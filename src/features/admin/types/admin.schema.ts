import * as z from 'zod';
import { SystemRole, OrganizationRole } from '../../../types/enums';

// Users
export const userSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
    systemRole: z.nativeEnum(SystemRole, { message: 'Seleccione un rol' }).default(SystemRole.USER),
    organizationRole: z.nativeEnum(OrganizationRole).optional(),
    specialty: z.string().optional().or(z.literal('')),
});

export type UserFormValues = z.infer<typeof userSchema>;

// Specialties
export const specialtySchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    specialty: z.string().min(2, 'La especialidad es requerida (ej: CARDIOLOGIA)'),
    description: z.string().optional().or(z.literal('')),
});

export type SpecialtyFormValues = z.infer<typeof specialtySchema>;

// Consulting Rooms
export const consultingRoomSchema = z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    ubicacion: z.string().optional().or(z.literal('')),
    disponible: z.boolean().optional(),
    userId: z.string().uuid('ID de usuario inválido (UUID requerido)'),
});

export type ConsultingRoomFormValues = z.infer<typeof consultingRoomSchema>;
