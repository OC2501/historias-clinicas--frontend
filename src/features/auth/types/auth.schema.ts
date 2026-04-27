import * as z from 'zod';
import { OrganizationPlanType, OrganizationRole } from '@/types/enums';

export const loginSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    phone: z.string().optional(),
    planType: z.nativeEnum(OrganizationPlanType, { message: 'Seleccione un plan válido' }),
    organizationName: z.string().optional(),
    organizationType: z.string().optional(),
    organizationSize: z.string().optional(),
    organizationRole: z.nativeEnum(OrganizationRole).optional(),
}).superRefine((data, ctx) => {
    if (data.planType === OrganizationPlanType.CLINIC) {
        if (!data.organizationName || data.organizationName.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'El nombre de la clínica es requerido',
                path: ['organizationName']
            });
        }
        if (!data.organizationType) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'El tipo de clínica es requerido',
                path: ['organizationType']
            });
        }
        if (!data.organizationRole) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Debe seleccionar su rol en la clínica',
                path: ['organizationRole']
            });
        }
    }
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    confirmPassword: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
