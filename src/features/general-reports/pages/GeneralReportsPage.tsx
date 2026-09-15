"use client"

import { cn } from "@/lib/utils"

import { useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { format } from "date-fns"

import { useAuth } from "@/features/auth/hooks/useAuth"
import { OrganizationRole } from "@/types"
import { useGeneralReports } from "../hooks/useGeneralReports"
import { StatsCards } from "../components/StatsCards"
import { ConsultationTrends } from "../components/ConsultationTrends"
import { SpecialtyDistributionChart } from "../components/SpecialtyDistribution"
import { SpecialtyRadarChart } from "../components/SpecialtyRadarChart"
import { PatientGenderChart, PatientAgeChart } from "../components/PatientDemographics"
import { TopDiagnoses } from "../components/TopDiagnoses"
import { GerenciasDistributionChart } from "../components/GerenciasDistributionChart"
import { AppointmentStatsChart } from "../components/AppointmentStatsChart"
import { AppointmentsByDayChart } from "../components/AppointmentsByDayChart"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Download,
  FileBarChart,
  Loader2,
  History,
  Calendar,
  ClipboardList,
  Activity,
  FileText,
  Check,
  FileSpreadsheet,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { GeneralReportDocument } from "../pdf/GeneralReportDocument"
import { exportGeneralReportToExcel } from "../reports/GeneralReportExcel"
import { consultasApi } from "@/features/consultas/api/consultas.api"

export default function GeneralReportsPage() {
  const { user } = useAuth();
  const isDoctor = user?.organizationRole === OrganizationRole.DOCTOR;

  const [timeframe, setTimeframe] = useState<string>("1w");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setTimeframe("custom");
    } else if (!range) {
      setTimeframe("1w");
    }
  };

  const {
    summary,
    specialties,
    demographics,
    trends,
    diagnoses,
    gerencias,
    appointments,
    isLoading,
    refetchAll
  } = useGeneralReports(timeframe, dateRange?.from?.toISOString(), dateRange?.to?.toISOString());

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const blob = await pdf(
        <GeneralReportDocument
          summary={summary}
          specialties={specialties}
          demographics={demographics}
          appointments={appointments}
          trends={trends}
          diagnoses={diagnoses}
          timeframe={timeframe}
          isDoctor={isDoctor}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_General_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      let consultasData = undefined;
      try {
        const consultasRes = await consultasApi.getAll({
          startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
          limit: 2000,
        });
        consultasData = consultasRes.data?.data;
      } catch (err) {
        console.error('Error fetching period consultas for excel export:', err);
      }

      await exportGeneralReportToExcel({
        summary,
        gerencias,
        demographics,
        diagnoses,
        appointments,
        specialties,
        trends,
        consultas: consultasData,
        timeframe,
        dateRange,
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 container mx-auto py-8 lg:px-8">
        <div className="flex justify-between items-center bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
          <div className="space-y-3">
            <Skeleton className="h-10 w-80 rounded-xl" />
            <Skeleton className="h-5 w-96 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-40 rounded-2xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="h-[450px] rounded-3xl" />
          <Skeleton className="h-[450px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 container mx-auto pt-4 pb-8 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Premium Header */}
      <div className="flex flex-col gap-6 md:gap-8 bg-card/40 backdrop-blur-3xl p-5 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <FileBarChart className="h-40 md:h-60 w-40 md:w-60 -mr-10 md:-mr-20 -mt-10 md:-mt-20 rotate-12" />
        </div>

        {/* Top Section: Title & Icon */}
        <div className="flex items-center gap-4 md:gap-6 relative z-10">
          <div className="bg-primary shadow-xl shadow-primary/30 p-3 md:p-4 rounded-2xl">
            <FileBarChart className="h-7 w-7 md:h-9 md:w-9 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight">
              Centro de Inteligencia
            </h1>
            <p className="mt-0.5 text-muted-foreground font-bold text-[9px] md:text-[11px] tracking-wider uppercase opacity-70">
              Análisis y Vigilancia Epidemiológica Ocupacional
            </p>
          </div>
        </div>

        {/* Middle Section: Timeframe Selector */}
        <div className="relative z-20 w-full xl:w-auto self-start">
          <Tabs value={timeframe} onValueChange={(val) => { setDateRange(undefined); setTimeframe(val); }} className="w-full">
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto grid grid-cols-3 md:flex !h-auto gap-1 border border-slate-200/60 dark:border-slate-700 shadow-inner">
              {[
                { val: '1w', label: '7D', icon: History },
                { val: '1m', label: '1M', icon: Calendar },
                { val: '3m', label: '3M', icon: ClipboardList },
                { val: '6m', label: '6M', icon: Activity },
                { val: '9m', label: '9M', icon: FileText },
                { val: '1y', label: '1A', icon: Check },
              ].map(({ val, label, icon: Icon }) => (
                <TabsTrigger
                  key={val}
                  value={val}
                  className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary px-3 md:px-4 py-2 h-9 md:h-10 flex flex-row items-center justify-center gap-1.5 text-[11px] font-bold uppercase transition-all"
                >
                  <Icon className="h-3.5 w-3.5 opacity-60" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bottom Section: Action Filters */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 relative z-10 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
            {/* Date Picker Container */}
            <div className="w-full md:w-auto shrink-0 relative z-20">
              <DatePickerWithRange
                date={dateRange}
                setDate={handleDateChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full xl:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-card hover:bg-muted font-bold transition-all shadow-xs"
              onClick={refetchAll}
              title="Actualizar datos"
            >
              <RefreshCw className="h-4 w-4 opacity-70" />
            </Button>

            {/* Botón Exportar Excel */}
            <Button
              variant="outline"
              size="lg"
              className="flex-1 xl:flex-none px-4 rounded-xl h-11 font-bold text-xs border-emerald-600/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shadow-xs transition-all flex items-center gap-2"
              onClick={handleExportExcel}
              disabled={isExportingExcel || isLoading}
            >
              {isExportingExcel ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}</span>
            </Button>

            {/* Botón Exportar PDF */}
            <Button
              size="lg"
              className="flex-1 xl:flex-none px-5 rounded-xl h-11 font-bold text-xs bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-102 active:scale-98 flex items-center gap-2"
              onClick={handleExportPDF}
              disabled={isExportingPDF || isLoading}
            >
              {isExportingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExportingPDF ? 'Generando PDF...' : 'Exportar Informe PDF'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:gap-8">
        {/* Top Section: Stats Cards */}
        <div className="w-full group/stats">
          <StatsCards data={summary} isDoctor={isDoctor} />
        </div>

        {/* Charts Matrix */}
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2 items-stretch">
          {/* Trends takes full width in a 2-col grid */}
          <div className="lg:col-span-2">
            <ConsultationTrends data={trends} timeframe={timeframe} dateRange={dateRange} />
          </div>

          {/* Atenciones por Gerencia (Salud Ocupacional) */}
          <div className="lg:col-span-2">
            <GerenciasDistributionChart data={gerencias} />
          </div>

          <div>
            <TopDiagnoses data={diagnoses} />
          </div>

          <div>
            <PatientAgeChart data={demographics} />
          </div>

          <div>
            <PatientGenderChart data={demographics} />
          </div>

          <div className={cn(
            isDoctor ? "lg:col-span-2" : "lg:col-span-1"
          )}>
            <AppointmentStatsChart data={appointments} />
          </div>

          {!isDoctor && (
            <div>
              <SpecialtyDistributionChart data={specialties} />
            </div>
          )}

          {!isDoctor && (
            <div>
              <SpecialtyRadarChart data={specialties} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
