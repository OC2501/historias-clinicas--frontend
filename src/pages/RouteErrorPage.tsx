import { useRouteError, Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function RouteErrorPage() {
    const error = useRouteError() as any;
    console.error(error);

    return (
        <div className="flex h-screen flex-col items-center justify-center gap-6 p-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">¡Ups! Algo salió mal</h1>
                <p className="text-muted-foreground max-w-[500px]">
                    Ha ocurrido un error inesperado al cargar esta página. 
                    Nuestros ingenieros han sido notificados (o lo estarían en producción).
                </p>
            </div>

            {error?.message && (
                <div className="bg-muted p-4 rounded-lg text-left max-w-2xl overflow-auto border">
                    <p className="text-xs font-mono text-destructive">{error.message}</p>
                </div>
            )}

            <div className="flex gap-4">
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Reintentar
                </Button>
                <Button asChild>
                    <Link to="/">Volver al Dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
