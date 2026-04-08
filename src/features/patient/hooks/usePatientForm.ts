import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientsApi, doctorsApi } from '@/api';
import { Gender } from '@/types/enums';
import type { Doctor } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

export const patientSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    identificationNumber: z.string().min(5, 'Documento inválido'),
    birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
    gender: z.nativeEnum(Gender, {
        message: 'Seleccione un género',
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
    doctorId: z.string().optional().or(z.literal('')),
    email: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

export function usePatientForm(id?: string) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEdit);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            identificationNumber: '',
            birthDate: '',
            gender: '' as any,
            phone: '',
            address: '',
            email: '',
            doctorId: '',
        },
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const doctorsRes = await doctorsApi.getAll();
                const doctorsData = Array.isArray(doctorsRes.data)
                    ? doctorsRes.data
                    : (doctorsRes.data as any).data || [];
                setDoctors(doctorsData);

                if (isEdit) {
                    const patientRes = await patientsApi.getById(id!);
                    const p = (patientRes.data as any).data || patientRes.data;
                    form.reset({
                        firstName: p.firstName,
                        lastName: p.lastName,
                        identificationNumber: p.identificationNumber || '',
                        birthDate: p.birthDate ? p.birthDate.split('T')[0] : '',
                        gender: p.gender as Gender,
                        phone: p.phone || '',
                        address: p.address || '',
                        email: p.email || '',
                        doctorId: p.doctor?.id || '',
                    });
                } else if (user?.role === 'DOCTOR') {
                    const currentDoctor = doctorsData.find((d: Doctor) => d.user?.id === user?.id);
                    if (currentDoctor) {
                        form.setValue('doctorId', currentDoctor.id);
                    }
                }
            } catch (error) {
                console.error('Error loading form data:', error);
                toast.error('Error al cargar la información');
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [id, isEdit, form, user]);

    const onSubmit = async (values: PatientFormValues) => {
        setIsSubmitting(true);
        try {
            const payload: any = {
                ...values,
                doctorId: values.doctorId || (user?.role === 'DOCTOR' ? user.doctorProfile?.id : undefined)
            };

            // Limpiar campos opcionales que envían strings vacíos
            if (!payload.phone) delete payload.phone;
            if (!payload.address) delete payload.address;
            if (!payload.doctorId) delete payload.doctorId;
            if (!payload.email) delete payload.email;
            if (!payload.identificationNumber) delete payload.identificationNumber;

            if (isEdit) {
                await patientsApi.update(id!, payload);
                toast.success('Paciente actualizado correctamente');
            } else {
                await patientsApi.create(payload);
                toast.success('Paciente creado correctamente');
            }

            // Invalidar cachés de TanStack Query para actualización en vivo
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['patient', id] });
            }

            navigate('/patients');
        } catch (error: any) {
            console.error('Error saving patient:', error);
            const serverMessage = error.response?.data?.message;
            const message = Array.isArray(serverMessage) ? serverMessage.join(', ') : serverMessage;
            toast.error(message || 'Error al guardar el paciente');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        form,
        doctors,
        isSubmitting,
        isLoading,
        isEdit,
        onSubmit,
        user,
    };
}
