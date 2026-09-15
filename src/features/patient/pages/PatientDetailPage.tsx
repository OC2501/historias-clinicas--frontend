
import { useState, useMemo } from 'react';
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
    Loader2,
    Paperclip,
    Activity,
    Printer,
    ShieldAlert,
    Users,
    HeartHandshake,
    Edit,
    UserPlus,
    Unlink,
    Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePatient } from '@/features/patient/hooks/usePatient';
import { formatPatientAge, formatTitleCase } from '@/lib/utils';
import { PatientDetailHeader, PatientGeneralInfo } from '@/features/patient/components/PatientDetailComponents';
import { PatientDocumentsTab } from '@/features/patient/components/PatientDocumentsTab';
import { pdf } from '@react-pdf/renderer';
import { PatientFullHistoryPDF } from '@/features/patient/pdf/PatientFullHistoryPDF';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SystemRole, OrganizationRole, RELATIONSHIP_LABELS } from '@/types/enums';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, consultasApi, specialtiesApi, patientsApi } from '@/api';
import { ConsultasDetail } from '@/features/consultas/components/ConsultasDetail';
import { ConsultaReportPDF } from '@/features/consultas/pdf/ConsultaReportPDF';
import type { Consulta } from '@/features/consultas/types/consultas.type';
import { TIPO_CONSULTA_LABELS, TIPO_CONSULTA_COLORS } from '@/features/consultas/types/consultas.type';
import type { Patient } from '@/types';
import { LinkFamilyMemberModal } from '@/features/patient/components/LinkFamilyMemberModal';
import { safeFormat } from '@/lib/utils';

// Función auxiliar para formateo seguro
const formatDateSafe = (dateString: string | null | undefined, formatStr: string) => {
    return safeFormat(dateString, formatStr, 'S/F');
};

