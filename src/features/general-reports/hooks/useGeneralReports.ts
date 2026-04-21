import { useQuery } from '@tanstack/react-query';
import { generalReportsApi } from '../api/general-reports.api';

export const useGeneralReports = (timeframe: string = '6m', startDate?: string, endDate?: string) => {
  const summaryQuery = useQuery({
    queryKey: ['reports-summary', timeframe, startDate, endDate],
    queryFn: () => generalReportsApi.getSummary(timeframe, startDate, endDate),
  });

  const specialtyQuery = useQuery({
    queryKey: ['reports-specialty', timeframe, startDate, endDate],
    queryFn: () => generalReportsApi.getSpecialtyDistribution(timeframe, startDate, endDate),
  });

  const demographicsQuery = useQuery({
    queryKey: ['reports-demographics', timeframe, startDate, endDate],
    queryFn: () => generalReportsApi.getDemographics(timeframe, startDate, endDate),
  });

  const trendsQuery = useQuery({
    queryKey: ['reports-trends', timeframe, startDate, endDate],
    queryFn: () => generalReportsApi.getTrends(timeframe, startDate, endDate),
  });

  const diagnosesQuery = useQuery({
    queryKey: ['reports-diagnoses', timeframe, startDate, endDate],
    queryFn: () => generalReportsApi.getTopDiagnoses(timeframe, startDate, endDate),
  });

  const appointmentsQuery = useQuery({
    queryKey: ['reports-appointments', timeframe, startDate, endDate],
    queryFn: () => generalReportsApi.getAppointmentsStats(timeframe, startDate, endDate),
  });

  const isLoading =
    summaryQuery.isLoading ||
    specialtyQuery.isLoading ||
    demographicsQuery.isLoading ||
    trendsQuery.isLoading ||
    diagnosesQuery.isLoading ||
    appointmentsQuery.isLoading;

  const isError =
    summaryQuery.isError ||
    specialtyQuery.isError ||
    demographicsQuery.isError ||
    trendsQuery.isError ||
    diagnosesQuery.isError ||
    appointmentsQuery.isError;

  return {
    summary: summaryQuery.data,
    specialties: specialtyQuery.data,
    demographics: demographicsQuery.data,
    trends: trendsQuery.data,
    diagnoses: diagnosesQuery.data,
    appointments: appointmentsQuery.data,
    isLoading,
    isError,
    refetchAll: () => {
      summaryQuery.refetch();
      specialtyQuery.refetch();
      demographicsQuery.refetch();
      trendsQuery.refetch();
      diagnosesQuery.refetch();
      appointmentsQuery.refetch();
    }
  };
};
