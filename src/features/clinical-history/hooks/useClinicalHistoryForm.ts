import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalHistoryApi, patientsApi, doctorsApi, specialtiesApi } from '@/api';
import type { Patient, Doctor, CreateClinicalHistoryRequest, TemplateStructure, SpecialtyTemplate, PatientDocument } from '@/types';
import { OrganizationRole } from '@/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useAutoSave } from '@/hooks/useAutoSave';
import { toast } from 'sonner';
import { getCaracasDate, safeFormat } from '@/lib/utils';

import { clinicalHistorySchema, type ClinicalHistoryFormValues } from '../types/clinical-history.schema';

export function useClinicalHistoryForm() {
    const navigate = useNavigate();
    const { id: editHistoryId } = useParams<{ id?: string }>();
    const isEditMode = Boolean(editHistoryId);

    const [searchParams] = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [patientSearch, setPatientSearch] = useState('');
    const debouncedPatientSearch = useDebounce(patientSearch.trim(), 200);
    const [isPatientListOpen, setIsPatientListOpen] = useState(false);
    const [diagInput, setDiagInput] = useState('');
    
    // Gestión por plantilla
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
    const [lastAutoSelectedDoctorId, setLastAutoSelectedDoctorId] = useState<string>('');
    const [activeTemplate, setActiveTemplate] = useState<TemplateStructure | null>(null);
    const [documents, setDocuments] = useState<PatientDocument[]>([]);

    const form = useForm<ClinicalHistoryFormValues>({
        resolver: zodResolver(clinicalHistorySchema),
        defaultValues: {
            patientId: urlPatientId || '',
            doctorId: '',
            specialty: '',
            motivoConsulta: '',
            enfermedadActual: '',
            diagnosticos: [],
            antecedentesPersonales: '',
            antecedentesFamiliares: '',
            habitosPsicobiologicos: '',
            presionArterial: '',
            frecuenciaCardiaca: '',
            frecuenciaRespiratoria: '',
            temperatura: '',
            peso: '',
            altura: '',
            imc: '',
            saturacionOxigeno: '',
            otros: '',
            examenes: '',
            medicacion: '',
            formData: {
                datosEspecificos: {},
            },
        },
    });

    const selectedPatientId = form.watch('patientId');

    // 0. Cargar historia existente en modo edición
    const { data: existingHistoryRes, isLoading: isLoadingExisting } = useQuery({
        queryKey: ['clinical-history', editHistoryId],
        queryFn: () => clinicalHistoryApi.getById(editHistoryId!),
        enabled: isEditMode,
    });

    const existingHistory = useMemo(() => {
        if (!existingHistoryRes?.data) return undefined;
        return (existingHistoryRes.data as any).data || existingHistoryRes.data;
    }, [existingHistoryRes]);

    // 1. Query dinámica de pacientes contra la base de datos
    const { data: patientsRes, isLoading: isLoadingPatients } = useQuery({
        queryKey: ['patients-history-search', debouncedPatientSearch],
        queryFn: () => patientsApi.getAll({ search: debouncedPatientSearch || undefined, limit: 30 }),
    });

    // 1.1 Si hay un paciente seleccionado que no esté en la página actual, cargarlo
    const { data: singlePatientRes } = useQuery({
        queryKey: ['patient-single-history', selectedPatientId],
        queryFn: () => patientsApi.getById(selectedPatientId!),
        enabled: !!selectedPatientId && !isEditMode,
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    // Cargar todas las plantillas disponibles
    const { data: templatesRes, isLoading: isLoadingTemplates } = useQuery({
        queryKey: ['specialty-templates', { limit: 100 }],
        queryFn: () => specialtiesApi.getAll({ limit: 100 }),
    });

    const patients = useMemo(() => ((patientsRes?.data as any)?.data || patientsRes?.data || []) as Patient[], [patientsRes]);
    const doctors = useMemo(() => ((doctorsRes?.data as any)?.data || doctorsRes?.data || []) as Doctor[], [doctorsRes]);
    const templates = useMemo(() => ((templatesRes?.data as any)?.data || templatesRes?.data || []) as SpecialtyTemplate[], [templatesRes]);

    const selectedPatient = useMemo(() => {
        if (isEditMode && existingHistory?.patient) {
            return existingHistory.patient as Patient;
        }
        if (!selectedPatientId) return undefined;
        const found = patients.find(p => p.id === selectedPatientId);
        if (found) return found;
        if (singlePatientRes?.data) return singlePatientRes.data;
        return undefined;
    }, [isEditMode, existingHistory, selectedPatientId, patients, singlePatientRes]);

    const selectedDoctor = doctors.find(d => d.id === form.watch('doctorId'));

    // Precargar datos si estamos en modo edición
    useEffect(() => {
        if (!isEditMode || !existingHistory) return;

        const pId = existingHistory.patient?.id || existingHistory.patientId || '';
        const dId = existingHistory.doctor?.id || existingHistory.doctorId || '';
        const ef = existingHistory.examenFisico || {};
        const sv = ef.signosVitales || {};
        const pm = existingHistory.planManejo || {};

        form.reset({
            patientId: pId,
            doctorId: dId,
            specialty: existingHistory.specialty || '',
            motivoConsulta: existingHistory.motivoConsulta || '',
            enfermedadActual: existingHistory.enfermedadActual || '',
            diagnosticos: Array.isArray(existingHistory.diagnosticos) ? existingHistory.diagnosticos : [],
            antecedentesPersonales: typeof existingHistory.antecedentesPersonales === 'string'
                ? existingHistory.antecedentesPersonales
                : JSON.stringify(existingHistory.antecedentesPersonales || ''),
            antecedentesFamiliares: typeof existingHistory.antecedentesFamiliares === 'string'
                ? existingHistory.antecedentesFamiliares
                : JSON.stringify(existingHistory.antecedentesFamiliares || ''),
            habitosPsicobiologicos: typeof existingHistory.habitos === 'string'
                ? existingHistory.habitos
                : JSON.stringify(existingHistory.habitos || ''),
            presionArterial: sv.presionArterial || ef.presionArterial || '',
            frecuenciaCardiaca: sv.frecuenciaCardiaca || ef.frecuenciaCardiaca || '',
            frecuenciaRespiratoria: sv.frecuenciaRespiratoria || ef.frecuenciaRespiratoria || '',
            temperatura: sv.temperatura || ef.temperatura || '',
            peso: sv.peso || ef.peso || '',
            altura: sv.altura || ef.altura || '',
            imc: sv.imc || ef.imc || '',
            saturacionOxigeno: sv.saturacionOxigeno || ef.saturacionOxigeno || '',
            otros: ef.otros || ef.hallazgosPorSistema?.otros || '',
            examenes: pm.examenes || '',
            medicacion: pm.medicacion || '',
            formData: {
                datosEspecificos: existingHistory.datosEspecificos || {},
            },
        });

        if (existingHistory.templateId) {
            setSelectedTemplateId(existingHistory.templateId);
        } else if (existingHistory.specialty && templates.length > 0) {
            const matched = templates.find(t => t.specialty?.toUpperCase() === existingHistory.specialty?.toUpperCase() && t.specialty !== 'HISTORIA BÁSICA');
            if (matched) setSelectedTemplateId(matched.id);
        }

        const patientDocs = existingHistory.patient?.documents || selectedPatient?.documents || [];
        const patientDocsForHistory = (Array.isArray(patientDocs) ? patientDocs : []).filter(
            (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url) && d.clinicalHistoryId === editHistoryId
        );
        const historyDirectDocs = (Array.isArray(existingHistory.documents) ? existingHistory.documents : []).filter(
            (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url)
        );

        const allDocs = [...historyDirectDocs];
        patientDocsForHistory.forEach((pDoc: any) => {
            if (!allDocs.some((d: any) => (d.id && d.id === pDoc.id) || (d.url && d.url === pDoc.url))) {
                allDocs.push(pDoc);
            }
        });

        setDocuments(allDocs);
    }, [isEditMode, existingHistory, selectedPatient, templates, form, editHistoryId]);

    // Efecto para asignar doctor inicial (solo en creación)
    useEffect(() => {
        if (isEditMode) return;
        const isDoctor = user?.organizationRole === OrganizationRole.DOCTOR;
        if (isDoctor && doctors.length > 0) {
            const doctor = doctors.find((d: Doctor) => d.user?.id === user?.id);
            if (doctor) {
                form.setValue('doctorId', doctor.id);
            }
        }
    }, [isEditMode, user, doctors, form]);

    // Pre-seleccionar la plantilla si coincide con la especialidad del médico (solo en creación)
    useEffect(() => {
        if (isEditMode) return;
        if (!selectedDoctor || selectedDoctor.id === lastAutoSelectedDoctorId) return;

        const specialty = selectedDoctor.specialty;
        if (specialty && templates.length > 0) {
            const matchedTemplate = templates.find(
                t => t.specialty?.toUpperCase() === specialty.toUpperCase() && t.specialty !== 'HISTORIA BÁSICA'
            );
            if (matchedTemplate) {
                setSelectedTemplateId(matchedTemplate.id);
            } else {
                setSelectedTemplateId('none');
            }
            setLastAutoSelectedDoctorId(selectedDoctor.id);
        }
    }, [isEditMode, selectedDoctor, templates, lastAutoSelectedDoctorId]);

    // Actualizar la plantilla activa e inyectar especialidad al cambiar la selección
    useEffect(() => {
        if (!selectedTemplateId || selectedTemplateId === 'none') {
            setActiveTemplate(null);
            if (!isEditMode) {
                form.setValue('specialty', selectedDoctor?.specialty || 'General');
            }
            return;
        }
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
            setActiveTemplate(template.estructura);
            form.setValue('specialty', template.specialty || '');
        } else {
            setActiveTemplate(null);
            if (!isEditMode) {
                form.setValue('specialty', selectedDoctor?.specialty || 'General');
            }
        }
    }, [selectedTemplateId, templates, form, selectedDoctor, isEditMode]);

    const filteredPatients = useMemo(() => {
        if (!patientSearch.trim()) return patients;
        const rawQuery = patientSearch.toLowerCase().trim();
        const digitsOnlyQuery = rawQuery.replace(/\D/g, '');

        const scored = patients.map((p) => {
            const idClean = (p.identificationNumber || '').replace(/\D/g, '');
            const firstName = (p.firstName || '').toLowerCase();
            const lastName = (p.lastName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`.trim();
            const titularName = p.titular ? `${p.titular.firstName} ${p.titular.lastName}`.toLowerCase() : '';
            const titularId = p.titular?.identificationNumber ? p.titular.identificationNumber.replace(/\D/g, '') : '';

            let score = 0;
            let matchIndex = 999;

            if (digitsOnlyQuery.length > 0) {
                if (idClean.startsWith(digitsOnlyQuery) || titularId.startsWith(digitsOnlyQuery)) {
                    score = 1000;
                    matchIndex = 0;
                } else if (idClean.includes(digitsOnlyQuery) || titularId.includes(digitsOnlyQuery)) {
                    matchIndex = idClean.indexOf(digitsOnlyQuery);
                    score = 500;
                }
            }

            if (firstName.startsWith(rawQuery) || lastName.startsWith(rawQuery) || fullName.startsWith(rawQuery)) {
                score = Math.max(score, 400);
            } else if (fullName.includes(rawQuery) || titularName.includes(rawQuery)) {
                score = Math.max(score, 300);
            }

            return { patient: p, score, matchIndex };
        });

        return scored
            .filter(item => item.score > 0 || patients.length > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.patient);
    }, [patients, patientSearch]);

    // Cálculo automático de IMC
    const peso = form.watch('peso');
    const altura = form.watch('altura');

    useEffect(() => {
        if (peso && altura) {
            const p = parseFloat(peso);
            const a = parseFloat(altura);
            if (p > 0 && a > 0) {
                const heightInMeters = a > 3 ? a / 100 : a;
                if (heightInMeters >= 0.3 && heightInMeters <= 2.8) {
                    const imcValue = p / (heightInMeters * heightInMeters);
                    const currentImc = form.getValues('imc');
                    const newImc = imcValue.toFixed(1);
                    if (currentImc !== newImc) {
                        form.setValue('imc', newImc);
                    }
                }
            }
        }
    }, [peso, altura, form]);

    const addDiagnostic = () => {
        if (!diagInput.trim()) return;
        const current = form.getValues('diagnosticos') || [];
        form.setValue('diagnosticos', [...current, diagInput.trim()], { shouldDirty: true });
        setDiagInput('');
    };

    const removeDiagnostic = (index: number) => {
        const current = form.getValues('diagnosticos') || [];
        form.setValue('diagnosticos', current.filter((_, i) => i !== index), { shouldDirty: true });
    };

    // Constructor de carga útil unificado
    const buildPayload = useCallback((values: ClinicalHistoryFormValues): CreateClinicalHistoryRequest => {
        const historyDate = isEditMode && existingHistory?.fecha 
            ? safeFormat(existingHistory.fecha, 'yyyy-MM-dd', getCaracasDate()) 
            : getCaracasDate();

        return {
            fecha: historyDate,
            patientId: values.patientId,
            doctorId: values.doctorId,
            specialty: values.specialty,
            templateId: selectedTemplateId !== 'none' ? selectedTemplateId : undefined,
            documents,
            formData: {
                motivoConsulta: values.motivoConsulta || '',
                enfermedadActual: values.enfermedadActual || '',
                diagnosticos: values.diagnosticos || [],
                datosEspecificos: values.formData?.datosEspecificos || {},
                antecedentesFamiliares: values.antecedentesFamiliares || 'Ninguno',
                antecedentesPersonales: values.antecedentesPersonales || 'Ninguno',
                habitos: values.habitosPsicobiologicos || 'N/A',
                examenFisico: {
                    presionArterial: values.presionArterial || 'N/A',
                    frecuenciaCardiaca: values.frecuenciaCardiaca || 'N/A',
                    frecuenciaRespiratoria: values.frecuenciaRespiratoria || 'N/A',
                    saturacionOxigeno: values.saturacionOxigeno || 'N/A',
                    temperatura: values.temperatura || 'N/A',
                    peso: values.peso || 'N/A',
                    altura: values.altura || 'N/A',
                    imc: values.imc || 'N/A',
                    otros: values.otros || '',
                },
                planManejo: {
                    examenes: values.examenes || 'Ninguno',
                    medicacion: values.medicacion || 'Ninguna',
                },
            },
        };
    }, [isEditMode, existingHistory, selectedTemplateId, documents]);

    // Mutación de creación
    const createMutation = useMutation({
        mutationFn: (payload: CreateClinicalHistoryRequest) => clinicalHistoryApi.create(payload),
        onSuccess: (res) => {
            toast.success('Historia clínica creada correctamente');
            autoSave.clearDraft();
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            const newId = (res.data as any)?.data?.id || (res.data as any)?.id;
            if (newId) {
                navigate(`/clinical-history/${newId}`);
            } else {
                navigate('/clinical-history');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al guardar la historia clínica');
        }
    });

    // Mutación de actualización
    const updateMutation = useMutation({
        mutationFn: (payload: CreateClinicalHistoryRequest) => clinicalHistoryApi.update(editHistoryId!, payload),
        onSuccess: () => {
            toast.success('Historia clínica actualizada correctamente');
            autoSave.clearDraft();
            queryClient.invalidateQueries({ queryKey: ['clinical-history', editHistoryId] });
            queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            navigate(`/clinical-history/${editHistoryId}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Error al actualizar la historia clínica');
        }
    });

    // Hook de autoguardado en tiempo real (Estilo Word / Google Docs)
    const autoSave = useAutoSave<ClinicalHistoryFormValues>({
        form,
        draftKey: isEditMode 
            ? `draft_history_edit_${editHistoryId}` 
            : `draft_history_new_${user?.id || 'default'}`,
        onRemoteSave: isEditMode ? async (values) => {
            if (!editHistoryId) return;
            const payload = buildPayload(values);
            await clinicalHistoryApi.update(editHistoryId, payload);
            queryClient.invalidateQueries({ queryKey: ['clinical-history', editHistoryId] });
        } : undefined,
        debounceMs: 2000,
        enabled: isEditMode ? Boolean(existingHistory) : true,
        onCustomRestore: (draftData) => {
            form.reset(draftData);
            if (draftData.specialty && templates.length > 0) {
                const matched = templates.find(t => t.specialty?.toUpperCase() === draftData.specialty.toUpperCase());
                if (matched) setSelectedTemplateId(matched.id);
            }
        }
    });

    const onSubmit = async (values: ClinicalHistoryFormValues) => {
        const payload = buildPayload(values);
        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const isLoading = isLoadingPatients || isLoadingDoctors || isLoadingTemplates || (isEditMode && isLoadingExisting);

    return {
        form,
        patients,
        doctors,
        templates,
        isLoading,
        isSubmitting: createMutation.isPending || updateMutation.isPending,
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
        activeTemplate,
        selectedTemplateId,
        setSelectedTemplateId,
        isEditMode,
        existingHistory,
        autoSave,
        documents,
        setDocuments,
    };
}
