import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi, clinicalHistoryApi, clinicalHistoryNoteApi } from '@/api';

export function usePatient(id?: string) {
    // Validación estricta del ID
    const isValidId = id && id !== 'undefined' && id !== '';

    // 1. Query para el detalle del paciente
    const patientQuery = useQuery({
        queryKey: ['patient', id],
        queryFn: () => patientsApi.getById(id!),
        enabled: !!isValidId,
    });

    // 2. Query para las historias clínicas
    const historiesQuery = useQuery({
        queryKey: ['clinical-histories'],
        queryFn: () => clinicalHistoryApi.getAll(), 
        enabled: !!isValidId,
    });

    // 3. Query para las notas de evolución (opcional, por si no vienen en la historia)
    const notesQuery = useQuery({
        queryKey: ['clinical-history-notes'],
        queryFn: () => clinicalHistoryNoteApi.getAll(),
        enabled: !!isValidId,
    });

    // Extracción segura del paciente manejando el wrapping del backend
    const patient = useMemo(() => {
        const res = patientQuery.data as any;
        if (!res) return null;
        
        // El log muestra que el objeto está en res.data
        const actualData = res.data?.data || res.data || res;
        console.log('DEBUG - Extracted Patient:', actualData);
        return actualData;
    }, [patientQuery.data]);
    
    // Filtrado local por patientId
    const histories = useMemo(() => {
        // Intentamos sacar las historias del objeto paciente directamente si existen
        if (patient?.clinicalHistories && patient.clinicalHistories.length > 0) {
            return patient.clinicalHistories;
        }

        const rawData = (historiesQuery.data as any)?.data?.data || (historiesQuery.data as any)?.data || [];
        return rawData.filter((h: any) => {
            const hPatientId = h.patient?.id || h.patientId || h.patient;
            return String(hPatientId) === String(id);
        });
    }, [historiesQuery.data, id, patient]);

    const notes = useMemo(() => {
        // Intentar obtener notas de las historias ya filtradas primero
        const notesFromHistories = histories.flatMap((h: any) => h.notes || []);
        if (notesFromHistories.length > 0) return notesFromHistories;

        // Si no, filtrar de la query de notas global
        const rawNotes = (notesQuery.data as any)?.data?.data || (notesQuery.data as any)?.data || [];
        const patientHistoryIds = histories.map((h: any) => String(h.id));
        return rawNotes.filter((note: any) => {
            const noteHistoryId = note.clinicalHistoryId || note.historyId || note.clinicalHistory?.id;
            return patientHistoryIds.includes(String(noteHistoryId));
        });
    }, [notesQuery.data, histories]);

    const isLoading = patientQuery.isLoading || historiesQuery.isLoading || notesQuery.isLoading;

    return {
        patient,
        histories,
        notes,
        isLoading,
        error: patientQuery.error || historiesQuery.error || notesQuery.error,
        refetch: () => {
            patientQuery.refetch();
            historiesQuery.refetch();
            notesQuery.refetch();
        }
    };
}
