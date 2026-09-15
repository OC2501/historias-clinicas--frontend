import { RotateCcw, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeFormat } from '@/lib/utils';

interface DraftRecoveryBannerProps {
    draftTimestamp: Date | null;
    onRestore: () => void;
    onDiscard: () => void;
    itemName?: string;
}

export function DraftRecoveryBanner({
    draftTimestamp,
    onRestore,
    onDiscard,
    itemName = 'historia clínica',
}: DraftRecoveryBannerProps) {
    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                        Borrador recuperable disponible
                        {draftTimestamp && (
                            <span className="inline-flex items-center gap-1 font-normal text-xs text-amber-700 dark:text-amber-400">
                                <Clock className="h-3 w-3" />
                                {safeFormat(draftTimestamp, 'dd/MM/yyyy hh:mm a', 'Reciente')}
                            </span>
                        )}
                    </h4>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                        Tienes un borrador autoguardado de esta {itemName} que no fue enviado. Puedes restaurar todos los campos para continuar redactando o descartarlo.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDiscard}
                    className="h-8 text-xs border-amber-300/60 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Descartar
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={onRestore}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Recuperar borrador
                </Button>
            </div>
        </div>
    );
}
