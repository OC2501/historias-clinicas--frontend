import { useNavigate } from 'react-router';
import {
    ArrowLeft,
    FileText,
    Plus,
    
    User,
    Calendar,
    Stethoscope,
    Clock,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ClinicalHistory } from '@/types';
import { cn } from '@/lib/utils';
import { useClinicalHistory } from '@/features/clinical-history/hooks/useClinicalHistory';

export function ClinicalHistoryDetailPage() {
    const navigate = useNavigate();
    const { history, isLoading, expandedEvents, toggleExpand, allEvents } = useClinicalHistory();

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
    if (!history) return <div className="p-8 text-center text-muted-foreground">No se encontró la historia clínica.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Historial Clínico</h1>
                        <p className="text-muted-foreground">
                            Registro cronológico de atención para <strong>{history.patient.firstName} {history.patient.lastName}</strong>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => navigate(`/clinical-history/notes/new?historyId=${history.id}`)} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Nota
                    </Button>
                </div>
            </div>

            {/* Patient Summary Card */}
            <Card className="bg-muted/30">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Paciente</span>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-medium">{history.patient.firstName} {history.patient.lastName}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Documento</span>
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{history.patient.identificationNumber || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Especialidad</span>
                            <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-primary" />
                                <Badge variant="secondary" className="capitalize">
                                    {history.specialty.toLowerCase()}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Fecha Inicio</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                    {format(new Date(history.fecha), 'PP', { locale: es })}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/50 before:to-transparent">
                {allEvents.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-10">
                        {/* Dot */}
                        <div className="absolute left-0 mt-1.5 h-10 w-10 flex items-center justify-center rounded-full bg-background border-2 border-primary z-10">
                            {event.isInitial ? (
                                <FileText className="h-5 w-5 text-primary" />
                            ) : (
                                <Clock className="h-5 w-5 text-primary" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 ml-4">
                            <Card className={cn(
                                "transition-all duration-300",
                                expandedEvents[event.id] ? "ring-2 ring-primary/20" : "hover:bg-muted/50 cursor-pointer"
                            )}
                                onClick={() => !expandedEvents[event.id] && toggleExpand(event.id)}
                            >
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg">{event.title}</CardTitle>
                                                {!event.isInitial && <Badge variant="outline">Evolución</Badge>}
                                            </div>
                                            <CardDescription className="flex items-center gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(event.date), 'PPp', { locale: es })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    Dr. {event.doctor}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={(e) => {
                                            e.stopPropagation();
                                            toggleExpand(event.id);
                                        }}>
                                            {expandedEvents[event.id] ? <ChevronUp /> : <ChevronDown />}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {expandedEvents[event.id] && (
                                    <CardContent className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Separator className="my-4" />
                                        <div className="space-y-6">
                                            {event.isInitial ? (
                                                <InitialHistoryDetail history={event.content as ClinicalHistory} />
                                            ) : (
                                                <EvolutionNoteDetail note={event.content as any} />
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const labelsMap: Record<string, string> = {
    presionArterial: 'Presión Arterial',
    frecuenciaCardiaca: 'Frecuencia Cardíaca',
    frecuenciaRespiratoria: 'Frecuencia Respiratoria',
    saturacionOxigeno: 'Saturación O2',
    temperatura: 'Temperatura',
    peso: 'Peso',
    altura: 'Altura',
    imc: 'IMC',
    otros: 'Exámenes / Hallazgos Adicionales',
    examenes: 'Exámenes Complementarios',
    medicacion: 'Medicación/Tratamiento',
    medication: 'Medicación/Tratamiento'
};

const formatLabel = (key: string) => labelsMap[key] || key.replace(/([A-Z])/g, ' $1').trim();
const isNA = (val: any) => !val || String(val).toUpperCase() === 'N/A' || String(val).toUpperCase() === 'NINGUNO' || String(val).toUpperCase() === 'NINGUNA';

function InitialHistoryDetail({ history }: { history: ClinicalHistory }) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Motivo de Consulta</h4>
                    <p className="text-sm border-l-2 border-muted-foreground/20 pl-4 italic">
                        {history.motivoConsulta || 'No especificado'}
                    </p>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Enfermedad Actual</h4>
                    <p className="text-sm">
                        {history.enfermedadActual || 'No especificada'}
                    </p>
                </div>
                {history.antecedentesPersonales && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Antecedentes Personales</h4>
                        <div className="text-sm border-l-2 border-primary/20 pl-4 prose-sm max-w-none">
                            {typeof history.antecedentesPersonales === 'string' ? (
                                <div dangerouslySetInnerHTML={{ __html: history.antecedentesPersonales }} />
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: (history.antecedentesPersonales as any).descripcion || 'Ninguno' }} />
                            )}
                        </div>
                    </div>
                )}
                {(history.antecedentesFamiliares || history.datosEspecificos?.antecedentesFamiliares) && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Antecedentes Familiares</h4>
                        {(() => {
                            const antFam = history.antecedentesFamiliares || history.datosEspecificos?.antecedentesFamiliares;
                            return typeof antFam === 'string' ? (
                                <div className="text-sm border-l-2 border-primary/20 pl-4 prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: antFam }} />
                            ) : (
                                <div className="text-sm border-l-2 border-primary/20 pl-4">{String(antFam)}</div>
                            );
                        })()}
                    </div>
                )}
                {history.habitos && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Hábitos Psicobiológicos</h4>
                        <div className="text-sm border-l-2 border-secondary/20 pl-4 prose-sm max-w-none">
                            {typeof history.habitos === 'string' ? (
                                <div dangerouslySetInnerHTML={{ __html: history.habitos }} />
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: (history.habitos as any).descripcion || 'N/A' }} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {history.examenFisico && Object.keys(history.examenFisico).length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Examen Físico</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-muted/30 rounded-lg">
                            {Object.entries(history.examenFisico).filter(([k]) => k !== 'otros').map(([k, v]) => (
                                <div key={k} className="flex flex-col border-b border-muted py-1 last:border-0">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">{formatLabel(k)}</span>
                                    <span className={cn("font-medium", isNA(v) && "text-muted-foreground/40")}>{String(v)}</span>
                                </div>
                            ))}
                        </div>
                        {history.examenFisico.otros && (
                            <div className="mt-2">
                                <span className="text-xs text-muted-foreground font-semibold uppercase">{formatLabel('otros')}</span>
                                <div className="text-sm border-l-2 border-primary/20 pl-4 mt-1 prose-sm" dangerouslySetInnerHTML={{ __html: history.examenFisico.otros }} />
                            </div>
                        )}
                    </div>
                )}
                {history.diagnosticos && history.diagnosticos.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Diagnósticos</h4>
                        <div className="flex flex-wrap gap-2">
                            {history.diagnosticos.map((d, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-muted/20 border-primary/20">
                                    {d}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
                {history.planManejo && (
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Plan de Manejo</h4>
                        {typeof history.planManejo === 'string' ? (
                            <p className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/10">{history.planManejo}</p>
                        ) : (
                            <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                                {Object.entries(history.planManejo).map(([k, v]) => (
                                    <div key={k} className="text-sm flex flex-col">
                                        <span className="font-semibold text-primary/80">{formatLabel(k)}</span>
                                        <span className={cn("text-muted-foreground", isNA(v) && "opacity-40")}>{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {history.datosEspecificos && Object.keys(history.datosEspecificos).length > 0 && (
                <div className="md:col-span-2">
                    <Separator className="my-2" />
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Hallazgos Específicos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(history.datosEspecificos).map(([key, value]) => (
                            <div key={key} className="p-3 rounded-lg bg-muted/40">
                                <span className="text-xs text-muted-foreground block mb-1 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <span className="text-sm font-medium">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function EvolutionNoteDetail({ note }: { note: any }) {
    return (
        <div className="space-y-4">
            <div>
                <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Estado Subjetivo</h4>
                <p className="text-sm border-l-2 border-primary/20 pl-4">
                    {note.estadoSubjetivo}
                </p>
            </div>

            {note.seguimiento && Object.keys(note.seguimiento).length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Seguimiento</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(note.seguimiento).map(([key, value]) => (
                            <div key={key} className="text-sm flex justify-between p-2 rounded bg-muted/30">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                <span className="font-medium">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {note.planAjustado && (
                <div>
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Plan Ajustado</h4>
                    <p className="text-sm">{typeof note.planAjustado === 'string' ? note.planAjustado : JSON.stringify(note.planAjustado)}</p>
                </div>
            )}

            {note.proximaCita && (
                <div className="flex items-center gap-2 text-primary font-medium">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Próxima cita programada para el {format(new Date(note.proximaCita), 'PPPP', { locale: es })}</span>
                </div>
            )}
        </div>
    );
}
