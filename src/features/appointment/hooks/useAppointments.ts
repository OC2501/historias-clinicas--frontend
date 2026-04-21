import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi } from '@/api';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

export function useAppointments() {
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Query para obtener citas con paginación
    const { data: response, isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['appointments', page, limit, view],
        queryFn: async () => {
            const res = await appointmentsApi.getAll({ 
                page,
                limit: view === 'calendar' ? 500 : limit
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

    const appointments = useMemo(() => {
        const rawData = response?.data || [];
        if (!Array.isArray(rawData)) return [];

        // 1. Cross-reference doctor data to ensure names are present
        const processed = rawData.map((app: any) => {
            if (!app.doctor?.user?.name && doctors.length > 0) {
                const fullDoctor = doctors.find((d: any) => d.id === app.doctor?.id);
                if (fullDoctor?.user) {
                    return {
                        ...app,
                        doctor: {
                            ...app.doctor,
                            user: fullDoctor.user
                        }
                    };
                }
            }
            return app;
        });

        // 2. Local Filtering
        if (!searchTerm) return processed;
        const lowerSearch = searchTerm.toLowerCase();
        return processed.filter((app: any) => {
            const patientName = `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`.toLowerCase();
            const documentId = (app.patient?.documentId || '').toLowerCase();
            const doctorName = (app.doctor?.user?.name || '').toLowerCase();
            
            return patientName.includes(lowerSearch) || 
                   documentId.includes(lowerSearch) || 
                   doctorName.includes(lowerSearch);
        });
    }, [response, doctors, searchTerm]);

    const meta = useMemo(() => {
        if (response?.meta) return response.meta;
        return {
            page: page,
            lastPage: (response as any)?.lastPage || Math.ceil((appointments?.length || 0) / limit) || 1,
            total: (response as any)?.total || appointments?.length || 0,
            limit: limit
        };
    }, [response, page, limit, appointments]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    // Calendar logic
    const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
    const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const today = () => setCurrentDate(new Date());

    return {
        view,
        setView,
        appointments,
        meta,
        isLoading: isLoadingAppointments || isLoadingDoctors,
        searchTerm,
        setSearchTerm: handleSearchChange,
        page,
        setPage,
        limit,
        setLimit,
        currentDate,
        weekDays,
        nextWeek,
        prevWeek,
        today,
        isSameDay
    };
}
