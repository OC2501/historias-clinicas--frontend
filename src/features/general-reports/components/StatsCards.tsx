import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, UserCheck, Activity } from "lucide-react"

interface StatsCardsProps {
  data: {
    totalPatients: number;
    totalConsultations: number;
    activeDoctors: number;
    dischargeRate: number;
  } | undefined;
  isDoctor?: boolean;
}

export function StatsCards({ data, isDoctor = false }: StatsCardsProps) {
  const allStats = [
    {
      title: "Total Pacientes",
      value: data?.totalPatients ?? 0,
      description: "Pacientes registrados",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      doctorVisible: true,
    },
    {
      title: "Consultas",
      value: data?.totalConsultations ?? 0,
      description: "Total de evoluciones",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      doctorVisible: true,
    },
    {
      title: "Médicos Activos",
      value: data?.activeDoctors ?? 0,
      description: "Profesionales de guardia",
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      doctorVisible: false,
    },
    {
      title: "Tasa de Altas",
      value: `${data?.dischargeRate ?? 0}%`,
      description: "Éxito clínico",
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      doctorVisible: true,
    }
  ];

  const stats = isDoctor ? allStats.filter(s => s.doctorVisible) : allStats;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 h-full">
      {stats.map((stat, i) => {
        const isLastOdd = stats.length % 2 !== 0 && i === stats.length - 1;
        return (
          <Card 
            key={i} 
            className={`group relative overflow-hidden border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 rounded-3xl${isLastOdd ? ' sm:col-span-2' : ''}`}
          >
            {/* Decorative background element */}
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-150 ${stat.bg}`} />
            
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <CardTitle className="text-[10px] font-black text-muted-foreground/70 uppercase tracking-[0.2em]">
                {stat.title}
              </CardTitle>
              <div className={`p-2.5 rounded-2xl border transition-colors ${stat.bg} ${stat.border}`}>
                <stat.icon className={`h-5 w-5 ${stat.color} transition-transform group-hover:rotate-12`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight mb-1">{stat.value}</div>
              <p className="text-[11px] text-muted-foreground font-bold flex items-center gap-1.5 uppercase opacity-80">
                <span className={`h-1.5 w-1.5 rounded-full ${stat.color.replace('text', 'bg')}`} />
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
