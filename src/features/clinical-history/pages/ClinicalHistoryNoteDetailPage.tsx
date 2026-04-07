import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    Activity,
    Pill
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { clinicalHistoryNoteApi } from '@/api';

export function ClinicalHistoryNoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: noteRes, isLoading: isLoadingNote } = useQuery({
        queryKey: ['clinical-history-note', id],
        queryFn: () => clinicalHistoryNoteApi.getById(id!),
        enabled: !!id,
    });

    const note = useMemo(() => noteRes?.data || null, [noteRes]);

    if (isLoadingNote) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando detalles de la nota...</div>;
    if (!note) return <div className="p-8 text-center text-muted-foreground">No se encontró la nota de evolución.</div>;

    const renderDataRecord = (record: Record<string, any> | undefined | null) => {
        if (!record || Object.keys(record).length === 0) return <p className="text-sm italic text-muted-foreground">No hay datos registrados</p>;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {Object.entries(record).map(([key, value]) => (
                    <div key={key} className="text-sm flex justify-between p-2 rounded bg-muted/30">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-medium">{String(value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderPlanData = (planData: any) => {
        if (!planData) return <p className="text-sm italic text-muted-foreground">Sin plan ajustado</p>;
        if (typeof planData === 'string') return <p className="text-sm mt-2">{planData}</p>;

        return renderDataRecord(planData);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalle de Nota de Evolución</h1>
                        <p className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Registrada el {format(new Date(note.fecha), 'PPP', { locale: es })} a las {format(new Date(note.fecha), 'p')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Anamnesis Subjetiva
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Estado Subjetivo</h4>
                            <p className="text-sm border-l-2 border-primary/20 pl-4 py-1 leading-relaxed">
                                {note.estadoSubjetivo}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            Seguimiento Físico / Métricas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderDataRecord(note.seguimiento)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Pill className="h-5 w-5 text-primary" />
                            Plan Ajustado
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderPlanData(note.planAjustado)}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        Próximos Pasos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {note.proximaCita ? (
                        <div className="flex items-center gap-2 text-primary font-medium text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>Cita de seguimiento recomendada para el: <strong>{format(new Date(note.proximaCita), 'PPPP', { locale: es })}</strong></span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No se registró fecha para próxima cita.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
