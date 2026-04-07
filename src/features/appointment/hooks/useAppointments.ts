import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi } from '@/api';
import { startOfWeek, addDays, isSameDay } from 'date-fns';

export function useAppointments() {
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { data: response, isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['appointments'],
        queryFn: () => appointmentsApi.getAll({ 
            limit: 500
        }),
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const doctors = useMemo(() => doctorsRes?.data?.data || [], [doctorsRes]);

    const appointments = useMemo(() => {
        const rawData = response?.data?.data || [];
        if (!Array.isArray(rawData)) return [];

        // Cross-reference doctor data to ensure names are present
        return rawData.map((app: any) => {
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
    }, [response, doctors]);

    const filteredAppointments = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return appointments.filter(app =>
            app.patient.firstName.toLowerCase().includes(search) ||
            app.patient.lastName.toLowerCase().includes(search) ||
            app.patient.identificationNumber?.includes(searchTerm) ||
            (app.doctor?.user?.name || '').toLowerCase().includes(search)
        );
    }, [appointments, searchTerm]);

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
        filteredAppointments,
        isLoading: isLoadingAppointments || isLoadingDoctors,
        searchTerm,
        setSearchTerm,
        currentDate,
        weekDays,
        nextWeek,
        prevWeek,
        today,
        isSameDay
    };
}
