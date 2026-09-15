import type { Patient } from '@/features/patient/types/patient.types';
import type { Doctor } from '@/features/admin/types/doctor.types';
import type { User } from '@/features/admin/types/user.types';

export type TipoConsulta =
  | 'CHEQUEO_RUTINA'
  | 'CONTROL'
  | 'CURATIVA'
  | 'EMERGENCIA'
  | 'OCUPACIONAL'
  | 'OTRO';

export const TIPO_CONSULTA_LABELS: Record<TipoConsulta, string> = {
  CHEQUEO_RUTINA: 'Chequeo de Rutina',
  CONTROL: 'Control Médico',
  CURATIVA: 'Consulta Curativa',
  EMERGENCIA: 'Emergencia / Triaje',
  OCUPACIONAL: 'Evaluación Ocupacional',
  OTRO: 'Otro',
};

export const TIPO_CONSULTA_COLORS: Record<TipoConsulta, string> = {
  CHEQUEO_RUTINA: 'border-blue-500/30 bg-blue-50/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  CONTROL: 'border-emerald-500/30 bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  CURATIVA: 'border-amber-500/30 bg-amber-50/70 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  EMERGENCIA: 'border-rose-500/30 bg-rose-50/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  OCUPACIONAL: 'border-purple-500/30 bg-purple-50/70 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  OTRO: 'border-slate-500/30 bg-slate-50/70 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300',
};

export interface Consulta {
  id: string;
  fecha: string;
  hora?: string;
  tipoConsulta: TipoConsulta;
  motivoConsulta: string;
  sintomas?: string;

  // Signos Vitales
  presionArterial?: string;
  frecuenciaCardiaca?: string;
  frecuenciaRespiratoria?: string;
  temperatura?: string;
  saturacionOxigeno?: string;
  peso?: string;
  altura?: string;
  imc?: string;
  glucemia?: string;

  // Evaluación y Conducta
  examenFisico?: string;
  diagnostico?: string;
  diagnosticosSecundarios?: string[];
  tratamiento?: string;
  examenesSolicitados?: string;

  // Reposo Médico
  reposoMedico: boolean;
  diasReposo?: number;
  fechaInicioReposo?: string;
  fechaFinReposo?: string;

  observaciones?: string;
  proximoControl?: string;

  // Relaciones
  patient: Patient;
  doctor?: Doctor;
  nurseId?: string;
  nurse?: User;
  createdById?: string;
  createdBy?: User;
  organization?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultaRequest {
  fecha: string;
  hora?: string;
  patientId: string;
  doctorId?: string;
  nurseId?: string;
  tipoConsulta?: TipoConsulta;
  motivoConsulta: string;
  sintomas?: string;
  presionArterial?: string;
  frecuenciaCardiaca?: string;
  frecuenciaRespiratoria?: string;
  temperatura?: string;
  saturacionOxigeno?: string;
  peso?: string;
  altura?: string;
  imc?: string;
  glucemia?: string;
  examenFisico?: string;
  diagnostico?: string;
  diagnosticosSecundarios?: string[];
  tratamiento?: string;
  examenesSolicitados?: string;
  reposoMedico?: boolean;
  diasReposo?: number;
  fechaInicioReposo?: string;
  fechaFinReposo?: string;
  observaciones?: string;
  proximoControl?: string;
}

export type UpdateConsultaRequest = Partial<CreateConsultaRequest>;

export interface ConsultaStats {
  totalHoy: number;
  totalAtenciones?: number;
  totalMes: number;
  totalReposos: number;
  totalDiasReposo?: number;
  totalRepososActivosHoy?: number;
  promedioDiario: number;
}
