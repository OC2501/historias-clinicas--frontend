import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/tables/DataTable';
import { getClinicalHistoryNoteColumns } from '@/features/clinical-history/components/ClinicalHistoryNoteColumns';
import { getClinicalHistoryColumns } from '@/features/clinical-history/components/ClinicalHistoryColumns';
import { ClinicalHistoryNotePrintModal } from './ClinicalHistoryNotePrintModal';
import { clinicalHistoryNoteApi, doctorsApi, clinicalHistoryApi } from '@/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ClinicalHistoryNoteListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);

    // Pagination for main notes table
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const handlePrintRequest = (note: any) => {
        setSelectedNote(note);
        setIsPrintModalOpen(true);
    };

    const columns = getClinicalHistoryNoteColumns(navigate, handlePrintRequest);

    const { data: response, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['clinical-history-notes', page, limit],
        queryFn: async () => {
            const res = await clinicalHistoryNoteApi.getAll({
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

        // 2. Local Filtering
        if (!search) return mapped;
        const lowerSearch = search.toLowerCase();
        return mapped.filter((note: any) => {
            const subjetivo = (note.subjetivo || '').toLowerCase();
            const doctorName = (note.doctor?.user?.name || '').toLowerCase();
            return subjetivo.includes(lowerSearch) || doctorName.includes(lowerSearch);
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

    const filteredData = processedData;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notas de Evolución</h1>
                    <p className="text-muted-foreground">
                        Examine los seguimientos realizados a los pacientes.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="w-full sm:w-auto bg-primary text-primary-foreground" onClick={() => setIsSelectModalOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Nueva Nota
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en estado subjetivo, médico..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
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
                <DialogContent className="sm:max-w-[800px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Seleccionar Historia Clínica</DialogTitle>
                        <DialogDescription className="text-sm">
                            Elija la historia clínica a la que desea agregar una nueva nota.
                        </DialogDescription>
                    </DialogHeader>
                    <HistorySelectionTable onSelect={(id) => {
                        setIsSelectModalOpen(false);
                        navigate(`/clinical-history/notes/new?historyId=${id}`);
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

    const { data: response, isLoading } = useQuery({
        queryKey: ['clinical-histories', page, limit],
        queryFn: async () => {
            const res = await clinicalHistoryApi.getAll({ page, limit });
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

    const columns = getClinicalHistoryColumns(
        // navigate is not needed inside the table, provide dummy
        () => { },
        undefined,
        undefined
    ).map(col => {
        // Replace the default actions column with a simple select button
        if (col.header === 'Acciones') {
            return {
                ...col,
                accessorKey: (history: any) => (
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(history.id); }}>
                        Seleccionar
                    </Button>
                ),
            };
        }
        return col;
    });

    return (
        <DataTable
            columns={columns}
            data={histories}
            isLoading={isLoading}
            pagination={{
                currentPage: page,
                totalPages: resilientMeta?.lastPage || 1,
                pageSize: limit,
                totalItems: resilientMeta?.total || 0,
                onPageChange: setPage,
                onPageSizeChange: setLimit
            }}
        />
    );
}
