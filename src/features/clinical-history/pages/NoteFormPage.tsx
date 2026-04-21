import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Loader2,
    History,
    User,
    Stethoscope,
    Calendar,
    Save,
    Clock,
    DoorOpen,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { clinicalHistoryNoteApi, clinicalHistoryApi, specialtiesApi, consultingRoomsApi } from '@/api';
import type { ClinicalHistory, SpecialtyTemplate, ConsultingRoom } from '@/types';
import { DynamicForm } from '../components/DynamicForm';
import { PatientStatusBadge } from '@/features/patient/components/PatientStatusBadge';

import { noteSchema, type NoteFormValues } from '../types/clinical-history.schema';

export function NoteFormPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const historyId = searchParams.get('historyId');

    const [history, setHistory] = useState<ClinicalHistory | null>(null);
    const [template, setTemplate] = useState<SpecialtyTemplate | null>(null);
    const [consultingRooms, setConsultingRooms] = useState<ConsultingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<NoteFormValues>({
        resolver: zodResolver(noteSchema),
        defaultValues: {
            estadoSubjetivo: '',
            cambiosSintomas: '',
            planAjustado: '',
            proximaCita: '',
            horaCita: '',
            consultingRoomId: '',
            isDischarge: false,
            seguimiento: {},
        },
    });

    useEffect(() => {
        if (!historyId) {
            toast.error('No se especificó la historia clínica');
            navigate('/clinical-history');
            return;
        }

        const loadData = async () => {
            try {
                const hRes = await clinicalHistoryApi.getById(historyId);
                const h = hRes.data;
                setHistory(h);

                // Try to load evolution template for this specialty
                // Usually we search for a template named "EVOLUCION - {Specialty}"
                try {
                    const tRes = await specialtiesApi.getBySpecialty(`${h.specialty}_EVOLUCION`);
                    setTemplate(tRes.data);
                } catch (e) {
                    // Fallback to the specialty's main template if no evolution one exists? 
                    // Or just show standard fields. For now, try main if not found.
                    try {
                        const tResMain = await specialtiesApi.getBySpecialty(h.specialty);
                        setTemplate(tResMain.data);
                    } catch (e2) {
                        setTemplate(null);
                    }
                }

                // Load consulting rooms
                try {
                    const crRes = await consultingRoomsApi.getAll({ page: 1, limit: 50 });
                    setConsultingRooms(crRes.data.data);
                } catch (e) {
                    console.error('Error al cargar consultorios');
                }
            } catch (error) {
                toast.error('Error al cargar información de la historia clínica');
                navigate('/clinical-history');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [historyId, navigate]);

    const onSubmit = async (values: NoteFormValues) => {
        if (!historyId) return;
        setIsSubmitting(true);
        try {
            await clinicalHistoryNoteApi.create({
                fecha: new Date().toISOString(),
                estadoSubjetivo: values.estadoSubjetivo,
                cambiosSintomas: values.cambiosSintomas || undefined,
                clinicalHistoryId: historyId,
                seguimiento: values.seguimiento && Object.keys(values.seguimiento).length > 0
                    ? values.seguimiento
                    : undefined,
                planAjustado: values.planAjustado
                    ? { indicaciones: values.planAjustado }
                    : undefined,
                proximaCita: values.proximaCita
                    ? new Date(values.proximaCita).toISOString()
                    : undefined,
                horaCita: values.horaCita || undefined,
                consultingRoomId: values.consultingRoomId || undefined,
                isDischarge: values.isDischarge,
            });

            // Invalidar cachés para ver la nota inmediatamente
            queryClient.invalidateQueries({ queryKey: ['clinical-history', historyId] });
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
            queryClient.invalidateQueries({ queryKey: ['clinical-history-notes'] });

            toast.success('Nota de evolución guardada');
            navigate(`/clinical-history/${historyId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la nota');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
    if (!history) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Nota de Evolución</h1>
                        <p className="text-muted-foreground">
                            Registrar el progreso del paciente <strong>{history.patient.firstName} {history.patient.lastName}</strong>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-muted/40">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Contexto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-3">
                            <div className="space-y-1">
                                <span className="text-muted-foreground block">Paciente</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <User className="h-3 w-3" />
                                    {history.patient.firstName} {history.patient.lastName}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block">Especialidad</span>
                                <div className="flex items-center gap-2 font-medium">
                                    <Stethoscope className="h-3 w-3" />
                                    {history.specialty}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-muted-foreground block">DNI</span>
                                <div className="font-medium underline decoration-primary/30">
                                    {history.patient.identificationNumber || 'N/A'}
                                </div>
                            </div>
                            <div className="pt-2 border-t mt-3">
                                <span className="text-muted-foreground block mb-1">Estado Actual</span>
                                <PatientStatusBadge status={history.patient.status} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-3">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalle de la Sesión</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="estadoSubjetivo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estado Subjetivo / Motivo del día *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Cómo llega el paciente hoy, cambios reportados..."
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
                                                <FormLabel>Cambios en Síntomas (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Mejoría o empeoramiento de síntomas específicos..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {template && (
                                        <div className="pt-4 border-t space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Seguimiento Específico</h3>
                                                <Badge variant="outline" className="text-[10px]">{template.name}</Badge>
                                            </div>
                                            <DynamicForm
                                                structure={template.estructura}
                                                basePath="seguimiento"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="planAjustado"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Plan Ajustado / Recomendaciones</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Instrucciones para la casa, cambios en medicación..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="proximaCita"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Programar Próxima Cita</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input type="date" className="pl-10 h-10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="horaCita"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Hora de la Cita</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                            <Input type="time" className="pl-10 h-10" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="consultingRoomId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Consultorio</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10">
                                                                <div className="flex items-center gap-2">
                                                                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                                                                    <SelectValue placeholder="Seleccione consultorio" />
                                                                </div>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {consultingRooms.map((room) => (
                                                                <SelectItem key={room.id} value={room.id}>
                                                                    {room.nombre}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <FormField
                                            control={form.control}
                                            name="isDischarge"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-emerald-50/10 border-emerald-100">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base text-emerald-800 flex items-center gap-2">
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                                            Dar de Alta Médica
                                                        </FormLabel>
                                                        <p className="text-sm text-muted-foreground">
                                                            Marcar al paciente como dado de alta después de esta consulta.
                                                        </p>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-emerald-600"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting} className="w-full sm:w-auto">
                                    Cancelar
                                </Button>
                                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Guardar Nota de Evolución
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    );
}
