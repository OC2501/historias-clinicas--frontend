import { api } from '@/api/axios';
import type {
  DashboardSummary,
  SpecialtyDistribution,
  PatientDemographics,
  ConsultationTrend,
  TopDiagnosis,
  AppointmentStats
} from '../types/reports.types';

export const generalReportsApi = {
  getSummary: async (timeframe: string = '6m', startDate?: string, endDate?: string) => {
    const { data } = await api.get<DashboardSummary>('/general-reports/summary', { params: { timeframe, startDate, endDate } });
    return data;
  },

  getSpecialtyDistribution: async (timeframe: string = '6m', startDate?: string, endDate?: string) => {
    const { data } = await api.get<SpecialtyDistribution[]>('/general-reports/specialty-distribution', { params: { timeframe, startDate, endDate } });
    return data;
  },

  getDemographics: async (timeframe: string = '6m', startDate?: string, endDate?: string) => {
    const { data } = await api.get<PatientDemographics>('/general-reports/demographics', { params: { timeframe, startDate, endDate } });
    return data;
  },

  getTrends: async (timeframe: string = '6m', startDate?: string, endDate?: string) => {
    const { data } = await api.get<ConsultationTrend[]>('/general-reports/trends', { params: { timeframe, startDate, endDate } });
    return data;
  },

  getTopDiagnoses: async (timeframe: string = '6m', startDate?: string, endDate?: string) => {
    const { data } = await api.get<TopDiagnosis[]>('/general-reports/top-diagnoses', { params: { timeframe, startDate, endDate } });
    return data;
  },

  getAppointmentsStats: async (timeframe: string = '6m', startDate?: string, endDate?: string) => {
    const { data } = await api.get<AppointmentStats>('/general-reports/appointments-stats', { params: { timeframe, startDate, endDate } });
    return data;
  },
};
