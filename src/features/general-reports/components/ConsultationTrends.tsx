import React from "react"
import type { DateRange } from "react-day-picker"
"use client"

import { TrendingUp, Activity } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { ConsultationTrend } from "../types/reports.types"
import { useIsMobile } from "@/hooks/use-mobile"

const chartConfig = {
  count: {
    label: "Consultas",
    color: "#6366F1",
  },
} satisfies ChartConfig

interface ConsultationTrendsProps {
  data: ConsultationTrend[] | undefined;
  timeframe?: string;
  dateRange?: DateRange;
}

export function ConsultationTrends({ data = [], timeframe = '6m', dateRange }: ConsultationTrendsProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const isMobile = useIsMobile();
  React.useEffect(() => { setIsMounted(true); }, []);

  // Pad the data to ensure matching number of elements
  const { isDaily, intervalsCount, baseEndDate } = React.useMemo(() => {
    let daysDiff = 0;
    let monthsDiff = 0;
    let baseEn = new Date();

    if (timeframe === "custom" && dateRange?.from && dateRange?.to) {
      baseEn = dateRange.to;
      const start = dateRange.from;
      daysDiff = Math.floor((baseEn.getTime() - start.getTime()) / (1000 * 3600 * 24));
      monthsDiff = (baseEn.getFullYear() - start.getFullYear()) * 12 + (baseEn.getMonth() - start.getMonth());
    } else {
      switch (timeframe) {
        case '1w': daysDiff = 6; break;
        case '1m': daysDiff = 29; break;
        case '3m': monthsDiff = 2; break;
        case '1y':
          monthsDiff = 11;
          baseEn = new Date(baseEn.getFullYear(), 11, 31);
          break;
        case '6m':
          monthsDiff = 5;
          baseEn = new Date(baseEn.getFullYear(), 5, 30);
          break;
        case '9m':
          monthsDiff = 8;
          baseEn = new Date(baseEn.getFullYear(), 8, 30);
          break;
        default: monthsDiff = 5; break;
      }
    }

    const daily = timeframe === '1w' || timeframe === '1m' || (timeframe === "custom" && daysDiff <= 60);
    return {
      isDaily: daily,
      intervalsCount: daily ? daysDiff : monthsDiff,
      baseEndDate: baseEn
    }
  }, [timeframe, dateRange]);

  const paddedData = React.useMemo(() => {
    const result = [];
    for (let i = intervalsCount; i >= 0; i--) {
      const d = new Date(baseEndDate.getTime());
      if (isDaily) {
        d.setDate(d.getDate() - i);
      } else {
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
      }
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = isDaily ? `${d.getFullYear()}-${monthStr}-${dayStr}` : `${d.getFullYear()}-${monthStr}`;

      const found = data.find(item => item.date === dateStr);
      result.push({
        date: dateStr,
        count: found ? Number(found.count) : 0,
        originalDate: d,
      });
    }
    return result;
  }, [data, intervalsCount, isDaily, baseEndDate]);

  const formattedData = paddedData.map(item => ({
    ...item,
    dateLabel: isDaily
      ? item.originalDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '')
      : item.originalDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
  }));

  const lastMonthCount = paddedData[paddedData.length - 1]?.count ?? 0;
  const prevMonthCount = paddedData[paddedData.length - 2]?.count ?? 0;
  const growth = prevMonthCount > 0 ? ((lastMonthCount - prevMonthCount) / prevMonthCount) * 100 : 0;

  const timeframeLabels: Record<string, string> = {
    '1w': 'los últimos 7 días',
    '1m': 'el último mes',
    '3m': 'los últimos 3 meses',
    '6m': 'este semestre (Ene - Jun)',
    '9m': 'primeros 9 meses (Ene - Sep)',
    '1y': 'este año (Ene - Dic)',
    'custom': 'fechas personalizadas'
  };

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Tendencia de Consultas</CardTitle>
        </div>
        <CardDescription className="font-semibold text-xs text-muted-foreground/80">
          Análisis temporal en {timeframeLabels[timeframe] || 'el periodo seleccionado'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 pt-6 pb-2">
        {isMounted && <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
          <AreaChart
            accessibilityLayer
            data={formattedData}
            margin={{
              left: -10,
              right: 15,
              top: 10,
            }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-muted/10" />
            <XAxis
              dataKey="dateLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={isMobile ? 30 : 20}
              className="text-[10px] font-bold text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              className="text-[10px] font-bold text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ stroke: '#6366F1', strokeWidth: 2, strokeDasharray: '4 4' }}
              content={<ChartTooltipContent indicator="dot" className="rounded-xl border-none shadow-2xl" />}
            />
            <defs>
              <linearGradient id="fillCount" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#6366F1"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#6366F1"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#fillCount)"
              stroke="#6366F1"
              strokeWidth={3}
              stackId="a"
              dot={{ r: 4, fillOpacity: 1, fill: "#6366F1", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#4F46E5" }}
            />
          </AreaChart>
        </ChartContainer>}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full items-start gap-2 text-xs bg-primary/[0.03] p-3 rounded-2xl border border-primary/5">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 leading-none font-black text-primary">
              {growth >= 0 ? 'Crecimiento de' : 'Descenso de'} {Math.abs(growth).toFixed(1)}% <TrendingUp className={`h-4 w-4 ${growth < 0 ? 'rotate-180' : ''}`} />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground font-semibold">
              Totalizando {lastMonthCount} consultas registradas
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
