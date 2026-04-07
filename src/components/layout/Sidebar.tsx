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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserRole } from '@/types';
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
        roles: [UserRole.DOCTOR, UserRole.ADMIN],
    },

    {
        to: '/clinical-history-note',
        label: 'Notas de Evolución',
        icon: <History className="h-4 w-4" />,
        roles: [UserRole.DOCTOR, UserRole.ADMIN],
    }
];

const settingsNavItems: NavItem[] = [
    {
        to: '/settings/schedule',
        label: 'Horarios',
        icon: <Clock className="h-4 w-4" />,
        roles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR],
    },
    {
        to: '/settings/rooms',
        label: 'Consultorios',
        icon: <DoorOpen className="h-4 w-4" />,
        roles: [UserRole.ADMIN, UserRole.SECRETARY, UserRole.DOCTOR],
    },
    {
        to: '/settings/templates',
        label: 'Plantillas',
        icon: <BookTemplate className="h-4 w-4" />,
        roles: [UserRole.ADMIN],
    },
    {
        to: '/settings/users',
        label: 'Usuarios',
        icon: <UserCog className="h-4 w-4" />,
        roles: [UserRole.ADMIN],
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
        return location.pathname.startsWith(path);
    };

    const canAccess = (item: NavItem) => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    };

    const hasSettingsAccess = settingsNavItems.some(canAccess);

    return (
        <div className={cn(
            "relative flex h-full flex-col bg-card transition-all duration-300 ease-in-out border-r shadow-xl z-20",
            effectiveIsOpen ? "w-72" : "w-20",
            isMobile && "w-full border-none shadow-none"
        )}>
            {/* Logo Area */}
            <div className="flex h-16 items-center border-b px-4 overflow-hidden">
                <div className={cn(
                    "flex items-center gap-3 transition-all duration-300",
                    !effectiveIsOpen && "mx-auto justify-center"
                )}>
                    <div className="bg-primary/10 p-2 rounded-xl shrink-0">
                        <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    {effectiveIsOpen && (
                        <span className="text-xl font-black tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate animate-in fade-in slide-in-from-left-2">
                            EHR System
                        </span>
                    )}
                </div>
            </div>

            {/* Toggle Button - Refined and Integrated - Hidden in mobile */}
            {!isMobile && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 z-30 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted text-muted-foreground hover:text-primary transition-all lg:flex hidden"
                    aria-label={effectiveIsOpen ? "Contraer sidebar" : "Expandir sidebar"}
                >
                    {effectiveIsOpen ? (
                        <ChevronLeft className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                    )}
                </Button>
            )}

            <ScrollArea className="flex-1 px-3 py-6">
                {/* Main Navigation */}
                <div className="space-y-1">
                    {mainNavItems.filter(canAccess).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onNavigate}
                            title={!effectiveIsOpen ? item.label : ''}
                            className={({ isActive: linkActive }) => cn(
                                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 group relative',
                                linkActive
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                !effectiveIsOpen && "px-0 justify-center"
                            )}
                        >
                            <div className={cn(
                                "transition-transform duration-200 group-hover:scale-110",
                                isActive(item.to) ? "text-primary-foreground" : "text-primary"
                            )}>
                                {item.icon}
                            </div>
                            {effectiveIsOpen && (
                                <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                                    {item.label}
                                </span>
                            )}
                            {/* Active Indicator Line for Collapsed State */}
                            {!effectiveIsOpen && isActive(item.to) && (
                                <div className="absolute left-0 h-6 w-1 bg-primary rounded-r-full" />
                            )}
                        </NavLink>
                    ))}
                </div>

                {hasSettingsAccess && (
                    <>
                        <Separator className="my-6 opacity-50" />
                        {effectiveIsOpen && (
                            <div className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 animate-in fade-in duration-300">
                                <Settings className="h-3 w-3" />
                                Configuración
                            </div>
                        )}
                        <nav className="flex flex-col gap-1">
                            {settingsNavItems.filter(canAccess).map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={onNavigate}
                                    title={!effectiveIsOpen ? item.label : ''}
                                    className={({ isActive: linkActive }) => cn(
                                        'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 group relative',
                                        linkActive
                                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                        !effectiveIsOpen && "px-0 justify-center"
                                    )}
                                >
                                    <div className={cn(
                                        "transition-transform duration-200 group-hover:scale-110",
                                        isActive(item.to) ? "text-primary-foreground" : "text-primary"
                                    )}>
                                        {item.icon}
                                    </div>
                                    {effectiveIsOpen && (
                                        <span className="animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                                            {item.label}
                                        </span>
                                    )}
                                    {!effectiveIsOpen && isActive(item.to) && (
                                        <div className="absolute left-0 h-6 w-1 bg-primary rounded-r-full" />
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    </>
                )}
            </ScrollArea>

            <div className="p-4 border-t bg-muted/5">
                <div className={cn(
                    "bg-primary/5 rounded-2xl p-4 border border-primary/10 transition-all duration-300 overflow-hidden",
                    !effectiveIsOpen && "p-2 items-center"
                )}>
                    {effectiveIsOpen ? (
                        <div className="animate-in fade-in duration-300">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Usuario Actual</p>
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{user?.role}</p>
                        </div>
                    ) : (
                        <div className="flex justify-center py-1">
                            <UserCog className="h-5 w-5 text-primary" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
