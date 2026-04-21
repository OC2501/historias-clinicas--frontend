import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api';

export function usePatients() {
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Query para obtener pacientes con paginación
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['patients', page, limit],
        queryFn: async () => {
            const res = await patientsApi.getAll({ 
                page, 
                limit
            });
            return res.data;
        },
    });

    const patients = useMemo(() => response?.data || [], [response]);

    const filteredPatients = useMemo(() => {
        if (!searchValue) return patients;
        const lowerSearch = searchValue.toLowerCase();
        return patients.filter((p: any) => {
            const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
            const documentId = (p.documentId || '').toLowerCase();
            return fullName.includes(lowerSearch) || documentId.includes(lowerSearch);
        });
    }, [patients, searchValue]);

    const meta = useMemo(() => {
        if (response?.meta) return response.meta;
        return {
            page: page,
            lastPage: (response as any)?.lastPage || Math.ceil((patients?.length || 0) / limit) || 1,
            total: (response as any)?.total || patients?.length || 0,
            limit: limit
        };
    }, [response, page, limit, patients]);

    // Al cambiar la búsqueda, volvemos a la página 1
    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        setPage(1);
    };

    return {
        patients: filteredPatients,
        meta,
        isLoading,
        searchValue,
        setSearchValue: handleSearchChange,
        page,
        setPage,
        limit,
        setLimit,
        error
    };
}
