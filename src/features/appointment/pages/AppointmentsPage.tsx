import { useState } from 'react';
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
    User,
    Loader2,
    Download,
    FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/tables/DataTable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAppointmentColumns } from '@/features/appointment/components/AppointmentColumns';
import { useAppointments } from '@/features/appointment/hooks/useAppointments';
import { Status } from '@/types';
import { cn } from '@/lib/utils';
import { appointmentsApi, patientsApi } from '@/api';
import { pdf } from '@react-pdf/renderer';
import { AppointmentsReportPDF } from '../pdf/AppointmentsReportPDF';
import { AppointmentsTimetablePDF } from '../pdf/AppointmentsTimetablePDF';
import { exportAppointmentsToExcel } from '../reports/AppointmentsExcel';

const formatTitleCase = (str: string | null | undefined) => {
    if (!str) return '—';
    return str
        .toLowerCase()
        .split(' ')
        .map((word, idx) => {
            const prepositions = ['de', 'la', 'las', 'el', 'los', 'y', 'del', 'o', 'a', 'en'];
            if (prepositions.includes(word) && idx !== 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

const STATUS_COLORS: Record<Status, string> = {
    [Status.SCHEDULED]: 'border-primary/50 bg-primary/5 text-primary',
    [Status.COMPLETED]: 'border-emerald-500 bg-emerald-50/50 text-emerald-700',
    [Status.CANCELLED]: 'border-destructive/50 bg-destructive/5 text-destructive',
};


export function AppointmentsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingTimetable, setIsExportingTimetable] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const {
        view,
        setView,
        calendarMode,
        setCalendarMode,
        appointments,
        meta,
        isLoading,
        searchTerm,
        setSearchTerm,
        gender,
        setGender,
        gerencia,
        setGerencia,
        page,
        setPage,
        limit,
        setLimit,
        currentDate,
        doctors,
        weekDays,
        monthDays,
        nextWeek,
        prevWeek,
        today,
        isSameDay
    } = useAppointments();

    const { data: gerenciasRes } = useQuery({
        queryKey: ['unique-gerencias'],
        queryFn: () => patientsApi.getUniqueGerencias()
    });
    const gerencias = gerenciasRes?.data || [];

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

    const getFilteredAppointments = async () => {
        const response = await appointmentsApi.getAll({ 
            page: 1, 
            limit: 10000,
            search: searchTerm || undefined,
            gender: gender || undefined,
            gerencia: gerencia || undefined
        } as any);
        const allAppointments = response.data?.data || [];

        const populated = allAppointments.map((app: any) => {
            if (!app.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === app.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...app,
                        doctor: {
                            ...app.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return app;
        });

        return populated;
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const filtered = await getFilteredAppointments();
            const blob = await pdf(
                <AppointmentsReportPDF appointments={filtered} />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Citas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            const filtered = await getFilteredAppointments();
            await exportAppointmentsToExcel(filtered, 'Reporte_Citas');
        } catch (error) {
            console.error('Error generating Excel:', error);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleExportTimetablePDF = async () => {
        setIsExportingTimetable(true);
        try {
            const filtered = await getFilteredAppointments();
            const blob = await pdf(
                <AppointmentsTimetablePDF 
                    appointments={filtered} 
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
            a.download = `Cronograma_${modeLabel}_Citas_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating Timetable PDF:', error);
            toast.error('Error al generar el cronograma PDF');
        } finally {
            setIsExportingTimetable(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <CalendarIcon className="w-8 h-8 text-primary" />
                        Agenda de Citas
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestiona las consultas médicas y disponibilidad de espacios.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={handleExportExcel} 
                        disabled={isExportingExcel || isLoading || !appointments || appointments.length === 0}
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
                        disabled={isExporting || isLoading || !appointments || appointments.length === 0}
                        className="w-full sm:w-auto"
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? 'Exportando...' : 'Exportar PDF'}
                    </Button>
                    {view === 'calendar' && (
                        <Button 
                            variant="outline" 
                            onClick={handleExportTimetablePDF} 
                            disabled={isExportingTimetable || isLoading || !appointments || appointments.length === 0}
                            className="w-full sm:w-auto text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/20 border-sky-200 dark:border-sky-900"
                        >
                            {isExportingTimetable ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CalendarIcon className="mr-2 h-4 w-4" />
                            )}
                            {isExportingTimetable ? 'Exportando...' : 'Exportar Cronograma'}
                        </Button>
                    )}
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
                                placeholder="Buscar paciente..."
                                className="pl-8 shadow-sm bg-background h-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={gender || "ALL"} onValueChange={(val) => setGender(val === "ALL" ? "" : val)}>
                                <SelectTrigger className="w-full sm:w-[180px] h-10 shadow-sm bg-background">
                                    <SelectValue placeholder="Todos los géneros" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todos los géneros</SelectItem>
                                    <SelectItem value="MALE">Masculino</SelectItem>
                                    <SelectItem value="FEMALE">Femenino</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={gerencia || "ALL"} onValueChange={(val) => setGerencia(val === "ALL" ? "" : val)}>
                                <SelectTrigger className="w-full sm:w-[280px] h-10 shadow-sm bg-background truncate">
                                    <SelectValue placeholder="Todas las gerencias" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="ALL">Todas las gerencias</SelectItem>
                                    {gerencias.map((g: string) => (
                                        <SelectItem key={g} value={g} title={g}>{formatTitleCase(g)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {(gender || gerencia) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setGender('');
                                        setGerencia('');
                                    }}
                                    className="text-xs text-muted-foreground hover:text-foreground h-10 px-3"
                                >
                                    Limpiar
                                </Button>
                            )}
                        </div>
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

                        {calendarMode === 'week' ? (
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
                        ) : (
                            <div className="border rounded-xl overflow-hidden shadow-sm bg-muted gap-px flex flex-col">
                                <div className="grid grid-cols-7 gap-px">
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                                        <div key={d} className="bg-background p-2.5 text-center text-xs font-bold text-muted-foreground uppercase border-b">
                                            {d}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-px">
                                    {monthDays.map((day) => {
                                        const dayAppointments = appointments
                                            .filter(app => isSameDay(new Date(app.startTime), day))
                                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
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
                                                    
                                                    <button 
                                                        onClick={() => navigate(`/appointments/new?date=${format(day, 'yyyy-MM-dd')}`)}
                                                        className="opacity-0 group-hover/day:opacity-100 text-primary hover:bg-primary/10 p-0.5 rounded transition-opacity"
                                                        title="Agendar Cita"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <div className="space-y-1 flex-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                                                    {dayAppointments.slice(0, 3).map(app => {
                                                        const statusColor = STATUS_COLORS[app.status as Status] || 'border-gray-500 bg-gray-50/50';
                                                        return (
                                                            <div
                                                                key={app.id}
                                                                className={cn(
                                                                    "p-1 text-[9px] border-l-2 rounded-sm truncate cursor-pointer hover:scale-[1.02] transition-all",
                                                                    statusColor
                                                                )}
                                                                title={`${format(new Date(app.startTime), 'HH:mm')} - ${app.patient.firstName} ${app.patient.lastName} (${app.doctor?.user?.name || 'Médico'})`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/appointments`);
                                                                }}
                                                            >
                                                                <span className="font-bold mr-0.5">{format(new Date(app.startTime), 'HH:mm')}</span>
                                                                {app.patient.firstName}
                                                            </div>
                                                        );
                                                    })}
                                                    {dayAppointments.length > 3 && (
                                                        <div className="text-[8px] text-muted-foreground font-semibold px-1 py-0.5 bg-muted/30 rounded-sm inline-block">
                                                            +{dayAppointments.length - 3} más
                                                        </div>
                                                    )}
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
        </div>
    );
}
