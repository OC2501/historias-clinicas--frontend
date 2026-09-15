import { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addMonths, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Loader2, Search, Trash2, CalendarDays, List, Download, FileSpreadsheet, Clock, MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { schedulesApi, doctorsApi, consultingRoomsApi } from '@/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/tables/DataTable';
import { getScheduleColumns } from '../components/ScheduleColumns';
import { pdf } from '@react-pdf/renderer';
import { SchedulesTimetablePDF } from '../pdf/SchedulesTimetablePDF';
import { exportSchedulesToExcel } from '../reports/SchedulesExcelReport';

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
    diaSemana: z.number().int().min(0).max(6).optional(),
    fecha: z.string().optional(),
    horaInicio: z.string().min(1, 'Hora de inicio requerida'),
    horaFin: z.string().min(1, 'Hora de fin requerida'),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function SchedulePage() {
    const { user } = useAuth();
    const isDoctor = (user?.organizationRole || user?.systemRole) === 'DOCTOR';
    const canManage = !isDoctor;
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [scheduleType, setScheduleType] = useState<'weekly' | 'date'>('weekly');

    // Paginación
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            doctorId: '',
            consultingRoomId: '',
            diaSemana: 1,
            fecha: '',
            horaInicio: '08:00',
            horaFin: '17:00',
        },
    });

    // Date navigation & calculations
    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handleNext = () => {
        if (calendarMode === 'week') {
            setCurrentDate(addDays(currentDate, 7));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const handlePrev = () => {
        if (calendarMode === 'week') {
            setCurrentDate(addDays(currentDate, -7));
        } else {
            setCurrentDate(addMonths(currentDate, -1));
        }
    };

    const handleToday = () => setCurrentDate(new Date());

    // Queries
    const { data: schedulesRes, isLoading: isLoadingSchedules } = useQuery({
        queryKey: ['schedules', page, limit, view],
        queryFn: async () => {
            const res = await schedulesApi.getAll({ 
                page, 
                limit: view === 'calendar' ? 1000 : limit 
            });
            return res.data;
        },
    });

    const getFilteredSchedules = async () => {
        const res = await schedulesApi.getAll({ page: 1, limit: 10000 });
        const allScheds = res.data?.data || [];
        
        const populated = allScheds.map((s: any) => {
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

        if (!search) return populated;
        const lowerSearch = search.toLowerCase();
        return populated.filter((s: any) => {
            const docName = (s.doctor?.user?.name || '').toLowerCase();
            const roomName = (s.consultingRoom?.nombre || '').toLowerCase();
            const dayLabel = (DAYS_OF_WEEK.find(d => d.value === s.diaSemana)?.label || '').toLowerCase();
            const timeRange = `${s.horaInicio} - ${s.horaFin}`.toLowerCase();

            return docName.includes(lowerSearch) ||
                roomName.includes(lowerSearch) ||
                dayLabel.includes(lowerSearch) ||
                timeRange.includes(lowerSearch);
        });
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const filtered = await getFilteredSchedules();
            const blob = await pdf(
                <SchedulesTimetablePDF 
                    schedules={filtered} 
                    weekDays={weekDays}
                    calendarMode={calendarMode}
                    monthDays={monthDays}
                    currentDate={currentDate}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const modeLabel = calendarMode === 'month' ? 'Mensual' : 'Semanal';
            a.download = `Cronograma_${modeLabel}_Horarios_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            const filtered = await getFilteredSchedules();
            await exportSchedulesToExcel(filtered, 'Cronograma_Horarios');
        } catch (error) {
            console.error('Error generating Excel:', error);
            toast.error('Error al generar Excel');
        } finally {
            setIsExportingExcel(false);
        }
    };

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await doctorsApi.getAll();
            return res.data;
        },
    });

    const { data: roomsRes, isLoading: isLoadingRooms } = useQuery({
        queryKey: ['rooms'],
        queryFn: async () => {
            const res = await consultingRoomsApi.getAll();
            return res.data;
        },
    });

    const doctors = useMemo(() => {
        if (Array.isArray(doctorsRes)) return doctorsRes;
        if (Array.isArray((doctorsRes as any)?.data)) return (doctorsRes as any).data;
        if (Array.isArray((doctorsRes as any)?.data?.data)) return (doctorsRes as any).data.data;
        return [];
    }, [doctorsRes]);
    const rooms = roomsRes?.data || [];
    const meta = useMemo(() => {
        if (!schedulesRes) return null;
        return schedulesRes.meta || {
            total: (schedulesRes as any).total || 0,
            lastPage: (schedulesRes as any).lastPage || 1,
            page: (schedulesRes as any).page || page,
            limit: (schedulesRes as any).limit || limit
        };
    }, [schedulesRes, page, limit]);

    // Cruzar datos para asegurar que los médicos tengan su nombre (User)
    const schedulesData = useMemo(() => {
        const rawData = schedulesRes?.data || [];
        if (!Array.isArray(rawData)) return [];

        // 1. Cross-reference doctor data
        const mapped = rawData.map((s: any) => {
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

        // 2. Local Filtering
        if (!search) return mapped;
        const lowerSearch = search.toLowerCase();
        return mapped.filter((s: any) => {
            const docName = (s.doctor?.user?.name || '').toLowerCase();
            const roomName = (s.consultingRoom?.nombre || '').toLowerCase();
            const dayLabel = (DAYS_OF_WEEK.find(d => d.value === s.diaSemana)?.label || '').toLowerCase();
            const timeRange = `${s.horaInicio} - ${s.horaFin}`.toLowerCase();

            return docName.includes(lowerSearch) ||
                roomName.includes(lowerSearch) ||
                dayLabel.includes(lowerSearch) ||
                timeRange.includes(lowerSearch);
        });
    }, [schedulesRes, doctors, search]);

    // Pre-seleccionar doctor si el usuario es DOCTOR
    useMemo(() => {
        if ((user?.organizationRole || user?.systemRole) === 'DOCTOR' && doctors.length > 0) {
            const doctor = doctors.find((d: any) => d.user?.id === user?.id);
            if (doctor && !form.getValues('doctorId')) {
                form.setValue('doctorId', doctor.id);
            }
        }
    }, [user, doctors, form]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (values: ScheduleFormValues) => {
            const payload: any = {
                ...values,
                horaInicio: values.horaInicio.substring(0, 5),
                horaFin: values.horaFin.substring(0, 5),
            };
            if (scheduleType === 'weekly') {
                payload.fecha = undefined;
                payload.diaSemana = values.diaSemana;
            } else if (values.fecha) {
                const [year, month, dateVal] = values.fecha.split('-').map(Number);
                const dateObj = new Date(year, month - 1, dateVal);
                payload.diaSemana = dateObj.getDay();
            }
            return schedulesApi.create(payload);
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

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            form.reset({
                doctorId: (user?.organizationRole || user?.systemRole) === 'DOCTOR' ? doctors.find((d: any) => d.user?.id === user?.id)?.id || '' : '',
                consultingRoomId: '',
                diaSemana: 1,
                fecha: '',
                horaInicio: '08:00',
                horaFin: '17:00',
            });
            setScheduleType('weekly');
        }
    }, [isOpen, doctors, user]);

    const onSubmit = (values: ScheduleFormValues) => {
        if (scheduleType === 'weekly' && values.diaSemana === undefined) {
            form.setError('diaSemana', { type: 'manual', message: 'Debe seleccionar un día de la semana' });
            toast.error('Debe seleccionar un día de la semana');
            return;
        }
        if (scheduleType === 'date' && !values.fecha) {
            form.setError('fecha', { type: 'manual', message: 'Debe seleccionar una fecha específica' });
            toast.error('Debe seleccionar una fecha específica');
            return;
        }
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
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Clock className="w-8 h-8 text-primary" />
                        Gestión de Horarios
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define la disponibilidad semanal de los médicos por consultorio.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={handleExportExcel} 
                        disabled={isExportingExcel || isLoading || schedulesData.length === 0}
                        className="w-full sm:w-auto text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                    >
                        {isExportingExcel ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                        )}
                        {isExportingExcel ? 'Exportando...' : 'Exportar Excel'}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleExportPDF} 
                        disabled={isExporting || isLoading || schedulesData.length === 0}
                        className={`w-full sm:w-auto mr-0 sm:mr-2 ${
                            view === 'calendar' 
                                ? "text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/20 border-sky-200 dark:border-sky-900" 
                                : ""
                        }`}
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : view === 'calendar' ? (
                            <CalendarDays className="mr-2 h-4 w-4" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? 'Exportando...' : view === 'calendar' ? 'Exportar Cronograma' : 'Exportar PDF'}
                    </Button>
                    {canManage && (
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full sm:w-auto shadow-sm">
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
                                    <form 
                                        onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                            console.error('Form validation errors:', errors);
                                            const fields = Object.keys(errors).map(k => {
                                                const err = (errors as any)[k];
                                                return `${k}: ${err.message || 'Inválido'}`;
                                            }).join(', ');
                                            toast.error(`Errores de validación: ${fields}`);
                                        })} 
                                        className="space-y-4 pt-4"
                                    >
                                        {(user?.organizationRole || user?.systemRole) !== 'DOCTOR' && (
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
                                                                        {doc.user?.name || `Dr. ${doc.specialty || doc.id.substring(0, 8)}`}
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tipo de Horario</label>
                                            <div className="flex bg-muted p-1 rounded-xl gap-1">
                                                <button
                                                    type="button"
                                                    className={`flex-1 text-xs py-1.5 font-semibold rounded-lg transition-all ${
                                                        scheduleType === 'weekly' 
                                                            ? 'bg-background shadow-sm text-foreground' 
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                    onClick={() => setScheduleType('weekly')}
                                                >
                                                    Semanal Recurrente
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`flex-1 text-xs py-1.5 font-semibold rounded-lg transition-all ${
                                                        scheduleType === 'date' 
                                                            ? 'bg-background shadow-sm text-foreground' 
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                    onClick={() => setScheduleType('date')}
                                                >
                                                    Fecha Específica
                                                </button>
                                            </div>
                                        </div>

                                        {scheduleType === 'weekly' ? (
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
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="fecha"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Fecha Específica</FormLabel>
                                                        <FormControl>
                                                            <Input type="date" {...field} className="rounded-xl" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
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
                    )}
                </div>
            </div>

            <Tabs
                defaultValue="list"
                value={view}
                onValueChange={(v) => setView(v as 'list' | 'calendar')}
                className="w-full"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-2 sm:w-auto shadow-sm">
                        <TabsTrigger value="list" className="gap-2">
                            <List className="h-4 w-4" />
                            Lista
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Calendario
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 sm:w-60">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por médico, consultorio o día..."
                                className="pl-8 shadow-sm bg-background h-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {view === 'list' ? (
                    <DataTable
                        columns={getScheduleColumns(setDeleteId, canManage)}
                        data={schedulesData}
                        isLoading={isLoading}
                        pagination={meta ? {
                            currentPage: page,
                            totalPages: meta.lastPage,
                            pageSize: limit,
                            totalItems: meta.total,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit
                        } : undefined}
                    />
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/20 p-2.5 rounded-lg border gap-3">
                            <h2 className="text-lg font-bold capitalize flex items-center gap-2 px-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                {format(currentDate, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <div className="flex items-center flex-wrap gap-2">
                                <div className="flex items-center bg-background rounded-md border shadow-sm p-0.5">
                                    <Button 
                                        variant={calendarMode === 'week' ? 'secondary' : 'ghost'} 
                                        size="sm" 
                                        className="h-7 px-3 text-xs font-semibold rounded-sm"
                                        onClick={() => setCalendarMode('week')}
                                    >
                                        Semana
                                    </Button>
                                    <Button 
                                        variant={calendarMode === 'month' ? 'secondary' : 'ghost'} 
                                        size="sm" 
                                        className="h-7 px-3 text-xs font-semibold rounded-sm"
                                        onClick={() => setCalendarMode('month')}
                                    >
                                        Mes
                                    </Button>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleToday} className="font-semibold">Hoy</Button>
                                <div className="flex items-center bg-background rounded-md border shadow-sm">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none border-r" onClick={handlePrev}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={handleNext}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {calendarMode === 'week' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-px bg-muted border rounded-xl overflow-hidden shadow-sm">
                                {weekDays.map((day) => {
                                    const todayStart = startOfDay(new Date());
                                    const dayStart = startOfDay(day);
                                    const daySchedules = dayStart >= todayStart
                                        ? schedulesData
                                            .filter(s => {
                                                if (s.fecha) {
                                                    const [year, month, dateVal] = s.fecha.split('-').map(Number);
                                                    const scheduleDate = new Date(year, month - 1, dateVal);
                                                    return isSameDay(day, scheduleDate);
                                                }
                                                return s.diaSemana === day.getDay();
                                            })
                                            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                                        : [];

                                    return (
                                        <div key={day.toString()} className="bg-background min-h-[500px] flex flex-col group/day relative">
                                            <div className="p-3 text-center border-b font-medium bg-muted/5 group-hover/day:bg-muted/10">
                                                <p className="capitalize text-xs font-bold tracking-wider text-muted-foreground">
                                                    {format(day, 'EEEE', { locale: es })}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {format(day, 'dd/MM/yyyy')}
                                                </p>
                                            </div>
                                            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                                {daySchedules.length > 0 ? (
                                                    daySchedules.map(s => (
                                                        <div
                                                            key={s.id}
                                                            className="p-2.5 text-[11px] border-l-4 border-l-primary rounded-md shadow-sm bg-primary/5 hover:shadow-md hover:scale-[1.02] transition-all relative group"
                                                        >
                                                            <p className="font-bold flex items-center justify-between">
                                                                {s.horaInicio.substring(0, 5)} - {s.horaFin.substring(0, 5)}
                                                                <Clock className="h-3.5 w-3.5 opacity-50 text-muted-foreground" />
                                                            </p>
                                                            <p className="truncate mt-1 font-bold text-slate-800 dark:text-slate-100">
                                                                {s.doctor?.user?.name ? `Dr. ${s.doctor.user.name}` : 'Médico'}
                                                            </p>
                                                            <p className="truncate text-[9px] text-muted-foreground capitalize">
                                                                {s.doctor?.specialty || 'General'}
                                                            </p>
                                                            <p className="truncate text-[9px] text-sky-600 dark:text-sky-400 font-medium mt-1 flex items-center gap-1">
                                                                <MapPin className="h-2.5 w-2.5" />
                                                                {s.consultingRoom?.nombre || '—'}
                                                            </p>
                                                            
                                                            {/* Delete button on hover */}
                                                            {canManage && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteId(s.id);
                                                                    }}
                                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover/day:opacity-100 transition-opacity absolute inset-0">
                                                        <Plus className="h-8 w-8 text-muted-foreground/10" />
                                                    </div>
                                                )}
                                            </div>
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-10 rounded-none border-t border-dashed opacity-0 group-hover/day:opacity-100 transition-all hover:bg-primary/5 hover:text-primary"
                                                    onClick={() => {
                                                        form.setValue('diaSemana', day.getDay());
                                                        form.setValue('fecha', format(day, 'yyyy-MM-dd'));
                                                        setScheduleType('date');
                                                        setIsOpen(true);
                                                    }}
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                    <span className="text-xs font-semibold">Agregar</span>
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="border rounded-xl overflow-hidden shadow-sm bg-muted gap-px flex flex-col">
                                <div className="grid grid-cols-7 gap-px bg-background">
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                                        <div key={d} className="p-2.5 text-center text-xs font-bold text-muted-foreground uppercase border-b animate-in fade-in">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-px">
                                    {monthDays.map((day) => {
                                        const todayStart = startOfDay(new Date());
                                        const dayStart = startOfDay(day);
                                        const daySchedules = dayStart >= todayStart
                                            ? schedulesData
                                                .filter(s => {
                                                    if (s.fecha) {
                                                        const [year, month, dateVal] = s.fecha.split('-').map(Number);
                                                        const scheduleDate = new Date(year, month - 1, dateVal);
                                                        return isSameDay(day, scheduleDate);
                                                    }
                                                    return s.diaSemana === day.getDay();
                                                })
                                                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                                            : [];
                                        const isTodayDay = isSameDay(day, new Date());
                                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                                        return (
                                            <div 
                                                key={day.toString()} 
                                                className={`bg-background min-h-[110px] p-2 flex flex-col group/day relative ${
                                                    isCurrentMonth ? "" : "bg-slate-50/50 dark:bg-slate-900/10 text-muted-foreground/50"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                                                        isTodayDay ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                                                    }`}>
                                                        {format(day, 'd')}
                                                    </span>
                                                    
                                                    {canManage && (
                                                        <button 
                                                            onClick={() => {
                                                                form.setValue('diaSemana', day.getDay());
                                                                form.setValue('fecha', format(day, 'yyyy-MM-dd'));
                                                                setScheduleType('date');
                                                                setIsOpen(true);
                                                            }}
                                                            className="opacity-0 group-hover/day:opacity-100 text-primary hover:bg-primary/10 p-0.5 rounded transition-opacity"
                                                            title="Agregar Horario"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="space-y-1 flex-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                                                    {daySchedules.map(s => (
                                                        <div
                                                            key={s.id}
                                                            className="p-1 text-[9px] border-l-2 border-l-primary rounded-sm bg-primary/5 hover:scale-[1.02] transition-all relative group/card"
                                                            title={`${s.horaInicio.substring(0, 5)} - ${s.horaFin.substring(0, 5)}: ${s.doctor?.user?.name || 'Médico'} en ${s.consultingRoom?.nombre || '—'}`}
                                                        >
                                                            <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                {s.horaInicio.substring(0, 5)} {s.doctor?.user?.name ? `Dr. ${s.doctor.user.name.split(' ')[0]}` : 'Médico'}
                                                            </div>
                                                            
                                                            {canManage && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteId(s.id);
                                                                    }}
                                                                    className="absolute top-0 right-0 opacity-0 group-hover/card:opacity-100 text-destructive hover:bg-destructive/10 p-0.5 rounded transition-opacity"
                                                                >
                                                                    <Trash2 className="h-2.5 w-2.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Tabs>

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
