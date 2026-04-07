import { api } from '@/api';
import type {
    ConsultingRoom,
    CreateConsultingRoomRequest,
    UpdateConsultingRoomRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const consultingRoomsApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<ConsultingRoom>>('/consulting-room', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<ConsultingRoom>>(`/consulting-room/${id}`),

    create: (data: CreateConsultingRoomRequest) =>
        api.post<ApiOneResponse<ConsultingRoom>>('/consulting-room', data),

    update: (id: string, data: UpdateConsultingRoomRequest) =>
        api.patch<ApiOneResponse<ConsultingRoom>>(`/consulting-room/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<ConsultingRoom>>(`/consulting-room/${id}`),
};
