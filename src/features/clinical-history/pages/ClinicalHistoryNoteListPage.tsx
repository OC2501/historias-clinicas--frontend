import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileText, Download, Loader2, FileSpreadsheet, Filter, Activity } from 'lucide-react';
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
import { getClinicalHistoryNoteColumns } from '@/features/clinical-history/components/ClinicalHistoryNoteColumns';
import { getClinicalHistoryColumns } from '@/features/clinical-history/components/ClinicalHistoryColumns';
import { ClinicalHistoryNotePrintModal } from './ClinicalHistoryNotePrintModal';
import { doctorsApi, clinicalHistoryApi, clinicalHistoryNoteApi, patientsApi } from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useClinicalHistoryNotes } from '../hooks/useClinicalHistoryNotes';
import { pdf } from '@react-pdf/renderer';
import { ClinicalHistoryNoteReportPDF } from '../pdf/ClinicalHistoryNoteReportPDF';
import { exportClinicalHistoryNotesToExcel } from '../reports/ClinicalHistoryNoteExcel';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import type { Column } from '@/types/table';
import type { ClinicalHistory } from '@/types';
import { safeFormat } from '@/lib/utils';

export function ClinicalHistoryNoteListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [gender, setGender] = useState('');
    const [gerencia, setGerencia] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

    // Pagination for main notes table
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

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

    const handlePrintRequest = (note: any) => {
        setSelectedNote(note);
        setIsPrintModalOpen(true);
    };

    const columns = getClinicalHistoryNoteColumns(navigate, handlePrintRequest);

    const { data: response, isLoading: isLoadingNotes } = useClinicalHistoryNotes(page, limit, search, gender, gerencia);

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
        const mapped = rawData.map((note: any) => {
            if (!note.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === note.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...note,
                        doctor: {
                            ...note.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return note;
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

    const getFilteredAllNotes = async () => {
        const res = await clinicalHistoryNoteApi.getAll({ 
            page: 1, 
            limit: 10000,
            search: search || undefined,
            gender: gender || undefined,
            gerencia: gerencia || undefined
        } as any);
        const rawData = res.data?.data || [];
        if (!Array.isArray(rawData)) return [];

        // Mapear médicos igual que en processedData
        const mapped = rawData.map((note: any) => {
            if (!note.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === note.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...note,
                        doctor: {
                            ...note.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return note;
        });

        return mapped;
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const filtered = await getFilteredAllNotes();
            const blob = await pdf(
                <ClinicalHistoryNoteReportPDF notes={filtered} />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Notas_Evolucion_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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
            const filtered = await getFilteredAllNotes();
            await exportClinicalHistoryNotesToExcel(filtered, 'Reporte_Notas_Evolucion');
        } catch (error) {
            console.error('Error generating Excel:', error);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const filteredData = processedData;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Activity className="w-8 h-8 text-primary" />
                        Notas de Evolución
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Examine los seguimientos realizados a los pacientes.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={handleExportExcel} 
                        disabled={isExportingExcel || isLoadingNotes || filteredData.length === 0}
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
                        disabled={isExporting || isLoadingNotes || filteredData.length === 0}
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
                        <Button className="w-full sm:w-auto bg-primary text-primary-foreground" onClick={() => setIsSelectModalOpen(true)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Nueva Nota
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative flex-1 md:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en estado subjetivo, médico..."
                        className="pl-8 h-10 shadow-sm bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                data={filteredData}
                isLoading={isLoadingNotes || isLoadingDoctors}
                pagination={{
                    currentPage: page,
                    totalPages: resilientMeta?.lastPage || 1,
                    pageSize: limit,
                    totalItems: resilientMeta?.total || 0,
                    onPageChange: setPage,
                    onPageSizeChange: setLimit
                }}
            />

            <ClinicalHistoryNotePrintModal
                isOpen={isPrintModalOpen}
                onOpenChange={setIsPrintModalOpen}
                note={selectedNote}
            />
            {/* Selection Modal for Clinical Histories */}
            <Dialog open={isSelectModalOpen} onOpenChange={setIsSelectModalOpen}>
                <DialogContent className="!max-w-none w-[96vw] sm:w-[92vw] md:max-w-4xl lg:max-w-5xl max-h-[88vh] flex flex-col p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800">
                    <DialogHeader className="pb-2 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Seleccionar Historia Clínica
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Elija la historia clínica a la que desea agregar una nueva nota de evolución.
                        </DialogDescription>
                    </DialogHeader>
                    <HistorySelectionTable onSelect={(id) => {
                        setIsSelectModalOpen(false);
                        navigate(`/clinical-history-note/new?historyId=${id}`);
                    }} />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper component for selecting a clinical history
function HistorySelectionTable({ onSelect }: { onSelect: (id: string) => void }) {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search.trim(), 300);

    const { data: response, isLoading } = useQuery({
        queryKey: ['clinical-histories-selection', page, limit, debouncedSearch],
        queryFn: async () => {
            const res = await clinicalHistoryApi.getAll({ 
                page, 
                limit, 
                search: debouncedSearch || undefined 
            });
            return res.data;
        },
    });

    const histories = useMemo(() => response?.data || [], [response]);
    const resilientMeta = useMemo(() => {
        if (response?.meta) return response.meta;
        return {
            page: page,
            lastPage: (response as any)?.lastPage || Math.ceil((histories?.length || 0) / limit) || 1,
            total: (response as any)?.total || histories?.length || 0,
            limit: limit
        };
    }, [response, page, limit, histories]);

    const columns: Column<ClinicalHistory>[] = useMemo(() => [
        {
            header: 'Fecha',
            className: 'w-[100px] whitespace-nowrap',
            accessorKey: (history: any) => safeFormat(history?.fecha, 'dd/MM/yyyy', 'S/F'),
        },
        {
            header: 'Paciente',
            className: 'max-w-[260px]',
            accessorKey: (history: any) => (
                <div className="flex flex-col min-w-0 max-w-[260px]">
                    <span className="font-bold text-foreground truncate" title={`${history?.patient?.firstName || ''} ${history?.patient?.lastName || ''}`}>
                        {history?.patient?.firstName || '—'} {history?.patient?.lastName || ''}
                    </span>
                    <span 
                        className="text-xs text-muted-foreground truncate" 
                        title={history?.patient?.gerencia ? `C.I: ${history?.patient?.identificationNumber || 'Sin Cédula'} • ${history.patient.gerencia}` : undefined}
                    >
                        {history?.patient?.identificationNumber
                            ? `C.I: ${history.patient.identificationNumber}`
                            : 'Sin Cédula'}
                        {history?.patient?.gerencia && ` • ${history.patient.gerencia}`}
                    </span>
                </div>
            ),
        },
        {
            header: 'Especialidad',
            className: 'w-[130px] whitespace-nowrap',
            accessorKey: (history: any) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize truncate max-w-[120px]">
                    {history?.specialty?.toLowerCase() || 'General'}
                </span>
            ),
        },
        {
            header: 'Médico',
            className: 'max-w-[190px]',
            accessorKey: (history: any) => {
                const docName = history?.doctor?.user?.name 
                    ? `Dr(a). ${history.doctor.user.name}` 
                    : (history?.doctor?.id ? `Dr. (${history.doctor.id.substring(0, 8)})` : 'Médico no asignado');
                return (
                    <span className="truncate block max-w-[190px]" title={docName}>
                        {docName}
                    </span>
                );
            },
        },
        {
            header: 'Acción',
            className: 'w-[110px] text-right whitespace-nowrap',
            accessorKey: (history: any) => (
                <Button 
                    size="sm" 
                    className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold h-8 px-3 shadow-xs shrink-0"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onSelect(history.id); 
                    }}
                >
                    Seleccionar
                </Button>
            ),
        },
    ], [onSelect]);

    return (
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar historia clínica por paciente, cédula o médico..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="pl-9 h-10 bg-background text-sm"
                />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                <DataTable
                    columns={columns}
                    data={histories}
                    isLoading={isLoading}
                    className="[&_[data-slot=table-container]]:overflow-x-hidden"
                    pagination={{
                        currentPage: page,
                        totalPages: resilientMeta?.lastPage || 1,
                        pageSize: limit,
                        totalItems: resilientMeta?.total || 0,
                        onPageChange: setPage,
                        onPageSizeChange: (newLimit) => {
                            setLimit(newLimit);
                            setPage(1);
                        },
                        pageSizeOptions: [1, 2, 5, 10, 20]
                    }}
                />
            </div>
        </div>
    );
}
