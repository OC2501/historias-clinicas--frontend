import { useNavigate } from 'react-router';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/tables/DataTable';
import { PatientColumns } from '@/features/patient/components/PatientColumns';
import { usePatients } from '@/features/patient/hooks/usePatients';
import type { Patient } from '@/types';

export function PatientsListPage() {
    const navigate = useNavigate();
    const { 
        patients, 
        meta, 
        isLoading, 
        searchValue, 
        setSearchValue,
        page,
        setPage,
        limit,
        setLimit 
    } = usePatients();

    const handleRowClick = (patient: Patient) => {
        navigate(`/patients/${patient.id}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona el listado de pacientes y accede a sus historias clínicas.
                    </p>
                </div>
                <Button onClick={() => navigate('/patients/new')} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Paciente
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o documento..."
                        className="pl-9"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <DataTable
                columns={PatientColumns}
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

