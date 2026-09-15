import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientsApi, doctorsApi } from '@/api';
import { Gender, PatientType, RelationshipType } from '@/types/enums';
import type { Doctor, Patient } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';

export const patientSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    identificationNumber: z.string().optional(),
    birthDate: z.string().min(1, 'Fecha de nacimiento requerida'),
    gender: z.nativeEnum(Gender, {
        message: 'Seleccione un género',
    }),
    phone: z.string().optional(),
    address: z.string().optional(),
    doctorId: z.string().optional().or(z.literal('')),
    email: z.string().optional(),
    gerencia: z.string().optional(),
    cargo: z.string().optional(),
    patientType: z.enum(['TITULAR', 'BENEFICIARIO']).default('TITULAR'),
    relationship: z.enum(['CONYUGE', 'HIJO', 'PADRE', 'MADRE', 'OTRO']).optional().or(z.literal('')),
    titularId: z.string().optional().or(z.literal('')),
});

const STATIC_GERENCIAS = [
    'CONSULTORIA JURIDICA',
    'GERENCIA DE ATENCION CIUDADANA',
    'GERENCIA DE CALIDAD DE LAS AGUAS',
    'GERENCIA DE COMERCIALIZACION',
    'GERENCIA DE COMPRAS Y CONTRATACIONES',
    'GERENCIA DE CONTROL DE PERDIDAS Y CALIDAD DE AGUA',
    'GERENCIA DE DISTRIBUCION',
    'GERENCIA DE DISTRIBUCION DE AGUA POTABLE',
    'GERENCIA DE FUENTES HIDRICAS',
    'GERENCIA DE GESTION ADMINISTRATIVA',
    'GERENCIA DE GESTION COMUNICACIONAL',
    'GERENCIA DE GESTIÓN DE LA INFORMACION SOBRE LA PRESTACIÓN DEL SERVICIO',
    'GERENCIA DE GESTION HUMANA',
    'GERENCIA DE GESTION POPULAR DE LAS AGUAS',
    'GERENCIA DE INGENIERIA Y PROYECTOS',
    'GERENCIA DE MANTENIMIENTO',
    'GERENCIA DE OPERACIONES',
    'GERENCIA DE OPERACIONES DE AGUA POTABLE',
    'GERENCIA DE PLANIFICACION PRESUPUESTO Y ORGANIZACIÓN',
    'GERENCIA DE PLANTA FISICA',
    'GERENCIA DE SANEAMIENTO',
    'GERENCIA DE SEGURIDAD INTEGRAL',
    'GERENCIA DE TECNOLOGIA DE INFORMACION Y COMUNICACIÓN',
    'GERENCIA DE TRANSPORTE',
    'PRESIDENCIA',
    'UNIDAD DE AUDITORIA INTERNA'
];

export type PatientFormValues = z.infer<typeof patientSchema>;

export function usePatientForm(id?: string) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryTitularId = searchParams.get('titularId');

    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isEdit = !!id;

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [uniqueGerencias, setUniqueGerencias] = useState<string[]>(STATIC_GERENCIAS);
    const [titularesList, setTitularesList] = useState<Patient[]>([]);
    const [selectedTitular, setSelectedTitular] = useState<Patient | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEdit);

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientSchema) as any,
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
            gerencia: '',
            cargo: '',
            patientType: queryTitularId ? 'BENEFICIARIO' : 'TITULAR',
            relationship: queryTitularId ? 'HIJO' : undefined,
            titularId: queryTitularId || '',
        },
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [doctorsRes, gerenciasRes, patientsRes] = await Promise.all([
                    doctorsApi.getAll(),
                    patientsApi.getUniqueGerencias(),
                    patientsApi.getAll({ limit: 1000, patientType: 'TITULAR' })
                ]);

                const doctorsData = Array.isArray(doctorsRes.data)
                    ? doctorsRes.data
                    : (doctorsRes.data as any).data || [];
                setDoctors(doctorsData);

                const dbGerencias = Array.isArray(gerenciasRes.data) 
                    ? gerenciasRes.data 
                    : (gerenciasRes.data as any)?.data || [];

                const merged = Array.from(new Set([
                    ...STATIC_GERENCIAS,
                    ...dbGerencias
                ])).sort();
                setUniqueGerencias(merged);

                const rawPatients = (patientsRes.data as any)?.data || patientsRes.data || [];
                const titulares = Array.isArray(rawPatients)
                    ? rawPatients.filter((p: Patient) => !p.patientType || p.patientType === 'TITULAR')
                    : [];
                setTitularesList(titulares);

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
                        gerencia: p.gerencia || '',
                        cargo: p.cargo || '',
                        patientType: p.patientType || 'TITULAR',
                        relationship: p.relationship || undefined,
                        titularId: p.titular?.id || '',
                    });
                    if (p.titular) {
                        setSelectedTitular(p.titular);
                    }
                } else {
                    if (queryTitularId) {
                        const matched = titulares.find((t: Patient) => t.id === queryTitularId);
                        if (matched) {
                            setSelectedTitular(matched);
                            if (matched.gerencia) {
                                form.setValue('gerencia', matched.gerencia);
                            }
                        } else {
                            try {
                                const singleTitularRes = await patientsApi.getById(queryTitularId);
                                const t = (singleTitularRes.data as any).data || singleTitularRes.data;
                                if (t) {
                                    setSelectedTitular(t);
                                    if (t.gerencia) {
                                        form.setValue('gerencia', t.gerencia);
                                    }
                                }
                            } catch (e) {
                                console.error('Error loading titular:', e);
                            }
                        }
                    }

                    if (user?.organizationRole === 'DOCTOR') {
                        const currentDoctor = doctorsData.find((d: Doctor) => d.user?.id === user?.id);
                        if (currentDoctor) {
                            form.setValue('doctorId', currentDoctor.id);
                        }
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
    }, [id, isEdit, form, user, queryTitularId]);

    const onSubmit = async (values: PatientFormValues) => {
        setIsSubmitting(true);
        try {
            const payload: any = {
                ...values,
                doctorId: values.doctorId || (user?.organizationRole === 'DOCTOR' ? user.doctorProfile?.id : undefined)
            };

            // Limpiar campos opcionales que envían strings vacíos
            if (!payload.phone) delete payload.phone;
            if (!payload.address) delete payload.address;
            if (!payload.doctorId) delete payload.doctorId;
            if (!payload.email) delete payload.email;
            if (!payload.identificationNumber || !payload.identificationNumber.trim()) {
                delete payload.identificationNumber;
            }
            if (!payload.gerencia) delete payload.gerencia;
            if (!payload.cargo) delete payload.cargo;

            if (payload.patientType === 'TITULAR') {
                delete payload.relationship;
                delete payload.titularId;
            } else {
                delete payload.cargo;
                if (!payload.gerencia && selectedTitular?.gerencia) {
                    payload.gerencia = selectedTitular.gerencia;
                }
                if (!payload.relationship) delete payload.relationship;
                if (!payload.titularId) delete payload.titularId;
            }

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
        uniqueGerencias,
        titularesList,
        selectedTitular,
        setSelectedTitular,
        isSubmitting,
        isLoading,
        isEdit,
        onSubmit,
        user,
    };
}
