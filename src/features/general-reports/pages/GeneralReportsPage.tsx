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
import { DischargeRateGauge } from "../components/DischargeRateGauge"
import { SpecialtyDistributionChart } from "../components/SpecialtyDistribution"
import { SpecialtyRadarChart } from "../components/SpecialtyRadarChart"
import { PatientGenderChart, PatientAgeChart } from "../components/PatientDemographics"
import { TopDiagnoses } from "../components/TopDiagnoses"
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
  Check
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import { GeneralReportDocument } from "../pdf/GeneralReportDocument"

export default function GeneralReportsPage() {
  const { user } = useAuth();
  const isDoctor = user?.organizationRole === OrganizationRole.DOCTOR;

  const [timeframe, setTimeframe] = useState<string>("6m");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setTimeframe("custom");
    } else if (!range) {
      setTimeframe("6m");
    }
  };

  const {
    summary,
    specialties,
    demographics,
    trends,
    diagnoses,
    appointments,
    isLoading,
    refetchAll
  } = useGeneralReports(timeframe, dateRange?.from?.toISOString(), dateRange?.to?.toISOString());

  const handleExportPDF = async () => {
    setIsExporting(true);
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
      setIsExporting(false);
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
    <div className="space-y-6 md:space-y-8 container mx-auto pt-4 pb-8 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      {/* Premium Header */}
      <div className="flex flex-col gap-6 md:gap-10 bg-card/40 backdrop-blur-3xl p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/40 shadow-2xl shadow-primary/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <FileBarChart className="h-40 md:h-60 w-40 md:w-60 -mr-10 md:-mr-20 -mt-10 md:-mt-20 rotate-12" />
        </div>

        {/* Top Section: Title & Icon */}
        <div className="flex items-center gap-4 md:gap-8 relative z-10">
          <div className="bg-primary shadow-2xl shadow-primary/40 p-3 md:p-5 rounded-2xl md:rounded-[2rem] rotate-1 group-hover:rotate-0 transition-transform duration-700">
            <FileBarChart className="h-7 w-7 md:h-12 md:w-12 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-foreground selection:bg-primary selection:text-white leading-none">
              Centro de Inteligencia
            </h1>
            <p className="mt-1 md:mt-2 text-muted-foreground font-black text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-50">
              Análisis dinámico de actividad clínica v2.0
            </p>
          </div>
        </div>

        {/* Middle Section: Timeframe Selector */}
        <div className="relative z-30 w-full xl:w-auto self-start md:mb-0 ">
          <Tabs value={timeframe} onValueChange={setTimeframe} className="w-full">
            <TabsList className="bg-muted/50 p-1.5 rounded-[1.25rem] w-full md:w-auto grid grid-cols-3 md:flex !h-auto gap-2 border border-white/10 shadow-inner">
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
                  className="group/tab rounded-xl md:rounded-[1.1rem] data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary px-3 md:px-5 py-3 md:py-0 h-10 md:h-11 flex flex-row items-center justify-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-tighter sm:tracking-wider transition-all duration-300"
                >
                  <Icon className="h-4 w-4 opacity-50 group-data-[state=active]/tab:opacity-100 group-data-[state=active]/tab:scale-110 transition-all" />
                  <span>{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bottom Section: Action Filters */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 md:gap-8 relative z-10 pt-6 md:pt-10 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 md:gap-6 w-full xl:w-auto">
            {/* Date Picker Container */}
            <div className="w-full md:w-auto shrink-0 relative z-20">
              <DatePickerWithRange
                date={dateRange}
                setDate={handleDateChange}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 w-full xl:w-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-12 md:h-14 w-12 md:w-14 shrink-0 rounded-xl md:rounded-[1.5rem] border-2 bg-card/50 hover:bg-muted font-bold transition-all hover:scale-110 active:scale-90 shadow-lg shadow-black/5"
              onClick={refetchAll}
              title="Actualizar datos"
            >
              <RefreshCw className="h-5 w-5 md:h-6 md:w-6 opacity-70" />
            </Button>
            <Button
              size="lg"
              className="flex-1 xl:flex-none px-6 md:px-10 rounded-xl md:rounded-[1.5rem] h-12 md:h-14 font-black tracking-tight bg-primary text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer transition-transform" />

              <div className="relative z-10 flex items-center justify-center gap-2 md:gap-4">
                {isExporting ? (
                  <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" />
                ) : (
                  <Download className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:-translate-y-1 group-hover:scale-110" />
                )}
                <span className="uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-[12px] font-black">
                  {isExporting ? 'Procesando...' : 'Exportar Dashboard'}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8">
        {/* Top Section: Stats & Gauge */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-8 group/stats">
            <StatsCards data={summary} isDoctor={isDoctor} />
          </div>
          <div className="lg:col-span-4 group/gauge">
            <DischargeRateGauge rate={summary?.dischargeRate} />
          </div>
        </div>

        {/* Charts Matrix */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 items-stretch">
          {/* Trends takes full width in a 2-col grid */}
          <div className="lg:col-span-2 hover:scale-[1.01] transition-transform duration-500">
            <ConsultationTrends data={trends} timeframe={timeframe} dateRange={dateRange} />
          </div>

          <div className="hover:scale-[1.01] transition-transform duration-500">
            {!isDoctor ? (
              <SpecialtyDistributionChart data={specialties} />
            ) : (
              <AppointmentsByDayChart data={appointments} />
            )}
          </div>

          <div className="hover:scale-[1.01] transition-transform duration-500">
            <PatientAgeChart data={demographics} />
          </div>

          <div className="hover:scale-[1.01] transition-transform duration-500">
            <PatientGenderChart data={demographics} />
          </div>

          <div className="hover:scale-[1.01] transition-transform duration-500">
            <TopDiagnoses data={diagnoses} />
          </div>

          <div className={cn(
            "hover:scale-[1.01] transition-transform duration-500",
            isDoctor ? "lg:col-span-2" : "lg:col-span-1"
          )}>
            <AppointmentStatsChart data={appointments} />
          </div>

          {!isDoctor && (
            <div className="hover:scale-[1.01] transition-transform duration-500">
              <SpecialtyRadarChart data={specialties} />
            </div>
          )}
        </div>
      </div>

      {/* Modern Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center py-10 px-8 text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-40 border-t border-border/20 gap-4">



      </div>
    </div>
  );
}
