import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalHistoryApi, patientsApi, specialtiesApi, doctorsApi } from '@/api';
import type { Patient, Doctor, CreateClinicalHistoryRequest } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toast } from 'sonner';

import { clinicalHistorySchema, type ClinicalHistoryFormValues } from '../types/clinical-history.schema';

export function useClinicalHistoryForm() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    
    const [patientSearch, setPatientSearch] = useState('');
    const [isPatientListOpen, setIsPatientListOpen] = useState(false);
    const [diagInput, setDiagInput] = useState('');

    const form = useForm<ClinicalHistoryFormValues>({
        resolver: zodResolver(clinicalHistorySchema),
        defaultValues: {
            patientId: '',
            doctorId: '',
            specialty: '',
            motivoConsulta: '',
            enfermedadActual: '',
            diagnosticos: [],
            asma: false,
            alergias: '',
            tabaquismo: '',
            ejercicio: '',
            presionArterial: '',
            frecuenciaCardiaca: '',
            peso: '',
            altura: '',
            examenes: '',
            medicacion: '',
            formData: {
                datosEspecificos: {},
            },
        },
    });

    const selectedSpecialty = form.watch('specialty');
    const selectedPatientId = form.watch('patientId');

    // Queries
    const { data: patientsRes, isLoading: isLoadingPatients } = useQuery({
        queryKey: ['patients', { limit: 100 }],
        queryFn: () => patientsApi.getAll({ limit: 100 }),
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const { data: templateRes, isLoading: isLoadingTemplate } = useQuery({
        queryKey: ['specialty-template', selectedSpecialty],
        queryFn: () => specialtiesApi.getBySpecialty(selectedSpecialty),
        enabled: !!selectedSpecialty,
    });

    const patients = useMemo(() => ((patientsRes?.data as any)?.data || patientsRes?.data || []) as Patient[], [patientsRes]);
    const doctors = useMemo(() => ((doctorsRes?.data as any)?.data || doctorsRes?.data || []) as Doctor[], [doctorsRes]);
    const template = (templateRes?.data as any)?.data || templateRes?.data || null;


    // Effect to set doctor initial data
    useEffect(() => {
        if (user?.role === 'DOCTOR' && doctors.length > 0) {
            const doctor = doctors.find((d: Doctor) => d.user?.id === user?.id);
            if (doctor) {
                form.setValue('doctorId', doctor.id);
                if (doctor.specialty && !form.getValues('specialty')) {
                    form.setValue('specialty', doctor.specialty.toUpperCase());
                }
            }
        }
    }, [user, doctors, form]);

    const filteredPatients = useMemo(() => {
        if (!patientSearch) return patients;
        const search = patientSearch.toLowerCase();
        return patients.filter(p =>
            p.firstName.toLowerCase().includes(search) ||
            p.lastName.toLowerCase().includes(search) ||
            p.identificationNumber?.includes(search)
        );
    }, [patients, patientSearch]);

    const addDiagnostic = () => {
        if (!diagInput.trim()) return;
        const current = form.getValues('diagnosticos');
        form.setValue('diagnosticos', [...current, diagInput.trim()]);
        setDiagInput('');
    };

    const removeDiagnostic = (index: number) => {
        const current = form.getValues('diagnosticos');
        form.setValue('diagnosticos', current.filter((_, i) => i !== index));
    };

    // Mutation
    const createMutation = useMutation({
        mutationFn: (payload: CreateClinicalHistoryRequest) => clinicalHistoryApi.create(payload),
        onSuccess: () => {
            toast.success('Historia clínica creada correctamente');
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
            navigate('/clinical-history');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al guardar la historia clínica');
        }
    });

    const onSubmit = async (values: ClinicalHistoryFormValues) => {
        const payload: CreateClinicalHistoryRequest = {
            fecha: new Date().toISOString(),
            patientId: values.patientId,
            doctorId: values.doctorId,
            specialty: values.specialty,
            formData: {
                motivoConsulta: values.motivoConsulta,
                enfermedadActual: values.enfermedadActual,
                diagnosticos: values.diagnosticos,
                datosEspecificos: values.formData?.datosEspecificos || {},
                antecedentesPersonales: {
                    asma: values.asma ? 'Sí' : 'No',
                    alergias: values.alergias || 'Ninguna',
                },
                habitos: {
                    tabaquismo: values.tabaquismo || 'N/A',
                    ejercicio: values.ejercicio || 'N/A',
                },
                examenFisico: {
                    presionArterial: values.presionArterial || 'N/A',
                    frecuenciaCardiaca: values.frecuenciaCardiaca || 'N/A',
                    peso: values.peso || 'N/A',
                    altura: values.altura || 'N/A',
                },
                planManejo: {
                    examenes: values.examenes || 'Ninguno',
                    medicacion: values.medicacion || 'Ninguna',
                }
            },
        };
        createMutation.mutate(payload);
    };

    const selectedPatient = patients.find(p => p.id === selectedPatientId);
    const selectedDoctor = doctors.find(d => d.id === form.watch('doctorId'));

    const isLoading = isLoadingPatients || isLoadingDoctors || (!!selectedSpecialty && isLoadingTemplate);

    return {
        form,
        patients,
        doctors,
        template,
        isLoading,
        isSubmitting: createMutation.isPending,
        patientSearch,
        setPatientSearch,
        isPatientListOpen,
        setIsPatientListOpen,
        diagInput,
        setDiagInput,
        filteredPatients,
        selectedPatient,
        selectedDoctor,
        addDiagnostic,
        removeDiagnostic,
        onSubmit,
        user,
    };
}
