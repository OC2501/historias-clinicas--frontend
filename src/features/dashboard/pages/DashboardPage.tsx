import { useMemo } from 'react';
import {
    Users,
    CalendarDays,
    Clock,
    UserPlus,
    ChevronRight,
    ArrowUpRight,
    Calendar,
    Settings,
    History,
    Award,
    ShieldAlert,
    Stethoscope,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, appointmentsApi, doctorsApi } from '@/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Appointment } from '@/types';
import { Link, useNavigate } from 'react-router';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/tables/DataTable';

const STATUS_COLORS: Record<string, string> = {
    'SCHEDULED': 'bg-primary/10 text-primary border-primary/20',
    'COMPLETED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'CANCELLED': 'bg-destructive/10 text-destructive border-destructive/20',
    'PENDING': 'bg-secondary/50 text-secondary-foreground border-secondary',
};

const STATUS_LABELS: Record<string, string> = {
    'SCHEDULED': 'Programada',
    'COMPLETED': 'Completada',
    'CANCELLED': 'Cancelada',
    'PENDING': 'Pendiente',
};

export function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: dashboardRes, isLoading: isLoadingDashboard } = useQuery({
        queryKey: ['doctor-dashboard'],
        queryFn: () => dashboardApi.getDoctorDashboard(),
        enabled: user?.role === 'ADMIN' || (user?.role === 'DOCTOR' && !!user?.doctorProfile),
    });

    const { data: appointmentsRes, isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['appointments', { limit: 100 }],
        queryFn: () => appointmentsApi.getAll({ limit: 100 }),
        enabled: !!user,
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
        enabled: !!user,
    });
    const doctors = doctorsRes?.data?.data || [];

    // Extracción robusta de las estadísticas
    const dashboardData = useMemo(() => {
        if (!dashboardRes) return null;
        console.log('DEBUG - Raw Dashboard Response:', dashboardRes);

        // Buscamos robustamente el payload final (saltando envelope de Axios y del Backend)
        const axiosData = (dashboardRes as any).data || dashboardRes;
        const finalData = axiosData?.data || axiosData;

        console.log('DEBUG - Processed Dashboard Data:', finalData);
        return finalData;
    }, [dashboardRes]);

    const todayAppointments = useMemo(() => {
        const appointments = (appointmentsRes as any)?.data?.data || (appointmentsRes as any)?.data || [];
        return appointments
            .filter((app: any) => isToday(new Date(app.startTime)))
            .map((app: any) => {
                if (!app.doctor?.user?.name && doctors.length > 0) {
                    const fullDoctor = doctors.find((d: any) => d.id === app.doctor?.id);
                    if (fullDoctor?.user) {
                        return { ...app, doctor: { ...app.doctor, user: fullDoctor.user } };
                    }
                }
                return app;
            })
            .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [appointmentsRes, doctors]);

    const isLoading = isLoadingDashboard || isLoadingAppointments || isLoadingDoctors;

    const kpis = [
        {
            title: 'Total Pacientes',
            value: dashboardData?.totalPatients ?? 0,
            icon: Users,
            description: 'Pacientes registrados',
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'Citas Hoy',
            value: dashboardData?.todayAppointments ?? 0,
            icon: CalendarDays,
            description: 'Consultas programadas',
            color: 'text-primary',
            bgColor: 'bg-secondary/50',
        },
        {
            title: 'Pendientes',
            value: dashboardData?.pendingAppointments ?? 0,
            icon: Clock,
            description: 'Citas por atender',
            color: 'text-muted-foreground',
            bgColor: 'bg-muted/30',
        },
        {
            title: 'Completadas',
            value: dashboardData?.appointmentsByStatus?.COMPLETED ?? 0,
            icon: CheckCircle2,
            description: 'Citas finalizadas',
            color: 'text-emerald-700',
            bgColor: 'bg-emerald-50',
        },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Bienvenido, <span className="text-foreground font-medium">{user?.name}</span>. Aquí tienes un resumen de hoy.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Exportar Reporte
                    </Button>
                </div>
            </div>

            {/* Onboarding / Missing Profile Alert */}
            {user?.role === 'DOCTOR' && !user?.doctorProfile && (
                <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden mb-6">
                    <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="p-8 flex-1 space-y-4">
                                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                    Acción Requerida
                                </div>
                                <h2 className="text-3xl font-black leading-tight">Activa tu Perfil Profesional</h2>
                                <p className="text-primary-foreground/90 text-lg font-medium leading-relaxed max-w-xl">
                                    Para asociar pacientes a tus consultas y acceder a tus estadísticas personalizadas, primero necesitamos configurar tu especialidad y licencia médica.
                                </p>
                                <Button
                                    size="lg"
                                    className="bg-white text-primary hover:bg-white/90 font-bold h-12 px-8 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95"
                                    onClick={() => navigate('/doctor/setup')}
                                >
                                    <Award className="mr-2 h-5 w-5" />
                                    Configurar Ahora
                                </Button>
                            </div>
                            <div className="hidden md:flex relative p-8">
                                <div className="absolute inset-0 bg-gradient-to-l from-primary/50 to-transparent" />
                                <Stethoscope className="h-48 w-48 text-white/10 -rotate-12" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* KPI Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading
                    ? Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="border-none shadow-sm bg-muted/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))
                    : kpis.map((kpi, i) => (
                        <Card key={i} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    {kpi.title}
                                </CardTitle>
                                <div className={`${kpi.bgColor} p-2.5 rounded-xl`}>
                                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight">{kpi.value}</div>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    {kpi.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                {/* Upcoming Appointments */}
                <Card className="md:col-span-4 border-none shadow-sm overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Próximas Citas</CardTitle>
                            <CardDescription>
                                Consultas programadas para hoy, {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}.
                            </CardDescription>
                        </div>
                        <Calendar className="h-5 w-5 text-muted-foreground/50" />
                    </CardHeader>
                    <CardContent className="flex-1">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : todayAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground font-medium">No hay citas programadas para hoy.</p>
                                <Button variant="link" asChild className="mt-2 text-primary">
                                    <Link to="/appointments">Crear primera cita</Link>
                                </Button>
                            </div>
                        ) : (
                            <DataTable
                                columns={[
                                    {
                                        header: 'Hora',
                                        accessorKey: (app: Appointment) => (
                                            <span className="font-semibold text-primary">
                                                {format(new Date(app.startTime), 'HH:mm')}
                                            </span>
                                        )
                                    },
                                    {
                                        header: 'Paciente',
                                        accessorKey: (app: Appointment) => (
                                            <span className="font-medium group-hover:text-primary transition-colors">
                                                {app.patient?.firstName || '—'} {app.patient?.lastName || ''}
                                            </span>
                                        )
                                    },
                                    {
                                        header: 'Médico',
                                        accessorKey: (app: Appointment) => (
                                            <span className="text-muted-foreground text-sm">
                                                {app.doctor?.user?.name || 'Médico no asignado'}
                                            </span>
                                        )
                                    },
                                    {
                                        header: 'Estado',
                                        className: 'text-right',
                                        accessorKey: (app: Appointment) => (
                                            <Badge
                                                variant="outline"
                                                className={cn("font-medium shadow-none", STATUS_COLORS[app.status] || "")}
                                            >
                                                {STATUS_LABELS[app.status] || app.status}
                                            </Badge>
                                        )
                                    }
                                ]}
                                data={todayAppointments}
                                isLoading={isLoading}
                                onRowClick={() => navigate(`/appointments`)}
                                className="border-none bg-transparent"
                            />
                        )}
                    </CardContent>
                    <div className="p-4 bg-muted/20 border-t mt-auto">
                        <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/5 transition-colors" asChild>
                            <Link to="/appointments">
                                Ver todas las citas
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </Card>

                {/* Quick Access */}
                <Card className="md:col-span-3 border-none shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle>Accesos Rápidos</CardTitle>
                        <CardDescription>
                            Accesos directos a las tareas más comunes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button className="w-full justify-start h-12 text-base font-medium" asChild>
                            <Link to="/patients">
                                <div className="bg-primary-foreground/20 p-1.5 rounded-lg mr-3">
                                    <UserPlus className="h-4 w-4" />
                                </div>
                                Nuevo Paciente
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 text-base font-medium shadow-sm" asChild>
                            <Link to="/appointments">
                                <div className="bg-muted p-1.5 rounded-lg mr-3">
                                    <CalendarDays className="h-4 w-4 text-primary" />
                                </div>
                                Nueva Cita
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 text-base font-medium shadow-sm" asChild>
                            <Link to="/clinical-history">
                                <div className="bg-muted p-1.5 rounded-lg mr-3">
                                    <History className="h-4 w-4 text-primary" />
                                </div>
                                Nueva Historia Clínica
                            </Link>
                        </Button>

                        <Button variant="outline" className="w-full justify-start h-12 text-base font-medium shadow-sm" asChild>
                            <Link to="/clinical-history-note">
                                <div className="bg-muted p-1.5 rounded-lg mr-3">
                                    <History className="h-4 w-4 text-primary" />
                                </div>
                                Nueva Nota de Evolución
                            </Link>
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground font-semibold tracking-wider">
                                    Configuración
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="ghost" className="flex flex-col h-20 gap-2 border bg-muted/10 hover:bg-muted/30 transition-all" asChild>
                                <Link to="/settings/schedule">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span className="text-xs font-semibold">Horarios</span>
                                </Link>
                            </Button>
                            <Button variant="ghost" className="flex flex-col h-20 gap-2 border bg-muted/10 hover:bg-muted/30 transition-all" asChild>
                                <Link to="/settings/users">
                                    <Settings className="h-5 w-5 text-primary" />
                                    <span className="text-xs font-semibold">Usuarios</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
