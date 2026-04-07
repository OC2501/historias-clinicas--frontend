import { Status } from '@/types/enums';
import type { Patient } from '@/features/patient/types/patient.types';
import type { Doctor } from '@/features/admin/types/doctor.types';
import type { ConsultingRoom } from '@/features/admin/types/consulting-room.types';

export interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    status: Status;
    patient: Patient;
    doctor: Doctor;
    consultingRoom?: ConsultingRoom;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAppointmentRequest {
    patientId: string;
    doctorId: string;
    consultingRoomId: string;
    startTime: string; // ISO datetime
    endTime: string;   // ISO datetime
    status?: Status;
    reason?: string;
    notes?: string;
}

export type UpdateAppointmentRequest = Partial<CreateAppointmentRequest>;
