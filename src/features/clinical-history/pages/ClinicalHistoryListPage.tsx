import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, FileDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        queryKey: ['clinical-histories'],
        queryFn: () => clinicalHistoryApi.getAll(),
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const doctors = useMemo(() => doctorsRes?.data?.data || [], [doctorsRes]);

    const processedData = useMemo(() => {
        const rawData = response?.data?.data || [];
        if (!Array.isArray(rawData)) return [];

        return rawData.map((h: any) => {
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
    }, [response, doctors]);

    const filteredData = useMemo(() => {
        if (!search) return processedData;
        const lowSearch = search.toLowerCase();
        return processedData.filter(item =>
            item.patient?.firstName?.toLowerCase().includes(lowSearch) ||
            item.patient?.lastName?.toLowerCase().includes(lowSearch) ||
            item.specialty?.toLowerCase().includes(lowSearch) ||
            (item.doctor?.user?.name || '').toLowerCase().includes(lowSearch)
        );
    }, [processedData, search]);

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

            <Card>
                <CardHeader>
                    <CardTitle>Historiales del Centro</CardTitle>
                    <CardDescription>
                        Búsqueda rápida y filtros por especialidad o paciente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por paciente, especialidad..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={filteredData}
                        isLoading={isLoadingHistories || isLoadingDoctors}
                    />
                </CardContent>
            </Card>

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
