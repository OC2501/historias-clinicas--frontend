import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  Calendar,
  ChevronRight,
  ChevronsUpDown,
  Check,
  ClipboardList,
  Clock,
  Heart,
  Loader2,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
  User,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi, doctorsApi, usersApi } from '@/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { OrganizationRole, SystemRole } from '@/types';
import { cn, safeFormat } from '@/lib/utils';
import { PatientSelector } from '@/components/shared/PatientSelector';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveBadge } from '@/components/shared/AutoSaveBadge';
import { DraftRecoveryBanner } from '@/components/shared/DraftRecoveryBanner';
import { consultaSchema, type ConsultaFormValues } from '../types/consultas.schema';
import type { Consulta, TipoConsulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS } from '../types/consultas.type';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface ConsultasFormProps {
  initialData?: Consulta | null;
  initialPatientId?: string;
  onSubmit: (data: ConsultaFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type TabKey = 'general' | 'vitales' | 'evaluacion' | 'tratamiento' | 'reposo';

interface TabItem {
  id: TabKey;
  titulo: string;
  subtitulo: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  {
    id: 'general',
    titulo: 'Datos Generales',
    subtitulo: 'Identificación del paciente, médico y datos de la atención.',
    icon: User,
  },
  {
    id: 'vitales',
    titulo: 'Signos Vitales',
    subtitulo: 'Constantes biométricas del triaje y cálculo de IMC.',
    icon: Activity,
  },
  {
    id: 'evaluacion',
    titulo: 'Evaluación Clínica',
    subtitulo: 'Motivo de consulta, sintomatología y diagnóstico.',
    icon: Stethoscope,
  },
  {
    id: 'tratamiento',
    titulo: 'Tratamiento y Receta',
    subtitulo: 'Prescripción farmacológica e indicaciones terapéuticas.',
    icon: Pill,
  },
  {
    id: 'reposo',
    titulo: 'Reposo y Control',
    subtitulo: 'Incapacidad médica laboral y fecha de próximo control.',
    icon: ShieldAlert,
  },
];

export function ConsultasForm({
  initialData,
  initialPatientId,
  onSubmit,
  onCancel,
  isSubmitting,
}: ConsultasFormProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [selectedPatientInfo, setSelectedPatientInfo] = useState<any>(
    initialData?.patient || null
  );

  // Si se inicializa con initialPatientId o initialData?.patient?.id y no hay selectedPatientInfo, cargarlo
  const effectiveInitialPatientId = initialPatientId || initialData?.patient?.id;
  const { data: initialPatientRes } = useQuery({
    queryKey: ['patient-initial', effectiveInitialPatientId],
    queryFn: () => patientsApi.getById(effectiveInitialPatientId!),
    enabled: !!effectiveInitialPatientId && !selectedPatientInfo,
  });

  // 2. Obtener lista de médicos
  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors-list-form'],
    queryFn: () => doctorsApi.getAll(),
  });

  const doctors = useMemo(() => {
    const raw = doctorsRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    return [];
  }, [doctorsRes]);

  // 2.1. Obtener lista de personal de enfermería
  const { data: nursesRes } = useQuery({
    queryKey: ['nurses-list-form'],
    queryFn: () => usersApi.getNurses(),
  });

  const nurses = useMemo(() => {
    const raw = nursesRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray((raw as any)?.data)) return (raw as any).data;
    return [];
  }, [nursesRes]);

  const isDoctor =
    user?.organizationRole === OrganizationRole.DOCTOR ||
    !!user?.doctorProfile;

  const isStrictDoctor =
    user?.organizationRole === OrganizationRole.DOCTOR &&
    user?.systemRole !== SystemRole.SUPERADMIN;

  const isNurse = user?.organizationRole === OrganizationRole.NURSE;
  const isStrictNurse = isNurse && user?.systemRole !== SystemRole.SUPERADMIN;

  // 3. Inicializar react-hook-form
  const form = useForm<ConsultaFormValues>({
    resolver: zodResolver(consultaSchema) as any,
    defaultValues: {
      fecha: initialData?.fecha
        ? safeFormat(initialData.fecha, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      hora: initialData?.hora || format(new Date(), 'hh:mm a'),
      patientId: initialPatientId || initialData?.patient?.id || '',
      doctorId:
        initialData?.doctor?.id ||
        (!initialData?.nurse?.id && user?.doctorProfile?.id ? user.doctorProfile.id : ''),
      nurseId:
        initialData?.nurse?.id ||
        (!initialData?.doctor?.id && isNurse ? user?.id : ''),
      tipoConsulta: (initialData?.tipoConsulta as TipoConsulta) || 'CHEQUEO_RUTINA',
      motivoConsulta: initialData?.motivoConsulta || '',
      sintomas: initialData?.sintomas || '',
      presionArterial: initialData?.presionArterial || '',
      frecuenciaCardiaca: initialData?.frecuenciaCardiaca || '',
      frecuenciaRespiratoria: initialData?.frecuenciaRespiratoria || '',
      temperatura: initialData?.temperatura || '',
      saturacionOxigeno: initialData?.saturacionOxigeno || '',
      peso: initialData?.peso || '',
      altura: initialData?.altura || '',
      imc: initialData?.imc || '',
      glucemia: initialData?.glucemia || '',
      examenFisico: initialData?.examenFisico || '',
      diagnostico: initialData?.diagnostico || '',
      tratamiento: initialData?.tratamiento || '',
      examenesSolicitados: initialData?.examenesSolicitados || '',
      reposoMedico: initialData?.reposoMedico || false,
      diasReposo: initialData?.diasReposo || 1,
      fechaInicioReposo: initialData?.fechaInicioReposo
        ? safeFormat(initialData.fechaInicioReposo, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      fechaFinReposo: initialData?.fechaFinReposo
        ? safeFormat(initialData.fechaFinReposo, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      observaciones: initialData?.observaciones || '',
      proximoControl: initialData?.proximoControl
        ? safeFormat(initialData.proximoControl, 'yyyy-MM-dd')
        : '',
    },
  });

  const isEditMode = Boolean(initialData?.id);
  const autoSave = useAutoSave<ConsultaFormValues>({
    form,
    draftKey: isEditMode ? `draft_consulta_edit_${initialData?.id}` : `draft_consulta_new_${user?.id || 'default'}`,
    debounceMs: 2000,
    enabled: !isEditMode,
  });

  const watchPeso = form.watch('peso');
  const watchAltura = form.watch('altura');
  const watchReposo = form.watch('reposoMedico');
  const watchDiasReposo = form.watch('diasReposo');
  const watchFechaInicio = form.watch('fechaInicioReposo');
  const watchPatientId = form.watch('patientId');
  const watchTipoConsulta = form.watch('tipoConsulta');
  const watchDoctorId = form.watch('doctorId');
  const watchNurseId = form.watch('nurseId');

  const evaluatorValue = useMemo(() => {
    if (watchDoctorId) return `doctor:${watchDoctorId}`;
    if (watchNurseId) return `nurse:${watchNurseId}`;
    return 'none';
  }, [watchDoctorId, watchNurseId]);

  const handleEvaluatorChange = (val: string) => {
    if (val.startsWith('doctor:')) {
      const docId = val.replace('doctor:', '');
      form.setValue('doctorId', docId, { shouldDirty: true, shouldValidate: true });
      form.setValue('nurseId', '', { shouldDirty: true, shouldValidate: true });
    } else if (val.startsWith('nurse:')) {
      const nId = val.replace('nurse:', '');
      form.setValue('nurseId', nId, { shouldDirty: true, shouldValidate: true });
      form.setValue('doctorId', '', { shouldDirty: true, shouldValidate: true });
    } else {
      form.setValue('doctorId', '', { shouldDirty: true, shouldValidate: true });
      form.setValue('nurseId', '', { shouldDirty: true, shouldValidate: true });
    }
  };

  // 3.3. Capturar fecha y hora exacta del momento de la atención al abrir el formulario
  useEffect(() => {
    if (initialData) {
      if (initialData.fecha) {
        form.setValue('fecha', safeFormat(initialData.fecha, 'yyyy-MM-dd'));
      }
      if (initialData.hora) {
        form.setValue('hora', initialData.hora);
      }
    } else {
      const now = new Date();
      form.setValue('fecha', format(now, 'yyyy-MM-dd'));
      form.setValue('hora', format(now, 'hh:mm a'));
    }
  }, [initialData, form]);

  // 3.4. Auto-seleccionar paciente si se recibe initialPatientId o initialData
  useEffect(() => {
    const targetPatientId = initialPatientId || initialData?.patient?.id;
    if (targetPatientId && !form.getValues('patientId')) {
      form.setValue('patientId', targetPatientId);
    }
  }, [initialPatientId, initialData, form]);

  useEffect(() => {
    if (initialPatientRes?.data && !selectedPatientInfo) {
      setSelectedPatientInfo(initialPatientRes.data);
      form.setValue('patientId', initialPatientRes.data.id);
    }
  }, [initialPatientRes, selectedPatientInfo, form]);

  // 3.5. Auto-seleccionar el médico tratante si el usuario autenticado es Doctor
  useEffect(() => {
    if (initialData?.doctor?.id) return; // Si estamos editando, respetar el médico previo

    if (isDoctor && doctors.length > 0) {
      const matchedDoctor = doctors.find(
        (d: any) =>
          (user?.doctorProfile?.id && d.id === user.doctorProfile.id) ||
          (d.user?.id && d.user.id === user?.id)
      );
      if (matchedDoctor && !form.getValues('doctorId')) {
        form.setValue('doctorId', matchedDoctor.id);
      }
    }
  }, [user, doctors, form, initialData, isDoctor]);

  // 4. Cálculo síncrono e instantáneo de IMC
  const calculatedImc = useMemo(() => {
    const pesoNum = parseFloat(String(watchPeso || '').replace(',', '.').trim());
    const alturaNum = parseFloat(String(watchAltura || '').replace(',', '.').trim());

    if (!isNaN(pesoNum) && !isNaN(alturaNum) && pesoNum > 0 && alturaNum > 0) {
      const alturaMetros = alturaNum > 3 ? alturaNum / 100 : alturaNum;
      if (alturaMetros >= 0.3 && alturaMetros <= 2.8) {
        return (pesoNum / (alturaMetros * alturaMetros)).toFixed(1);
      }
    }
    return '';
  }, [watchPeso, watchAltura]);

  // Sincronizar con react-hook-form para el envío
  useEffect(() => {
    form.setValue('imc', calculatedImc, { shouldValidate: true });
  }, [calculatedImc, form]);

  // 5. Cálculo automático de fecha fin de reposo
  useEffect(() => {
    if (watchReposo && watchFechaInicio && watchDiasReposo) {
      try {
        const cleanStr = String(watchFechaInicio).trim();
        const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        let startDate: Date;
        if (match) {
          startDate = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 12, 0, 0);
        } else {
          startDate = new Date(watchFechaInicio);
        }

        if (!isNaN(startDate.getTime())) {
          const days = Math.max(1, Number(watchDiasReposo));
          const endDate = addDays(startDate, days);
          form.setValue('fechaFinReposo', format(endDate, 'yyyy-MM-dd'));
        }
      } catch {
        // Ignorar
      }
    }
  }, [watchReposo, watchFechaInicio, watchDiasReposo, form]);

  // 6. Limpiar información del paciente si se remueve
  useEffect(() => {
    if (!watchPatientId && selectedPatientInfo) {
      setSelectedPatientInfo(null);
    }
  }, [watchPatientId, selectedPatientInfo]);

  // Clasificación oficial según la OMS (Organización Mundial de la Salud)
  const getImcClassification = (imcStr?: string) => {
    if (!imcStr) return null;
    const imc = parseFloat(imcStr);
    if (isNaN(imc) || imc <= 0) return null;

    if (imc < 18.5) {
      return {
        label: 'Bajo Peso',
        color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
      };
    }
    if (imc < 25.0) {
      return {
        label: 'Peso Normal (Saludable)',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
      };
    }
    if (imc < 30.0) {
      return {
        label: 'Sobrepeso',
        color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300',
      };
    }
    if (imc < 35.0) {
      return {
        label: 'Obesidad Grado I',
        color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300',
      };
    }
    if (imc < 40.0) {
      return {
        label: 'Obesidad Grado II',
        color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
      };
    }
    return {
      label: 'Obesidad Grado III (Mórbida)',
      color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-200',
    };
  };

  const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
  const activeTabItem = TABS[currentTabIndex];

  const handleNextTab = () => {
    if (currentTabIndex < TABS.length - 1) {
      setActiveTab(TABS[currentTabIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS[currentTabIndex - 1].id);
    }
  };

  const handleFormSubmit = async (values: ConsultaFormValues) => {
    await onSubmit(values);
    autoSave.clearDraft();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* ═══════════════════════════════════════════════
            1. ENCABEZADO SUPERIOR
        ═══════════════════════════════════════════════ */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-2xl font-black tracking-wider sm:tracking-widest text-slate-900 dark:text-slate-100 uppercase truncate">
                  {initialData ? 'Editar Consulta' : 'Nueva Consulta / Chequeo'}
                </h2>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                  {TIPO_CONSULTA_LABELS[watchTipoConsulta] || 'Chequeo'}
                </Badge>
                <AutoSaveBadge
                  status={autoSave.status}
                  lastSaved={autoSave.lastSaved}
                  isRemote={isEditMode}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" />
                  5 secciones
                </span>
                {selectedPatientInfo && (
                  <span className="flex items-center gap-1 text-primary font-bold truncate max-w-[200px] sm:max-w-none">
                    <User className="h-3 w-3" />
                    {selectedPatientInfo.firstName} {selectedPatientInfo.lastName} (C.I: {selectedPatientInfo.identificationNumber || 'S/D'})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── NAVEGADOR DE PASOS EN MÓVIL (100% ANCHO, CERO SCROLL) ── */}
        <div className="md:hidden flex flex-col gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-850/50 border-b border-slate-200/80 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                {currentTabIndex + 1}
              </span>
              <span>{activeTabItem.titulo}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Paso {currentTabIndex + 1} de {TABS.length}
            </span>
          </div>

          {/* 5 Segmentos interactivos */}
          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
            {TABS.map((tab, idx) => {
              const isCurrent = idx === currentTabIndex;
              const isPast = idx < currentTabIndex;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.titulo}
                  className={cn(
                    'h-2 rounded-full transition-all cursor-pointer',
                    isCurrent
                      ? 'bg-primary ring-2 ring-primary/20'
                      : isPast
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            2. CUERPO (SIDEBAR ESCRITORIO + PANEL PRINCIPAL)
        ═══════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0">
          {/* ── SIDEBAR IZQUIERDO CON TABS (SOLO ESCRITORIO) ── */}
          <div className="hidden md:flex w-72 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 md:overflow-hidden">
            {/* Resumen Paciente en Sidebar */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-850/30">
              <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                Paciente Evaluado
              </p>
              {selectedPatientInfo ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {selectedPatientInfo.firstName} {selectedPatientInfo.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    C.I: {selectedPatientInfo.identificationNumber || 'S/D'} • {selectedPatientInfo.gerencia || 'Sin Gerencia'}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Seleccione paciente en Datos Generales
                </p>
              )}
            </div>

            {/* Lista de Navegación por Secciones */}
            <div className="md:flex-1 md:overflow-y-auto py-4 px-3 space-y-1">
              <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2 px-2">
                Secciones del Chequeo
              </p>

              {TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-primary-foreground' : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 text-xs font-bold uppercase tracking-wider truncate',
                        isActive ? 'text-primary-foreground font-semibold' : 'text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {`${idx + 1}. ${tab.titulo}`}
                    </span>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PANEL DERECHO CON FORMULARIO POR SECCIÓN ── */}
          <div className="flex-1 flex flex-col overflow-y-auto md:overflow-hidden bg-slate-50/30 dark:bg-slate-950/20">
            {/* Título de la Sección Activa */}
            <div className="px-4 sm:px-10 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs">
              <h3 className="text-xl sm:text-3xl font-black tracking-wider sm:tracking-widest text-slate-900 dark:text-slate-100 uppercase">
                {activeTabItem.titulo}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                {activeTabItem.subtitulo}
              </p>
            </div>

            {/* Contenido de Campos de la Sección */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-4 sm:py-6 space-y-6">
              {autoSave.hasDraft && !isEditMode && (
                <DraftRecoveryBanner
                  draftTimestamp={autoSave.draftTimestamp}
                  onRestore={autoSave.restoreDraft}
                  onDiscard={autoSave.discardDraft}
                  itemName="consulta médica"
                />
              )}

              {/* ──────────────────────────────────────────────────────────
                  SECCIÓN 1: DATOS GENERALES
              ────────────────────────────────────────────────────────── */}
              {activeTab === 'general' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Selector de Paciente con Buscador y Pestañas por Categoría */}
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Paciente *
                        </p>
                        <FormControl>
                          <PatientSelector
                            value={field.value}
                            selectedPatient={selectedPatientInfo}
                            showDetailsCard={false}
                            onChange={(patientId, patient) => {
                              field.onChange(patientId);
                              if (patient) setSelectedPatientInfo(patient);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Ficha Resumen del Paciente */}
                  {selectedPatientInfo && (
                    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-bold block">
                            Cédula
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedPatientInfo.identificationNumber || 'S/D'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-bold block">
                            Gerencia
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {selectedPatientInfo.gerencia || 'No asignada'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-bold block">
                            Cargo
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                            {selectedPatientInfo.cargo || 'No registrado'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase text-[9px] font-bold block">
                            Género
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedPatientInfo.gender === 'MALE' ||
                              selectedPatientInfo.gender === 'M' ||
                              selectedPatientInfo.gender === 'Masculino'
                              ? 'Masculino'
                              : selectedPatientInfo.gender === 'FEMALE' ||
                                selectedPatientInfo.gender === 'F' ||
                                selectedPatientInfo.gender === 'Femenino'
                                ? 'Femenino'
                                : selectedPatientInfo.gender || '—'}
                          </span>
                        </div>
                      </div>

                      {selectedPatientInfo.patientType === 'BENEFICIARIO' && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                            Beneficiario: {selectedPatientInfo.relationship || 'Carga Familiar'}
                          </span>
                          {selectedPatientInfo.titular && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              Titular: <b>{selectedPatientInfo.titular.firstName} {selectedPatientInfo.titular.lastName}</b> (C.I: {selectedPatientInfo.titular.identificationNumber || 'S/D'})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Médico / Evaluador */}
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                          Médico / Evaluador
                        </p>
                        {isDoctor ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold py-0 border-primary/30 text-primary bg-primary/5"
                          >
                            Mi perfil asignado
                          </Badge>
                        ) : isNurse ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-bold py-0 border-cyan-400 text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-300"
                          >
                            Mi perfil de enfermería asignado
                          </Badge>
                        ) : null}
                      </div>
                      <Select
                        onValueChange={handleEvaluatorChange}
                        value={evaluatorValue}
                        disabled={isStrictDoctor}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={cn(
                              "h-10 text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800",
                              isStrictDoctor && "opacity-90 bg-slate-50 dark:bg-slate-800/60"
                            )}
                          >
                            <SelectValue placeholder="Seleccionar evaluador..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {doctors.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-xs font-bold text-slate-400 uppercase">
                                Médicos
                              </SelectLabel>
                              {doctors.map((doc: any) => (
                                <SelectItem key={doc.id} value={`doctor:${doc.id}`}>
                                  {doc.user?.name ? `Dr(a). ${doc.user.name}` : `Dr. (${doc.specialty || 'General'})`}
                                  {user?.id === doc.user?.id ? ' (Tú)' : ''}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {nurses.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-xs font-bold text-slate-400 uppercase">
                                Personal de Enfermería
                              </SelectLabel>
                              {nurses.map((nurse: any) => (
                                <SelectItem key={nurse.id} value={`nurse:${nurse.id}`}>
                                  {nurse.name} (Enfermería)
                                  {user?.id === nurse.id ? ' (Tú)' : ''}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>

                    {/* Tipo de Consulta */}
                    <FormField
                      control={form.control}
                      name="tipoConsulta"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Tipo de Chequeo *
                          </p>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 text-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                                <SelectValue placeholder="Tipo de chequeo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(TIPO_CONSULTA_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fecha de Atención */}
                    <FormField
                      control={form.control}
                      name="fecha"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Fecha de Atención *
                          </p>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Hora */}
                    <FormField
                      control={form.control}
                      name="hora"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Hora
                          </p>
                          <FormControl>
                            <Input
                              placeholder="Ej. 08:30 AM"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  SECCIÓN 2: SIGNOS VITALES
              ────────────────────────────────────────────────────────── */}
              {activeTab === 'vitales' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Banner de Estado Nutricional / IMC */}
                  {(() => {
                    const imcValue = calculatedImc;
                    const classification = getImcClassification(imcValue);

                    return (
                      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase block">
                            Índice de Masa Corporal (IMC)
                          </span>
                          {imcValue ? (
                            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                              {imcValue}{' '}
                              <span className="text-xs font-normal text-slate-400">kg/m²</span>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                              Ingrese Peso (kg) y Talla (cm) abajo para calcular automáticamente.
                            </div>
                          )}
                        </div>
                        {classification ? (
                          <Badge
                            variant="outline"
                            className={`font-bold px-3 py-1.5 text-xs border self-start sm:self-center ${classification.color}`}
                          >
                            {classification.label}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-medium px-3 py-1 text-xs border border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-500 self-start sm:self-center"
                          >
                            Pendiente de datos
                          </Badge>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Presión Arterial */}
                    <FormField
                      control={form.control}
                      name="presionArterial"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Presión Arterial (mmHg)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="120/80"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Frecuencia Cardíaca */}
                    <FormField
                      control={form.control}
                      name="frecuenciaCardiaca"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Frec. Cardíaca (bpm)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="75"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Frecuencia Respiratoria */}
                    <FormField
                      control={form.control}
                      name="frecuenciaRespiratoria"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Frec. Respiratoria (rpm)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="16"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Temperatura */}
                    <FormField
                      control={form.control}
                      name="temperatura"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Temperatura (°C)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="36.5"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Saturación O2 */}
                    <FormField
                      control={form.control}
                      name="saturacionOxigeno"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Saturación O2 (%)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="98"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Peso */}
                    <FormField
                      control={form.control}
                      name="peso"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Peso (kg)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="70"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Altura / Talla */}
                    <FormField
                      control={form.control}
                      name="altura"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Talla / Altura (cm)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="175"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Glucemia */}
                    <FormField
                      control={form.control}
                      name="glucemia"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Glucemia (mg/dL)
                          </p>
                          <FormControl>
                            <Input
                              placeholder="Ej. 95"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  SECCIÓN 3: EVALUACIÓN CLÍNICA Y DIAGNÓSTICO
              ────────────────────────────────────────────────────────── */}
              {activeTab === 'evaluacion' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Motivo de Consulta */}
                  <FormField
                    control={form.control}
                    name="motivoConsulta"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Motivo del Chequeo / Consulta *
                        </p>
                        <FormControl>
                          <Input
                            placeholder="Ej. Control de tensión arterial, chequeo preventivo, cefalea..."
                            className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 font-medium"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Síntomas y Anamnesis */}
                  <FormField
                    control={form.control}
                    name="sintomas"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Sintomatología / Evolución Actual
                        </p>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Detalles de los síntomas referidos por el trabajador..."
                            className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Examen Físico */}
                  <FormField
                    control={form.control}
                    name="examenFisico"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Hallazgos al Examen Físico
                        </p>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Inspección cardiopulmonar, abdomen, osteomuscular, etc..."
                            className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Diagnóstico Principal */}
                  <FormField
                    control={form.control}
                    name="diagnostico"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Diagnóstico Principal
                        </p>
                        <FormControl>
                          <Input
                            placeholder="Ej. Chequeo Ocupacional Normal / Hipertensión Arterial Grado I..."
                            className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 font-semibold text-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  SECCIÓN 4: TRATAMIENTO Y RECETA
              ────────────────────────────────────────────────────────── */}
              {activeTab === 'tratamiento' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Prescripción Médica */}
                  <FormField
                    control={form.control}
                    name="tratamiento"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Indicaciones Farmacológicas / Recipe Médico
                        </p>
                        <FormControl>
                          <Textarea
                            rows={5}
                            placeholder="1. Medicamento X 500mg — Tomar 1 tableta cada 8 horas por 3 días.&#10;2. Recomendaciones de hidratación..."
                            className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm font-mono leading-relaxed"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Exámenes Solicitados */}
                  <FormField
                    control={form.control}
                    name="examenesSolicitados"
                    render={({ field }) => (
                      <FormItem>
                        <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                          Exámenes Paraclínicos Solicitados (Opcional)
                        </p>
                        <FormControl>
                          <Input
                            placeholder="Ej. Perfil lipídico, Glucemia en ayunas, Radiografía de tórax..."
                            className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  SECCIÓN 5: REPOSO Y CONTROL
              ────────────────────────────────────────────────────────── */}
              {activeTab === 'reposo' && (
                <div className="space-y-6 max-w-3xl">
                  {/* Switch Reposo */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                        ¿Se otorga Reposo Médico Laboral?
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">
                        Genera constancia médica oficial y cálculo de días de incapacidad.
                      </span>
                    </div>
                    <FormField
                      control={form.control}
                      name="reposoMedico"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Campos de Reposo */}
                  {watchReposo && (
                    <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in-50">
                      <FormField
                        control={form.control}
                        name="diasReposo"
                        render={({ field }) => (
                          <FormItem>
                            <p className="text-[10px] font-bold tracking-widest text-rose-800 dark:text-rose-300 uppercase mb-1">
                              Días de Reposo *
                            </p>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={30}
                                className="h-10 border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 font-bold"
                                {...field}
                                value={field.value ?? 1}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaInicioReposo"
                        render={({ field }) => (
                          <FormItem>
                            <p className="text-[10px] font-bold tracking-widest text-rose-800 dark:text-rose-300 uppercase mb-1">
                              Fecha Inicio Reposo
                            </p>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10 border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fechaFinReposo"
                        render={({ field }) => (
                          <FormItem>
                            <p className="text-[10px] font-bold tracking-widest text-rose-800 dark:text-rose-300 uppercase mb-1">
                              Fecha Fin / Reincorporación
                            </p>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-10 border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recomendaciones */}
                    <FormField
                      control={form.control}
                      name="observaciones"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Recomendaciones u Observaciones
                          </p>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Recomendaciones preventivas o instrucciones al trabajador..."
                              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    {/* Próximo Control */}
                    <FormField
                      control={form.control}
                      name="proximoControl"
                      render={({ field }) => (
                        <FormItem>
                          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            Próximo Control Sugerido
                          </p>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            3. FOOTER INFERIOR
        ═══════════════════════════════════════════════ */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-2 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {currentTabIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevTab}
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider gap-1 sm:gap-2 h-9 sm:h-10 px-2.5 sm:px-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden xs:inline">Anterior</span>
              </Button>
            )}

            {currentTabIndex < TABS.length - 1 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleNextTab}
                className="text-[11px] sm:text-xs font-bold uppercase tracking-wider gap-1 sm:gap-2 h-9 sm:h-10 px-3 sm:px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
              >
                <span>Siguiente</span> <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 sm:gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] sm:text-xs font-black tracking-wider uppercase px-3 sm:px-8 py-2 sm:py-2.5 rounded-xl transition-all shadow-md shadow-primary/25 disabled:opacity-60 h-9 sm:h-10 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">{initialData ? 'Actualizar Consulta' : 'Guardar Consulta'}</span>
                  <span className="sm:hidden">{initialData ? 'Guardar' : 'Guardar'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Form>
  );
}
