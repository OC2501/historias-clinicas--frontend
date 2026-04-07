import type { User } from '@/features/admin/types/user.types';
import type { ConsultingRoom } from '@/features/admin/types/consulting-room.types';

export interface DoctorWithUser {
    id: string;
    specialty?: string;
    licenseNumber?: string;
    isActive: boolean;
    user?: User; // Opcional, ya que la respuesta del API puede no traerlo
}

export interface Schedule {
    id: string;
    diaSemana: number; // 0=Domingo, 1=Lunes, ..., 6=Sábado
    horaInicio: string; // "09:00:00"
    horaFin: string;    // "11:45:00"
    doctor: DoctorWithUser;
    consultingRoom: ConsultingRoom;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateScheduleRequest {
    diaSemana: number;
    horaInicio: string; // HH:MM:SS
    horaFin: string;    // HH:MM:SS
    doctorId: string;
    consultingRoomId: string;
}

export type UpdateScheduleRequest = Partial<CreateScheduleRequest>;
