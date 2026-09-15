import { Link } from 'react-router';
import {
    Settings,
    UserCog,
    Users,
    Shield,
    Clock,
    DoorOpen,
    BookTemplate,
    Bell,
    FileBarChart,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SystemRole, OrganizationRole } from '@/types/enums';

interface SettingCard {
    title: string;
    description: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'personal' | 'clinical' | 'admin';
    roles?: (SystemRole | OrganizationRole)[];
    badge?: string;
    iconColor: string;
    bgColor: string;
}

const SETTING_CARDS: SettingCard[] = [
    // Cuenta y Personal
    {
        title: 'Mi Perfil',
        description: 'Información personal, datos de cuenta, cambio de contraseña y preguntas de seguridad.',
        to: '/settings/profile',
        icon: UserCog,
        category: 'personal',
        iconColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50',
    },
    // Operaciones Clínicas
    {
        title: 'Horarios de Atención',
        description: 'Configuración de turnos, jornadas y disponibilidad de médicos especialistas.',
        to: '/settings/schedule',
        icon: Clock,
        category: 'clinical',
        roles: [
            OrganizationRole.ADMIN,
            OrganizationRole.OWNER,
            OrganizationRole.SECRETARY,
            OrganizationRole.DOCTOR,
            OrganizationRole.NURSE,
            OrganizationRole.MEDICAL_DIRECTOR,
            SystemRole.SUPERADMIN,
        ],
        iconColor: 'text-teal-600 dark:text-teal-400',
        bgColor: 'bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/50',
    },
    {
        title: 'Consultorios Médicos',
        description: 'Gestión y asignación de espacios físicos de consulta y áreas de atención médica.',
        to: '/settings/rooms',
        icon: DoorOpen,
        category: 'clinical',
        roles: [
            OrganizationRole.ADMIN,
            OrganizationRole.OWNER,
            OrganizationRole.SECRETARY,
            OrganizationRole.DOCTOR,
            OrganizationRole.NURSE,
            OrganizationRole.MEDICAL_DIRECTOR,
            SystemRole.SUPERADMIN,
        ],
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/50',
    },
    {
        title: 'Plantillas de Especialidad',
        description: 'Formularios dinámicos y campos específicos para cada especialidad médica.',
        to: '/settings/templates',
        icon: BookTemplate,
        category: 'clinical',
        roles: [
            OrganizationRole.ADMIN,
            SystemRole.SUPERADMIN,
            OrganizationRole.OWNER,
            OrganizationRole.DOCTOR,
            OrganizationRole.NURSE,
        ],
        iconColor: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50',
    },
    {
        title: 'Reportes y Estadísticas',
        description: 'Métricas asistenciales, demográficas, tendencias clínicas y resumen de consultas.',
        to: '/settings/reports',
        icon: FileBarChart,
        category: 'clinical',
        roles: [
            OrganizationRole.ADMIN,
            OrganizationRole.OWNER,
            SystemRole.SUPERADMIN,
            OrganizationRole.MEDICAL_DIRECTOR,
            OrganizationRole.DOCTOR,
            OrganizationRole.NURSE,
        ],
        iconColor: 'text-sky-600 dark:text-sky-400',
        bgColor: 'bg-sky-50 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/50',
    },
    // Administración y Seguridad
    {
        title: 'Gestión de Usuarios',
        description: 'Creación de cuentas, asignación de roles de sistema y control de acceso del personal.',
        to: '/settings/users',
        icon: Users,
        category: 'admin',
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER],
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50',
    },
    {
        title: 'Auditoría del Sistema',
        description: 'Registro de actividades, eventos de seguridad y trazabilidad de cambios en el sistema.',
        to: '/settings/audit',
        icon: Shield,
        category: 'admin',
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER],
        iconColor: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/50',
    },
    {
        title: 'Alertas y Notificaciones',
        description: 'Configuración de reglas de alertas médicas, avisos y parámetros automáticos.',
        to: '/settings/alerts',
        icon: Bell,
        category: 'admin',
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER],
        iconColor: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/50',
    },
];

export function SettingsPage() {
    const { user } = useAuth();

    const canAccess = (item: SettingCard) => {
        if (!item.roles) return true;
        if (!user) return false;
        return (
            item.roles.includes(user.systemRole) ||
            (user.organizationRole && item.roles.includes(user.organizationRole))
        );
    };

    const accessibleCards = SETTING_CARDS.filter(canAccess);
    const personalCards = accessibleCards.filter((c) => c.category === 'personal');
    const clinicalCards = accessibleCards.filter((c) => c.category === 'clinical');
    const adminCards = accessibleCards.filter((c) => c.category === 'admin');

    const renderCard = (item: SettingCard) => {
        const IconComponent = item.icon;
        return (
            <Link
                key={item.to}
                to={item.to}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/40 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${item.bgColor} transition-transform duration-200 group-hover:scale-105`}>
                            <IconComponent className={`h-6 w-6 ${item.iconColor}`} />
                        </div>
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                    </div>
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {item.description}
                    </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Configurar</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
            </Link>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-transparent p-6 sm:p-8 rounded-3xl border border-blue-500/15 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold w-fit">
                            <Settings className="h-3.5 w-3.5" />
                            <span>Panel de Control</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                            Configuración del Sistema
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-2xl">
                            Administre las preferencias de su cuenta, parámetros operativos clínicos y herramientas de seguridad.
                        </p>
                    </div>

                    {user && (
                        <div className="self-start sm:self-auto px-4 py-2 rounded-2xl bg-card border border-border shadow-xs text-xs">
                            <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                                Rol Activo
                            </span>
                            <span className="font-extrabold text-foreground">
                                {user.organizationRole || user.systemRole}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Categoría: Cuenta y Perfil */}
            {personalCards.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Cuenta y Perfil
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {personalCards.map(renderCard)}
                    </div>
                </div>
            )}

            {/* Categoría: Operaciones Clínicas */}
            {clinicalCards.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Operaciones Clínicas
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clinicalCards.map(renderCard)}
                    </div>
                </div>
            )}

            {/* Categoría: Seguridad y Administración */}
            {adminCards.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Administración y Seguridad
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {adminCards.map(renderCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
