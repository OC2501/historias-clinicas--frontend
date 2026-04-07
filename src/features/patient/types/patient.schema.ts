import * as z from 'zod';
import { Gender } from '@/types/enums';

export const patientSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    identificationNumber: z.string().min(5, 'Documento inválido'),
    birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
    gender: z.nativeEnum(Gender, {
        message: 'Seleccione un género',
    }),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    email: z.string().optional().or(z.literal('')),
    doctorId: z.string().optional().or(z.literal('')),
});

export type PatientFormValues = z.infer<typeof patientSchema>;
