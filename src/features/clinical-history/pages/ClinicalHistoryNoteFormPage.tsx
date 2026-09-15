import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    FileText,
    Activity,
    Pill,
    Calendar as CalendarIcon,
    Eye,
    Stethoscope,
    ClipboardList,
    Save,
    User,
    Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';
import { PDFViewer } from '@react-pdf/renderer';
import { EvolutionNotePDF } from '@/features/clinical-history/pdf/EvolutionNotePDF';
import { useQuery } from '@tanstack/react-query';
import { clinicalHistoryApi } from '@/api';
import { differenceInYears } from 'date-fns';
import { cn, safeFormat } from '@/lib/utils';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveBadge } from '@/components/shared/AutoSaveBadge';
import { DraftRecoveryBanner } from '@/components/shared/DraftRecoveryBanner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/components/ui/tabs';

import { 
    useCreateClinicalHistoryNote, 
    useUpdateClinicalHistoryNote, 
    useClinicalHistoryNoteById 
} from '../hooks/useClinicalHistoryNotes';
import { ClinicalHistoryDocumentsManager } from '@/features/clinical-history/components/ClinicalHistoryDocumentsManager';
import type { PatientDocument } from '@/features/patient/types/patient.types';
import type { CreateClinicalHistoryNoteRequest, UpdateClinicalHistoryNoteRequest } from '@/types';

const noteSchema = z.object({
    estadoSubjetivo: z.string().min(10, 'El estado subjetivo debe tener al menos 10 caracteres'),
    objetivo: z.string().min(10, 'Describa el estado objetivo (signos vitales, examen físico)'),
    diagnostico: z.string().min(5, 'Especifique el diagnóstico'),
    tratamientoActual: z.string().optional(),
    cambiosSintomas: z.string().optional(),
    proximaCita: z.string().optional().or(z.literal('')),
});

type NoteFormValues = z.infer<typeof noteSchema>;

const TAB_ORDER = ['anamnesis', 'objetivo', 'diagnostico', 'plan', 'examenes'];

export function ClinicalHistoryNoteFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id?: string }>();
    const isEdit = Boolean(id);
    const [searchParams] = useSearchParams();
    const queryHistoryId = searchParams.get('historyId');

    const createNoteMutation = useCreateClinicalHistoryNote();
    const updateNoteMutation = useUpdateClinicalHistoryNote();

    const { data: noteRes, isLoading: isLoadingNote } = useClinicalHistoryNoteById(id || '');
    const existingNote = noteRes?.data;

    const historyId = queryHistoryId || existingNote?.clinicalHistoryId || existingNote?.clinicalHistory?.id;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTab, setCurrentTab] = useState('anamnesis');
    const [documents, setDocuments] = useState<PatientDocument[]>([]);

    // Initial values for dynamic fields
    const [peso, setPeso] = useState('');
    const [presionArterial, setPresionArterial] = useState('');
    const [medicacion, setMedicacion] = useState('');
    const [indicaciones, setIndicaciones] = useState('');
    const [showPDF, setShowPDF] = useState(false);

    const { data: historyRes } = useQuery({
        queryKey: ['clinical-history', historyId],
        queryFn: () => clinicalHistoryApi.getById(historyId!),
        enabled: !!historyId,
    });
    const history = useMemo(() => historyRes?.data || null, [historyRes]);

    const patientProp = useMemo(() => {
        const p = history?.patient || existingNote?.patient || existingNote?.clinicalHistory?.patient;
        if (!p) return undefined;
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'No registrado';
        const age = p.birthDate ? differenceInYears(new Date(), new Date(p.birthDate)) : 'No registrada';
        return { name, age };
    }, [history, existingNote]);

    const form = useForm<NoteFormValues>({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            estadoSubjetivo: '',
            objetivo: '',
            diagnostico: '',
            tratamientoActual: '',
            cambiosSintomas: '',
            proximaCita: '',
        },
    });

    // Cargar datos existentes si está en modo edición
    useEffect(() => {
        if (isEdit && existingNote) {
            form.reset({
                estadoSubjetivo: existingNote.estadoSubjetivo || '',
                objetivo: existingNote.objetivo || '',
                diagnostico: existingNote.diagnostico || '',
                tratamientoActual: existingNote.tratamientoActual || '',
                cambiosSintomas: existingNote.cambiosSintomas || '',
                proximaCita: existingNote.proximaCita ? safeFormat(existingNote.proximaCita, 'yyyy-MM-dd', '') : '',
            });

            if (existingNote.seguimiento) {
                if (existingNote.seguimiento.peso) setPeso(String(existingNote.seguimiento.peso));
                if (existingNote.seguimiento.presionArterial) setPresionArterial(String(existingNote.seguimiento.presionArterial));
            }
            if (existingNote.planAjustado) {
                if (existingNote.planAjustado.medicacion) setMedicacion(String(existingNote.planAjustado.medicacion));
                if (existingNote.planAjustado.indicaciones) setIndicaciones(String(existingNote.planAjustado.indicaciones));
            }
            // Consolidar documentos: de la nota directamente + los del paciente con este noteId
            const noteDocs = (existingNote.documents && Array.isArray(existingNote.documents))
                ? existingNote.documents.filter((d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url))
                : [];

            const patient = history?.patient || existingNote?.patient || existingNote?.clinicalHistory?.patient;
            const patientDocsForNote = (patient?.documents || []).filter(
                (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url) && d.noteId === existingNote.id
            );

            // Merge deduplicando por id / url
            const merged = [...noteDocs];
            patientDocsForNote.forEach((pDoc: any) => {
                if (!merged.some((d: any) => (d.id && d.id === pDoc.id) || (d.url && d.url === pDoc.url))) {
                    merged.push(pDoc);
                }
            });

            setDocuments(merged);
        }
    }, [isEdit, existingNote, history, form]);

    const autoSave = useAutoSave<NoteFormValues>({
        form,
        draftKey: isEdit ? `draft_edit_note_${id}` : `draft_note_${historyId || 'general'}`,
        debounceMs: 2000,
    });

    const currentTabIndex = TAB_ORDER.indexOf(currentTab);
    const goToPrevTab = () => {
        if (currentTabIndex > 0) setCurrentTab(TAB_ORDER[currentTabIndex - 1]);
    };
    const goToNextTab = () => {
        if (currentTabIndex < TAB_ORDER.length - 1) setCurrentTab(TAB_ORDER[currentTabIndex + 1]);
    };

    const onError = (errors: any) => {
        if (errors.estadoSubjetivo || errors.cambiosSintomas) {
            setCurrentTab('anamnesis');
        } else if (errors.objetivo) {
            setCurrentTab('objetivo');
        } else if (errors.diagnostico || errors.tratamientoActual) {
            setCurrentTab('diagnostico');
        } else if (errors.proximaCita) {
            setCurrentTab('plan');
        }
        toast.error('Por favor complete los campos requeridos marcados en rojo.');
    };

    const onSubmit = async (values: NoteFormValues) => {
        if (!historyId && !isEdit) {
            toast.error('No se ha proporcionado el ID de la historia principal.');
            return;
        }

        setIsSubmitting(true);
        try {
            const seguimientoData: Record<string, any> = {};
            if (peso) seguimientoData['peso'] = peso;
            if (presionArterial) seguimientoData['presionArterial'] = presionArterial;

            const planData: Record<string, any> = {};
            if (medicacion) planData['medicacion'] = medicacion;
            if (indicaciones) planData['indicaciones'] = indicaciones;

            if (isEdit) {
                const payload: UpdateClinicalHistoryNoteRequest = {
                    estadoSubjetivo: values.estadoSubjetivo,
                    objetivo: values.objetivo,
                    diagnostico: values.diagnostico,
                    tratamientoActual: values.tratamientoActual,
                    cambiosSintomas: values.cambiosSintomas || undefined,
                    seguimiento: Object.keys(seguimientoData).length > 0 ? seguimientoData : undefined,
                    planAjustado: Object.keys(planData).length > 0 ? planData : undefined,
                    proximaCita: values.proximaCita ? new Date(values.proximaCita).toISOString() : undefined,
                    documents: documents,
                };

                await updateNoteMutation.mutateAsync({ id: id!, data: payload });

                toast.success('Nota de evolución actualizada exitosamente');
                autoSave.clearDraft();
                if (historyId) {
                    navigate(`/clinical-history/${historyId}`);
                } else {
                    navigate(`/clinical-history-note/${id}`);
                }
            } else {
                const payload: CreateClinicalHistoryNoteRequest = {
                    fecha: new Date().toISOString(),
                    estadoSubjetivo: values.estadoSubjetivo,
                    objetivo: values.objetivo,
                    diagnostico: values.diagnostico,
                    tratamientoActual: values.tratamientoActual,
                    cambiosSintomas: values.cambiosSintomas || undefined,
                    clinicalHistoryId: historyId!,
                    seguimiento: Object.keys(seguimientoData).length > 0 ? seguimientoData : undefined,
                    planAjustado: Object.keys(planData).length > 0 ? planData : undefined,
                    proximaCita: values.proximaCita ? new Date(values.proximaCita).toISOString() : undefined,
                    documents: documents,
                };

                await createNoteMutation.mutateAsync(payload);

                toast.success('Nota de evolución registrada exitosamente');
                autoSave.clearDraft();
                navigate(`/clinical-history/${historyId}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la nota');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isEdit && isLoadingNote) {
        return (
            <div className="p-16 text-center space-y-4 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Cargando datos de la nota de evolución...</p>
            </div>
        );
    }

    if (!historyId && !isEdit) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">No se especificó la historia clínica a la que pertenece esta nota.</p>
                <Button onClick={() => navigate('/clinical-history-note')}>Volver a Historias</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-20">
            {/* Header móvil y desktop optimizado */}
            <div className="space-y-2 sm:space-y-0">
                {/* En mobile: Fila superior con botón Volver y el AutoSaveBadge */}
                <div className="flex items-center justify-between gap-2 sm:hidden">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(-1)} 
                        className="gap-1.5 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground" 
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs font-medium">Volver</span>
                    </Button>
                    <AutoSaveBadge
                        status={autoSave.status}
                        lastSaved={autoSave.lastSaved}
                    />
                </div>

                {/* En desktop y título principal */}
                <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)} 
                            className="hidden sm:flex shrink-0 -ml-1" 
                            aria-label="Volver"
                        >
                            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    {isEdit ? 'Editar Nota de Evolución' : 'Nueva Nota de Evolución'}
                                </h1>
                                <div className="hidden sm:block">
                                    <AutoSaveBadge
                                        status={autoSave.status}
                                        lastSaved={autoSave.lastSaved}
                                    />
                                </div>
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                                {isEdit 
                                    ? 'Modifique los hallazgos y el plan de seguimiento clínico.' 
                                    : 'Agregue una nota de seguimiento a la historia clínica.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Summary Header */}
            {history?.patient && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Paciente</p>
                            <p className="text-sm font-semibold text-foreground">{patientProp?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div>
                            <span className="text-muted-foreground">Edad: </span>
                            <span className="font-semibold">{patientProp?.age} {typeof patientProp?.age === 'number' ? 'años' : ''}</span>
                        </div>
                        {history.patient.identificationNumber && (
                            <div>
                                <span className="text-muted-foreground">Cédula: </span>
                                <span className="font-semibold">{history.patient.identificationNumber}</span>
                            </div>
                        )}
                        {history.doctor?.user?.name && (
                            <div className="hidden sm:block">
                                <span className="text-muted-foreground">Médico tratante: </span>
                                <span className="font-semibold">Dr(a). {history.doctor.user.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {autoSave.hasDraft && (
                <DraftRecoveryBanner
                    draftTimestamp={autoSave.draftTimestamp}
                    onRestore={autoSave.restoreDraft}
                    onDiscard={autoSave.discardDraft}
                    itemName="nota de evolución"
                />
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full h-auto sm:h-11 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800 gap-1 sm:gap-0 grow">
                                <TabsTrigger
                                    value="anamnesis"
                                    className="h-10 sm:h-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                >
                                    <FileText className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Anamnesis</span>
                                    {(form.formState.errors.estadoSubjetivo || form.formState.errors.cambiosSintomas) && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                        </span>
                                    )}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="objetivo"
                                    className="h-10 sm:h-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                >
                                    <Activity className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Examen Físico</span>
                                    {form.formState.errors.objetivo && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                        </span>
                                    )}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="diagnostico"
                                    className="h-10 sm:h-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                >
                                    <Stethoscope className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Diagnóstico</span>
                                    {(form.formState.errors.diagnostico || form.formState.errors.tratamientoActual) && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                        </span>
                                    )}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="plan"
                                    className="h-10 sm:h-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                >
                                    <ClipboardList className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Plan y Cita</span>
                                    {form.formState.errors.proximaCita && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                        </span>
                                    )}
                                </TabsTrigger>

                                <TabsTrigger
                                    value="examenes"
                                    className="h-10 sm:h-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                >
                                    <Paperclip className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Exámenes</span>
                                    {documents.length > 0 && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                                            {documents.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPDF(true)}
                                className="h-10 lg:h-11 gap-2 border-primary/20 hover:bg-primary/5 text-primary shrink-0 w-full lg:w-auto shadow-sm font-medium"
                            >
                                <Eye className="h-4 w-4" />
                                Previsualizar PDF
                            </Button>
                        </div>

                        {/* TAB 1: ANAMNESIS */}
                        <TabsContent value="anamnesis" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Anamnesis de Evolución</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="estadoSubjetivo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado Subjetivo *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describa cómo se siente el paciente, sus percepciones y progreso..."
                                                        className="min-h-[120px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="cambiosSintomas"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cambios en los Síntomas</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describa si los síntomas han mejorado, empeorado o surgido nuevos..."
                                                        className="min-h-[100px] resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 2: OBJETIVO */}
                        <TabsContent value="objetivo" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Evaluación Objetiva y Signos Vitales</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="objetivo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Examen Físico y Signos Vitales *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describa los hallazgos del examen físico, signos vitales actuales..."
                                                        className="min-h-[120px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <FormLabel>Peso (kg) <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></FormLabel>
                                            <Input
                                                placeholder="Ej. 75.5"
                                                value={peso}
                                                onChange={(e) => setPeso(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel>Presión Arterial (mmHg) <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></FormLabel>
                                            <Input
                                                placeholder="Ej. 120/80"
                                                value={presionArterial}
                                                onChange={(e) => setPresionArterial(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 3: DIAGNÓSTICO */}
                        <TabsContent value="diagnostico" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Diagnóstico y Tratamiento Actual</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="diagnostico"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Diagnóstico *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Diagnóstico de la visita actual..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tratamientoActual"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tratamiento Actual</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describa el tratamiento que el paciente está recibiendo actualmente..."
                                                        className="min-h-[100px] resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 4: PLAN Y CITA */}
                        <TabsContent value="plan" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Pill className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Plan Ajustado</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <FormLabel>Medicamentos / Tratamiento</FormLabel>
                                        <Textarea
                                            placeholder="Modificaciones en la medicación..."
                                            className="min-h-[100px]"
                                            value={medicacion}
                                            onChange={(e) => setMedicacion(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Indicaciones Generales</FormLabel>
                                        <Input
                                            placeholder="Reposo, dieta, ejercicios..."
                                            value={indicaciones}
                                            onChange={(e) => setIndicaciones(e.target.value)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Próxima Visita</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="proximaCita"
                                        render={({ field }) => (
                                            <FormItem className="max-w-sm">
                                                <FormLabel>Fecha de Próxima Cita Estimada</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TAB 5: EXÁMENES COMPLEMENTARIOS */}
                        <TabsContent value="examenes" className="space-y-6 focus-visible:outline-none">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-primary" />
                                        <CardTitle className="text-base">Exámenes Complementarios y Estudios</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ClinicalHistoryDocumentsManager
                                        documents={documents}
                                        onChange={setDocuments}
                                        historyId={historyId}
                                        noteId={isEdit ? id : undefined}
                                        patientId={history?.patient?.id}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Bottom Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="w-full sm:w-auto">
                            Cancelar y volver
                        </Button>

                        <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
                            {currentTabIndex > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToPrevTab}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Anterior
                                </Button>
                            )}

                            {currentTabIndex < TAB_ORDER.length - 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToNextTab}
                                >
                                    Siguiente
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPDF(true)}
                                className="gap-2 border-primary/20 hover:bg-primary/5 text-primary hidden sm:flex"
                            >
                                <Eye className="h-4 w-4" />
                                Previsualizar PDF
                            </Button>

                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-6 shadow-md shadow-primary/20">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isEdit ? 'Guardar Cambios' : 'Guardar Evolución'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* PDF Preview Modal */}
                    <Dialog open={showPDF} onOpenChange={setShowPDF}>
                        <DialogContent className="!max-w-none w-[75vw] h-[85vh] flex flex-col p-0 overflow-hidden !rounded-xl border-none shadow-2xl">
                            <DialogHeader className="px-6 py-4 border-b bg-card hidden sm:flex shrink-0">
                                <DialogTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Previsualización de Nota de Evolución
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Previsualización de la nota de evolución en formato PDF
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 min-h-0 bg-muted/20">
                                <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                                    <EvolutionNotePDF
                                        data={{
                                            estadoSubjetivo: form.getValues('estadoSubjetivo'),
                                            objetivo: form.getValues('objetivo'),
                                            diagnostico: form.getValues('diagnostico'),
                                            tratamientoActual: form.getValues('tratamientoActual'),
                                            cambiosSintomas: form.getValues('cambiosSintomas'),
                                            proximaCita: form.getValues('proximaCita'),
                                        }}
                                        patient={patientProp}
                                        note={{ doctor: history?.doctor }}
                                        seguimiento={{
                                            peso: peso,
                                            presionArterial: presionArterial,
                                        }}
                                        planAjustado={{
                                            medicacion: medicacion,
                                            indicaciones: indicaciones,
                                        }}
                                    />
                                </PDFViewer>
                            </div>
                        </DialogContent>
                    </Dialog>
                </form>
            </Form>
        </div>
    );
}
