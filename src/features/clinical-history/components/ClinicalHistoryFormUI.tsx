import type { UseFormReturn } from 'react-hook-form';
import { Loader2, Search, Check, Info, ChevronsUpDown, History, Stethoscope, User as UserIcon, X, FileText, Activity, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';

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
} from "@/components/ui/dialog";

import { MedicalReportPDF } from '@/reports/MedicalReportPDF';
import { cn } from '@/lib/utils';
import type { Patient, Doctor } from '@/types';
import type { ClinicalHistoryFormValues } from '../types/clinical-history.schema';

interface ClinicalHistoryFormUIProps {
    form: UseFormReturn<ClinicalHistoryFormValues>;
    patients: Patient[];
    doctors: Doctor[];
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
}

export function ClinicalHistoryFormUI({
    form,
    doctors,
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
    setShowPDF
}: ClinicalHistoryFormUIProps) {
    const navigate = useNavigate();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Patient & Context */}
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                            <CardHeader className="pb-3 pt-4 sm:pt-6">
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-base">Información General</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 px-6 pb-6">
                                <FormField
                                    control={form.control}
                                    name="patientId"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Paciente *</FormLabel>
                                            <Popover open={isPatientListOpen} onOpenChange={setIsPatientListOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {selectedPatient
                                                                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                                                                : "Buscar paciente..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <div className="p-2 border-b">
                                                        <div className="flex items-center px-3 gap-2 bg-muted rounded-md">
                                                            <Search className="h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Filtrar por nombre o ID..."
                                                                className="border-0 focus-visible:ring-0 px-0 h-9 bg-transparent"
                                                                value={patientSearch}
                                                                onChange={(e) => setPatientSearch(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[300px] overflow-y-auto p-1">
                                                        {filteredPatients.length === 0 ? (
                                                            <p className="p-4 text-center text-sm text-muted-foreground">
                                                                No se encontraron pacientes.
                                                            </p>
                                                        ) : (
                                                            filteredPatients.map((patient) => (
                                                                <div
                                                                    key={patient.id}
                                                                    className={cn(
                                                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                        field.value === patient.id && "bg-accent"
                                                                    )}
                                                                    onClick={() => {
                                                                        form.setValue("patientId", patient.id);
                                                                        setIsPatientListOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value === patient.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span>{patient.firstName} {patient.lastName}</span>
                                                                        <span className="text-xs text-muted-foreground">{patient.identificationNumber}</span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Especialidad</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione especialidad" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {selectedDoctor?.specialty ? (
                                                        <SelectItem value={selectedDoctor.specialty.toUpperCase()}>
                                                            {selectedDoctor.specialty}
                                                        </SelectItem>
                                                    ) : (
                                                        <>
                                                            <SelectItem value="GENERAL">General</SelectItem>
                                                            <SelectItem value="NEUMONOLOGIA">Neumonología</SelectItem>
                                                            <SelectItem value="CARDIOLOGIA">Cardiología</SelectItem>
                                                            <SelectItem value="PEDIATRIA">Pediatría</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>La plantilla de formulario cambiará según la especialidad.</FormDescription>
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
                                            {selectedPatient.birthDate ? (new Date().getFullYear() - new Date(selectedPatient.birthDate).getFullYear()) + ' años' : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Género:</span>
                                        <span className="font-semibold uppercase">{selectedPatient.gender}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Column 2 & 3: Main Form Content */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <Tabs defaultValue="consulta" className="w-full">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                                <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full lg:max-w-2xl !h-auto sm:!h-12 p-1.5 bg-muted/50 rounded-xl gap-1.5 shadow-inner grow">
                                    <TabsTrigger value="consulta" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                                        <History className="h-4 w-4" />
                                        <span className="text-xs sm:text-sm font-medium">Consulta</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="antecedentes" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                                        <UserIcon className="h-4 w-4" />
                                        <span className="text-xs sm:text-sm font-medium">Antecedentes</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="fisico" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                                        <Activity className="h-4 w-4" />
                                        <span className="text-xs sm:text-sm font-medium">Examen Físico</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="plan" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                                        <ClipboardList className="h-4 w-4" />
                                        <span className="text-xs sm:text-sm font-medium">Plan</span>
                                    </TabsTrigger>
                                </TabsList>

                                {selectedPatient && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowPDF(!showPDF)}
                                        className="h-10 lg:h-11 gap-2 border-primary/20 hover:bg-primary/5 text-primary shrink-0 w-full lg:w-auto shadow-sm font-medium"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Previsualizar PDF
                                    </Button>
                                )}
                            </div>

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
                                                {form.watch('diagnosticos').map((diag: string, i: number) => (
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
                                                {form.watch('diagnosticos').length === 0 && (
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
                        </Tabs>

                        {/* Sticky Footer Actions for Mobile / Regular Footer for Desktop */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-muted/50 z-50 flex flex-row gap-3 md:relative md:bg-transparent md:border-none md:p-0 md:pt-4 md:pb-10 md:mt-auto md:justify-end">
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
                                    className="flex-1 md:hidden h-11 gap-2 border-primary/20 bg-background"
                                >
                                    <FileText className="h-4 w-4" />
                                    PDF
                                </Button>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                disabled={isSubmitting}
                                className="flex-1 md:w-auto px-8 h-11 md:h-auto shadow-lg shadow-primary/20"
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </div>

                        {/* Spacer for bottom sticky bar on mobile */}
                        <div className="h-20 md:hidden" />

                        {/* PDF Preview Modal */}
                        <Dialog open={showPDF} onOpenChange={setShowPDF}>
                            <DialogContent className="!max-w-none w-[75vw] h-[85vh] flex flex-col p-0 overflow-hidden !rounded-xl border-none shadow-2xl">
                                <DialogHeader className="px-6 py-4 border-b bg-card hidden sm:flex shrink-0">
                                    <DialogTitle className="flex items-center gap-2 text-lg">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Previsualización de Historia Clínica
                                    </DialogTitle>
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
