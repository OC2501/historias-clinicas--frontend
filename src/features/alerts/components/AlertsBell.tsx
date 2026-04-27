import { Bell, Info, AlertTriangle, XCircle, CheckCircle, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAlerts } from '../hooks/useAlerts';
import type { AlertType } from '../types/alert.types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ALERT_CONFIG: Record<AlertType, {
    icon: typeof Info;
    iconClass: string;
    bgClass: string;
}> = {
    INFO: { icon: Info, iconClass: 'text-blue-500', bgClass: 'bg-blue-50' },
    WARNING: { icon: AlertTriangle, iconClass: 'text-amber-500', bgClass: 'bg-amber-50' },
    DANGER: { icon: XCircle, iconClass: 'text-red-500', bgClass: 'bg-red-50' },
    SUCCESS: { icon: CheckCircle, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50' },
};

export function AlertsBell() {
    const { alerts, isLoading, markAsRead, markAllAsRead, isMarkingRead } = useAlerts();
    const count = alerts.length;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-xl hover:bg-primary/5"
                    aria-label={`Alertas: ${count} no leídas`}
                >
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-red-500 hover:bg-red-500 border-background border-2 rounded-full"
                        >
                            {count > 9 ? '9+' : count}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-80 p-0 rounded-2xl shadow-2xl border-primary/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm">Alertas</span>
                        {count > 0 && (
                            <Badge className="h-4 px-1.5 text-[10px] font-bold bg-red-500 hover:bg-red-500">
                                {count}
                            </Badge>
                        )}
                    </div>
                    {count > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-primary hover:text-primary hover:bg-primary/5 rounded-lg"
                            onClick={() => markAllAsRead()}
                            disabled={isMarkingRead}
                        >
                            Marcar todo
                        </Button>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        Cargando alertas...
                    </div>
                ) : count === 0 ? (
                    <div className="p-8 text-center">
                        <BellOff className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">Sin alertas pendientes</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Estás al día 🎉</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-80">
                        <div className="p-2 space-y-1.5">
                            {alerts.map((alert) => {
                                const config = ALERT_CONFIG[alert.type];
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            'rounded-xl p-3 flex gap-3 group hover:shadow-sm transition-all',
                                            config.bgClass,
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.iconClass)} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-xs text-foreground leading-tight">
                                                {alert.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className="text-[10px] text-muted-foreground/60">
                                                    {format(new Date(alert.createdAt), "d MMM, HH:mm", { locale: es })}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 text-[10px] px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10"
                                                    onClick={() => markAsRead(alert.id)}
                                                    disabled={isMarkingRead}
                                                >
                                                    Marcar leída
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </PopoverContent>
        </Popover>
    );
}
