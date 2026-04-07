export interface ConsultingRoom {
    id: string;
    nombre: string;
    ubicacion?: string;
    disponible: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateConsultingRoomRequest {
    nombre: string;
    ubicacion?: string;
    disponible?: boolean;
    userId: string;
}

export type UpdateConsultingRoomRequest = Partial<CreateConsultingRoomRequest>;
