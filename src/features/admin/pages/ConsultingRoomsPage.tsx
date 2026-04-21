import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Loader2,
    Search
} from 'lucide-react';
import { toast } from 'sonner';


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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { consultingRoomsApi } from '@/api';
import type { ConsultingRoom, CreateConsultingRoomRequest } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { consultingRoomSchema, type ConsultingRoomFormValues as RoomFormValues } from '../types/admin.schema';
import { DataTable } from '@/components/tables/DataTable';
import { getConsultingRoomColumns } from '../components/ConsultingRoomsColumns';

export function ConsultingRoomsPage() {
    const [rooms, setRooms] = useState<ConsultingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<ConsultingRoom | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const { user } = useAuth();

    // Paginación
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [meta, setMeta] = useState<any>(null);

    const canManage = user?.organizationRole === 'OWNER' || user?.organizationRole === 'ADMIN' || user?.systemRole === 'SUPERADMIN' || (user?.organizationRole === 'DOCTOR' && user?.organization?.planType === 'INDEPENDENT');

    const form = useForm<RoomFormValues>({
        resolver: zodResolver(consultingRoomSchema),
        defaultValues: {
            nombre: '',
            ubicacion: '',
            disponible: true,
            userId: '',
        },
    });

    const loadRooms = async () => {
        setIsLoading(true);
        try {
            const res = await consultingRoomsApi.getAll({ page, limit });
            setRooms(res.data.data || res.data || []);
            setMeta(res.data.meta || {
                total: (res.data as any).total || 0,
                lastPage: (res.data as any).lastPage || 1
            });
        } catch (error) {
            toast.error('Error al cargar consultorios');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRooms();
    }, [page, limit]);

    const filteredRooms = useMemo(() => {
        if (!search) return rooms;
        const lowerSearch = search.toLowerCase();
        return rooms.filter((r) =>
            r.nombre.toLowerCase().includes(lowerSearch) ||
            (r.ubicacion || '').toLowerCase().includes(lowerSearch)
        );
    }, [rooms, search]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const onSubmit = async (values: RoomFormValues) => {
        setIsSubmitting(true);
        try {
            if (editingRoom) {
                await consultingRoomsApi.update(editingRoom.id, values);
                toast.success('Consultorio actualizado');
            } else {
                await consultingRoomsApi.create({
                    ...values,
                    userId: user?.id || ''
                } as CreateConsultingRoomRequest);
                toast.success('Consultorio creado');
            }
            setIsOpen(false);
            setEditingRoom(null);
            form.reset();
            loadRooms();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar consultorio');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (room: ConsultingRoom) => {
        setEditingRoom(room);
        form.reset({
            nombre: room.nombre,
            ubicacion: room.ubicacion || '',
        });
        setIsOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await consultingRoomsApi.delete(deleteId);
            toast.success('Consultorio eliminado');
            setDeleteId(null);
            loadRooms();
        } catch (error) {
            toast.error('Error al eliminar consultorio');
        }
    };

    const handleCreate = () => {
        setEditingRoom(null);
        form.reset({
            nombre: '',
            ubicacion: '',
            disponible: true,
            userId: user?.id || '',
        });
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
        setEditingRoom(null);
        form.reset();
    };

    if (isLoading && rooms.length === 0) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Consultorios</h1>
                    <p className="text-muted-foreground">
                        Administre la disponibilidad física del centro médico.
                    </p>
                </div>
                {canManage && (
                    <Button onClick={handleCreate} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Consultorio
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o ubicación..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                columns={getConsultingRoomColumns(handleEdit, setDeleteId, canManage)}
                data={filteredRooms}
                isLoading={isLoading}
                onRowClick={canManage ? handleEdit : undefined}
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
                        <DialogTitle>{editingRoom ? 'Editar Consultorio' : 'Nuevo Consultorio'}</DialogTitle>
                        <DialogDescription>
                            Ingrese los detalles del espacio físico.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="nombre"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Consultorio 101, Box A..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="ubicacion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ubicación</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Piso 2, Ala Sur..." {...field} />
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
                                    {editingRoom ? 'Actualizar' : 'Guardar'}
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
                title="¿Eliminar consultorio?"
                description="Esta acción no se puede deshacer. El consultorio se eliminará permanentemente."
                variant="destructive"
            />
        </div>
    );
}
