import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    FileText,
    MessageSquare,
    ArrowLeft,
    Plus,
    Calendar,
    Stethoscope,
    ChevronRight,
    User,
    Download,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePatient } from '@/features/patient/hooks/usePatient';
import { PatientDetailHeader, PatientGeneralInfo } from '@/features/patient/components/PatientDetailComponents';
import { pdf } from '@react-pdf/renderer';
import { PatientFullHistoryPDF } from '@/reports/PatientFullHistoryPDF';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '@/api';

// Función auxiliar para formateo seguro
const formatDateSafe = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return 'S/F';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return format(date, formatStr, { locale: es });
};

export function PatientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { patient, histories, notes, isLoading } = usePatient(id);
    const [isDownloading, setIsDownloading] = useState(false);

    // Cargamos la lista de doctores para cruzar nombres si el backend no los envía en la historia
    const { data: doctorsRes } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const doctorsList = doctorsRes?.data?.data || [];

    const getDoctorName = (doctorObj: any) => {
        if (doctorObj?.user?.name) return doctorObj.user.name;
        // Si no viene el nombre, lo buscamos en nuestra lista por ID
        const found = doctorsList.find((d: any) => d.id === doctorObj?.id);
        if (found?.user?.name) return found.user.name;
        // Si no, devolvemos la especialidad o un genérico
        return doctorObj?.specialty ? `Especialista en ${doctorObj.specialty}` : 'Médico Responsable';
    };

    const handleDownloadAll = async () => {
        if (!patient || histories.length === 0) return;

        setIsDownloading(true);
        try {
            const doc = <PatientFullHistoryPDF patient={patient} histories={histories} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Historial_${patient.lastName}_${patient.firstName}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Historial médico descargado correctamente');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast.error('Error al generar el documento PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-[400px]" />
                    <div className="grid gap-6 md:grid-cols-2">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border border-dashed">
                <User className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <h2 className="text-2xl font-bold text-muted-foreground">Paciente no encontrado</h2>
                <Button variant="outline" className="mt-6" onClick={() => navigate('/patients')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al listado
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Premium Header - Refactored */}
            <PatientDetailHeader patient={patient} />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-muted/30 p-1 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:flex-wrap w-full md:w-auto h-auto gap-1">
                    <TabsTrigger value="general" className="rounded-xl px-6 py-2.5 data-[state=active]:shadow-md w-full sm:w-auto">Información</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-6 py-2.5 data-[state=active]:shadow-md w-full sm:w-auto">Historias Clínicas</TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-xl px-6 py-2.5 data-[state=active]:shadow-md w-full sm:w-auto">Notas de Evolución</TabsTrigger>
                </TabsList>

                {/* Tab: General - Refactored */}
                <TabsContent value="general" className="mt-0 focus-visible:outline-none">
                    <PatientGeneralInfo patient={patient} />
                </TabsContent>

                {/* Tab: History */}
                <TabsContent value="history" className="mt-0 focus-visible:outline-none">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-muted/5 p-6 gap-4">
                            <div>
                                <CardTitle className="text-xl">Historias Clínicas</CardTitle>
                                <CardDescription>Registro cronológico de todas las consultas realizadas.</CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-primary border-primary/20 hover:bg-primary/5 w-full sm:w-auto"
                                onClick={handleDownloadAll}
                                disabled={isDownloading || histories.length === 0}
                            >
                                {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                )}
                                {isDownloading ? 'Generando...' : 'Descargar Todo'}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {histories.length > 0 ? (
                                <div className="divide-y divide-muted/50">
                                    {histories.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start sm:items-center gap-4 p-6 hover:bg-muted/20 transition-all cursor-pointer group"
                                            onClick={() => navigate(`/clinical-history/${item.id}`)}
                                        >
                                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                                            </div>
                                            <div className="flex-1 space-y-1 w-full">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                                                    <span className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors">
                                                        Consulta {item.specialty || 'General'}
                                                    </span>
                                                    <Badge variant="outline" className="font-semibold px-3 py-1 bg-background shadow-none border-primary/20 text-primary self-start sm:self-auto">
                                                        <Calendar className="mr-1.5 h-3 w-3" aria-hidden="true" />
                                                        {formatDateSafe(item.createdAt, 'dd MMM yyyy')}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                                                    <p className="flex items-center gap-1.5 font-medium">
                                                        <User className="h-3.5 w-3.5" aria-hidden="true" />
                                                        Dr. {getDoctorName(item.doctor)}
                                                    </p>
                                                    <p className="flex items-center gap-1.5 italic line-clamp-1">
                                                        {item.motivoConsulta ? `“${item.motivoConsulta.substring(0, 60)}…”` : 'Sin motivo registrado'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="hidden sm:block h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" aria-hidden="true" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center px-4">
                                    <div className="bg-muted p-6 rounded-full mb-4">
                                        <FileText className="h-10 w-10 text-muted-foreground opacity-30" />
                                    </div>
                                    <p className="text-lg font-semibold text-muted-foreground">Sin historial médico</p>
                                    <p className="text-sm text-muted-foreground max-w-[250px] mt-1">Este paciente aún no tiene consultas registradas.</p>
                                    <Button variant="link" className="mt-4 text-primary" onClick={() => navigate(`/clinical-history/new?patientId=${id}`)}>
                                        Iniciar primera consulta
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Notes */}
                <TabsContent value="notes" className="mt-0 focus-visible:outline-none">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-muted/5 p-6 gap-4">
                            <div>
                                <CardTitle className="text-xl">Notas de Evolución</CardTitle>
                                <CardDescription>Seguimiento diario y estado subjetivo del paciente.</CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => navigate(`/clinical-history/notes/new?historyId=${histories[0].id}`)}
                                className="rounded-xl px-5 shadow-sm w-full sm:w-auto"
                                disabled={histories.length === 0}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nueva Nota
                            </Button>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {notes.length > 0 ? (
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-primary/5 before:to-transparent">
                                    {notes.map((note: any) => (
                                        <div key={note.id} className="relative pl-12 group">
                                            <div className="absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-2xl border-4 bg-background border-muted group-hover:border-primary/20 group-hover:bg-primary/5 text-muted-foreground group-hover:text-primary transition-all duration-300 z-10 shadow-sm">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                            <div className="bg-muted/20 hover:bg-muted/40 p-4 sm:p-5 rounded-2xl border border-transparent hover:border-muted-foreground/10 transition-all shadow-none space-y-3 relative overflow-hidden">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-2 sm:gap-0">
                                                    <p className="text-sm font-bold text-primary">Evolución Médica</p>
                                                    <span className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm self-start sm:self-auto">
                                                        {format(new Date(note.createdAt), 'dd MMM yyyy • HH:mm', { locale: es })}
                                                    </span>
                                                </div>
                                                <div className="text-base text-card-foreground leading-relaxed italic relative z-10">
                                                    "{note.estadoSubjetivo}"
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-muted-foreground/5 relative z-10">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px] bg-primary text-white">DR</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium text-muted-foreground">Dr. {note.doctor?.user?.name || 'Médico Responsable'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center px-4">
                                    <div className="bg-muted p-6 rounded-full mb-4">
                                        <MessageSquare className="h-10 w-10 text-muted-foreground opacity-30" />
                                    </div>
                                    <p className="text-lg font-semibold text-muted-foreground">Sin notas registradas</p>
                                    <p className="text-sm text-muted-foreground max-w-[250px] mt-1">No se han registrado notas de evolución para este paciente.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