export function PatientDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { patient, histories, notes, isLoading } = usePatient(id);
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
    const [isConsultaDetailOpen, setIsConsultaDetailOpen] = useState(false);
    const [isLinkFamilyModalOpen, setIsLinkFamilyModalOpen] = useState(false);
    const [unlinkingMember, setUnlinkingMember] = useState<Patient | null>(null);
    const [isUnlinking, setIsUnlinking] = useState(false);

    const handleUnlink = async () => {
        if (!unlinkingMember || !patient) return;
        setIsUnlinking(true);
        try {
            await patientsApi.unlinkFamilyMember(patient.id, unlinkingMember.id);
            toast.success(`${unlinkingMember.firstName} ${unlinkingMember.lastName} fue desvinculado(a) del núcleo familiar.`);
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            setUnlinkingMember(null);
        } catch (error: any) {
            console.error('Error unlinking family member:', error);
            const msg = error?.response?.data?.message || error?.message || 'Error al desvincular familiar';
            toast.error(msg);
        } finally {
            setIsUnlinking(false);
        }
    };

    // Cargamos la lista de doctores para cruzar nombres si el backend no los envía en la historia
    const { data: doctorsRes } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await doctorsApi.getAll();
            return res.data;
        },
    });

    const doctorsList = useMemo(() => {
        if (Array.isArray(doctorsRes)) return doctorsRes;
        if (Array.isArray((doctorsRes as any)?.data)) return (doctorsRes as any).data;
        if (Array.isArray((doctorsRes as any)?.data?.data)) return (doctorsRes as any).data.data;
        return [];
    }, [doctorsRes]);

    // Cargamos las plantillas de especialidad para formatear historias de cualquier especialidad en PDF
    const { data: templatesRes } = useQuery({
        queryKey: ['specialty-templates'],
        queryFn: async () => {
            const res = await specialtiesApi.getAll();
            return res.data;
        },
    });

    const templatesList = useMemo(() => {
        if (Array.isArray(templatesRes)) return templatesRes;
        if (Array.isArray((templatesRes as any)?.data)) return (templatesRes as any).data;
        if (Array.isArray((templatesRes as any)?.data?.data)) return (templatesRes as any).data.data;
        return [];
    }, [templatesRes]);

    // Cargamos las consultas y chequeos diarios del paciente
    const { data: consultasRes, isLoading: isLoadingConsultas } = useQuery({
        queryKey: ['consultas-patient-detail', id],
        queryFn: async () => {
            const res = await consultasApi.getAll({ limit: 100 });
            return res.data;
        },
        enabled: !!id,
    });

    const patientConsultas = useMemo(() => {
        const list = consultasRes?.data || [];
        if (!Array.isArray(list)) return [];
        return list.filter(
            (c: Consulta) =>
                c.patient?.id === id ||
                (patient?.identificationNumber &&
                    c.patient?.identificationNumber === patient.identificationNumber)
        );
    }, [consultasRes, id, patient?.identificationNumber]);

    const familyMembersList = useMemo(() => {
        return (patient?.familyMembers || []).filter((m: any) => m && m.isActive !== false);
    }, [patient?.familyMembers]);

    // Consolidate documents from: patient profile + clinical histories + evolution notes
    const allDocuments = useMemo(() => {
        const sanitize = (docs: any[], meta?: object) =>
            (docs || [])
                .filter((d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url))
                .map((d: any) => ({ ...d, ...meta }));

        const profileDocs = sanitize(patient?.documents || []);

        const clinicalHistoriesList = (histories && histories.length > 0)
            ? histories
            : (patient?.clinicalHistories || []);

        const historyDocs = clinicalHistoriesList.flatMap((h: any) =>
            sanitize(h.documents || [], {
                clinicalHistoryId: h.id,
                clinicalHistorySpecialty: h.specialty,
                clinicalHistoryDate: h.createdAt,
            })
        );

        // Notes can be in notes array or embedded in clinicalHistories
        const notesList = (notes && notes.length > 0)
            ? notes
            : clinicalHistoriesList.flatMap((h: any) => h.notes || []);

        const noteDocs = notesList.flatMap((n: any) => {
            const h = clinicalHistoriesList.find((hist: any) => String(hist.id) === String(n.clinicalHistoryId || n.clinicalHistory?.id));
            return sanitize(n.documents || [], {
                clinicalHistoryId: n.clinicalHistoryId || n.clinicalHistory?.id || h?.id,
                clinicalHistorySpecialty: n.clinicalHistory?.specialty || h?.specialty,
                clinicalHistoryDate: n.clinicalHistory?.createdAt || h?.createdAt,
                noteId: n.id,
                noteDate: n.fecha || n.createdAt,
            });
        });

        // Deduplicate: preserve distinct origins (evolution note vs history vs profile)
        const seen = new Set<string>();
        return [...noteDocs, ...historyDocs, ...profileDocs].filter((d: any) => {
            const originKey = d.noteId
                ? `note_${d.noteId}`
                : d.clinicalHistoryId
                    ? `history_${d.clinicalHistoryId}`
                    : 'profile';
            const baseKey = d.id || d.url;
            if (!baseKey) return true;
            const key = `${baseKey}_${originKey}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [patient?.documents, patient?.clinicalHistories, histories, notes]);

    const documentsCount = allDocuments.length;

    const handlePrintSingleConsulta = async (c: Consulta) => {
        try {
            const doc = <ConsultaReportPDF consulta={c} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch {
            toast.error('Error al generar el informe en PDF');
        }
    };

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
            const doc = <PatientFullHistoryPDF patient={patient} histories={histories} templates={templatesList} />;
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
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full !h-auto sm:!h-12 p-1.5 bg-muted/50 rounded-xl gap-1.5 shadow-inner grow mb-6">
                    <TabsTrigger value="general" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                        <User className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">Información</span>
                    </TabsTrigger>
                    <TabsTrigger value="family" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs sm:text-sm font-medium">Familiares</span>
                        {familyMembersList.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 rounded-full font-bold bg-blue-500/10 text-blue-600 border-blue-500/20">
                                {familyMembersList.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="consultas" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                        <Activity className="h-4 w-4 text-rose-500" />
                        <span className="text-xs sm:text-sm font-medium">Chequeos</span>
                        {patientConsultas.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 rounded-full font-bold bg-primary/10 text-primary border-primary/20">
                                {patientConsultas.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                        <Stethoscope className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">Historias</span>
                        {histories.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 rounded-full font-bold bg-primary/10 text-primary border-primary/20">
                                {histories.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">Notas</span>
                        {notes.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 rounded-full font-bold bg-primary/10 text-primary border-primary/20">
                                {notes.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="h-12 sm:h-full gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all focus-visible:ring-0">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">Estudios</span>
                        {documentsCount > 0 && (
                            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 rounded-full font-bold bg-primary/10 text-primary border-primary/20">
                                {documentsCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Tab: General - Refactored */}
                <TabsContent value="general" className="mt-0 focus-visible:outline-none">
                    <PatientGeneralInfo patient={patient} />
                </TabsContent>

                {/* Tab: Núcleo Familiar */}
                <TabsContent value="family" className="mt-0 focus-visible:outline-none">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-muted/5 p-6 gap-4">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    Núcleo Familiar y Cargas Médicas
                                </CardTitle>
                                <CardDescription>
                                    Beneficiarios asociados a la atención y cobertura médica del trabajador.
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsLinkFamilyModalOpen(true)}
                                    className="rounded-xl px-4 shadow-2xs border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 flex-1 sm:flex-initial"
                                >
                                    <UserPlus className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    Vincular Existente
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/patients/new?titularId=${patient.id}`)}
                                    className="rounded-xl px-4 shadow-2xs w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Familiar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Si este paciente es beneficiario, mostramos la tarjeta de su titular */}
                            {patient.patientType === 'BENEFICIARIO' && patient.titular && (
                                <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 rounded-2xl border border-blue-200/70 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                                            {patient.titular.firstName?.charAt(0)}{patient.titular.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase bg-blue-600 text-white border-none">
                                                    Trabajador Titular Responsable
                                                </Badge>
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    C.I: {patient.titular.identificationNumber || 'S/D'}
                                                </span>
                                            </div>
                                            <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                                                {patient.titular.firstName} {patient.titular.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {patient.titular.gerencia || 'Gerencia no registrada'} {patient.titular.cargo ? `• ${patient.titular.cargo}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-300 text-blue-700 hover:bg-blue-100/50 dark:border-blue-800 dark:text-blue-300"
                                        onClick={() => navigate(`/patients/${patient.titular?.id}`)}
                                    >
                                        Ver Expediente del Titular
                                        <ChevronRight className="ml-1.5 h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {familyMembersList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {familyMembersList.map((member: Patient) => (
                                        <div
                                            key={member.id}
                                            className="p-5 rounded-2xl border border-border/80 bg-card hover:shadow-md transition-all space-y-4 relative group"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-2xs">
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground">
                                                            {member.firstName} {member.lastName}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300">
                                                                {member.relationship ? (RELATIONSHIP_LABELS[member.relationship as keyof typeof RELATIONSHIP_LABELS] || member.relationship) : 'Familiar'}
                                                            </Badge>
                                                            {member.patientType === 'TITULAR' && (
                                                                <Badge className="text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-600 border-none flex items-center gap-1">
                                                                    <Briefcase className="h-3 w-3" />
                                                                    Trabajador Titular
                                                                </Badge>
                                                            )}
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                {member.identificationNumber ? `C.I: ${member.identificationNumber}` : 'Sin C.I.'}
                                                            </span>
                                                        </div>
                                                        {member.gerencia && (
                                                            <p className="text-[11px] text-muted-foreground mt-1">
                                                                {formatTitleCase(member.gerencia)} {member.cargo ? `• ${formatTitleCase(member.cargo)}` : ''}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Desvincular del núcleo"
                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shrink-0"
                                                    onClick={() => setUnlinkingMember(member)}
                                                >
                                                    <Unlink className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                                                <div>
                                                    <span className="text-slate-400 text-[10px] font-bold block uppercase">Edad / Nacimiento</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {formatPatientAge(member.birthDate)} <span className="text-muted-foreground font-normal text-[11px]">({formatDateSafe(member.birthDate, 'dd/MM/yyyy')})</span>
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400 text-[10px] font-bold block uppercase">Género</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {member.gender === 'MALE' ? 'Masculino' : 'Femenino'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs font-semibold flex-1"
                                                    onClick={() => navigate(`/patients/${member.id}`)}
                                                >
                                                    Ver Expediente
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex-1"
                                                    onClick={() => navigate(`/consultas?patientId=${member.id}`)}
                                                >
                                                    <Activity className="h-3.5 w-3.5 mr-1" />
                                                    Consulta
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center flex flex-col items-center px-4">
                                    <div className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-full mb-4 text-blue-600 dark:text-blue-400">
                                        <Users className="h-10 w-10 opacity-40" />
                                    </div>
                                    <p className="text-lg font-semibold text-muted-foreground">Sin familiares registrados</p>
                                    <p className="text-sm text-muted-foreground max-w-[320px] mt-1">
                                        Registra o asocia las cargas familiares (cónyuge, hijos, padres) para vincular su cobertura médica.
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                                        <Button
                                            variant="outline"
                                            className="border-blue-500/30 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 text-xs font-semibold"
                                            onClick={() => setIsLinkFamilyModalOpen(true)}
                                        >
                                            <UserPlus className="h-4 w-4 mr-1.5 text-blue-600" />
                                            Vincular trabajador / familiar existente
                                        </Button>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                                            onClick={() => navigate(`/patients/new?titularId=${patient.id}`)}
                                        >
                                            <Plus className="h-4 w-4 mr-1.5" />
                                            Registrar nuevo familiar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Chequeos Diarios / Consultas */}
                <TabsContent value="consultas" className="mt-0 focus-visible:outline-none">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-muted/5 p-6 gap-4">
                            <div>
                                <CardTitle className="text-xl">Chequeos Diarios y Triajes</CardTitle>
                                <CardDescription>
                                    Evaluaciones clínicas rápidas, constantes biométricas y recetas emitidas.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => navigate(`/consultas?patientId=${patient.id}`)}
                                className="rounded-xl px-5 shadow-sm w-full sm:w-auto"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Chequeo
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingConsultas ? (
                                <div className="p-12 text-center flex flex-col items-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                    <p className="text-sm text-muted-foreground">Cargando chequeos del paciente...</p>
                                </div>
                            ) : patientConsultas.length > 0 ? (
                                <div className="divide-y divide-muted/50">
                                    {patientConsultas.map((item: Consulta) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-muted/20 transition-all cursor-pointer group"
                                            onClick={() => {
                                                setSelectedConsulta(item);
                                                setIsConsultaDetailOpen(true);
                                            }}
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                                                    <Activity className="h-6 w-6 sm:h-7 sm:w-7" />
                                                </div>
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors">
                                                            {item.motivoConsulta || 'Chequeo General'}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-bold uppercase tracking-wider ${TIPO_CONSULTA_COLORS[item.tipoConsulta]}`}
                                                        >
                                                            {TIPO_CONSULTA_LABELS[item.tipoConsulta] || item.tipoConsulta}
                                                        </Badge>
                                                        {item.reposoMedico && (
                                                            <Badge variant="outline" className="text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300">
                                                                <ShieldAlert className="h-3 w-3 mr-1" /> Reposo: {item.diasReposo || 1} Día(s)
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1 font-semibold text-foreground">
                                                            <Calendar className="h-3.5 w-3.5 text-primary" />
                                                            {formatDateSafe(item.fecha, 'dd MMM yyyy')} {item.hora ? `• ${item.hora}` : ''}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3.5 w-3.5" />
                                                            Dr(a). {item.doctor?.user?.name || getDoctorName(item.doctor)}
                                                        </span>
                                                    </div>

                                                    {/* Constantes vitales destacadas */}
                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        {item.presionArterial && (
                                                            <span className="inline-flex items-center text-[11px] font-mono bg-muted/60 px-2 py-0.5 rounded-md text-foreground">
                                                                PA: <b>{item.presionArterial}</b>
                                                            </span>
                                                        )}
                                                        {item.frecuenciaCardiaca && (
                                                            <span className="inline-flex items-center text-[11px] font-mono bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md">
                                                                FC: <b>{item.frecuenciaCardiaca} bpm</b>
                                                            </span>
                                                        )}
                                                        {item.temperatura && (
                                                            <span className="inline-flex items-center text-[11px] font-mono bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                                                                Temp: <b>{item.temperatura}°C</b>
                                                            </span>
                                                        )}
                                                        {item.imc && (
                                                            <span className="inline-flex items-center text-[11px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
                                                                IMC: <b>{item.imc}</b>
                                                            </span>
                                                        )}
                                                        {item.diagnostico && (
                                                            <span className="inline-flex items-center text-[11px] italic text-muted-foreground truncate max-w-xs">
                                                                Dx: {item.diagnostico}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-center">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePrintSingleConsulta(item);
                                                    }}
                                                    title="Imprimir informe en PDF"
                                                >
                                                    <Printer className="h-4 w-4 mr-1" />
                                                    PDF
                                                </Button>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center px-4">
                                    <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-full mb-4 text-rose-500">
                                        <Activity className="h-10 w-10 opacity-40" />
                                    </div>
                                    <p className="text-lg font-semibold text-muted-foreground">Sin chequeos registrados</p>
                                    <p className="text-sm text-muted-foreground max-w-[280px] mt-1">
                                        Este paciente aún no tiene chequeos diarios o triajes registrados.
                                    </p>
                                    <Button
                                        variant="link"
                                        className="mt-4 text-primary"
                                        onClick={() => navigate(`/consultas?patientId=${patient.id}`)}
                                    >
                                        Registrar primer chequeo diario
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                                <CardTitle className="text-xl flex items-center gap-2">
                                    Notas de Evolución
                                    {notes.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 font-bold text-xs bg-primary/10 text-primary border-primary/20">
                                            {notes.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>Seguimiento diario y estado subjetivo del paciente.</CardDescription>
                            </div>
                            {user && (user.organizationRole === OrganizationRole.DOCTOR || user.organizationRole === OrganizationRole.NURSE || user.organizationRole === OrganizationRole.MEDICAL_DIRECTOR || user.systemRole === SystemRole.SUPERADMIN) && (
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/clinical-history-note/new?historyId=${histories[0].id}`)}
                                    className="rounded-xl px-5 shadow-sm w-full sm:w-auto"
                                    disabled={histories.length === 0}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Nota
                                </Button>
                            )}
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
                                                {/* Header: título + fecha */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10 gap-2 sm:gap-0">
                                                    <p className="text-sm font-bold text-primary">Nota de Evolución</p>
                                                    <span className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm self-start sm:self-auto">
                                                        {formatDateSafe(note.fecha || note.createdAt, 'dd MMM yyyy')}
                                                    </span>
                                                </div>

                                                {/* Estado subjetivo */}
                                                <div className="text-sm text-card-foreground leading-relaxed italic relative z-10 border-l-2 border-primary/30 pl-3">
                                                    "{note.estadoSubjetivo}"
                                                </div>

                                                {/* Diagnóstico y tratamiento */}
                                                {(note.diagnostico || note.tratamientoActual) && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative z-10">
                                                        {note.diagnostico && (
                                                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5">
                                                                <p className="text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Diagnóstico</p>
                                                                <p className="text-xs text-foreground font-medium leading-snug">{note.diagnostico}</p>
                                                            </div>
                                                        )}
                                                        {note.tratamientoActual && (
                                                            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5">
                                                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Tratamiento</p>
                                                                <p className="text-xs text-foreground font-medium leading-snug">{note.tratamientoActual}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Footer: médico + botón de detalle */}
                                                <div className="flex items-center justify-between pt-2 border-t border-muted-foreground/5 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback className="text-[10px] bg-primary text-white">DR</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            Dr. {note.doctor?.user?.name || note.clinicalHistory?.doctor?.user?.name || 'Médico Responsable'}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-primary hover:bg-primary/5 h-7 px-2 gap-1"
                                                        onClick={() => navigate(`/clinical-history-note/${note.id}`)}
                                                    >
                                                        Ver detalle
                                                        <ChevronRight className="h-3 w-3" />
                                                    </Button>
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

                {/* Tab: Documents & Studies */}
                <TabsContent value="documents" className="mt-0 focus-visible:outline-none">
                    <PatientDocumentsTab patient={patient} allDocuments={allDocuments} />
                </TabsContent>
            </Tabs>

            {/* Modal de Detalle de Chequeo / Consulta */}
            <ConsultasDetail
                consulta={selectedConsulta}
                isOpen={isConsultaDetailOpen}
                onClose={() => {
                    setIsConsultaDetailOpen(false);
                    setSelectedConsulta(null);
                }}
                onEdit={() => {
                    setIsConsultaDetailOpen(false);
                    navigate(`/consultas?patientId=${patient.id}`);
                }}
                onPrint={handlePrintSingleConsulta}
            />

            {/* Modal para Vincular Familiar / Trabajador Existente */}
            {patient && (
                <LinkFamilyMemberModal
                    isOpen={isLinkFamilyModalOpen}
                    onClose={() => setIsLinkFamilyModalOpen(false)}
                    titular={patient}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['patient', id] });
                        queryClient.invalidateQueries({ queryKey: ['patients'] });
                    }}
                />
            )}

            {/* Diálogo de Confirmación para Desvincular Familiar */}
            <AlertDialog
                open={!!unlinkingMember}
                onOpenChange={(open) => !open && setUnlinkingMember(null)}
            >
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold">
                            ¿Desvincular del núcleo familiar?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                            Se removerá a <b>{unlinkingMember?.firstName} {unlinkingMember?.lastName}</b> de la carga familiar de <b>{patient?.firstName} {patient?.lastName}</b>.
                            <br /><br />
                            {unlinkingMember?.patientType === 'TITULAR'
                                ? 'Nota: El trabajador mantendrá su propio expediente médico, nómina y cargo intactos como titular.'
                                : 'Nota: Su expediente clínico y consultas previas se mantendrán guardados en el sistema.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel
                            disabled={isUnlinking}
                            className="rounded-xl text-xs"
                        >
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isUnlinking}
                            onClick={handleUnlink}
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                        >
                            {isUnlinking ? 'Desvinculando...' : 'Sí, desvincular'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
