import { ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MaintenancePage() {
    const handleRetry = () => {
        window.location.href = import.meta.env.BASE_URL || '/';
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="max-w-md w-full text-center space-y-8 p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-100/50 dark:shadow-none animate-in fade-in zoom-in duration-500">
                {/* Visual Icon Header */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-3xl border border-amber-200 dark:border-amber-900/30">
                    <ShieldAlert className="w-12 h-12" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-ping" />
                </div>

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                        Hidroven-Falcón
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                        Portal en Mantenimiento
                    </h1>

                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Estamos realizando actualizaciones críticas y optimizaciones en la base de datos de historias clínicas. Volveremos a estar en línea muy pronto.
                    </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                    <Button
                        onClick={handleRetry}
                        className="w-full h-11 rounded-xl shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Verificar Conexión
                    </Button>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Si crees que esto es un error, por favor contacta al administrador del sistema.
                    </p>
                </div>
            </div>
        </div>
    );
}
