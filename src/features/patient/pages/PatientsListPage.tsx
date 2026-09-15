import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Download, Loader2, FileSpreadsheet, Users, UserCheck, List, HeartHandshake } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PatientColumns } from '@/features/patient/components/PatientColumns';
import { BeneficiaryColumns } from '@/features/patient/components/BeneficiaryColumns';
import { usePatients } from '@/features/patient/hooks/usePatients';
import type { Patient } from '@/types';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import { pdf } from '@react-pdf/renderer';
import { PatientsReportPdf } from '../pdf/PatientsReportPdf';
import { BeneficiariosReportsPdf } from '../pdf/BeneficiariosReportsPDF';
import { format } from 'date-fns';
import { patientsApi } from '@/api';
import { exportPatientsToExcel } from '../reports/PatientsReportExcel';
import { exportBeneficiariosToExcel } from '../reports/BeneficiariosReportsExcel';

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

export function PatientsListPage() {
    const navigate = useNavigate();
    const [isExporting, setIsExporting] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [activeTab, setActiveTab] = useState<'TITULAR' | 'BENEFICIARIO' | 'ALL'>('TITULAR');

    const {
        patients,
        meta,
        isLoading,
        searchValue,
        setSearchValue,
        gender,
        setGender,
        gerencia,
        setGerencia,
        patientType,
        setPatientType,
        relationship,
        setRelationship,
        gerencias,
        page,
        setPage,
        limit,
        setLimit
    } = usePatients('TITULAR');

    const handleTabChange = (val: string) => {
        const tab = val as 'TITULAR' | 'BENEFICIARIO' | 'ALL';
        setActiveTab(tab);
        setPatientType(tab === 'ALL' ? '' : tab);
        if (tab !== 'BENEFICIARIO') {
            setRelationship('');
        }
    };

    const handleRowClick = (patient: Patient) => {
        navigate(`/patients/${patient.id}`);
    };

    const getFilteredPatients = async () => {
        const response = await patientsApi.getAll({
            page: 1,
            limit: 10000,
            search: searchValue || undefined,
            gender: gender || undefined,
            gerencia: gerencia || undefined,
            patientType: activeTab === 'ALL' ? undefined : activeTab,
            relationship: relationship || undefined,
        } as any);
        return response.data?.data || [];
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const filteredAllPatients = await getFilteredPatients();
            const documentComponent = activeTab === 'BENEFICIARIO'
                ? <BeneficiariosReportsPdf patients={filteredAllPatients} />
                : <PatientsReportPdf patients={filteredAllPatients} />;

            const blob = await pdf(documentComponent).toBlob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const prefix = activeTab === 'BENEFICIARIO' ? 'Reporte_Beneficiarios' : `Reporte_Pacientes_${activeTab}`;
            a.download = `${prefix}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
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
            if (activeTab === 'BENEFICIARIO') {
                const filteredAllPatients = await getFilteredPatients();
                await exportBeneficiariosToExcel(filteredAllPatients, 'Reporte_Beneficiarios_Hidroven');
            } else {
                const response = await patientsApi.getAll({
                    page: 1,
                    limit: 10000,
                    search: searchValue || undefined,
                    gender: gender || undefined,
                    gerencia: gerencia || undefined,
                    relationship: relationship || undefined,
                } as any);
                const allPatients = response.data?.data || [];
                await exportPatientsToExcel(allPatients, `Reporte_Pacientes_${activeTab}`);
            }
        } catch (error) {
            console.error('Error generating Excel:', error);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const currentColumns = activeTab === 'BENEFICIARIO' ? BeneficiaryColumns : PatientColumns;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <Users className="w-8 h-8 text-primary" />
                        Pacientes y Cargas Médicas
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Gestiona el registro de trabajadores titulares y beneficiarios con acceso a sus expedientes clínicos.
                    </p>
                </div>

                {/* Acciones: en móvil se distribuyen limpiamente */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <Button onClick={() => navigate('/patients/new')} className="w-full sm:w-auto shadow-sm order-first sm:order-last font-semibold">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Paciente
                    </Button>

                    <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            disabled={isExportingExcel || isLoading || !patients || patients.length === 0}
                            className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 font-medium"
                        >
                            {isExportingExcel ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {isExportingExcel ? 'Exportando...' : 'Excel'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPDF}
                            disabled={isExporting || isLoading || !patients || patients.length === 0}
                            className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm font-medium"
                        >
                            {isExporting ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {isExporting ? 'Exportando...' : 'PDF'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Pestañas de Navegación Adaptadas (Sin Scroll) */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid grid-cols-3 w-full h-11 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-800">
                    <TabsTrigger 
                        value="TITULAR" 
                        className="h-full flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer"
                    >
                        <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                        <span className="truncate">
                            <span className="hidden sm:inline">Trabajadores </span>Titulares
                        </span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="BENEFICIARIO" 
                        className="h-full flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer"
                    >
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
                        <span className="truncate">
                            Beneficiarios<span className="hidden sm:inline"> / Familiares</span>
                        </span>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="ALL" 
                        className="h-full flex items-center justify-center gap-1.5 sm:gap-2 px-1.5 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-xs dark:data-[state=active]:shadow-sm dark:data-[state=active]:border dark:data-[state=active]:border-slate-700/60 cursor-pointer"
                    >
                        <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">
                            <span className="hidden sm:inline">Todos los </span>Pacientes
                        </span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Barra de Búsqueda y Filtros */}
            <div className="flex flex-col md:flex-row md:items-center gap-2.5 sm:gap-3">
                <div className="relative flex-1 md:max-w-xs w-full">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={activeTab === 'BENEFICIARIO' ? "Buscar beneficiario o titular..." : "Buscar por nombre o documento..."}
                        className="pl-10 h-10 bg-background shadow-xs w-full"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
                    {activeTab === 'BENEFICIARIO' && (
                        <Select value={relationship || "ALL"} onValueChange={(val) => setRelationship(val === "ALL" ? "" : val)}>
                            <SelectTrigger className="w-full sm:w-[215px] h-10 shadow-xs bg-background">
                                <SelectValue placeholder="Todos los parentescos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los parentescos</SelectItem>
                                <SelectItem value="CONYUGE">Cónyuge / Pareja</SelectItem>
                                <SelectItem value="HIJO">Hijo / Hija</SelectItem>
                                <SelectItem value="PADRE">Padre</SelectItem>
                                <SelectItem value="MADRE">Madre</SelectItem>
                                <SelectItem value="OTRO">Otro Familiar</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    <Select value={gender || "ALL"} onValueChange={(val) => setGender(val === "ALL" ? "" : val)}>
                        <SelectTrigger className="w-full sm:w-[190px] h-10 shadow-xs bg-background">
                            <SelectValue placeholder="Todos los géneros" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos los géneros</SelectItem>
                            <SelectItem value="MALE">Masculino</SelectItem>
                            <SelectItem value="FEMALE">Femenino</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={gerencia || "ALL"} onValueChange={(val) => setGerencia(val === "ALL" ? "" : val)}>
                        <SelectTrigger className="w-full sm:w-[260px] h-10 shadow-xs bg-background truncate">
                            <SelectValue placeholder="Todas las gerencias" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <SelectItem value="ALL">Todas las gerencias</SelectItem>
                            {gerencias.map((g: string) => (
                                <SelectItem key={g} value={g} title={g}>{formatTitleCase(g)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(gender || gerencia || relationship || searchValue) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchValue('');
                                setGender('');
                                setGerencia('');
                                setRelationship('');
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground h-10 px-3.5 self-start sm:self-auto"
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabla Principal Dinámica */}
            <DataTable
                columns={currentColumns}
                data={patients}
                isLoading={isLoading}
                onRowClick={handleRowClick}
                pagination={meta ? {
                    currentPage: page,
                    totalPages: meta.lastPage,
                    pageSize: limit,
                    totalItems: meta.total,
                    onPageChange: setPage,
                    onPageSizeChange: setLimit
                } : undefined}
            />
        </div>
    );
}

