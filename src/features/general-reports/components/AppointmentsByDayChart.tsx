import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import type { AppointmentStats } from "../types/reports.types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import { ChartLegend, type LegendItem } from "./ChartLegend"
import { CustomPercentTooltip } from "./CustomPercentTooltip"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppointmentsByDayChartProps {
  data?: AppointmentStats;
}

export function AppointmentsByDayChart({ data }: AppointmentsByDayChartProps) {
  const isMobile = useIsMobile();

  if (!data?.byDay) return null;

  const hasData = data.byDay.some(item => item.count > 0);
  const total = data.byDay.reduce((acc, curr) => acc + curr.count, 0);

  const legendData: LegendItem[] = data.byDay.map(d => ({
    name: d.day,
    value: d.count,
    color: "#4F46E5"
  }));

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-border/50">
        <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 shrink-0">
          <CalendarDays className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight">Carga por Día</CardTitle>
          <CardDescription className="font-semibold text-xs text-muted-foreground/80">
            Distribución semanal de actividad clínica
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-0 pt-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-[350px]">
            <CalendarDays className="h-12 w-12 opacity-10 mb-4" />
            <p className="font-bold text-sm tracking-tight">No hay actividad en este periodo</p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byDay}
                layout={isMobile ? "vertical" : "horizontal"}
                margin={isMobile
                  ? { top: 5, right: 30, left: 40, bottom: 5 }
                  : { top: 20, right: 20, left: -20, bottom: 0 }
                }
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2={isMobile ? "1" : "0"} y2={isMobile ? "0" : "1"}>
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={isMobile}
                  horizontal={!isMobile}
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-muted/20"
                />
                <XAxis
                  type={isMobile ? "number" : "category"}
                  dataKey={isMobile ? undefined : "day"}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={isMobile ? undefined : (value) => value.substring(0, 3)}
                  className="text-[10px] font-bold text-muted-foreground"
                  hide={isMobile}
                />
                <YAxis
                  type={isMobile ? "category" : "number"}
                  dataKey={isMobile ? "day" : undefined}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  className="text-[10px] font-bold text-muted-foreground"
                  width={isMobile ? 80 : 40}
                  tickFormatter={(val) => isMobile ? val : val}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)', radius: 8 }}
                  content={<CustomPercentTooltip total={total} />}
                />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={isMobile ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                  animationDuration={1500}
                  barSize={isMobile ? 24 : undefined}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      {hasData && (
        <CardFooter className="pt-4 pb-6 border-t border-border/50">
          <ChartLegend data={legendData} total={total} columns={isMobile ? 2 : 3} />
        </CardFooter>
      )}
    </Card>
  );
}
