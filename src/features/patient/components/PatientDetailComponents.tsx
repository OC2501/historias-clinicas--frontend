import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Phone, MapPin, Edit, Plus, ArrowLeft, Activity, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { patientsApi } from '@/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Patient } from '@/types';
import { PatientStatusBadge } from './PatientStatusBadge';

interface PatientDetailHeaderProps {
    patient: Patient;
}

// Función auxiliar para formateo seguro
const safeFormat = (dateString: string | null | undefined, formatStr: string) => {
    if (!dateString) return 'No registrada';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return format(date, formatStr, { locale: es });
};

export function PatientDetailHeader({ patient }: PatientDetailHeaderProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Acceso extremadamente seguro a las iniciales
    const getInitials = () => {
        if (!patient) return 'P';
        const f = patient.firstName?.charAt(0) || '';
        const l = patient.lastName?.charAt(0) || '';
        return (f + l).toUpperCase() || 'P';
    };

    const initials = getInitials();

    const handleDelete = async () => {
        try {
            await patientsApi.delete(patient.id);
            toast.success('Paciente eliminado correctamente');
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            navigate('/patients');
        } catch (error) {
            toast.error('Error al eliminar el paciente');
        }
    };

    return (
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between bg-card p-4 sm:p-6 rounded-3xl border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity className="h-32 w-32" aria-hidden="true" />
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 relative z-10 w-full md:w-auto text-center sm:text-left">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/patients')}
                        className="rounded-xl shadow-none hover:bg-primary/5 hover:text-primary transition-all shrink-0 sm:hidden"
                        aria-label="Volver al listado de pacientes"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>

                    <div className="flex items-center gap-4 mx-auto sm:mx-0">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/patients')}
                            className="rounded-xl shadow-none hover:bg-primary/5 hover:text-primary transition-all shrink-0 hidden sm:flex"
                            aria-label="Volver al listado de pacientes"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Avatar className="h-20 w-20 sm:h-20 sm:w-20 border-4 border-background shadow-lg shrink-0">
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="w-9 sm:hidden" /> {/* Spacer to balance the back button on mobile */}
                </div>

                <div className="mt-1 sm:mt-0 flex flex-col items-center sm:items-start">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">
                        {patient.firstName} {patient.lastName}
                    </h1>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 font-semibold shadow-none">
                            {patient.identificationNumber || 'Sin Documento'}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 font-semibold text-muted-foreground shadow-none">
                            {patient.gender === 'MALE' ? 'M' : 'F'} – {safeFormat(patient.birthDate, 'dd MMM yyyy')}
                        </Badge>
                        <PatientStatusBadge status={patient.status} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 relative z-10 w-full md:w-auto mt-2 md:mt-0">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-first">
                    <Button onClick={() => navigate(`/clinical-history/new?patientId=${patient.id}`)} className="rounded-xl px-6 py-6 sm:py-2 h-auto sm:h-10 text-base sm:text-sm font-bold sm:font-semibold shadow-md w-full sm:w-auto order-first sm:order-last">
                        <Plus className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                        Nueva Consulta
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/patients/${patient.id}/edit`)} className="rounded-xl px-5 h-auto sm:h-10 py-3 sm:py-2 w-full sm:w-auto border-primary/20 text-primary hover:bg-primary/5 shadow-sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Perfil
                    </Button>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="rounded-xl px-4 h-10 border-destructive/10 text-destructive/60 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 shadow-none w-full sm:w-auto mt-2 sm:mt-0">
                            <Trash2 className="mr-2 sm:mr-0 h-4 w-4" />
                            <span className="sm:hidden">Eliminar Expediente</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl w-[95vw] sm:w-full max-w-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Está completamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción eliminará permanentemente al paciente <strong>{patient.firstName} {patient.lastName}</strong> y todos sus registros asociados de la base de datos.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <AlertDialogCancel className="rounded-xl w-full sm:w-auto mt-0">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90 rounded-xl w-full sm:w-auto">
                                Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

export function InfoItem({ label, value, status }: { label: string; value: string | null | undefined; status?: 'success' | 'default' }) {
    return (
        <div className="space-y-1 group">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
            {status === 'success' ? (
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-base font-bold text-foreground">{value || 'N/A'}</span>
                </div>
            ) : (
                <p className="text-base font-bold text-card-foreground group-hover:text-primary transition-colors break-words">
                    {value || '—'}
                </p>
            )}
        </div>
    );
}

export function PatientGeneralInfo({ patient }: { patient: Patient }) {
    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <Card className="border-none shadow-sm lg:col-span-2 overflow-hidden">
                <CardHeader className="bg-muted/5 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-3">
                        <div className="bg-blue-100/50 p-2 rounded-xl">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        Detalles Personales
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 p-8">
                    <InfoItem label="Documento de Identidad" value={patient.identificationNumber} />
                    <InfoItem label="Fecha de Nacimiento" value={safeFormat(patient.birthDate, 'dd/MM/yyyy')} />
                    <InfoItem label="Género" value={patient.gender === 'MALE' ? 'Masculino' : 'Femenino'} />
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estado del Paciente</p>
                        <PatientStatusBadge status={patient.status} />
                    </div>
                    <InfoItem label="Correo Electrónico" value={patient.email || 'No registrado'} />

                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardHeader className="bg-muted/5 border-b pb-4">
                    <CardTitle className="text-lg flex items-center gap-3">
                        <div className="bg-orange-100/50 p-2 rounded-xl">
                            <Phone className="h-5 w-5 text-orange-600" />
                        </div>
                        Contacto
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                    <div className="flex items-start gap-4 group">
                        <div className="bg-muted p-2.5 rounded-xl group-hover:bg-primary/5 transition-colors">
                            <Phone className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-muted-foreground">Teléfono</p>
                            <p className="text-base font-medium">{patient.phone || 'No registrado'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                        <div className="bg-muted p-2.5 rounded-xl group-hover:bg-primary/5 transition-colors">
                            <MapPin className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-muted-foreground">Dirección de Residencia</p>
                            <p className="text-base font-medium">{patient.address || 'No registrado'}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl mt-4">
                        <p className="text-xs text-muted-foreground italic text-center">
                            Información actualizada por última vez el {safeFormat(patient.updatedAt, 'dd/MM/yyyy')}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
