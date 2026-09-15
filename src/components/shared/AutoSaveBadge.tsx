import { Cloud, Check, Loader2, AlertCircle } from 'lucide-react';
import { safeFormat } from '@/lib/utils';
import type { AutoSaveStatus } from '@/hooks/useAutoSave';
import { cn } from '@/lib/utils';

interface AutoSaveBadgeProps {
    status: AutoSaveStatus;
    lastSaved: Date | null;
    isRemote?: boolean;
    className?: string;
}

export function AutoSaveBadge({
    status,
    lastSaved,
    isRemote = false,
    className,
}: AutoSaveBadgeProps) {
    if (status === 'idle' && !lastSaved) {
        return null;
    }

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300 select-none whitespace-nowrap shrink-0",
                status === 'saving' && "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60",
                status === 'saved' && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60",
                status === 'error' && "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60",
                status === 'idle' && lastSaved && "bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
                className
            )}
        >
            {status === 'saving' && (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>{isRemote ? "Guardando cambios..." : "Guardando borrador..."}</span>
                </>
            )}

            {status === 'saved' && (
                <>
                    <div className="relative flex items-center justify-center shrink-0">
                        <Cloud className="h-3.5 w-3.5" />
                        <Check className="h-2 w-2 absolute text-emerald-600 dark:text-emerald-400 -bottom-0.5 -right-0.5 stroke-[3]" />
                    </div>
                    <span>
                        {isRemote ? "Guardado automático" : "Borrador guardado"} {lastSaved ? safeFormat(lastSaved, 'hh:mm:ss a', '') : ''}
                    </span>
                </>
            )}

            {status === 'error' && (
                <>
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>Error al guardar</span>
                </>
            )}

            {status === 'idle' && lastSaved && (
                <>
                    <Cloud className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span>
                        {isRemote ? "Guardado" : "Borrador"} {safeFormat(lastSaved, 'hh:mm a', '')}
                    </span>
                </>
            )}
        </div>
    );
}
