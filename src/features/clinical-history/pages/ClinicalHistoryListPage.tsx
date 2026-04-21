import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/tables/DataTable';
import { getClinicalHistoryColumns } from '@/features/clinical-history/components/ClinicalHistoryColumns';
import { ClinicalHistoryPrintModal } from './ClinicalHistoryPrintModal';
import { clinicalHistoryApi, doctorsApi } from '@/api';
import { useClinicalHistory } from '../hooks/useClinicalHistory';
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
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selectedHistory, setSelectedHistory] = useState<any>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [historyToDelete, setHistoryToDelete] = useState<any>(null);

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
        queryKey: ['clinical-histories', page, limit],
        queryFn: async () => {
            const res = await clinicalHistoryApi.getAll({
                page,
                limit
            });
            return res.data;
        },
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await doctorsApi.getAll();
            return res.data;
        },
    });

    const doctors = useMemo(() => doctorsRes?.data || [], [doctorsRes]);

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

        // 2. Local Filtering
        if (!search) return mapped;
        const lowerSearch = search.toLowerCase();
        return mapped.filter((h: any) => {
            const patientName = `${h.patient?.firstName || ''} ${h.patient?.lastName || ''}`.toLowerCase();
            const documentId = (h.patient?.documentId || '').toLowerCase();
            const specialty = (h.especialidad || '').toLowerCase();
            const doctorName = (h.doctor?.user?.name || '').toLowerCase();

            return patientName.includes(lowerSearch) ||
                documentId.includes(lowerSearch) ||
                specialty.includes(lowerSearch) ||
                doctorName.includes(lowerSearch);
        });
    }, [response, doctors, search]);

    const resilientMeta = useMemo(() => {
        if (response?.meta) return response.meta;
        return {
            page: page,
            lastPage: (response as any)?.lastPage || Math.ceil((processedData?.length || 0) / limit) || 1,
            total: (response as any)?.total || processedData?.length || 0,
            limit: limit
        };
    }, [response, page, limit, processedData]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Historias Clínicas</h1>
                    <p className="text-muted-foreground">
                        Gestione el registro médico histórico de sus pacientes.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => navigate('/clinical-history/new')} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Historia
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por paciente, especialidad..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
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
