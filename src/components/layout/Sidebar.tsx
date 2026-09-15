import { NavLink, useLocation } from 'react-router';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    FileText,
    Settings,
    Clock,
    DoorOpen,
    BookTemplate,
    UserCog,
    Stethoscope,
    History,
    ChevronLeft,
    ChevronRight,
    Shield,
    FileBarChart,
    Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SystemRole, OrganizationRole } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/store/ui.store';
import { Button } from '@/components/ui/button';

interface SidebarProps {
    onNavigate?: () => void;
    isMobile?: boolean;
}

interface NavItem {
    to: string;
    label: string;
    icon: React.ReactNode;
    roles?: string[];
}

const mainNavItems: NavItem[] = [
    {
        to: '/',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
        to: '/patients',
        label: 'Pacientes',
        icon: <Users className="h-4 w-4" />,
    },
    {
        to: '/appointments',
        label: 'Citas',
        icon: <CalendarDays className="h-4 w-4" />,
    },
    {
        to: '/clinical-history',
        label: 'Historias Clínicas',
        icon: <FileText className="h-4 w-4" />,
        roles: [OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, OrganizationRole.ADMIN, OrganizationRole.SECRETARY, SystemRole.SUPERADMIN],
    },

    {
        to: '/clinical-history-note',
        label: 'Notas de Evolución',
        icon: <History className="h-4 w-4" />,
        roles: [OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, OrganizationRole.ADMIN, OrganizationRole.SECRETARY, SystemRole.SUPERADMIN],
    },
    {
        to: '/consultas',
        label: 'Chequeos Diarios',
        icon: <Stethoscope className="h-4 w-4" />,
        roles: [OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, OrganizationRole.ADMIN, OrganizationRole.SECRETARY, SystemRole.SUPERADMIN],
    }
];

const settingsNavItems: NavItem[] = [
    {
        to: '/settings/profile',
        label: 'Mi Perfil',
        icon: <UserCog className="h-4 w-4" />,
    },
    {
        to: '/settings/reports',
        label: 'Reportes',
        icon: <FileBarChart className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, OrganizationRole.OWNER, SystemRole.SUPERADMIN, OrganizationRole.MEDICAL_DIRECTOR, OrganizationRole.DOCTOR, OrganizationRole.NURSE],
    },
    {
        to: '/settings/schedule',
        label: 'Horarios',
        icon: <Clock className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, OrganizationRole.OWNER, OrganizationRole.SECRETARY, OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, SystemRole.SUPERADMIN],
    },
    {
        to: '/settings/rooms',
        label: 'Consultorios',
        icon: <DoorOpen className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, OrganizationRole.OWNER, OrganizationRole.SECRETARY, OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, SystemRole.SUPERADMIN],
    },
    {
        to: '/settings/templates',
        label: 'Plantillas',
        icon: <BookTemplate className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER, OrganizationRole.DOCTOR, OrganizationRole.NURSE],
    },
    {
        to: '/settings/users',
        label: 'Usuarios',
        icon: <UserCog className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER],
    },
    {
        to: '/settings/audit',
        label: 'Auditoría',
        icon: <Shield className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER],
    },
    {
        to: '/settings/alerts',
        label: 'Alertas',
        icon: <Bell className="h-4 w-4" />,
        roles: [OrganizationRole.ADMIN, SystemRole.SUPERADMIN, OrganizationRole.OWNER],
    },
];

