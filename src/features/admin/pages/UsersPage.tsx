import { useEffect, useState } from 'react';
import { Loader2, Plus, Shield, Power, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { configurationApi } from '@/api';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { usersApi } from '@/api';
import { SystemRole, OrganizationRole } from '@/types/enums';
import type { User, CreateUserRequest } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import { userSchema, type UserFormValues } from '../types/admin.schema';

import { DataTable } from '@/components/tables/DataTable';
import { getUserColumns } from '../components/UserColumns';

export function UsersPage() {
    const { user, updateUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [maintenanceConfig, setMaintenanceConfig] = useState<any>(null);
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
    const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

    // Paginación
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [meta, setMeta] = useState<any>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema) as any,
        defaultValues: {
            name: '',
            email: '',
            username: '',
            systemRole: SystemRole.USER,
            organizationRole: undefined,
            password: '',
        },
    });

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await usersApi.getAll({ page, limit });
            const resData = res.data;
            setUsers(resData.data || []);
            const metaObj = resData.meta || resData;
            setMeta({
                page: metaObj.page || page,
                lastPage: metaObj.lastPage || Math.ceil((metaObj.total || 0) / limit) || 1,
                total: typeof metaObj.total === 'number' ? metaObj.total : (resData.data?.length || 0),
                limit: metaObj.limit || limit
            });
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    const checkMaintenanceStatus = async () => {
        if (user?.systemRole !== 'SUPERADMIN') return;
        try {
            const res = await configurationApi.getAll({ page: 1, limit: 100 });
            const configs = res.data.data || [];
            const mConfig = configs.find((c: any) => c.clave === 'maintenance_mode');
            if (mConfig) {
                setMaintenanceConfig(mConfig);
                setIsMaintenanceActive(mConfig.valor?.active === true);
            }
        } catch (error) {
            console.error('Error fetching maintenance config:', error);
        }
    };

    useEffect(() => {
        loadUsers();
        checkMaintenanceStatus();
    }, [page, limit]);

    const handleToggleMaintenance = async () => {
        setIsTogglingMaintenance(true);
        try {
            const nextActive = !isMaintenanceActive;
            if (maintenanceConfig) {
                await configurationApi.update(maintenanceConfig.id, {
                    valor: { active: nextActive }
                });
                setIsMaintenanceActive(nextActive);
                setMaintenanceConfig({
                    ...maintenanceConfig,
                    valor: { active: nextActive }
                });
            } else {
                const res = await configurationApi.create({
                    clave: 'maintenance_mode',
                    valor: { active: nextActive },
                    descripcion: 'Estado de mantenimiento del sistema',
                    userId: user?.id || ''
                });
                setIsMaintenanceActive(nextActive);
                setMaintenanceConfig(res.data);
            }
            toast.success(nextActive ? 'Modo mantenimiento activado' : 'Modo mantenimiento desactivado');
        } catch (error) {
            toast.error('Error al cambiar el estado del sistema');
        } finally {
            setIsTogglingMaintenance(false);
        }
    };

    const onSubmit = async (values: UserFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingUser) {
                const { password, ...updateData } = values;
                const res = await usersApi.update(editingUser.id, password ? values : updateData as any);
                toast.success('Usuario actualizado');
                if (user && editingUser.id === user.id) {
                    updateUser(res.data);
                }
            } else {
                if (!values.password) {
                    toast.error('La contraseña es requerida para nuevos usuarios');
                    setIsSubmitting(false);
                    return;
                }
                await usersApi.create(values as CreateUserRequest);
                toast.success('Usuario creado');
            }
            setIsOpen(false);
            setEditingUser(null);
            form.reset();
            loadUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar usuario');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (u: User) => {
        const isSuperadmin = u.systemRole === 'SUPERADMIN';
        if (isSuperadmin && user?.systemRole !== 'SUPERADMIN') {
            toast.error('No tiene permisos para editar un Superusuario');
            return;
        }
        setEditingUser(u);
        form.reset({
            name: u.name,
            email: u.email,
            username: u.username || '',
            systemRole: u.systemRole,
            organizationRole: u.organizationRole,
            password: '',
        });
        setIsOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await usersApi.delete(deleteId);
            toast.success('Usuario eliminado');
            setDeleteId(null);
            loadUsers();
        } catch (error) {
            toast.error('Error al eliminar usuario');
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setEditingUser(null);
        form.reset();
    };

    if (isLoading && users.length === 0) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Users className="w-8 h-8 text-primary" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Control de acceso y roles para el personal del sistema.
                    </p>
                </div>
                <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {user?.systemRole === 'SUPERADMIN' && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${isMaintenanceActive ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Estado del Sistema</h3>
                            <p className="text-sm text-muted-foreground max-w-xl">
                                {isMaintenanceActive 
                                    ? 'El sistema se encuentra en modo mantenimiento. Los usuarios sin privilegios de Superadmin no tendrán acceso a la plataforma.'
                                    : 'El sistema opera normalmente. Active esta opción solo para realizar actualizaciones críticas o tareas de base de datos.'}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant={isMaintenanceActive ? "destructive" : "default"}
                        className={`w-full md:w-auto h-11 px-6 font-semibold flex items-center justify-center gap-2 shadow-sm rounded-xl`}
                        onClick={handleToggleMaintenance}
                        disabled={isTogglingMaintenance}
                    >
                        {isTogglingMaintenance ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Power className="w-4 h-4" />
                        )}
                        {isMaintenanceActive ? 'DESACTIVAR MANTENIMIENTO' : 'ACTIVAR MANTENIMIENTO'}
                    </Button>
                </div>
            )}

            <DataTable
                columns={getUserColumns(user, handleEdit, setDeleteId)}
                data={users}
                isLoading={isLoading}
                onRowClick={handleEdit}
                pagination={meta ? {
                    currentPage: page,
                    totalPages: meta.lastPage,
                    pageSize: limit,
                    totalItems: meta.total,
                    onPageChange: setPage,
                    onPageSizeChange: setLimit
                } : undefined}
            />

            <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                        <DialogDescription>
                            Complete los datos de la cuenta.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nombre completo" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Correo Electrónico *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ejemplo@correo.com" type="email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre de Usuario</FormLabel>
                                        <FormControl>
                                            <Input placeholder="usuario (ej: mariaperez)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {user?.systemRole === SystemRole.SUPERADMIN && (
                                <FormField
                                    control={form.control}
                                    name="systemRole"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rol de Sistema *</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione un rol de sistema" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={SystemRole.USER}>Usuario</SelectItem>
                                                    <SelectItem value={SystemRole.SUPERADMIN}>Super Administrador</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <FormField
                                control={form.control}
                                name="organizationRole"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rol en Organización (Opcional si es SuperAdmin)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un rol" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {user?.systemRole === SystemRole.SUPERADMIN ? (
                                                    <>
                                                        <SelectItem value={OrganizationRole.OWNER}>Propietario / Admin Centro</SelectItem>
                                                        <SelectItem value={OrganizationRole.ADMIN}>Administrador de Sistema Auxiliar</SelectItem>
                                                        <SelectItem value={OrganizationRole.DOCTOR}>Médico</SelectItem>
                                                        <SelectItem value={OrganizationRole.NURSE}>Enfermería</SelectItem>
                                                        <SelectItem value={OrganizationRole.SECRETARY}>Secretaría</SelectItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <SelectItem value={OrganizationRole.DOCTOR}>Médico</SelectItem>
                                                        <SelectItem value={OrganizationRole.NURSE}>Enfermería</SelectItem>
                                                        <SelectItem value={OrganizationRole.SECRETARY}>Secretaría</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingUser ? 'Actualizar' : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(v) => !v && setDeleteId(null)}
                onConfirm={handleDelete}
                title="¿Eliminar usuario?"
                description="Se revocará el acceso permanentemente a este usuario."
                variant="destructive"
            />
        </div>
    );
}
