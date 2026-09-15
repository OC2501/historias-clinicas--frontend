import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi, doctorsApi } from '@/api';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addMonths, isSameDay } from 'date-fns';

export function useAppointments() {
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
    const [searchTerm, setSearchTerm] = useState('');
    const [gender, setGender] = useState('');
    const [gerencia, setGerencia] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Query para obtener citas con paginación
    const { data: response, isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['appointments', page, limit, view, searchTerm, gender, gerencia],
        queryFn: async () => {
            const res = await appointmentsApi.getAll({ 
                page,
                limit: view === 'calendar' ? 500 : limit,
                search: searchTerm || undefined,
                gender: gender || undefined,
                gerencia: gerencia || undefined
            } as any);
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

    const doctors = useMemo(() => {
        if (Array.isArray(doctorsRes)) return doctorsRes;
        if (Array.isArray((doctorsRes as any)?.data)) return (doctorsRes as any).data;
        if (Array.isArray((doctorsRes as any)?.data?.data)) return (doctorsRes as any).data.data;
        return [];
    }, [doctorsRes]);

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

        // 2. Local Sorting by Date (Ascending - closest/upcoming first)
        return processed.sort((a: any, b: any) => {
            const dateA = new Date(a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || 0).getTime();
            return dateA - dateB;
        });
    }, [response, doctors]);

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

    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handleNext = () => {
        if (calendarMode === 'week') {
            setCurrentDate(addDays(currentDate, 7));
        } else {
            setCurrentDate(addMonths(currentDate, 1));
        }
    };

    const handlePrev = () => {
        if (calendarMode === 'week') {
            setCurrentDate(addDays(currentDate, -7));
        } else {
            setCurrentDate(addMonths(currentDate, -1));
        }
    };

    const today = () => setCurrentDate(new Date());

    return {
        view,
        setView,
        calendarMode,
        setCalendarMode,
        appointments,
        meta,
        isLoading: isLoadingAppointments || isLoadingDoctors,
        searchTerm,
        setSearchTerm: handleSearchChange,
        gender,
        setGender,
        gerencia,
        setGerencia,
        page,
        setPage,
        limit,
        setLimit,
        currentDate,
        doctors,
        weekDays,
        monthDays,
        nextWeek: handleNext,
        prevWeek: handlePrev,
        today,
        isSameDay
    };
}
