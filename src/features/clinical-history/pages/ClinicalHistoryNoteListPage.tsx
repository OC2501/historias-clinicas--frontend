import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileDown, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

    const handlePrintRequest = (note: any) => {
        setSelectedNote(note);
        setIsPrintModalOpen(true);
    };

    const columns = getClinicalHistoryNoteColumns(navigate, handlePrintRequest);

    const { data: response, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['clinical-history-notes'],
        queryFn: () => clinicalHistoryNoteApi.getAll({
            limit: 500
        }),
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const doctors = useMemo(() => doctorsRes?.data?.data || [], [doctorsRes]);

    const processedData = useMemo(() => {
        const rawData = response?.data?.data || [];
        if (!Array.isArray(rawData)) return [];

        return rawData.map((note: any) => {
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
    }, [response, doctors]);

    const filteredData = useMemo(() => {
        if (!search) return processedData;
        const lowSearch = search.toLowerCase();
        return processedData.filter(item =>
            item.estadoSubjetivo?.toLowerCase().includes(lowSearch) ||
            (item.doctor?.user?.name || '').toLowerCase().includes(lowSearch)
        );
    }, [processedData, search]);

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

            <Card>
                <CardHeader>
                    <CardTitle>Todas las Notas</CardTitle>
                    <CardDescription>
                        Búsqueda de detalles en las notas de evolución.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    />
                </CardContent>
            </Card>

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
    const { data: response, isLoading } = useQuery({
        queryKey: ['clinical-histories'],
        queryFn: () => clinicalHistoryApi.getAll({ limit: 500 }),
    });

    const histories = useMemo(() => response?.data?.data || [], [response]);

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
        />
    );
}
