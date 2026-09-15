import { useState, useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Loader2, Search, Check, Info, ChevronsUpDown, History, User as UserIcon, X, FileText, Activity, ClipboardList, Sparkles, Paperclip } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PDFViewer } from '@react-pdf/renderer';
import { toast } from 'sonner';

import { RichTextEditor } from '@/components/shared/RichTextEditor';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { MedicalReportPDF } from '@/features/clinical-history/pdf/MedicalReportPDF';
import { DynamicForm } from '@/features/clinical-history/components/DynamicForm';
import { ClinicalHistoryDocumentsManager } from '@/features/clinical-history/components/ClinicalHistoryDocumentsManager';
import { cn, formatPatientAge } from '@/lib/utils';
import { PatientSelector } from '@/components/shared/PatientSelector';
import { AutoSaveBadge } from '@/components/shared/AutoSaveBadge';
import { DraftRecoveryBanner } from '@/components/shared/DraftRecoveryBanner';
import type { AutoSaveStatus } from '@/hooks/useAutoSave';
import type { Patient, Doctor, TemplateStructure, SpecialtyTemplate, PatientDocument } from '@/types';
import type { ClinicalHistoryFormValues } from '../types/clinical-history.schema';

interface ClinicalHistoryFormUIProps {
    form: UseFormReturn<ClinicalHistoryFormValues>;
    patients: Patient[];
    doctors: Doctor[];
    templates: SpecialtyTemplate[];
    isSubmitting: boolean;
    patientSearch: string;
    setPatientSearch: (val: string) => void;
    isPatientListOpen: boolean;
    setIsPatientListOpen: (val: boolean) => void;
    diagInput: string;
    setDiagInput: (val: string) => void;
    filteredPatients: Patient[];
    selectedPatient?: Patient;
    selectedDoctor?: Doctor;
    addDiagnostic: () => void;
    removeDiagnostic: (index: number) => void;
    onSubmit: (values: ClinicalHistoryFormValues) => void;
    userRole?: string;
    showPDF: boolean;
    setShowPDF: (val: boolean) => void;
    activeTemplate?: TemplateStructure | null;
    selectedTemplateId: string;
    setSelectedTemplateId: (val: string) => void;
    isEditMode?: boolean;
    existingHistory?: any;
    autoSave?: {
        status: AutoSaveStatus;
        lastSaved: Date | null;
        hasDraft: boolean;
        draftTimestamp: Date | null;
        restoreDraft: () => void;
        discardDraft: () => void;
    };
    documents?: PatientDocument[];
    setDocuments?: (docs: PatientDocument[]) => void;
}
const getSectionIcon = (titulo: string) => {
    const t = titulo.toLowerCase();
    if (t.includes('consulta') || t.includes('anamnesis') || t.includes('historia') || t.includes('relato')) {
        return History;
    }
    if (t.includes('antecedentes')) {
        return UserIcon;
    }
    if (t.includes('físico') || t.includes('fisico') || t.includes('examen') || t.includes('constantes') || t.includes('signos') || t.includes('vitales')) {
        return Activity;
    }
    if (t.includes('plan') || t.includes('tratamiento') || t.includes('manejo')) {
        return ClipboardList;
    }
    return Sparkles;
};
export function ClinicalHistoryFormUI({
    form,
    doctors,
    templates,
    isSubmitting,
    patientSearch,
    setPatientSearch,
    isPatientListOpen,
    setIsPatientListOpen,
    diagInput,
    setDiagInput,
    filteredPatients,
    selectedPatient,
    selectedDoctor,
    addDiagnostic,
    removeDiagnostic,
    onSubmit,
    userRole,
    showPDF,
    setShowPDF,
    activeTemplate,
    selectedTemplateId,
    setSelectedTemplateId,
    isEditMode = false,
    existingHistory,
    autoSave,
    documents = [],
    setDocuments,
}: ClinicalHistoryFormUIProps) {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState('consulta');

    useEffect(() => {
        if (activeTemplate) {
            const firstSecId = activeTemplate.secciones[0]?.id || activeTemplate.secciones[0]?.titulo;
            if (firstSecId) {
                setCurrentTab(firstSecId);
            }
        } else {
            setCurrentTab('consulta');
        }
    }, [activeTemplate]);

    const watchedValues = form.watch();
    const datosEspecificos = watchedValues.formData?.datosEspecificos || {};

    useEffect(() => {
        if (!activeTemplate || !datosEspecificos) return;

        let motifFieldId: string | null = null;
        let illnessFieldId: string | null = null;
        let personalHistoryFieldId: string | null = null;
        let familyHistoryFieldId: string | null = null;
        let habitFieldId: string | null = null;
        let bpFieldId: string | null = null;
        let hrFieldId: string | null = null;
        let rrFieldId: string | null = null;
        let satFieldId: string | null = null;
        let tempFieldId: string | null = null;
        let weightFieldId: string | null = null;
        let heightFieldId: string | null = null;
        let imcFieldId: string | null = null;
        let othersFieldId: string | null = null;

        activeTemplate.secciones.forEach(sec => {
            sec.campos.forEach(cam => {
                const label = cam.label.toLowerCase();
                
                if (label.includes('motivo') && !motifFieldId) motifFieldId = cam.id;
                if ((label.includes('enfermedad') || label.includes('relato')) && !illnessFieldId) illnessFieldId = cam.id;
                if ((label.includes('enfermedades y cirugías') || label.includes('antecedentes personales')) && !personalHistoryFieldId) personalHistoryFieldId = cam.id;
                if ((label.includes('enfermedades del núcleo') || label.includes('antecedentes familiares')) && !familyHistoryFieldId) familyHistoryFieldId = cam.id;
                if ((label.includes('hábitos') || label.includes('habitos')) && !habitFieldId) habitFieldId = cam.id;
                
                if ((label.includes('presión arterial') || label.includes('presion arterial') || label.includes('p.a.')) && !bpFieldId) bpFieldId = cam.id;
                if ((label.includes('frec. cardíaca') || label.includes('frec. cardiaca') || label.includes('f.c.') || label.includes('frecuencia cardíaca')) && !hrFieldId) hrFieldId = cam.id;
                if ((label.includes('frec. respiratoria') || label.includes('frecuencia respiratoria') || label.includes('f.r.')) && !rrFieldId) rrFieldId = cam.id;
                if ((label.includes('sat. o2') || label.includes('saturación') || label.includes('saturacion')) && !satFieldId) satFieldId = cam.id;
                if ((label.includes('temp') || label.includes('temperatura')) && !tempFieldId) tempFieldId = cam.id;
                if (label.includes('peso') && !weightFieldId) weightFieldId = cam.id;
                if (label.includes('altura') && !heightFieldId) heightFieldId = cam.id;
                if (label.includes('imc') && !imcFieldId) imcFieldId = cam.id;
                if (label.includes('otros') && !othersFieldId) othersFieldId = cam.id;
            });
        });

        const syncValue = (fieldId: string | null, targetName: keyof ClinicalHistoryFormValues) => {
            if (fieldId && datosEspecificos[fieldId] !== undefined) {
                const val = datosEspecificos[fieldId];
                if (form.getValues(targetName) !== val) {
                    form.setValue(targetName, val, { shouldValidate: true });
                }
            }
        };

        syncValue(motifFieldId, 'motivoConsulta');
        syncValue(illnessFieldId, 'enfermedadActual');
        syncValue(personalHistoryFieldId, 'antecedentesPersonales');
        syncValue(familyHistoryFieldId, 'antecedentesFamiliares');
        syncValue(habitFieldId, 'habitosPsicobiologicos');
        syncValue(bpFieldId, 'presionArterial');
        syncValue(hrFieldId, 'frecuenciaCardiaca');
        syncValue(rrFieldId, 'frecuenciaRespiratoria');
        syncValue(satFieldId, 'saturacionOxigeno');
        syncValue(tempFieldId, 'temperatura');
        syncValue(weightFieldId, 'peso');
        syncValue(heightFieldId, 'altura');
        syncValue(imcFieldId, 'imc');
        syncValue(othersFieldId, 'otros');

        if (weightFieldId && heightFieldId && imcFieldId) {
            const pesoVal = datosEspecificos[weightFieldId];
            const alturaVal = datosEspecificos[heightFieldId];
            if (pesoVal && alturaVal) {
                const p = parseFloat(pesoVal);
                const a = parseFloat(alturaVal);
                if (p > 0 && a > 0) {
                    const heightInMeters = a > 3 ? a / 100 : a;
                    if (heightInMeters >= 0.3 && heightInMeters <= 2.8) {
                        const calculatedImc = (p / (heightInMeters * heightInMeters)).toFixed(1);
                        const currentImc = datosEspecificos[imcFieldId];
                        if (currentImc !== calculatedImc) {
                            form.setValue(`formData.datosEspecificos.${imcFieldId}` as any, calculatedImc, { shouldValidate: true });
                            form.setValue('imc', calculatedImc, { shouldValidate: true });
                        }
                    }
                }
            }
        }
    }, [JSON.stringify(datosEspecificos), activeTemplate, form]);

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(
                    onSubmit,
                    (errors) => {
                        console.error("Form validation errors:", errors);
                        const errorMessages: string[] = [];
                        
                        if (errors.patientId) errorMessages.push("Paciente");
                        if (errors.doctorId) errorMessages.push("Médico");
                        if (errors.specialty) errorMessages.push("Especialidad");
                        if (errors.motivoConsulta) errorMessages.push("Motivo de Consulta");
                        if (errors.enfermedadActual) errorMessages.push("Enfermedad Actual");
                        if (errors.diagnosticos) errorMessages.push("Diagnósticos");
                        
                        if (errors.formData?.datosEspecificos) {
                            const specErrors = errors.formData.datosEspecificos;
                            Object.keys(specErrors).forEach(fieldId => {
                                if (activeTemplate) {
                                    activeTemplate.secciones.forEach(sec => {
                                        const found = sec.campos.find(c => c.id === fieldId);
                                        if (found) {
                                            errorMessages.push(found.label);
                                        }
                                    });
                                }
                            });
                        }
                        
                        if (errorMessages.length > 0) {
                            toast.error(`Por favor complete los campos obligatorios: ${errorMessages.join(', ')}`);
                        } else {
                            toast.error("Hay errores de validación en el formulario. Por favor, revise todos los campos.");
                        }
                    }
                )}
                className="space-y-8"
            >
                {autoSave?.hasDraft && !isEditMode && (
                    <DraftRecoveryBanner
                        draftTimestamp={autoSave.draftTimestamp}
                        onRestore={autoSave.restoreDraft}
                        onDiscard={autoSave.discardDraft}
                        itemName="historia clínica"
                    />
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Patient & Context */}
                    <div className="md:col-span-1 space-y-4 min-w-0">
                        <Card>
                            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-base">Información General</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 sm:px-6 sm:pb-6 pt-0 sm:pt-0">
                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Paciente *</FormLabel>
                                            <FormControl>
                                                {isEditMode && selectedPatient ? (
                                                    <div className="p-3 bg-muted/40 rounded-xl border border-muted/60 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-sm text-foreground">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                                                            <Badge variant="outline" className="text-[10px] bg-background">C.I. {selectedPatient.identificationNumber}</Badge>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground">Paciente asignado a este expediente</p>
                                                    </div>
                                                ) : (
                                                    <PatientSelector
                                                        value={field.value}
                                                        selectedPatient={selectedPatient}
                                                        onChange={(patientId) => {
                                                            field.onChange(patientId);
                                                        }}
                                                    />
                                                )}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {userRole !== 'DOCTOR' && (
                                    <FormField
                                        control={form.control}
                                        name="doctorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Médico Tratante</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value} disabled={userRole === 'DOCTOR'}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione médico" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {doctors.map(doc => (
                                                            <SelectItem key={doc.id} value={doc.id}>
                                                                {doc.user?.name || 'Médico Sin Nombre'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="specialty"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Plantilla de Especialidad</FormLabel>
                                            <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione una plantilla..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Por defecto</SelectItem>
                                                    {templates
                                                        .filter(t => t.specialty !== 'HISTORIA BÁSICA')
                                                        .map(t => (
                                                            <SelectItem key={t.id} value={t.id}>
                                                                {t.name} ({t.specialty})
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="flex items-center gap-1.5">
                                                {activeTemplate ? (
                                                    <><Sparkles className="h-3 w-3 text-primary" /> <span className="text-primary font-medium">Plantilla cargada — campos adicionales en la pestaña Consulta</span></>
                                                ) : (
                                                    'Los campos adicionales del formulario cambiarán según la plantilla seleccionada.'
                                                )}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {selectedPatient && (
                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        Resumen Paciente
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Edad:</span>
                                        <span className="font-semibold">
                                            {formatPatientAge(selectedPatient.birthDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Género:</span>
                                        <span className="font-semibold uppercase">
                                            {selectedPatient.gender === 'FEMALE' ? 'Femenino' : selectedPatient.gender === 'MALE' ? 'Masculino' : selectedPatient.gender}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Column 2 & 3: Main Form Content */}
                    <div className="md:col-span-2 flex flex-col gap-6 min-w-0">
                        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                            <div className="flex flex-col gap-3 mb-6">
                                <div className="flex items-center justify-between gap-3">
                                    {selectedPatient && (
                                        <div className="flex justify-end ml-auto">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowPDF(!showPDF)}
                                                className="h-9 gap-2 border-primary/20 hover:bg-primary/5 text-primary shrink-0 shadow-xs font-medium cursor-pointer"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Previsualizar PDF
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <TabsList
                                    className={cn(
                                        "p-1.5 bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 w-full !h-auto min-h-[46px] transition-all",
                                        activeTemplate 
                                            ? "flex flex-wrap items-center gap-1.5" 
                                            : "grid grid-cols-2 sm:grid-cols-5 gap-1.5"
                                    )}
                                >
                                    {activeTemplate ? (
                                        <>
                                            {activeTemplate.secciones
                                                .filter(sec => 
                                                    !sec.titulo.toLowerCase().includes('plan') && 
                                                    !sec.titulo.toLowerCase().includes('tratamiento') && 
                                                    !sec.titulo.toLowerCase().includes('evolución') &&
                                                    !sec.titulo.toLowerCase().includes('evolucion')
                                                )
                                                .map((sec, secIdx) => (
                                                    <TabsTrigger
                                                        key={sec.id || sec.titulo}
                                                        value={sec.id || sec.titulo}
                                                        className="flex-1 min-w-[110px] sm:min-w-[130px] min-h-[38px] py-1.5 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                                    >
                                                        {(() => {
                                                            const Icon = getSectionIcon(sec.titulo);
                                                            return <Icon className="h-4 w-4 shrink-0" />;
                                                        })()}
                                                        <span className="truncate">{sec.titulo}</span>
                                                        {(sec.campos.some(cam => form.formState.errors.formData?.datosEspecificos?.[cam.id]) || (secIdx === 0 && form.formState.errors.diagnosticos)) && (
                                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                                            </span>
                                                        )}
                                                    </TabsTrigger>
                                                ))
                                            }
                                            <TabsTrigger
                                                value="plan"
                                                className="flex-1 min-w-[110px] sm:min-w-[130px] min-h-[38px] py-1.5 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <ClipboardList className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Plan</span>
                                                {(form.formState.errors.examenes || form.formState.errors.medicacion) && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="examenes"
                                                className="flex-1 min-w-[110px] sm:min-w-[130px] min-h-[38px] py-1.5 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <Paperclip className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Exámenes</span>
                                                {documents && documents.length > 0 && (
                                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary font-bold">
                                                        {documents.length}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                        </>
                                    ) : (
                                        <>
                                            <TabsTrigger 
                                                value="consulta" 
                                                className="min-h-[36px] py-1.5 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <History className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Consulta</span>
                                                {(form.formState.errors.motivoConsulta || form.formState.errors.enfermedadActual || form.formState.errors.diagnosticos) && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="antecedentes" 
                                                className="min-h-[36px] py-1.5 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <UserIcon className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Antecedentes</span>
                                                {(form.formState.errors.antecedentesPersonales || form.formState.errors.antecedentesFamiliares || form.formState.errors.habitosPsicobiologicos) && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="fisico" 
                                                className="min-h-[36px] py-1.5 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <Activity className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Examen Físico</span>
                                                {(form.formState.errors.presionArterial ||
                                                    form.formState.errors.frecuenciaCardiaca ||
                                                    form.formState.errors.frecuenciaRespiratoria ||
                                                    form.formState.errors.saturacionOxigeno ||
                                                    form.formState.errors.temperatura ||
                                                    form.formState.errors.peso ||
                                                    form.formState.errors.altura ||
                                                    form.formState.errors.imc ||
                                                    form.formState.errors.otros) && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                                        </span>
                                                    )}
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="plan" 
                                                className="min-h-[36px] py-1.5 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <ClipboardList className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Plan</span>
                                                {(form.formState.errors.examenes || form.formState.errors.medicacion) && (
                                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                                                    </span>
                                                )}
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="examenes" 
                                                className="min-h-[36px] py-1.5 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer relative"
                                            >
                                                <Paperclip className="h-4 w-4 shrink-0" />
                                                <span className="truncate">Exámenes</span>
                                                {documents && documents.length > 0 && (
                                                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary font-bold">
                                                        {documents.length}
                                                    </Badge>
                                                )}
                                            </TabsTrigger>
                                        </>
                                    )}
                                </TabsList>
                            </div>

                            {activeTemplate ? (
                                <>
                                    {activeTemplate.secciones
                                        .filter(sec => 
                                            !sec.titulo.toLowerCase().includes('plan') && 
                                            !sec.titulo.toLowerCase().includes('tratamiento') && 
                                            !sec.titulo.toLowerCase().includes('evolución') &&
                                            !sec.titulo.toLowerCase().includes('evolucion')
                                        )
                                        .map((sec, secIdx) => (
                                            <TabsContent key={sec.id || sec.titulo} value={sec.id || sec.titulo} className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        {(() => {
                                                            const Icon = getSectionIcon(sec.titulo);
                                                            return <Icon className="h-4 w-4 text-primary" />;
                                                        })()}
                                                        <CardTitle className="text-base text-primary/80">{sec.titulo}</CardTitle>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-6 pt-6">
                                                    <DynamicForm structure={{ secciones: [sec] }} showSectionHeader={false} />
                                                    
                                                    {secIdx === 0 && (
                                                        <>
                                                            <Separator className="opacity-50 mt-6" />
                                                            <div className="space-y-4 pt-4">
                                                                <FormLabel className="font-semibold text-foreground">Diagnósticos *</FormLabel>
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        placeholder="Agregar diagnóstico..."
                                                                        value={diagInput}
                                                                        onChange={(e) => setDiagInput(e.target.value)}
                                                                        className="bg-background/50 focus:bg-background transition-colors border-muted focus-visible:ring-primary/20"
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                addDiagnostic();
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Button type="button" variant="secondary" onClick={addDiagnostic} className="shrink-0">
                                                                        Añadir
                                                                    </Button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2 pt-2">
                                                                    {(form.watch('diagnosticos') ?? []).map((diag: string, i: number) => (
                                                                        <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/10">
                                                                            {diag}
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-4 w-4 p-0 hover:bg-transparent text-primary/60 hover:text-destructive"
                                                                                onClick={() => removeDiagnostic(i)}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </Badge>
                                                                    ))}
                                                                    {(form.watch('diagnosticos') ?? []).length === 0 && (
                                                                        <p className="text-sm text-muted-foreground italic">No hay diagnósticos agregados.</p>
                                                                    )}
                                                                </div>
                                                                <FormMessage>{form.formState.errors.diagnosticos?.message}</FormMessage>
                                                            </div>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    ))}

                                    <TabsContent value="plan" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                        {activeTemplate && (() => {
                                            const planSec = activeTemplate.secciones.find(sec => 
                                                sec.titulo.toLowerCase().includes('plan') || 
                                                sec.titulo.toLowerCase().includes('tratamiento') || 
                                                sec.titulo.toLowerCase().includes('evolución') ||
                                                sec.titulo.toLowerCase().includes('evolucion')
                                            );
                                            if (planSec) {
                                                return (
                                                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-muted/50">
                                                            <div className="flex items-center gap-2">
                                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                                <CardTitle className="text-base text-primary/80">{planSec.titulo}</CardTitle>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-6 pt-6">
                                                            <DynamicForm structure={{ secciones: [planSec] }} showSectionHeader={false} />
                                                        </CardContent>
                                                    </Card>
                                                );
                                            }
                                            return null;
                                        })()}

                                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                            <CardHeader className="pb-3 border-b border-muted/50">
                                                <CardTitle className="text-sm font-semibold text-primary/80">Plan de Manejo y Tratamiento</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6 pt-6">
                                                <FormField
                                                    control={form.control}
                                                    name="examenes"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold">Exámenes Complementarios</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Laboratorios, RX, Eco, etc. a solicitar..." className="bg-background/50 focus:bg-background transition-colors border-muted focus-visible:ring-primary/20" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs">
                                                    <div className="flex items-center gap-2 text-primary font-medium">
                                                        <Paperclip className="h-4 w-4 shrink-0" />
                                                        <span>Adjuntar archivos PDF o imágenes (RX, ecografías, laboratorios)</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentTab('examenes')}
                                                        className="h-7 text-xs border-primary/30 hover:bg-primary/10 text-primary cursor-pointer shrink-0"
                                                    >
                                                        Gestionar Archivos ({documents?.length || 0})
                                                    </Button>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="medicacion"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold">Tratamiento Farmacológico</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Indique los medicamentos, dosis y frecuencia..."
                                                                    className="min-h-[120px] bg-background/50 focus:bg-background transition-colors border-muted focus-visible:ring-primary/20"
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
                                </>
                            ) : (
                                <>
                                    {/* Tab 1: Consulta */}
                                    <TabsContent value="consulta" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <History className="h-4 w-4 text-primary" />
                                                    <CardTitle className="text-base text-primary/80">Anamnesis e Historia</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="motivoConsulta"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold">Motivo de Consulta *</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Escriba el motivo principal de la visita..."
                                                                    className="resize-none min-h-[80px] bg-background/50 focus:bg-background transition-colors"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="enfermedadActual"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold">Enfermedad Actual *</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Cronología y descripción de los síntomas..."
                                                                    className="min-h-[150px] bg-background/50 focus:bg-background transition-colors"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <Separator className="opacity-50" />

                                                <div className="space-y-4">
                                                    <FormLabel className="font-semibold">Diagnósticos *</FormLabel>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            placeholder="Agregar diagnóstico..."
                                                            value={diagInput}
                                                            onChange={(e) => setDiagInput(e.target.value)}
                                                            className="bg-background/50"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    addDiagnostic();
                                                                }
                                                            }}
                                                        />
                                                        <Button type="button" variant="secondary" onClick={addDiagnostic} className="shrink-0">
                                                            Añadir
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 pt-2">
                                                        {(form.watch('diagnosticos') ?? []).map((diag: string, i: number) => (
                                                            <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/10">
                                                                {diag}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-4 p-0 hover:bg-transparent text-primary/60 hover:text-destructive"
                                                                    onClick={() => removeDiagnostic(i)}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </Badge>
                                                        ))}
                                                        {(form.watch('diagnosticos') ?? []).length === 0 && (
                                                            <p className="text-sm text-muted-foreground italic">No hay diagnósticos agregados.</p>
                                                        )}
                                                    </div>
                                                    <FormMessage>{form.formState.errors.diagnosticos?.message}</FormMessage>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Tab 2: Antecedentes */}
                                    <TabsContent value="antecedentes" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                                <CardHeader className="pb-3 border-b border-muted/50">
                                                    <CardTitle className="text-sm font-semibold text-primary/80">Antecedentes Personales</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4 pt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="antecedentesPersonales"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Enfermedades y Cirugías</FormLabel>
                                                                <FormControl>
                                                                    <RichTextEditor
                                                                        value={field.value as string || ''}
                                                                        onChange={field.onChange}
                                                                        placeholder="Ej. Asma, alergias, cirugías previas, etc."
                                                                        compact={true}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>

                                            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                                <CardHeader className="pb-3 border-b border-muted/50">
                                                    <CardTitle className="text-sm font-semibold text-primary/80">Antecedentes Familiares</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4 pt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="antecedentesFamiliares"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Enfermedades del núcleo familiar</FormLabel>
                                                                <FormControl>
                                                                    <RichTextEditor
                                                                        value={field.value as string || ''}
                                                                        onChange={field.onChange}
                                                                        placeholder="Ej. Padre hipertenso, Madre diabética..."
                                                                        compact={true}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>

                                            <Card className="sm:col-span-2 border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                                <CardHeader className="pb-3 border-b border-muted/50">
                                                    <CardTitle className="text-sm font-semibold text-primary/80">Hábitos Psicobiológicos</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4 pt-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="habitosPsicobiologicos"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Hábitos</FormLabel>
                                                                <FormControl>
                                                                    <RichTextEditor
                                                                        value={field.value as string || ''}
                                                                        onChange={field.onChange}
                                                                        placeholder="Ej. Tabaquismo, alcohol, actividad física, alimentación..."
                                                                        compact={true}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    {/* Tab 3: Examen Físico */}
                                    <TabsContent value="fisico" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                            <CardHeader className="pb-3 border-b border-muted/50">
                                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary/80">
                                                    <Activity className="h-4 w-4 text-primary" /> Constantes Vitales y Examen
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="presionArterial"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Presión Arterial</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="120/80 mmHg" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="frecuenciaCardiaca"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Frec. Cardíaca</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="75 lpm" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="frecuenciaRespiratoria"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Frec. Respiratoria</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="15 rpm" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="saturacionOxigeno"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Sat. O2 (%)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="98" type="number" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="temperatura"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Temp. (°C)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="36.5" step="0.1" type="number" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="peso"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Peso (kg)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="70" step="0.1" type="number" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="altura"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Altura (cm)</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="175" type="number" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="imc"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>IMC</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="22.5" type="number" step="0.1" className="bg-background/50" {...field} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name="otros"
                                                        render={({ field }) => (
                                                            <FormItem className="col-span-2 sm:col-span-4">
                                                                <FormLabel>Otros</FormLabel>
                                                                <FormControl>
                                                                    <RichTextEditor
                                                                        value={field.value as string || ''}
                                                                        onChange={field.onChange}
                                                                        placeholder="Describa hallazgos adicionales relevantes..."
                                                                        compact={true}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Tab 4: Plan */}
                                    <TabsContent value="plan" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                                            <CardHeader className="pb-3 border-b border-muted/50">
                                                <CardTitle className="text-sm font-semibold text-primary/80">Plan de Manejo y Tratamiento</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-6 pt-6">
                                                <FormField
                                                    control={form.control}
                                                    name="examenes"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold">Exámenes Complementarios</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Laboratorios, RX, Eco, etc. a solicitar..." className="bg-background/50" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs">
                                                    <div className="flex items-center gap-2 text-primary font-medium">
                                                        <Paperclip className="h-4 w-4 shrink-0" />
                                                        <span>Adjuntar archivos PDF o imágenes (RX, ecografías, laboratorios)</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentTab('examenes')}
                                                        className="h-7 text-xs border-primary/30 hover:bg-primary/10 text-primary cursor-pointer shrink-0"
                                                    >
                                                        Gestionar Archivos ({documents?.length || 0})
                                                    </Button>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="medicacion"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="font-semibold">Tratamiento Farmacológico</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    placeholder="Indique los medicamentos, dosis y frecuencia..."
                                                                    className="min-h-[120px] bg-background/50 focus:bg-background transition-colors"
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
                                </>
                            )}

                            {/* Tab 5: Exámenes Complementarios (PDFs / Imágenes) */}
                            <TabsContent value="examenes" className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
                                <ClinicalHistoryDocumentsManager
                                    documents={documents}
                                    onChange={setDocuments}
                                    historyId={isEditMode ? existingHistory?.id : undefined}
                                    patientId={selectedPatient?.id}
                                />
                            </TabsContent>
                        </Tabs>

                        {/* Sticky Footer Actions for Mobile / Regular Footer for Desktop */}
                        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-50 flex flex-row gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:relative md:bg-transparent md:border-none md:shadow-none md:p-0 md:pt-4 md:pb-10 md:mt-auto md:justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate(-1)}
                                className="hidden md:flex"
                            >
                                Cancelar y volver
                            </Button>

                            {selectedPatient && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowPDF(!showPDF)}
                                    className="flex-1 md:hidden h-11 gap-2 border-primary/20 bg-background shadow-xs font-medium"
                                >
                                    <FileText className="h-4 w-4" />
                                    PDF
                                </Button>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="flex-1 md:w-auto px-8 h-11 md:h-auto shadow-md shadow-primary/20 font-medium"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Historia Clínica' : 'Guardar')}
                            </Button>
                        </div>

                        {/* Spacer for bottom sticky bar on mobile */}
                        <div className="h-28 md:hidden" />

                        {/* PDF Preview Modal */}
                        <Dialog open={showPDF} onOpenChange={setShowPDF}>
                            <DialogContent className="!max-w-none w-[75vw] h-[85vh] flex flex-col p-0 overflow-hidden !rounded-xl border-none shadow-2xl">
                                <DialogHeader className="px-6 py-4 border-b bg-card hidden sm:flex shrink-0">
                                    <DialogTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Previsualización de Historia Clínica
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Previsualización de la historia clínica en formato PDF
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="flex-1 min-h-0 bg-muted/20">
                                    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
                                        <MedicalReportPDF
                                            data={{
                                                ...form.getValues(),
                                                antecedentesPersonales: form.getValues().antecedentesPersonales || 'No',
                                                antecedentesFamiliares: form.getValues().antecedentesFamiliares || 'No',
                                                habitos: form.getValues().habitosPsicobiologicos || 'N/A',
                                                examenFisico: {
                                                    presionArterial: form.getValues().presionArterial || 'N/A',
                                                    frecuenciaCardiaca: form.getValues().frecuenciaCardiaca || 'N/A',
                                                    frecuenciaRespiratoria: form.getValues().frecuenciaRespiratoria || 'N/A',
                                                    saturacionOxigeno: form.getValues().saturacionOxigeno || 'N/A',
                                                    temperatura: form.getValues().temperatura || 'N/A',
                                                    peso: form.getValues().peso || 'N/A',
                                                    altura: form.getValues().altura || 'N/A',
                                                    imc: form.getValues().imc || 'N/A',
                                                    otros: form.getValues().otros || 'N/A'
                                                },
                                                planManejo: {
                                                    examenes: form.getValues().examenes || 'Ninguno',
                                                    medicacion: form.getValues().medicacion || 'Ninguna'
                                                },
                                                datosEspecificos: form.getValues().formData?.datosEspecificos
                                            }}
                                            patient={selectedPatient}
                                            doctor={selectedDoctor}
                                            activeTemplate={activeTemplate}
                                        />
                                    </PDFViewer>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </form>
        </Form>
    );
}
