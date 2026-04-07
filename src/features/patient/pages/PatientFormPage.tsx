import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { patientsApi, doctorsApi } from '@/api';
import { Gender } from '@/types/enums';
import type { Doctor } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { patientSchema, type PatientFormValues } from '../types/patient.schema';

export function PatientFormPage() {
    const { id } = useParams<{ id: string }>();
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
            gender: undefined,
            phone: '',
            address: '',
            email: '',
            doctorId: '',
        },
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch doctors
                const doctorsRes = await doctorsApi.getAll();
                // Handle both wrapped { data: [...] } and unwrapped [...] responses
                const doctorsData = Array.isArray(doctorsRes.data)
                    ? doctorsRes.data
                    : (doctorsRes.data as any).data || [];

                setDoctors(doctorsData);

                // If edit, fetch patient data
                if (isEdit && id && id !== 'undefined') {
                    const patientRes = await patientsApi.getById(id);
                    // Check if response is wrapped or unwrapped
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
                    // Pre-select current doctor if applicable
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
            // Aseguramos que doctorId esté presente si el usuario es DOCTOR
            const payload: any = {
                ...values,
                doctorId: values.doctorId || (user?.role === 'DOCTOR' ? user.doctorProfile?.id : undefined)
            };

            // Limpiar campos opcionales que envían strings vacíos y causan error 500
            if (!payload.phone) delete payload.phone;
            if (!payload.address) delete payload.address;
            if (!payload.doctorId) delete payload.doctorId;
            if (!payload.email) delete payload.email;

            if (isEdit) {
                await patientsApi.update(id, payload);
                toast.success('Paciente actualizado correctamente');
            } else {
                await patientsApi.create(payload as any);
                toast.success('Paciente creado correctamente');
            }

            // Invalidar la caché de pacientes para que la lista se actualice
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['patient', id] });
            }

            navigate(`/patients/${id || ''}`);
        } catch (error: any) {
            console.error('Error saving patient:', error);
            toast.error(error.response?.data?.message || 'Error al guardar el paciente');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
                        </h1>
                        <p className="text-muted-foreground">
                            Completa la información del paciente para el registro médico.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Paciente</CardTitle>
                    <CardDescription>
                        Los campos marcados con * son obligatorios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                console.log('Form errors:', errors);
                                toast.error('Por favor, revisa los errores en el formulario');
                            })}
                            className="space-y-6"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Juan" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Apellido *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Pérez" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="identificationNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nº Documento / Cédula *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. 12345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="birthDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fecha de Nacimiento *</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="gender"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Género *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                                                    <SelectItem value={Gender.FEMALE}>Femenino</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Correo Electrónico</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. [EMAIL_ADDRESS]" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {user?.role !== 'DOCTOR' && (
                                    <FormField
                                        control={form.control}
                                        name="doctorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Médico Responsable *</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                    disabled={user?.role === 'DOCTOR'}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione un médico..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {doctors.map((doc) => (
                                                            <SelectItem key={doc.id} value={doc.id}>
                                                                {doc.user?.name || 'Médico Sin Nombre'} {doc.specialty ? `- ${doc.specialty}` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. +54 9 11 ..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Calle Falsa 123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                    disabled={isSubmitting}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isEdit ? 'Actualizar' : 'Guardar'} Paciente
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
