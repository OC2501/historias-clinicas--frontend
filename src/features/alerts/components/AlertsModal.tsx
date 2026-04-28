import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import type { AlertType } from '../types/alert.types';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'alerts_modal_shown';

const ALERT_CONFIG: Record<AlertType, {
    icon: typeof Info;
    badgeClass: string;
    iconClass: string;
    bgClass: string;
    label: string;
}> = {
    INFO: {
        icon: Info,
        badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        iconClass: 'text-blue-500',
        bgClass: 'bg-blue-500/10 border border-blue-500/20',
        label: 'Información',
    },
    WARNING: {
        icon: AlertTriangle,
        badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        iconClass: 'text-amber-500',
        bgClass: 'bg-amber-500/10 border border-amber-500/20',
        label: 'Advertencia',
    },
    DANGER: {
        icon: XCircle,
        badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
        iconClass: 'text-red-500',
        bgClass: 'bg-red-500/10 border border-red-500/20',
        label: 'Urgente',
    },
    SUCCESS: {
        icon: CheckCircle,
        badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        iconClass: 'text-emerald-500',
        bgClass: 'bg-emerald-500/10 border border-emerald-500/20',
        label: 'Éxito',
    },
};

export function AlertsModal() {
    const { alerts, isLoading, markAllAsRead, isMarkingRead } = useAlerts();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // Solo mostrar el modal si:
        // 1. Hay alertas no leídas
        // 2. No se ha mostrado ya en esta sesión
        if (!isLoading && alerts.length > 0 && !sessionStorage.getItem(SESSION_KEY)) {
            setOpen(true);
            sessionStorage.setItem(SESSION_KEY, 'true');
        }
    }, [alerts, isLoading]);

    const handleMarkAllAndClose = () => {
        markAllAsRead(undefined, {
            onSuccess: () => setOpen(false),
        });
    };

    const handleClose = () => setOpen(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg rounded-2xl shadow-2xl border-none p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Bell className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-white">
                                Alertas del Sistema
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-primary-foreground/80">
                            Tienes <strong className="text-white">{alerts.length}</strong> alerta{alerts.length !== 1 ? 's' : ''} pendiente{alerts.length !== 1 ? 's' : ''} por revisar.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Alerts list */}
                <ScrollArea className="max-h-[360px] px-6 py-4">
                    <div className="space-y-3">
                        {alerts.map((alert) => {
                            const config = ALERT_CONFIG[alert.type];
                            const Icon = config.icon;
                            return (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        'rounded-xl border p-4 flex gap-3 transition-all',
                                        config.bgClass,
                                    )}
                                >
                                    <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClass)} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold text-sm text-foreground">
                                                {alert.title}
                                            </span>
                                            <Badge variant="outline" className={cn('text-[10px] font-bold h-4 px-1.5', config.badgeClass)}>
                                                {config.label}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <DialogFooter className="px-6 pb-6 pt-2 flex gap-2 flex-row justify-end">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="rounded-xl"
                    >
                        Cerrar
                    </Button>
                    <Button
                        onClick={handleMarkAllAndClose}
                        disabled={isMarkingRead}
                        className="rounded-xl gap-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Marcar todo como leído
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
