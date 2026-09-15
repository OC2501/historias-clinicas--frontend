export interface DashboardSummary {
  totalPatients: number;
  titularesCount?: number;
  beneficiariosCount?: number;
  totalConsultations: number;
  totalConsultasDirectas?: number;
  totalNotes?: number;
  totalHistories?: number;
  totalReposos?: number;
  totalDiasReposo?: number;
  repososActivosHoy?: number;
  repososCulminados?: number;
  activeDoctors: number;
  totalAppointments?: number;
  dischargeRate: number;
}

export interface SpecialtyDistribution {
  specialty: string;
  count: string | number;
}

export interface GerenciaDistribution {
  gerencia: string;
  totalConsultas: number;
  totalReposos: number;
  repososActivos?: number;
  repososCulminados?: number;
  totalDiasReposo: number;
}

export interface PatientDemographics {
  gender: {
    male: number;
    female: number;
    other: number;
  };
  ageRanges: {
    '0-12': number;
    '13-18': number;
    '19-60': number;
    '60+': number;
  };
  patientType?: {
    titulares: number;
    beneficiarios: number;
  };
  total?: number;
}

export interface ConsultationTrend {
  date: string;
  count: string | number;
}

export interface TopDiagnosis {
  name: string;
  count: number;
  repososCount?: number;
  totalDiasReposo?: number;
  category?: string;
}

export interface AppointmentStats {
  statusStats: {
    SCHEDULED: number;
    COMPLETED: number;
    CANCELLED: number;
    [key: string]: number;
  };
  byDay: {
    day: string;
    count: number;
  }[];
  total: number;
}
