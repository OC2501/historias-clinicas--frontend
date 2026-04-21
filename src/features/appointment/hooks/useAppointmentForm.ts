import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, patientsApi, doctorsApi, consultingRoomsApi } from '@/api';
import { Status } from '@/types/enums';
import type { Patient, Doctor, ConsultingRoom } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { appointmentSchema, type AppointmentFormValues } from '../types/appointment.schema';

export type { AppointmentFormValues };

export function useAppointmentForm(id?: string, dateParam?: string | null, patientIdParam?: string | null) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isEdit = !!id;
    // ... rest of state stays the same

    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [rooms, setRooms] = useState<ConsultingRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [isPatientListOpen, setIsPatientListOpen] = useState(false);

    const defaultDate = dateParam ? `${dateParam}T09:00` : format(new Date(), "yyyy-MM-dd'T'09:00");
    const defaultEndDate = dateParam ? `${dateParam}T09:30` : format(new Date(), "yyyy-MM-dd'T'09:30");

    const form = useForm<AppointmentFormValues>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patientId: patientIdParam || '',
            doctorId: '',
            consultingRoomId: '',
            startTime: defaultDate,
            endTime: defaultEndDate,
            status: Status.SCHEDULED,
            reason: '',
            notes: '',
        },
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [patientsRes, doctorsRes, roomsRes] = await Promise.all([
                    patientsApi.getAll({ page: 1, limit: 100 }),
                    doctorsApi.getAll(),
                    consultingRoomsApi.getAll()
                ]);

                setPatients(patientsRes.data.data);
                setDoctors(doctorsRes.data.data);
                setRooms(roomsRes.data.data);

                if (isEdit) {
                    const res = await appointmentsApi.getById(id!);
                    const app = (res.data as any).data || res.data;
                    form.reset({
                        patientId: app.patient.id,
                        doctorId: app.doctor.id,
                        consultingRoomId: app.consultingRoom?.id || '',
                        startTime: format(new Date(app.startTime), "yyyy-MM-dd'T'HH:mm"),
                        endTime: format(new Date(app.endTime), "yyyy-MM-dd'T'HH:mm"),
                        status: app.status,
                        reason: app.reason || '',
                        notes: app.notes || '',
                    });
                } else if ((user?.organizationRole || user?.systemRole) === 'DOCTOR') {
                    const currentDoctor = doctorsRes.data.data.find((d: Doctor) => d.user?.id === user?.id);
                    if (currentDoctor) {
                        form.setValue('doctorId', currentDoctor.id);
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Error al cargar información');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id, isEdit, form, user]);

    const filteredPatients = useMemo(() => {
        if (!patientSearch) return patients;
        const search = patientSearch.toLowerCase();
        return patients.filter(p =>
            p.firstName.toLowerCase().includes(search) ||
            p.lastName.toLowerCase().includes(search) ||
            p.identificationNumber?.includes(search)
        );
    }, [patients, patientSearch]);

    const onSubmit = async (values: AppointmentFormValues) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...values,
                startTime: new Date(values.startTime).toISOString(),
                endTime: new Date(values.endTime).toISOString(),
            };

            if (isEdit) {
                await appointmentsApi.update(id!, payload);
                toast.success('Cita actualizada');
            } else {
                await appointmentsApi.create(payload);
                toast.success('Cita programada con éxito');
            }

            // Invalida caché para actualización en vivo
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            if (isEdit) {
                queryClient.invalidateQueries({ queryKey: ['appointment', id] });
            }

            navigate('/appointments');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar la cita');
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedPatient = patients.find(p => p.id === form.watch('patientId'));

    return {
        form,
        patients,
        doctors,
        rooms,
        isLoading,
        isSubmitting,
        isEdit,
        patientSearch,
        setPatientSearch,
        filteredPatients,
        selectedPatient,
        isPatientListOpen,
        setIsPatientListOpen,
        onSubmit,
        user,
    };
}
