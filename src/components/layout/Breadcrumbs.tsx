import { Link, useLocation } from 'react-router';
import { ChevronRight, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
    'patients': 'Pacientes',
    'appointments': 'Citas',
    'clinical-history': 'Historias Clínicas',
    'settings': 'Configuración',
    'schedule': 'Horarios',
    'rooms': 'Consultorios',
    'templates': 'Plantillas',
    'users': 'Usuarios',
    'new': 'Nuevo',
    'edit': 'Editar',
};

export function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (location.pathname === '/') return null;

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
            <Link
                to="/"
                className="flex items-center hover:text-primary transition-colors gap-1.5 px-1 py-0.5 rounded-md hover:bg-primary/5"
            >
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only">Inicio</span>
            </Link>

            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const label = routeMap[value] || value;

                // Handle UUIDs or IDs in the path
                const isId = /^[0-9a-fA-F-]{24,36}$/.test(value);
                const displayLabel = isId ? 'Detalle' : label;

                return (
                    <div key={to} className="flex items-center space-x-1">
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                        {last ? (
                            <span className="font-bold text-foreground px-1 py-0.5 bg-muted/50 rounded-md">
                                {displayLabel}
                            </span>
                        ) : (
                            <Link
                                to={to}
                                className="hover:text-primary transition-colors px-1 py-0.5 rounded-md hover:bg-primary/5"
                            >
                                {displayLabel}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
