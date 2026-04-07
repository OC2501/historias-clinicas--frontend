import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api';

export function usePatients() {
    const [searchValue, setSearchValue] = useState('');

    // Query para obtener todos los pacientes
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['patients'],
        queryFn: () => patientsApi.getAll({ limit: 500 }),
    });

    const patients = useMemo(() => response?.data?.data || [], [response]);

    // Filtrado en el cliente basado en el valor de búsqueda
    const filteredPatients = useMemo(() => {
        const lowerSearch = searchValue.toLowerCase();
        return patients.filter(p =>
            p.firstName.toLowerCase().includes(lowerSearch) ||
            p.lastName.toLowerCase().includes(lowerSearch) ||
            p.identificationNumber?.toLowerCase().includes(lowerSearch)
        );
    }, [searchValue, patients]);

    return {
        patients,
        filteredPatients,
        isLoading,
        searchValue,
        setSearchValue,
        error
    };
}
