import { Menu, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useUIStore } from '@/store/ui.store';
import { GlobalSearch } from '../shared/GlobalSearch';

export function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useAppTheme();
    const { toggleMobileMenu } = useUIStore();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

    return (
        <header className="flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-8 sticky top-0 z-10">
            {/* Mobile sidebar toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl hover:bg-primary/5"
                onClick={toggleMobileMenu}
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
            </Button>

            {/* Global Search */}
            <GlobalSearch />

            {/* Spacer */}
            <div className="flex-1" />

            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl hover:bg-primary/5">
                    {theme === 'dark' ? (
                        <Sun className="h-5 w-5 text-amber-500" />
                    ) : (
                        <Moon className="h-5 w-5 text-slate-700" />
                    )}
                    <span className="sr-only">Cambiar tema</span>
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-primary/5 p-0 overflow-hidden border shadow-sm">
                            <Avatar className="h-full w-full rounded-none">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl border-primary/10">
                        <DropdownMenuLabel className="p-3 font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground mt-1">
                                    {user?.email}
                                </p>
                                <div className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider w-fit">
                                    {user?.role}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="mx-1" />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-xl transition-colors cursor-pointer m-1">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="font-semibold">Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
