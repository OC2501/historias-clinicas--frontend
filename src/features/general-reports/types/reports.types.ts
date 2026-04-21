export interface DashboardSummary {
  totalPatients: number;
  totalConsultations: number;
  activeDoctors: number;
  dischargeRate: number;
}

export interface SpecialtyDistribution {
  specialty: string;
  count: string | number;
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
}

export interface ConsultationTrend {
  date: string;
  count: string | number;
}

export interface TopDiagnosis {
  name: string;
  count: number;
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
