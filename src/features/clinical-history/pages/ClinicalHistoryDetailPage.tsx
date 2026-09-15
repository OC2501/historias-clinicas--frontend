import { useNavigate } from 'react-router';
import {
    ArrowLeft,
    FileText,
    Plus,
    User,
    Calendar,
    Stethoscope,
    Clock,
    History,
    ChevronDown,
    ChevronUp,
    Activity,
    ClipboardList,
    Sparkles,
    Pencil,
    Pill,
    Paperclip
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ClinicalHistory, ClinicalHistoryNote } from '@/types';
import { cn, safeFormat } from '@/lib/utils';
import { useClinicalHistory } from '@/features/clinical-history/hooks/useClinicalHistory';
import { Carousel } from '@/components/ui/carousel';
import { sanitizeHtml } from '@/lib/sanitize';
import { useQuery } from '@tanstack/react-query';
import { specialtiesApi } from '@/api';
import { ClinicalHistoryDocumentsManager } from '@/features/clinical-history/components/ClinicalHistoryDocumentsManager';

export function ClinicalHistoryDetailPage() {
    const navigate = useNavigate();
    const { history, isLoading: isLoadingHistory, expandedEvents, toggleExpand, allEvents } = useClinicalHistory();

    const { data: templatesRes, isLoading: isLoadingTemplates } = useQuery({
        queryKey: ['specialty-templates'],
        queryFn: () => specialtiesApi.getAll(),
    });

    const isLoading = isLoadingHistory || isLoadingTemplates;

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
    if (!history) return <div className="p-8 text-center text-muted-foreground">No se encontró la historia clínica.</div>;

    const templates = (templatesRes?.data?.data || templatesRes?.data || []) as any[];
    const activeTemplate = history
        ? templates.find((t: any) => 
            t.id === history.templateId || 
            (!history.templateId && t.specialty?.toUpperCase() === history.specialty?.toUpperCase())
          )?.estructura || null
        : null;

    const recentNotes = (history.notes || []).slice(0, 10);

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10 transition-colors">
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
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(`/clinical-history/${history.id}/edit`)} 
                        className="w-full sm:w-auto border-primary/20 hover:bg-primary/5 text-primary shadow-xs font-medium"
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Historia
                    </Button>
                    <Button onClick={() => navigate(`/clinical-history-note/new?historyId=${history.id}`)} className="w-full sm:w-auto shadow-lg hover:scale-105 transition-all">
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Nota
                    </Button>
                </div>
            </div>

            {/* Recent Notes Carousel */}
            {recentNotes.length > 0 && (
                <Card className="border-none shadow-sm bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="pb-0">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl font-bold tracking-tight">Evoluciones Recientes</CardTitle>
                        </div>
                        <CardDescription>
                            Revise rápidamente los últimos cambios clínicos registrados.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Carousel
                            items={recentNotes}
                            onCardClick={(note) => {
                                if (!expandedEvents[note.id]) toggleExpand(note.id);
                                setTimeout(() => {
                                    document.getElementById(`event-${note.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                            }}
                            renderCard={(note: ClinicalHistoryNote) => (
                                <div 
                                    onClick={() => {
                                        if (!expandedEvents[note.id]) toggleExpand(note.id);
                                        setTimeout(() => {
                                            document.getElementById(`event-${note.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 100);
                                    }}
                                    className="w-full h-[300px] bg-card border-2 border-primary/10 rounded-2xl p-5 flex flex-col justify-between shadow-md hover:shadow-xl cursor-pointer relative overflow-hidden group/note"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                                                {safeFormat(note.fecha, 'dd MMM yyyy', 'S/F')}
                                            </Badge>
                                            <Clock className="h-4 w-4 text-muted-foreground/30" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Estado Subjetivo</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-4 italic leading-relaxed">
                                                "{note.estadoSubjetivo}"
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-muted">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Diagnóstico</span>
                                            <span className="text-xs font-semibold line-clamp-1">{note.diagnostico || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-primary font-bold">
                                            <User className="h-3 w-3" />
                                            Dr. {note.doctor?.user?.name || 'Médico'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Patient Summary Card */}
            <Card className="bg-muted/30">
                <CardContent className="p-6">
                    <div className={cn(
                        "grid gap-6",
                        activeTemplate ? "grid-cols-2 md:grid-cols-6" : "grid-cols-2 md:grid-cols-5"
                    )}>
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
                                    {(activeTemplate ? (history.doctor?.specialty || 'General') : history.specialty).toLowerCase()}
                                </Badge>
                            </div>
                        </div>
                        {activeTemplate && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Plantilla</span>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <Badge variant="outline" className="capitalize border-primary/20 bg-primary/5 text-primary">
                                        {history.specialty.toLowerCase()}
                                    </Badge>
                                </div>
                            </div>
                        )}
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Fecha Inicio</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                    {safeFormat(history.fecha, 'PP', 'S/F')}
                                </span>
                            </div>
                        </div>
                        {history.updatedAt && (
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Última Edición</span>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="font-medium text-xs text-emerald-700 dark:text-emerald-300">
                                        {safeFormat(history.updatedAt, 'dd/MM/yyyy hh:mm a', 'Reciente')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary/50 before:to-transparent">
                {allEvents.map((event) => (
                    <div key={event.id} id={`event-${event.id}`} className="relative flex items-start gap-10 scroll-mt-20">
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
                                        <div className="flex items-center gap-1">
                                            {!event.isInitial && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/clinical-history-note/${event.id}/edit`);
                                                    }}
                                                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium"
                                                    title="Editar Nota de Evolución"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                                    <span className="hidden sm:inline">Editar</span>
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={(e) => {
                                                e.stopPropagation();
                                                toggleExpand(event.id);
                                            }}>
                                                {expandedEvents[event.id] ? <ChevronUp /> : <ChevronDown />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {expandedEvents[event.id] && (
                                    <CardContent className="p-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Separator className="my-4" />
                                        <div className="space-y-6">
                                            {event.isInitial ? (
                                                <InitialHistoryDetail history={event.content as ClinicalHistory} activeTemplate={activeTemplate} />
                                            ) : (
                                                <EvolutionNoteDetail note={event.content as any} patientId={history.patient?.id} patientDocuments={history.patient?.documents || []} />
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

const getSectionIcon = (titulo: string) => {
    const t = titulo.toLowerCase();
    if (t.includes('consulta') || t.includes('anamnesis') || t.includes('historia') || t.includes('relato')) {
        return History;
    }
    if (t.includes('antecedentes')) {
        return User;
    }
    if (t.includes('físico') || t.includes('fisico') || t.includes('examen') || t.includes('constantes') || t.includes('signos') || t.includes('vitales')) {
        return Activity;
    }
    if (t.includes('plan') || t.includes('tratamiento') || t.includes('manejo')) {
        return ClipboardList;
    }
    return Sparkles;
};

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
    medicacion: 'Medicación / Tratamiento',
    medication: 'Medicación / Tratamiento',
    indicaciones: 'Indicaciones Generales',
    planManejo: 'Plan de Manejo',
};

const formatLabel = (key: string) => labelsMap[key] || key.replace(/([A-Z])/g, ' $1').trim();
const isNA = (val: any) => !val || String(val).toUpperCase() === 'N/A' || String(val).toUpperCase() === 'NINGUNO' || String(val).toUpperCase() === 'NINGUNA';

const parseJsonIfNeeded = (data: any) => {
    if (typeof data === 'string') {
        const trimmed = data.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return JSON.parse(trimmed);
            } catch {
                return data;
            }
        }
    }
    return data;
};

function DiagnosesList({ diagnosticos }: { diagnosticos?: string[] }) {
    if (!diagnosticos || diagnosticos.length === 0) return null;

    const cleanDiagnosisText = (text: string) => {
        return text.replace(/^(\d+[\.\-\)\s]+)+/, '').trim();
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Diagnósticos
                </h4>
                <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                    {diagnosticos.length}
                </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {diagnosticos.map((d, i) => {
                    const cleaned = cleanDiagnosisText(d) || d;
                    return (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70 shadow-2xs hover:border-primary/40 transition-colors"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                {i + 1}
                            </span>
                            <span className="text-sm font-medium leading-snug break-words text-foreground">
                                {cleaned}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PlanManejoDetail({ planManejo }: { planManejo: any }) {
    if (!planManejo) return null;

    const parsed = parseJsonIfNeeded(planManejo);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                    Plan de Manejo y Tratamiento
                </h4>
            </div>

            {typeof parsed === 'string' ? (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {parsed}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(parsed).map(([k, v]) => {
                        const label = formatLabel(k);
                        const isMed = k.toLowerCase().includes('medica');
                        const isFull = k === 'otros' || k === 'indicaciones' || isMed || String(v).length > 120;
                        return (
                            <div
                                key={k}
                                className={cn(
                                    "p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-1.5",
                                    isFull ? "md:col-span-2" : "md:col-span-1"
                                )}
                            >
                                <span className="text-xs font-bold text-primary uppercase tracking-wider block flex items-center gap-1.5">
                                    {isMed ? <Pill className="h-3.5 w-3.5 text-primary" /> : null}
                                    {label}
                                </span>
                                <div className={cn("text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed", isNA(v) && "text-muted-foreground/40 italic")}>
                                    {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function InitialHistoryDetail({ history, activeTemplate }: { history: ClinicalHistory; activeTemplate?: any }) {
    const patientDocsForHistory = (history.patient?.documents || []).filter(
        (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url) && d.clinicalHistoryId === history.id
    );
    const historyDirectDocs = (history.documents || []).filter(
        (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url)
    );

    const allHistoryDocs = [...historyDirectDocs];
    patientDocsForHistory.forEach((pDoc: any) => {
        if (!allHistoryDocs.some((d: any) => (d.id && d.id === pDoc.id) || (d.url && d.url === pDoc.url))) {
            allHistoryDocs.push(pDoc);
        }
    });

    if (!activeTemplate) {
        const hasAnamnesis = Boolean(history.motivoConsulta || history.enfermedadActual);
        const hasAntecedentes = Boolean(history.antecedentesPersonales || history.antecedentesFamiliares || history.datosEspecificos?.antecedentesFamiliares || history.habitos);
        const hasExamen = Boolean(history.examenFisico && Object.keys(history.examenFisico).length > 0);

        return (
            <div className="space-y-6">
                {/* 1. Anamnesis / Motivo & Enfermedad Actual */}
                {hasAnamnesis && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 rounded-xl bg-muted/20 border border-muted/60">
                        {history.motivoConsulta && (
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" /> Motivo de Consulta
                                </span>
                                <p className="text-sm font-medium text-foreground/90 border-l-2 border-primary/40 pl-3 py-1 italic bg-background/50 rounded-r-md">
                                    "{history.motivoConsulta}"
                                </p>
                            </div>
                        )}
                        {history.enfermedadActual && (
                            <div className={cn("space-y-1.5", !history.motivoConsulta && "md:col-span-2")}>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="h-3.5 w-3.5" /> Enfermedad Actual
                                </span>
                                <p className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3 py-1 bg-background/50 rounded-r-md">
                                    {history.enfermedadActual}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Antecedentes & Hábitos */}
                {hasAntecedentes && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> Antecedentes y Hábitos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.antecedentesPersonales && (
                                <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-2">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                        Antecedentes Personales
                                    </span>
                                    <div className="text-sm prose-sm max-w-none text-foreground/90">
                                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(typeof history.antecedentesPersonales === 'string' ? history.antecedentesPersonales : (history.antecedentesPersonales as any).descripcion || 'Ninguno') }} />
                                    </div>
                                </div>
                            )}
                            {(history.antecedentesFamiliares || history.datosEspecificos?.antecedentesFamiliares) && (
                                <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-2">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                        Antecedentes Familiares
                                    </span>
                                    {(() => {
                                        const antFam = history.antecedentesFamiliares || history.datosEspecificos?.antecedentesFamiliares;
                                        return typeof antFam === 'string' ? (
                                            <div className="text-sm prose-sm max-w-none text-foreground/90" dangerouslySetInnerHTML={{ __html: sanitizeHtml(antFam) }} />
                                        ) : (
                                            <div className="text-sm text-foreground/90">{String(antFam)}</div>
                                        );
                                    })()}
                                </div>
                            )}
                            {history.habitos && (
                                <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-2">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                        Hábitos Psicobiológicos
                                    </span>
                                    <div className="text-sm prose-sm max-w-none text-foreground/90">
                                        {typeof history.habitos === 'string' ? (
                                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(history.habitos) }} />
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml((history.habitos as any).descripcion || 'N/A') }} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 3. Examen Físico */}
                {hasExamen && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5" /> Examen Físico
                        </h4>
                        <div className="p-4 rounded-xl bg-card border border-border/70 shadow-2xs space-y-4">
                            {Object.entries(history.examenFisico!).filter(([k]) => k !== 'otros').length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {Object.entries(history.examenFisico!).filter(([k]) => k !== 'otros').map(([k, v]) => (
                                        <div key={k} className="p-2.5 rounded-lg bg-muted/40 border border-muted flex flex-col justify-center">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{formatLabel(k)}</span>
                                            <span className={cn("text-sm font-semibold mt-0.5", isNA(v) && "text-muted-foreground/40")}>{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {history.examenFisico!.otros && (
                                <div className="space-y-1.5 pt-1 border-t border-muted/50">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {formatLabel('otros')}
                                    </span>
                                    <div 
                                        className="text-sm border-l-2 border-primary/40 pl-3 py-1.5 prose-sm max-w-none text-foreground/90 bg-muted/20 rounded-r-lg" 
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(history.examenFisico!.otros) }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. Diagnósticos */}
                <DiagnosesList diagnosticos={history.diagnosticos} />

                {/* 5. Plan de Manejo */}
                <PlanManejoDetail planManejo={history.planManejo} />

                {/* 6. Exámenes Complementarios (PDFs / Imágenes) */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                            Exámenes Complementarios Adjuntos
                        </h4>
                        {allHistoryDocs.length > 0 && (
                            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                                {allHistoryDocs.length}
                            </Badge>
                        )}
                    </div>
                    <ClinicalHistoryDocumentsManager
                        documents={allHistoryDocs}
                        historyId={history.id}
                        patientId={history.patient?.id}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                {activeTemplate.secciones.map((sec: any) => (
                    <div key={sec.id || sec.titulo} className="space-y-3 p-4 rounded-xl bg-muted/20 border border-muted/50">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-2">
                            {(() => {
                                const Icon = getSectionIcon(sec.titulo);
                                return <Icon className="h-4 w-4" />;
                            })()}
                            {sec.titulo}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {sec.campos.map((campo: any) => {
                                const val = history.datosEspecificos?.[campo.id];
                                const isFullWidth = campo.layout === 'full';
                                
                                return (
                                    <div key={campo.id} className={cn("space-y-1", isFullWidth ? "sm:col-span-2" : "sm:col-span-1")}>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{campo.label}</span>
                                        {campo.tipo === 'rich-text' ? (
                                            <div className="text-sm prose-sm border-l-2 border-primary/10 pl-3 py-0.5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(val || 'No registrado')) }} />
                                        ) : (
                                            <p className="text-sm font-medium">{String(val || 'No registrado')}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-6 border-t border-muted/50 pt-6">
                <DiagnosesList diagnosticos={history.diagnosticos} />
                <PlanManejoDetail planManejo={history.planManejo} />

                {/* Exámenes Complementarios (PDFs / Imágenes) */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                            Exámenes Complementarios Adjuntos
                        </h4>
                        {allHistoryDocs.length > 0 && (
                            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                                {allHistoryDocs.length}
                            </Badge>
                        )}
                    </div>
                    <ClinicalHistoryDocumentsManager
                        documents={allHistoryDocs}
                        historyId={history.id}
                        patientId={history.patient?.id}
                    />
                </div>
            </div>
        </div>
    );
}

function EvolutionNoteDetail({ note, patientId, patientDocuments = [] }: { note: any; patientId?: string; patientDocuments?: any[] }) {
    const navigate = useNavigate();

    return (
        <div className="space-y-5">
            <div>
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Estado Subjetivo
                </h4>
                <p className="text-sm border-l-2 border-primary/40 pl-3 py-1 bg-muted/20 rounded-r-md text-foreground/90 leading-relaxed">
                    {note.estadoSubjetivo}
                </p>
            </div>

            {note.cambiosSintomas && (
                <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> Cambios en Síntomas
                    </h4>
                    <p className="text-sm border-l-2 border-primary/40 pl-3 py-1 bg-muted/20 rounded-r-md text-foreground/90 italic leading-relaxed">
                        {note.cambiosSintomas}
                    </p>
                </div>
            )}

            {note.seguimiento && Object.keys(note.seguimiento).length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" /> Evaluación Objetiva (Examen Físico)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(note.seguimiento).map(([key, value]) => (
                            <div key={key} className="text-sm flex flex-col p-2.5 rounded-lg bg-card border border-border/70 shadow-2xs">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">{formatLabel(key)}:</span>
                                <span className="font-semibold text-foreground mt-0.5">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {note.diagnostico && (
                    <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/15 space-y-1">
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider">Diagnóstico</h4>
                        <p className="text-sm font-semibold text-foreground leading-snug break-words">{note.diagnostico}</p>
                    </div>
                )}
                {note.tratamientoActual && (
                    <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 space-y-1">
                        <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Tratamiento Actual</h4>
                        <p className="text-sm font-semibold text-foreground leading-snug break-words">{note.tratamientoActual}</p>
                    </div>
                )}
            </div>

            {note.planAjustado && (() => {
                const parsedPlan = parseJsonIfNeeded(note.planAjustado);

                if (!parsedPlan) return null;

                if (typeof parsedPlan === 'string') {
                    return (
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <ClipboardList className="h-3.5 w-3.5" /> Plan Ajustado
                            </h4>
                            <div className="text-sm p-3.5 rounded-xl bg-card border border-border/70 text-foreground/90 whitespace-pre-wrap leading-relaxed shadow-2xs">
                                {parsedPlan}
                            </div>
                        </div>
                    );
                }

                if (typeof parsedPlan === 'object' && parsedPlan !== null) {
                    const entries = Object.entries(parsedPlan).filter(([_, v]) => !isNA(v));
                    if (entries.length === 0) return null;

                    return (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                <ClipboardList className="h-3.5 w-3.5" /> Plan Ajustado
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {entries.map(([k, v]) => {
                                    const label = formatLabel(k);
                                    const isMed = k.toLowerCase().includes('medica');
                                    const isFull = k === 'indicaciones' || isMed || String(v).length > 100;
                                    return (
                                        <div
                                            key={k}
                                            className={cn(
                                                "p-3.5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-1.5",
                                                isFull ? "md:col-span-2" : "md:col-span-1"
                                            )}
                                        >
                                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                                {isMed ? (
                                                    <Pill className="h-3.5 w-3.5 text-primary" />
                                                ) : (
                                                    <FileText className="h-3.5 w-3.5 text-primary" />
                                                )}
                                                {label}
                                            </span>
                                            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                return null;
            })()}

            {note.proximaCita && (
                <div className="flex items-center gap-2 text-primary font-medium text-sm p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                        Próxima cita programada para el {format(new Date(note.proximaCita), 'PPPP', { locale: es })}
                        {note.horaCita && ` a las ${format(new Date(`2000-01-01T${note.horaCita}`), 'hh:mm b', { locale: es })}`}
                    </span>
                </div>
            )}

            {/* Documentos adjuntos a la nota */}
            {(() => {
                const noteDocs = (note.documents && Array.isArray(note.documents))
                    ? note.documents.filter((d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url))
                    : [];

                const patientDocsForNote = (patientDocuments || []).filter(
                    (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url) && d.noteId === note.id
                );

                const merged = [...noteDocs];
                patientDocsForNote.forEach((pDoc: any) => {
                    if (!merged.some((d: any) => (d.id && d.id === pDoc.id) || (d.url && d.url === pDoc.url))) {
                        merged.push(pDoc);
                    }
                });

                if (merged.length === 0) return null;

                return (
                    <div className="space-y-2 border-t border-border/40 pt-4">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5" /> Exámenes Adjuntos ({merged.length})
                        </h4>
                        <ClinicalHistoryDocumentsManager
                            documents={merged}
                            noteId={note.id}
                            historyId={note.clinicalHistory?.id || note.clinicalHistoryId}
                            patientId={patientId}
                            readOnly={true}
                        />
                    </div>
                );
            })()}

            <div className="flex justify-end pt-2 border-t border-border/40">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/clinical-history-note/${note.id}/edit`)}
                    className="text-xs text-primary border-primary/20 hover:bg-primary/5 shadow-2xs"
                >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Editar Nota de Evolución
                </Button>
            </div>
        </div>
    );
}
