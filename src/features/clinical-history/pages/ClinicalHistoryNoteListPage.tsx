import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, FileDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/tables/DataTable';
import { getClinicalHistoryNoteColumns } from '@/features/clinical-history/components/ClinicalHistoryNoteColumns';
import { clinicalHistoryNoteApi, doctorsApi } from '@/api';

export function ClinicalHistoryNoteListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const columns = getClinicalHistoryNoteColumns(navigate);

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
                    <Button variant="outline" className="w-full sm:w-auto">
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
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
        </div>
    );
}
