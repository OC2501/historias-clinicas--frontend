import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, FileDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/tables/DataTable';
import { getClinicalHistoryColumns } from '@/features/clinical-history/components/ClinicalHistoryColumns';
import { clinicalHistoryApi, doctorsApi } from '@/api';

export function ClinicalHistoryListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const columns = getClinicalHistoryColumns(navigate);

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
                    <Button variant="outline" className="w-full sm:w-auto">
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
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
        </div>
    );
}
