import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalHistoryNoteApi } from '@/api';
import type { CreateClinicalHistoryNoteRequest, UpdateClinicalHistoryNoteRequest } from '@/types';

export const useClinicalHistoryNotes = (page = 1, limit = 10, clinicalHistoryId?: string) => {
    return useQuery({
        queryKey: ['clinical-history-notes', page, limit, clinicalHistoryId],
        queryFn: async () => {
            const res = await clinicalHistoryNoteApi.getAll({ page, limit, clinicalHistoryId } as any);
            return res.data;
        },
    });
};

export const useClinicalHistoryNoteById = (id: string) => {
    return useQuery({
        queryKey: ['clinical-history-note', id],
        queryFn: () => clinicalHistoryNoteApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateClinicalHistoryNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateClinicalHistoryNoteRequest) => clinicalHistoryNoteApi.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clinical-history-notes'] });
            if (variables.clinicalHistoryId) {
                queryClient.invalidateQueries({ queryKey: ['clinical-history', variables.clinicalHistoryId] });
            }
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
        },
    });
};

export const useUpdateClinicalHistoryNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateClinicalHistoryNoteRequest }) => clinicalHistoryNoteApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clinical-history-notes'] });
            queryClient.invalidateQueries({ queryKey: ['clinical-history-note', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
            queryClient.invalidateQueries({ queryKey: ['clinical-history'] }); // Invalidate all specific histories just in case
        },
    });
};

export const useDeleteClinicalHistoryNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => clinicalHistoryNoteApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinical-history-notes'] });
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
            queryClient.invalidateQueries({ queryKey: ['clinical-history'] });
        },
    });
};
