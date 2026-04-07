import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
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
import { UserRole } from '@/types/enums';
import type { User, CreateUserRequest } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import { userSchema, type UserFormValues } from '../types/admin.schema';

import { DataTable } from '@/components/tables/DataTable';
import { getUserColumns } from '../components/UserColumns';

export function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            role: UserRole.USER,
            password: '',
        },
    });

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const res = await usersApi.getAll({ page: 1, limit: 100 });
            setUsers(res.data.data);
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const onSubmit = async (values: UserFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingUser) {
                const { password, ...updateData } = values;
                await usersApi.update(editingUser.id, password ? values : updateData as any);
                toast.success('Usuario actualizado');
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

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role,
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

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">
                        Control de acceso y roles para el personal del sistema.
                    </p>
                </div>
                <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cuentas de Usuario</CardTitle>
                    <CardDescription>Usuarios registrados con acceso a la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={getUserColumns(handleEdit, setDeleteId)}
                        data={users}
                        isLoading={isLoading}
                        onRowClick={handleEdit}
                    />
                </CardContent>
            </Card>

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
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rol de Usuario *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione un rol" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                                                <SelectItem value={UserRole.DOCTOR}>Médico</SelectItem>
                                                <SelectItem value={UserRole.SECRETARY}>Secretaría</SelectItem>
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
