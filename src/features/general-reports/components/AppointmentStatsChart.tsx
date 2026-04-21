import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Label } from "recharts"
import type { AppointmentStats } from "../types/reports.types"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { ChartLegend, type LegendItem } from "./ChartLegend"
import { CustomPercentTooltip } from "./CustomPercentTooltip"

interface AppointmentStatsChartProps {
  data?: AppointmentStats;
}

const COLORS: Record<string, string> = {
  SCHEDULED: "#f59e0b",
  COMPLETED: "#10b981", // Emerald 500
  CANCELLED: "#ef4444", // Red 500
};

const LABEL_MAP: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export function AppointmentStatsChart({ data }: AppointmentStatsChartProps) {
  if (!data?.statusStats) return null;

  const chartData = Object.entries(data.statusStats)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: LABEL_MAP[status] || status,
      value: count,
      color: COLORS[status] || "#94a3b8", // Default slate-400
    }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const legendData: LegendItem[] = chartData.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
  }));

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-4 border-b border-border/50">
        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 shrink-0">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-xl font-bold tracking-tight">Estado de Citas</CardTitle>
          <CardDescription className="font-medium text-xs text-muted-foreground/80">
            Distribución de citas en el periodo seleccionado
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pb-2 pt-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-[350px]">
            <Calendar className="h-10 w-10 opacity-20 mb-3" />
            <p className="font-semibold text-sm">No hay citas en este periodo</p>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPercentTooltip total={total} />} />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="hover:opacity-80 transition-opacity duration-300 cursor-pointer"
                    />
                  ))}
                  <Label
                    position="center"
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {total.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-xs"
                            >
                              Citas
                            </tspan>
                          </text>
                        )
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      {chartData.length > 0 && (
        <CardFooter className="pt-4 pb-6 border-t border-border/50">
          <ChartLegend data={legendData} total={total} />
        </CardFooter>
      )}
    </Card>
  );
}
