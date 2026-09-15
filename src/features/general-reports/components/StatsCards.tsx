import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Stethoscope, Clock, Calendar } from "lucide-react"
import type { DashboardSummary } from "../types/reports.types"

interface StatsCardsProps {
  data: DashboardSummary | undefined;
  isDoctor?: boolean;
}

export function StatsCards({ data, isDoctor = false }: StatsCardsProps) {
  const allStats = [
    {
      title: "Total Pacientes",
      value: data?.totalPatients ?? 0,
      description: data?.titularesCount !== undefined 
        ? `${data.titularesCount} Titulares • ${data.beneficiariosCount || 0} Cargas` 
        : "Pacientes registrados",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      doctorVisible: true,
    },
    {
      title: "Atenciones Clínicas",
      value: data?.totalConsultations ?? 0,
      description: data?.totalConsultasDirectas !== undefined
        ? `${data.totalConsultasDirectas} Consultas • ${data.totalHistories || 0} Historias • ${data.totalNotes || 0} Notas`
        : "Total de atenciones",
      icon: Stethoscope,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      doctorVisible: true,
    },
    {
      title: "Reposos Médicos",
      value: data?.totalReposos ?? 0,
      description: data?.repososActivosHoy !== undefined
        ? `${data.repososActivosHoy} activos hoy • ${data.totalDiasReposo || 0} días ot.`
        : `${data?.totalDiasReposo ?? 0} días de reposo otorgados`,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      doctorVisible: true,
    },
    {
      title: "Citas Programadas",
      value: data?.totalAppointments ?? 0,
      description: data?.activeDoctors !== undefined
        ? `${data.activeDoctors} médicos en actividad`
        : "Citas registradas",
      icon: Calendar,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      doctorVisible: true,
    }
  ];

  const stats = isDoctor ? allStats.filter(s => s.doctorVisible) : allStats;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-full">
      {stats.map((stat, i) => {
        const isLastOdd = stats.length % 2 !== 0 && i === stats.length - 1;
        return (
          <Card 
            key={i} 
            className={`group relative overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 rounded-2xl${isLastOdd ? ' sm:col-span-2' : ''}`}
          >
            {/* Decorative background element */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-125 ${stat.bg}`} />
            
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-xl border transition-colors ${stat.bg} ${stat.border}`}>
                <stat.icon className={`h-4 w-4 ${stat.color} transition-transform group-hover:scale-110`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1 text-slate-900 dark:text-slate-100">{stat.value}</div>
              <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 truncate">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${stat.color.replace('text', 'bg').split(' ')[0]}`} />
                <span className="truncate">{stat.description}</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
