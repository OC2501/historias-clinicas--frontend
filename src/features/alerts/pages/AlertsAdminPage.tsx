import { useState } from 'react';
import { Plus, Trash2, Bell, Info, AlertTriangle, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import alertSchema, { type AlertFormValues } from '@/features/alerts/schema/alerts.schema';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { alertsApi } from '@/features/alerts/api/alerts.api';
import type { Alert, AlertType } from '@/features/alerts/types/alert.types';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALERT_CONFIG: Record<AlertType, {
    icon: typeof Info;
    label: string;
    badgeClass: string;
    iconClass: string;
    rowClass: string;
}> = {
    INFO: {
        icon: Info,
        label: 'Información',
        badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
        iconClass: 'text-blue-500',
        rowClass: 'border-l-4 border-l-blue-400',
    },
    WARNING: {
        icon: AlertTriangle,
        label: 'Advertencia',
        badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        iconClass: 'text-amber-500',
        rowClass: 'border-l-4 border-l-amber-400',
    },
    DANGER: {
        icon: XCircle,
        label: 'Urgente',
        badgeClass: 'bg-red-100 text-red-700 border-red-200',
        iconClass: 'text-red-500',
        rowClass: 'border-l-4 border-l-red-400',
    },
    SUCCESS: {
        icon: CheckCircle,
        label: 'Éxito',
        badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        iconClass: 'text-emerald-500',
        rowClass: 'border-l-4 border-l-emerald-400',
    },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsAdminPage() {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const form = useForm<AlertFormValues>({
        resolver: zodResolver(alertSchema) as any,
        defaultValues: { title: '', message: '', type: 'INFO', expiresAt: '' },
    });

    // ── Queries ──
    const { data: alerts = [], isLoading } = useQuery<Alert[]>({
        queryKey: ['alerts', 'admin'],
        queryFn: async () => {
            const res = await alertsApi.getAll();
            return res.data ?? [];
        },
    });

    // ── Mutations ──
    const createMutation = useMutation({
        mutationFn: (data: AlertFormValues) =>
            alertsApi.create({
                ...data,
                expiresAt: data.expiresAt || undefined,
            }),
        onSuccess: () => {
            toast.success('Alerta creada correctamente');
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            handleClose();
        },
        onError: () => toast.error('Error al crear la alerta'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => alertsApi.remove(id),
        onSuccess: () => {
            toast.success('Alerta eliminada');
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            setDeleteId(null);
        },
        onError: () => toast.error('Error al eliminar la alerta'),
    });

    // ── Handlers ──
    const onSubmit = (values: AlertFormValues) => createMutation.mutate(values);

    const handleClose = () => {
        setIsOpen(false);
        form.reset();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Alertas</h1>
                    <p className="text-muted-foreground">
                        Crea y administra comunicados que se muestran a todo el personal al iniciar sesión.
                    </p>
                </div>
                <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Alerta
                </Button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['INFO', 'WARNING', 'DANGER', 'SUCCESS'] as AlertType[]).map((type) => {
                    const config = ALERT_CONFIG[type];
                    const Icon = config.icon;
                    const count = alerts.filter((a) => a.type === type).length;
                    return (
                        <Card key={type} className="border-none shadow-sm">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={cn('p-2 rounded-xl', config.badgeClass)}>
                                    <Icon className={cn('h-4 w-4', config.iconClass)} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-xs text-muted-foreground">{config.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Table card */}
            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Alertas Activas
                    </CardTitle>
                    <CardDescription>
                        Todas las alertas del sistema. Las alertas no leídas se muestran automáticamente al iniciar sesión.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
                            <p className="font-medium text-muted-foreground">No hay alertas creadas</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">
                                Crea la primera alerta usando el botón de arriba.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert) => {
                                const config = ALERT_CONFIG[alert.type];
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            'flex items-start gap-4 rounded-xl p-4 bg-muted/20 hover:bg-muted/40 transition-colors',
                                            config.rowClass,
                                        )}
                                    >
                                        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClass)} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-semibold text-sm">{alert.title}</span>
                                                <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5 font-bold', config.badgeClass)}>
                                                    {config.label}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{alert.message}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground/60">
                                                <span>Creada: {format(new Date(alert.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</span>
                                                {alert.expiresAt && (
                                                    <span>Expira: {format(new Date(alert.expiresAt), "d MMM yyyy", { locale: es })}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0 transition-colors"
                                            onClick={() => setDeleteId(alert.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isOpen} onOpenChange={(v) => !v && handleClose()}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Nueva Alerta del Sistema
                        </DialogTitle>
                        <DialogDescription>
                            Esta alerta se mostrará a todos los usuarios al iniciar sesión.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Mantenimiento programado" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mensaje *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descripción detallada de la alerta..."
                                                className="resize-none"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tipo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="INFO">🔵 Información</SelectItem>
                                                    <SelectItem value="WARNING">🟡 Advertencia</SelectItem>
                                                    <SelectItem value="DANGER">🔴 Urgente</SelectItem>
                                                    <SelectItem value="SUCCESS">🟢 Éxito</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="expiresAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expira el (opcional)</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Publicar Alerta
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(v) => !v && setDeleteId(null)}
                onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
                title="¿Eliminar esta alerta?"
                description="La alerta dejará de mostrarse a todos los usuarios. Esta acción no se puede deshacer."
                variant="destructive"
            />
        </div>
    );
}
