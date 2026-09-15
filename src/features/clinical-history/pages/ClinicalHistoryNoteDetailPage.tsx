import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    Activity,
    Pill,
    Pencil,
    Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, safeFormat } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClinicalHistoryNoteById } from '../hooks/useClinicalHistoryNotes';
import { ClinicalHistoryDocumentsManager } from '@/features/clinical-history/components/ClinicalHistoryDocumentsManager';

export function ClinicalHistoryNoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: noteRes, isLoading: isLoadingNote } = useClinicalHistoryNoteById(id!);

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
        let parsed = planData;
        if (typeof parsed === 'string') {
            const trimmed = parsed.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                    parsed = JSON.parse(trimmed);
                } catch {
                    // keep as string
                }
            }
        }

        if (typeof parsed === 'string') return <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">{parsed}</p>;

        const planLabels: Record<string, string> = {
            medicacion: 'Medicación / Tratamiento',
            medication: 'Medicación / Tratamiento',
            indicaciones: 'Indicaciones Generales',
            examenes: 'Exámenes Complementarios',
        };

        const entries = Object.entries(parsed).filter(([_, val]) => val && String(val).trim() !== '');
        if (entries.length === 0) return <p className="text-sm italic text-muted-foreground">Sin plan ajustado</p>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {entries.map(([key, value]) => {
                    const label = planLabels[key] || key.replace(/([A-Z])/g, ' $1').trim();
                    const isMed = key.toLowerCase().includes('medica');
                    const isFull = key === 'medicacion' || key === 'indicaciones' || String(value).length > 100;
                    return (
                        <div key={key} className={cn("p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-1.5", isFull ? "md:col-span-2" : "md:col-span-1")}>
                            <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                {isMed ? <Pill className="h-3.5 w-3.5 text-primary" /> : <FileText className="h-3.5 w-3.5 text-primary" />}
                                {label}
                            </span>
                            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Detalle de Nota de Evolución</h1>
                        <p className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Registrada el {safeFormat(note.fecha, 'PPP', 'S/F')} a las {safeFormat(note.fecha, 'p', 'S/F')}
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => navigate(`/clinical-history-note/${note.id}/edit`)}
                    className="border-primary/20 hover:bg-primary/5 text-primary shadow-xs font-medium w-full sm:w-auto"
                >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Nota
                </Button>
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

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            Evaluación Objetiva
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {note.objetivo && (
                            <div>
                                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Examen Físico y Signos Vitales</h4>
                                <p className="text-sm border-l-2 border-primary/20 pl-4 py-1 leading-relaxed whitespace-pre-wrap">
                                    {note.objetivo}
                                </p>
                            </div>
                        )}
                        {note.seguimiento && Object.keys(note.seguimiento).length > 0 && (
                            <div className="pt-2">
                                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Métricas</h4>
                                {renderDataRecord(note.seguimiento)}
                            </div>
                        )}
                        {!note.objetivo && (!note.seguimiento || Object.keys(note.seguimiento).length === 0) && (
                            <p className="text-sm italic text-muted-foreground">No se registró evaluación objetiva.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Diagnóstico y Tratamiento Actual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {note.diagnostico && (
                            <div>
                                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Diagnóstico</h4>
                                <p className="text-sm border-l-2 border-primary/20 pl-4 py-1 leading-relaxed">
                                    {note.diagnostico}
                                </p>
                            </div>
                        )}
                        {note.tratamientoActual && (
                            <div>
                                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Tratamiento Actual</h4>
                                <p className="text-sm border-l-2 border-primary/20 pl-4 py-1 leading-relaxed whitespace-pre-wrap">
                                    {note.tratamientoActual}
                                </p>
                            </div>
                        )}
                        {!note.diagnostico && !note.tratamientoActual && (
                            <p className="text-sm italic text-muted-foreground">No se registró diagnóstico ni tratamiento actual.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
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

            {/* Exámenes y documentos adjuntos */}
            {(() => {
                const noteDocs = (note.documents && Array.isArray(note.documents))
                    ? note.documents.filter((d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url))
                    : [];

                const patient = note.patient || note.clinicalHistory?.patient;
                const patientDocsForNote = (patient?.documents || []).filter(
                    (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url) && d.noteId === note.id
                );

                const merged = [...noteDocs];
                patientDocsForNote.forEach((pDoc: any) => {
                    if (!merged.some((d: any) => (d.id && d.id === pDoc.id) || (d.url && d.url === pDoc.url))) {
                        merged.push(pDoc);
                    }
                });

                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Paperclip className="h-5 w-5 text-primary" />
                                Exámenes Complementarios Adjuntos
                                {merged.length > 0 && (
                                    <span className="ml-auto text-sm font-normal text-muted-foreground">{merged.length} archivo{merged.length !== 1 ? 's' : ''}</span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ClinicalHistoryDocumentsManager
                                documents={merged}
                                noteId={note.id}
                                historyId={note.clinicalHistoryId || note.clinicalHistory?.id}
                                patientId={patient?.id}
                                readOnly={true}
                            />
                        </CardContent>
                    </Card>
                );
            })()}
        </div>
    );
}