export function Sidebar({ onNavigate, isMobile }: SidebarProps) {
    const { user } = useAuth();
    const location = useLocation();
    const { isSidebarOpen, toggleSidebar } = useUIStore();

    // En mobile siempre está abierto (expandido) dentro del drawer
    const effectiveIsOpen = isMobile ? true : isSidebarOpen;

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const canAccess = (item: NavItem) => {
        if (!item.roles) return true;
        return user && (
            item.roles.includes(user.systemRole) ||
            (user.organizationRole && item.roles.includes(user.organizationRole))
        );
    };

    const hasSettingsAccess = settingsNavItems.some(canAccess);

    return (
        <div className={cn(
            "relative flex h-full flex-col bg-card transition-all duration-300 ease-in-out border-r shadow-xl z-20",
            effectiveIsOpen ? "w-72" : "w-20",
            isMobile && "w-full border-none shadow-none"
        )}>
            {/* Logo Area */}
            <div className="flex items-center px-4 py-5 overflow-hidden shrink-0 border-b border-slate-100 dark:border-slate-800">
                <div className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    !effectiveIsOpen && "mx-auto justify-center"
                )}>
                    <div className="bg-[#1a5f9c] text-white p-2.5 rounded-2xl shrink-0 shadow-md shadow-[#1a5f9c]/20 flex items-center justify-center">
                        <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    {effectiveIsOpen && (
                        <div className="flex flex-col justify-center leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-0.5">
                                Portal Clínico
                            </span>
                            <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1">
                                de Historias
                            </span>
                            <span className="text-[10px] font-extrabold text-[#1a5f9c] dark:text-[#3b82f6] tracking-widest uppercase">
                                HIDROVEN-FALCÓN
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button - Refined and Integrated - Hidden in mobile */}
            {!isMobile && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleSidebar}
                    className="absolute -right-3.5 top-6 z-50 h-7 w-7 rounded-full border border-border bg-background shadow-md hover:bg-muted text-muted-foreground hover:text-primary transition-all lg:flex hidden items-center justify-center cursor-pointer"
                    aria-label={effectiveIsOpen ? "Contraer sidebar" : "Expandir sidebar"}
                >
                    {effectiveIsOpen ? (
                        <ChevronLeft className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </Button>
            )}

            <ScrollArea className="flex-1 min-h-0 px-3 py-6">
                {/* Main Navigation */}
                <div className="space-y-1.5">
                    {mainNavItems.filter(canAccess).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onNavigate}
                            title={!effectiveIsOpen ? item.label : ''}
                            className={({ isActive: linkActive }) => cn(
                                'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 group relative',
                                linkActive
                                    ? 'bg-[#1a5f9c] text-white shadow-lg shadow-[#1a5f9c]/25'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
                                !effectiveIsOpen && "px-0 justify-center"
                            )}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className={cn(
                                    "transition-transform duration-200 group-hover:scale-110 shrink-0",
                                    isActive(item.to) ? "text-white" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                                )}>
                                    {item.icon}
                                </div>
                                {effectiveIsOpen && (
                                    <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                                        {item.label}
                                    </span>
                                )}
                            </div>
                            {effectiveIsOpen && isActive(item.to) && (
                                <div className="h-1.5 w-1.5 rounded-full bg-white shrink-0 shadow-sm" />
                            )}
                            {!effectiveIsOpen && isActive(item.to) && (
                                <div className="absolute left-0 h-6 w-1 bg-[#1a5f9c] rounded-r-full" />
                            )}
                        </NavLink>
                    ))}
                </div>

                {hasSettingsAccess && (
                    <>
                        <Separator className="my-6 opacity-40" />
                        {effectiveIsOpen && (
                            <div className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 animate-in fade-in duration-300">
                                <Settings className="h-3 w-3 text-slate-400" />
                                Configuración
                            </div>
                        )}
                        <nav className="flex flex-col gap-1.5">
                            {settingsNavItems.filter(canAccess).map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onNavigate}
                                    title={!effectiveIsOpen ? item.label : ''}
                                    className={({ isActive: linkActive }) => cn(
                                        'flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 group relative',
                                        linkActive
                                            ? 'bg-[#1a5f9c] text-white shadow-lg shadow-[#1a5f9c]/25'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100',
                                        !effectiveIsOpen && "px-0 justify-center"
                                    )}
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={cn(
                                            "transition-transform duration-200 group-hover:scale-110 shrink-0",
                                            isActive(item.to) ? "text-white" : "text-slate-500 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200"
                                        )}>
                                            {item.icon}
                                        </div>
                                        {effectiveIsOpen && (
                                            <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                                                {item.label}
                                            </span>
                                        )}
                                    </div>
                                    {effectiveIsOpen && isActive(item.to) && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-white shrink-0 shadow-sm" />
                                    )}
                                    {!effectiveIsOpen && isActive(item.to) && (
                                        <div className="absolute left-0 h-6 w-1 bg-[#1a5f9c] rounded-r-full" />
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </>
                )}
            </ScrollArea>

            <div className="p-4 border-t dark:border-slate-850 bg-muted/5 shrink-0">
                <div className={cn(
                    "bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10 transition-all duration-300 overflow-hidden",
                    !effectiveIsOpen && "p-2 items-center"
                )}>
                    {effectiveIsOpen ? (
                        <div className="animate-in fade-in duration-300">
                            <p className="text-[10px] font-bold text-primary dark:text-[#3b82f6] uppercase tracking-wider mb-1">Usuario Actual</p>
                            <p className="text-sm font-bold truncate dark:text-slate-200">{user?.name}</p>
                            <p className="text-[10px] text-muted-foreground dark:text-slate-400 font-medium">{(user?.organizationRole || user?.systemRole)}</p>
                        </div>
                    ) : (
                        <div className="flex justify-center py-1">
                            <UserCog className="h-5 w-5 text-primary dark:text-[#3b82f6]" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
