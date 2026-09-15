import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api';

export function usePatients(initialPatientType?: string) {
    const [searchValue, setSearchValue] = useState('');
    const [gender, setGender] = useState('');
    const [gerencia, setGerencia] = useState('');
    const [patientType, setPatientType] = useState(initialPatientType || '');
    const [relationship, setRelationship] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);

    // Query para obtener pacientes con paginación y filtros
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['patients', page, limit, searchValue, gender, gerencia, patientType, relationship],
        queryFn: async () => {
            const res = await patientsApi.getAll({ 
                page, 
                limit,
                search: searchValue || undefined,
                gender: gender || undefined,
                gerencia: gerencia || undefined,
                patientType: patientType === 'ALL' || !patientType ? undefined : patientType,
                relationship: relationship === 'ALL' || !relationship ? undefined : relationship,
            } as any);
            return res.data;
        },
    });

    const patients = useMemo(() => response?.data || [], [response]);

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

    const handleGenderChange = (value: string) => {
        setGender(value);
        setPage(1);
    };

    const handleGerenciaChange = (value: string) => {
        setGerencia(value);
        setPage(1);
    };

    const handlePatientTypeChange = (value: string) => {
        setPatientType(value);
        setPage(1);
    };

    const handleRelationshipChange = (value: string) => {
        setRelationship(value);
        setPage(1);
    };

    // Query to obtain unique gerencias from database
    const { data: gerenciasRes } = useQuery({
        queryKey: ['unique-gerencias'],
        queryFn: async () => {
            const res = await patientsApi.getUniqueGerencias();
            const raw = res.data;
            if (Array.isArray(raw)) return raw;
            if (raw && Array.isArray((raw as any).data)) return (raw as any).data;
            return [];
        }
    });

    const gerencias = Array.isArray(gerenciasRes) ? gerenciasRes : (gerenciasRes as any)?.data || [];

    return {
        patients,
        meta,
        isLoading,
        searchValue,
        setSearchValue: handleSearchChange,
        gender,
        setGender: handleGenderChange,
        gerencia,
        setGerencia: handleGerenciaChange,
        patientType,
        setPatientType: handlePatientTypeChange,
        relationship,
        setRelationship: handleRelationshipChange,
        gerencias,
        page,
        setPage,
        limit,
        setLimit,
        error
    };
}
