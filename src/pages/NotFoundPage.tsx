import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-xl text-muted-foreground">Página no encontrada</p>
            <Button asChild>
                <Link to="/">Volver al Dashboard</Link>
            </Button>
        </div>
    );
}
