import { useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
    DialogTrigger,
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
import * as z from 'zod';

import { schedulesApi, doctorsApi, consultingRoomsApi } from '@/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/tables/DataTable';
import { getScheduleColumns } from '../components/ScheduleColumns';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

const scheduleSchema = z.object({
    doctorId: z.string().min(1, 'Seleccione un médico'),
    consultingRoomId: z.string().min(1, 'Seleccione un consultorio'),
    diaSemana: z.number().int().min(0).max(6),
    horaInicio: z.string().min(1, 'Hora de inicio requerida'),
    horaFin: z.string().min(1, 'Hora de fin requerida'),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function SchedulePage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            doctorId: '',
            consultingRoomId: '',
            diaSemana: 1,
            horaInicio: '08:00',
            horaFin: '17:00',
        },
    });

    // Queries
    const { data: schedulesRes, isLoading: isLoadingSchedules } = useQuery({
        queryKey: ['schedules'],
        queryFn: () => schedulesApi.getAll({ limit: 100 }),
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const { data: roomsRes, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['rooms'],
        queryFn: () => consultingRoomsApi.getAll(),
    });

    const doctors = doctorsRes?.data?.data || [];
    const rooms = roomsRes?.data?.data || [];

    // Cruzar datos para asegurar que los médicos tengan su nombre (User)
    const schedules = useMemo(() => {
        const rawData = (schedulesRes as any)?.data?.data || (schedulesRes as any)?.data || [];
        if (!Array.isArray(rawData)) return [];

        return rawData.map((s: any) => {
            // Si el doctor en el horario NO tiene user.name, lo buscamos en la lista completa
            if (!s.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === s.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...s,
                        doctor: {
                            ...s.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return s;
        });
    }, [schedulesRes, doctors]);

    // Pre-seleccionar doctor si el usuario es DOCTOR
    useMemo(() => {
        if (user?.role === 'DOCTOR' && doctors.length > 0) {
            const doctor = doctors.find((d: any) => d.user?.id === user.id);
            if (doctor && !form.getValues('doctorId')) {
                form.setValue('doctorId', doctor.id);
            }
        }
    }, [user, doctors, form]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (values: ScheduleFormValues) => {
            // Asegurar formato HH:MM para el backend
            const payload = {
                ...values,
                horaInicio: values.horaInicio.substring(0, 5),
                horaFin: values.horaFin.substring(0, 5),
            };
            return schedulesApi.create(payload as any);
        },
        onSuccess: () => {
            toast.success('Horario creado correctamente');
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setIsOpen(false);
            form.reset({
                ...form.getValues(),
                diaSemana: form.getValues('diaSemana')
            });
        },
        onError: (error: any) => {
            const message = error.response?.data?.message;
            if (Array.isArray(message)) {
                toast.error(message[0]); 
            } else {
                toast.error(message || 'Error al crear horario');
            }
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => schedulesApi.delete(id),
        onSuccess: () => {
            toast.success('Horario eliminado');
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setDeleteId(null);
        },
        onError: () => {
            toast.error('Error al eliminar horario');
        }
    });

    const onSubmit = (values: ScheduleFormValues) => {
        createMutation.mutate(values);
    };

    const handleDelete = () => {
        if (deleteId) deleteMutation.mutate(deleteId);
    };

    const isLoading = isLoadingSchedules || isLoadingDoctors || isLoadingRooms;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Horarios</h1>
                    <p className="text-muted-foreground">
                        Define la disponibilidad semanal de los médicos por consultorio.
                    </p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Horario
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>Agregar Horario</DialogTitle>
                            <DialogDescription>
                                Establece un nuevo bloque de atención médica.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                {user?.role !== 'DOCTOR' && (
                                    <FormField
                                        control={form.control}
                                        name="doctorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Médico</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl">
                                                            <SelectValue placeholder="Seleccione médico" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl">
                                                        {doctors.map((doc: any) => (
                                                            <SelectItem key={doc.id} value={doc.id}>
                                                                {doc.user?.name || `Dr. ${doc.specialty || doc.id.substring(0,8)}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                                <FormField
                                    control={form.control}
                                    name="consultingRoomId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Consultorio</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl">
                                                        <SelectValue placeholder="Seleccione consultorio" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl">
                                                    {rooms.map((room: any) => (
                                                        <SelectItem key={room.id} value={room.id}>
                                                            {room.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="diaSemana"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Día de la Semana</FormLabel>
                                            <Select
                                                onValueChange={(v) => field.onChange(parseInt(v))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl">
                                                        <SelectValue placeholder="Seleccione día" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl">
                                                    {DAYS_OF_WEEK.map(day => (
                                                        <SelectItem key={day.value} value={day.value.toString()}>
                                                            {day.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="horaInicio"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hora Inicio</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} className="rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="horaFin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hora Fin</FormLabel>
                                                <FormControl>
                                                    <Input type="time" {...field} className="rounded-xl" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-8 shadow-md">
                                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {createMutation.isPending ? 'Guardando...' : 'Guardar Horario'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle>Horarios Registrados</CardTitle>
                    <CardDescription>Lista completa de turnos y disponibilidades.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        columns={getScheduleColumns(setDeleteId)}
                        data={schedules}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(v) => !v && setDeleteId(null)}
                onConfirm={handleDelete}
                title="¿Eliminar horario?"
                description="Se eliminará la disponibilidad configurada para este médico en este horario."
                variant="destructive"
            />
        </div>
    );
}
