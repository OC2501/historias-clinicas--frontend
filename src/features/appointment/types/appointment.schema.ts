import * as z from 'zod';
import { Status } from '@/types/enums';

export const appointmentSchema = z.object({
    patientId: z.string().min(1, 'Seleccione un paciente'),
    doctorId: z.string().min(1, 'Seleccione un médico'),
    consultingRoomId: z.string().min(1, 'Seleccione un consultorio'),
    startTime: z.string().min(1, 'Hora de inicio requerida'),
    endTime: z.string().min(1, 'Hora de fin requerida'),
    status: z.nativeEnum(Status, {
        message: 'Seleccione un estado',
    }),
    reason: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
