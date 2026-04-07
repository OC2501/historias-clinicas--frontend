import { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { clinicalHistoryApi, doctorsApi } from '@/api';


export function useClinicalHistory() {
    const { id } = useParams<{ id: string }>();
    const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({ initial: true });

    const { data: historyRes, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['clinical-history', id],
        queryFn: () => clinicalHistoryApi.getById(id!),
        enabled: !!id,
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const doctors = useMemo(() => doctorsRes?.data?.data || [], [doctorsRes]);
    const history = useMemo(() => {
        const rawHistory = historyRes?.data;
        if (!rawHistory) return null;

        const populateDoc = (obj: any) => {
            if (!obj?.doctor) return obj;
            if (!obj.doctor.user?.name && doctors.length > 0) {
                const found = doctors.find((d: any) => d.id === obj.doctor.id);
                if (found?.user) {
                    return {
                        ...obj,
                        doctor: { ...obj.doctor, user: found.user }
                    };
                }
            }
            return obj;
        };

        const result = populateDoc(rawHistory);
        return {
            ...result,
            notes: (result.notes || []).map(populateDoc)
        };
    }, [historyRes, doctors]);

    const toggleExpand = (eventId: string) => {
        setExpandedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    };

    const getDoctorName = (doctorObj: any) => {
        if (doctorObj?.user?.name) return doctorObj.user.name;
        if (!doctorObj?.id) return 'Médico no asignado';
        
        const found = doctors.find((d: any) => d.id === doctorObj.id);
        if (found?.user?.name) return found.user.name;
        
        return doctorObj.specialty ? `Dr. (Especialista en ${doctorObj.specialty})` : `Dr. (ID: ${doctorObj.id.substring(0, 8)})`;
    };

    const allEvents = useMemo(() => {
        if (!history) return [];

        const events = [
            {
                id: 'initial',
                type: 'HISTORY',
                date: history.fecha,
                title: `Historia Inicial - ${history.specialty}`,
                doctor: getDoctorName(history.doctor),
                content: history,
                isInitial: true
            },
            ...(history.notes || []).map((note: any) => ({
                id: note.id,
                type: 'NOTE',
                date: note.fecha,
                title: 'Nota de Evolución',
                doctor: getDoctorName(note.doctor) !== 'Médico no asignado' 
                    ? getDoctorName(note.doctor) 
                    : getDoctorName(history.doctor),
                content: note,
                isInitial: false
            }))
        ];

        return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [history, doctors]);

    return {
        id,
        history,
        isLoading: isLoadingHistory || isLoadingDoctors,
        expandedEvents,
        toggleExpand,
        allEvents
    };
}
