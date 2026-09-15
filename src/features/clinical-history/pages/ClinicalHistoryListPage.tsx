import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Download, Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SystemRole, OrganizationRole } from '@/types/enums';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/tables/DataTable';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getClinicalHistoryColumns } from '@/features/clinical-history/components/ClinicalHistoryColumns';
import { ClinicalHistoryPrintModal } from './ClinicalHistoryPrintModal';
import { clinicalHistoryApi, doctorsApi, patientsApi } from '@/api';
import { useClinicalHistory } from '../hooks/useClinicalHistory';
import { pdf } from '@react-pdf/renderer';
import { ClinicalHistoryReportPDF } from '../pdf/ClinicalHistoryReportPDF';
import { exportClinicalHistoriesToExcel } from '../reports/ClinicalHistoryExcel';
import { format } from 'date-fns';
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

export function ClinicalHistoryListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [gender, setGender] = useState('');
    const [gerencia, setGerencia] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [historyToDelete, setHistoryToDelete] = useState<any>(null);

    const formatTitleCase = (str: string | null | undefined) => {
        if (!str) return '—';
        return str
            .toLowerCase()
            .split(' ')
            .map((word, idx) => {
                const prepositions = ['de', 'la', 'las', 'el', 'los', 'y', 'del', 'o', 'a', 'en'];
                if (prepositions.includes(word) && idx !== 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    const { deleteHistory, isDeleting } = useClinicalHistory();

    const handlePrintRequest = (history: any) => {
        setSelectedHistory(history);
        setIsPrintModalOpen(true);
    };

    const handleDeleteRequest = (history: any) => {
        setHistoryToDelete(history);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (historyToDelete) {
            await deleteHistory(historyToDelete.id);
            setIsDeleteDialogOpen(false);
            setHistoryToDelete(null);
        }
    };

    const columns = getClinicalHistoryColumns(navigate, handlePrintRequest, handleDeleteRequest);

    const { data: response, isLoading: isLoadingHistories } = useQuery({
        queryKey: ['clinical-histories', page, limit, search, gender, gerencia],
        queryFn: async () => {
            const res = await clinicalHistoryApi.getAll({
                page,
                limit,
                search: search || undefined,
                gender: gender || undefined,
                gerencia: gerencia || undefined
            });
            return res.data;
        },
    });

    const { data: gerenciasRes } = useQuery({
        queryKey: ['unique-gerencias'],
        queryFn: () => patientsApi.getUniqueGerencias()
    });
    const gerencias = gerenciasRes?.data || [];

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await doctorsApi.getAll();
            return res.data;
        },
    });

    const doctors = useMemo(() => {
        if (Array.isArray(doctorsRes)) return doctorsRes;
        if (Array.isArray((doctorsRes as any)?.data)) return (doctorsRes as any).data;
        if (Array.isArray((doctorsRes as any)?.data?.data)) return (doctorsRes as any).data.data;
        return [];
    }, [doctorsRes]);

    const processedData = useMemo(() => {
        const rawData = response?.data || [];
        if (!Array.isArray(rawData)) return [];

        // 1. Cross-reference doctor data
        const mapped = rawData.map((h: any) => {
            if (!h.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === h.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...h,
                        doctor: {
                            ...h.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return h;
        });

        return mapped;
    }, [response, doctors]);

    const resilientMeta = useMemo(() => {
        if (response?.meta) return response.meta;
        return {
            page: page,
            lastPage: (response as any)?.lastPage || Math.ceil((processedData?.length || 0) / limit) || 1,
            total: (response as any)?.total || processedData?.length || 0,
            limit: limit
        };
    }, [response, page, limit, processedData]);

    const getFilteredAllHistories = async () => {
        const res = await clinicalHistoryApi.getAll({
            page: 1,
            limit: 10000,
            search: search || undefined,
            gender: gender || undefined,
            gerencia: gerencia || undefined
        });
        const rawData = res.data?.data || [];
        if (!Array.isArray(rawData)) return [];

        // Mapear médicos igual que en processedData
        const mapped = rawData.map((h: any) => {
            if (!h.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === h.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...h,
                        doctor: {
                            ...h.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return h;
        });

        return mapped;
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const filtered = await getFilteredAllHistories();
            const blob = await pdf(
                <ClinicalHistoryReportPDF histories={filtered} />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Historias_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportExcel = async () => {
        setIsExportingExcel(true);
        try {
            const filtered = await getFilteredAllHistories();
            await exportClinicalHistoriesToExcel(filtered, 'Reporte_Historias');
        } catch (error) {
            console.error('Error generating Excel:', error);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <FileText className="w-8 h-8 text-primary" />
                        Historias Clínicas
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestione el registro médico histórico de sus pacientes.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        disabled={isExportingExcel || isLoadingHistories || processedData.length === 0}
                        className="w-full sm:w-auto text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                    >
                        {isExportingExcel ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                        )}
                        {isExportingExcel ? 'Exportando...' : 'Exportar Excel'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleExportPDF}
                        disabled={isExporting || isLoadingHistories || processedData.length === 0}
                        className="w-full sm:w-auto mr-0 sm:mr-2"
                    >
                        {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? 'Exportando...' : 'Exportar PDF'}
                    </Button>
                    {user && (user.organizationRole === OrganizationRole.DOCTOR || user.organizationRole === OrganizationRole.NURSE || user.organizationRole === OrganizationRole.MEDICAL_DIRECTOR || user.systemRole === SystemRole.SUPERADMIN) && (
                        <Button onClick={() => navigate('/clinical-history/new')} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Historia
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 md:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por paciente, especialidad..."
                        className="pl-8 h-10 shadow-sm bg-background"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Select value={gender || "ALL"} onValueChange={(val) => setGender(val === "ALL" ? "" : val)}>
                        <SelectTrigger className="w-full sm:w-[180px] h-10 shadow-sm bg-background">
                            <SelectValue placeholder="Todos los géneros" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los géneros</SelectItem>
                            <SelectItem value="MALE">Masculino</SelectItem>
                            <SelectItem value="FEMALE">Femenino</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={gerencia || "ALL"} onValueChange={(val) => setGerencia(val === "ALL" ? "" : val)}>
                        <SelectTrigger className="w-full sm:w-[280px] h-10 shadow-sm bg-background truncate">
                            <SelectValue placeholder="Todas las gerencias" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="ALL">Todas las gerencias</SelectItem>
                            {gerencias.map((g: string) => (
                                <SelectItem key={g} value={g} title={g}>{formatTitleCase(g)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(gender || gerencia) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setGender('');
                                setGerencia('');
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground h-10 px-3"
                        >
                            Limpiar
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={processedData}
                isLoading={isLoadingHistories || isLoadingDoctors}
                pagination={{
                    currentPage: page,
                    totalPages: resilientMeta?.lastPage || 1,
                    pageSize: limit,
                    totalItems: resilientMeta?.total || 0,
                    onPageChange: setPage,
                    onPageSizeChange: setLimit
                }}
            />

            <ClinicalHistoryPrintModal
                isOpen={isPrintModalOpen}
                onOpenChange={setIsPrintModalOpen}
                history={selectedHistory}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la
                            historia clínica del servidor.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
