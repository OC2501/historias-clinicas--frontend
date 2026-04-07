import { api } from '@/api';
import type {
    ClinicalHistoryNote,
    CreateClinicalHistoryNoteRequest,
    UpdateClinicalHistoryNoteRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const clinicalHistoryNoteApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<ClinicalHistoryNote>>('clinical-history-note', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<ClinicalHistoryNote>>(`clinical-history-note/${id}`),

    create: (data: CreateClinicalHistoryNoteRequest) =>
        api.post<ApiOneResponse<ClinicalHistoryNote>>('clinical-history-note', data),

    update: (id: string, data: UpdateClinicalHistoryNoteRequest) =>
        api.patch<ApiOneResponse<ClinicalHistoryNote>>(`clinical-history-note/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<ClinicalHistoryNote>>(`clinical-history-note/${id}`),
};
