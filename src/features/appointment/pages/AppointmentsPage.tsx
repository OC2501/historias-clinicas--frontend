import { useNavigate } from 'react-router';
import {
    CalendarDays,
    List,
    Plus,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Clock,
    User
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/tables/DataTable';
import { getAppointmentColumns } from '@/features/appointment/components/AppointmentColumns';
import { useAppointments } from '@/features/appointment/hooks/useAppointments';
import { Status } from '@/types';
import { cn } from '@/lib/utils';
import { appointmentsApi } from '@/api';

const STATUS_COLORS: Record<Status, string> = {
    [Status.SCHEDULED]: 'border-primary/50 bg-primary/5 text-primary',
    [Status.COMPLETED]: 'border-emerald-500 bg-emerald-50/50 text-emerald-700',
    [Status.CANCELLED]: 'border-destructive/50 bg-destructive/5 text-destructive',
};


export function AppointmentsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const {
        view,
        setView,
        appointments,
        meta,
        isLoading,
        searchTerm,
        setSearchTerm,
        page,
        setPage,
        limit,
        setLimit,
        currentDate,
        weekDays,
        nextWeek,
        prevWeek,
        today,
        isSameDay
    } = useAppointments();

    // Mutation para cambiar estado
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Status }) =>
            appointmentsApi.update(id, { status }),
        onSuccess: () => {
            toast.success('Estado de la cita actualizado');
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
        },
        onError: () => {
            toast.error('Error al actualizar el estado de la cita');
        }
    });

    const handleStatusChange = (id: string, status: Status) => {
        statusMutation.mutate({ id, status });
    };

    const columns = getAppointmentColumns(handleStatusChange);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agenda de Citas</h1>
                    <p className="text-muted-foreground">
                        Gestiona las consultas médicas y disponibilidad de espacios.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigate('/appointments/new')} className="w-full sm:w-auto shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Cita
                    </Button>
                </div>
            </div>

            <Tabs
                defaultValue="list"
                value={view}
                onValueChange={(v) => setView(v as 'list' | 'calendar')}
                className="w-full"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
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

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar paciente..."
                                className="pl-8 shadow-sm bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="shadow-sm shrink-0">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {view === 'list' ? (
                    <DataTable
                        columns={columns}
                        data={appointments}
                        isLoading={isLoading}
                        pagination={{
                            currentPage: page,
                            totalPages: meta?.lastPage || 1,
                            pageSize: limit,
                            totalItems: meta?.total || 0,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit
                        }}
                    />
                ) : (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center justify-between bg-muted/20 p-2 rounded-lg border">
                            <h2 className="text-lg font-bold capitalize flex items-center gap-2 px-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                {format(currentDate, 'MMMM yyyy', { locale: es })}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={today} className="font-semibold">Hoy</Button>
                                <div className="flex items-center bg-background rounded-md border shadow-sm">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none border-r" onClick={prevWeek}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={nextWeek}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-px bg-muted border rounded-xl overflow-hidden shadow-sm">
                            {weekDays.map((day) => {
                                const dayAppointments = appointments
                                    .filter(app => isSameDay(new Date(app.startTime), day))
                                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                                const isTodayDay = isSameDay(day, new Date());

                                return (
                                    <div key={day.toString()} className="bg-background min-h-[500px] flex flex-col group/day relative">
                                        <div className={cn(
                                            "p-3 text-center border-b font-medium transition-colors",
                                            isTodayDay ? "bg-primary/5" : "bg-muted/5 group-hover/day:bg-muted/10"
                                        )}>
                                            <p className={cn(
                                                "capitalize text-[10px] font-bold tracking-wider",
                                                isTodayDay ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {format(day, 'eee', { locale: es })}
                                            </p>
                                            <p className={cn(
                                                "text-xl mt-0.5",
                                                isTodayDay ? "text-primary font-bold" : ""
                                            )}>
                                                {format(day, 'd')}
                                            </p>
                                        </div>
                                        <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                            {dayAppointments.length > 0 ? (
                                                dayAppointments.map(app => {
                                                    const statusColor = STATUS_COLORS[app.status as Status] || 'border-gray-500 bg-gray-50/50';

                                                    return (
                                                        <div
                                                            key={app.id}
                                                            className={cn(
                                                                "p-2 text-[11px] border-l-4 rounded-md shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all",
                                                                statusColor
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/appointments`);
                                                            }}
                                                        >
                                                            <p className="font-bold flex items-center justify-between">
                                                                {format(new Date(app.startTime), 'HH:mm')}
                                                                <Clock className="h-3 w-3 opacity-50" />
                                                            </p>
                                                            <p className="truncate mt-0.5 font-medium flex items-center gap-1">
                                                                <User className="h-2.5 w-2.5" />
                                                                {app.patient.firstName} {app.patient.lastName}
                                                            </p>
                                                            <p className="truncate text-[9px] opacity-70 italic mt-0.5">{app.doctor?.user?.name || 'Médico'}</p>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center pointer-events-none opacity-0 group-hover/day:opacity-100 transition-opacity absolute inset-0">
                                                    <Plus className="h-8 w-8 text-muted-foreground/10" />
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-10 rounded-none border-t border-dashed opacity-0 group-hover/day:opacity-100 transition-all hover:bg-primary/5 hover:text-primary"
                                            onClick={() => navigate(`/appointments/new?date=${format(day, 'yyyy-MM-dd')}`)}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" />
                                            <span className="text-xs font-semibold">Agendar</span>
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Tabs>
        </div>
    );
}
