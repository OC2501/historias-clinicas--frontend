import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, FileText, Activity, Pill, Calendar as CalendarIcon, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { PDFViewer } from '@react-pdf/renderer';
import { EvolutionNotePDF } from '@/features/clinical-history/pdf/EvolutionNotePDF';

import { Button } from '@/components/ui/button';
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

import { useCreateClinicalHistoryNote } from '../hooks/useClinicalHistoryNotes';
import type { CreateClinicalHistoryNoteRequest } from '@/types';

const noteSchema = z.object({
    estadoSubjetivo: z.string().min(10, 'El estado subjetivo debe tener al menos 10 caracteres'),
    objetivo: z.string().min(10, 'Describa el estado objetivo (signos vitales, examen físico)'),
    diagnostico: z.string().min(5, 'Especifique el diagnóstico'),
    tratamientoActual: z.string().optional(),
    cambiosSintomas: z.string().optional(),
    proximaCita: z.string().optional().or(z.literal('')),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export function ClinicalHistoryNoteFormPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const historyId = searchParams.get('historyId');
    const createNoteMutation = useCreateClinicalHistoryNote();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial values for dynamic fields
    const [peso, setPeso] = useState('');
    const [presionArterial, setPresionArterial] = useState('');
    const [medicacion, setMedicacion] = useState('');
    const [indicaciones, setIndicaciones] = useState('');
    const [showPDF, setShowPDF] = useState(false);

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

    const onSubmit = async (values: NoteFormValues) => {
        if (!historyId) {
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

            const payload: CreateClinicalHistoryNoteRequest = {
                fecha: new Date().toISOString(),
                estadoSubjetivo: values.estadoSubjetivo,
                objetivo: values.objetivo,
                diagnostico: values.diagnostico,
                tratamientoActual: values.tratamientoActual,
                cambiosSintomas: values.cambiosSintomas || undefined,
                clinicalHistoryId: historyId,
                seguimiento: Object.keys(seguimientoData).length > 0 ? seguimientoData : undefined,
                planAjustado: Object.keys(planData).length > 0 ? planData : undefined,
                proximaCita: values.proximaCita ? new Date(values.proximaCita).toISOString() : undefined,
            };

            await createNoteMutation.mutateAsync(payload);

            toast.success('Nota de evolución creada correctamente');
            navigate(`/clinical-history/${historyId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la nota');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!historyId) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-muted-foreground">No se especificó la historia clínica a la que pertenece esta nota.</p>
                <Button onClick={() => navigate('/clinical-history-note')}>Volver a Historias</Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nueva Nota de Evolución</h1>
                    <p className="text-muted-foreground">
                        Agregue una nota de seguimiento a la historia clínica.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                className="min-h-[100px]"
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
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">Evaluación Objetiva</CardTitle>
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
                                                className="min-h-[100px]"
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

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
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
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>



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
                                    className="h-20"
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

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPDF(!showPDF)}
                    >
                        {showPDF ? <X className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                        {showPDF ? 'Cerrar Vista PDF' : 'Previsualizar PDF'}
                    </Button>
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Guardando...' : 'Guardar Evolución'}
                    </Button>
                </div>

                {showPDF && (
                    <div className="mt-6 border rounded-lg overflow-hidden" style={{ height: '80vh' }}>
                        <PDFViewer style={{ width: '100%', height: '100%' }}>
                            <EvolutionNotePDF
                                data={{
                                    estadoSubjetivo: form.getValues('estadoSubjetivo'),
                                    objetivo: form.getValues('objetivo'),
                                    diagnostico: form.getValues('diagnostico'),
                                    tratamientoActual: form.getValues('tratamientoActual'),
                                    cambiosSintomas: form.getValues('cambiosSintomas'),
                                    proximaCita: form.getValues('proximaCita'),
                                }}
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
                )}
            </form>
        </Form>
        </div >
    );
}
