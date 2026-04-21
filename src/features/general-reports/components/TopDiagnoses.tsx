"use client"

import React from "react"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { TopDiagnosis } from "../types/reports.types"
import { ChartLegend, type LegendItem } from "./ChartLegend"
import { CustomPercentTooltip } from "./CustomPercentTooltip"

const chartConfig = {
  count: {
    label: "Frecuencia",
    color: "#4F46E5",
  },
  diag1: { color: "#4F46E5" },
  diag2: { color: "#4F46E5" },
  diag3: { color: "#4F46E5" },
  diag4: { color: "#4F46E5" },
  diag5: { color: "#4F46E5" },
} satisfies ChartConfig

const COLORS = [
  "#4F46E5",
];

interface TopDiagnosesProps {
  data: TopDiagnosis[] | undefined;
}

export function TopDiagnoses({ data = [] }: TopDiagnosesProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  }, [data]);

  const total = React.useMemo(() => chartData.reduce((acc, curr) => acc + Number(curr.count), 0), [chartData]);

  const legendData: LegendItem[] = React.useMemo(() => chartData.map(d => ({
    name: d.name,
    value: Number(d.count),
    color: d.fill
  })), [chartData]);

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-xl font-bold tracking-tight">Top Diagnósticos</CardTitle>
        <CardDescription>Patologías más frecuentes detectadas</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-0 pt-6">
        {isMounted && <ChartContainer
          config={chartConfig}
          className="flex-1 w-full"
          style={{ minHeight: '350px', height: Math.max(350, chartData.length * 60) + 'px' }}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            barCategoryGap="20%"
            margin={{
              left: 0,
              right: 20,
              top: 10,
              bottom: 10
            }}
          >
            <CartesianGrid horizontal={false} opacity={0.1} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={10}
              width={120}
              tickFormatter={(value: string) => value.length > 20 ? value.substring(0, 20) + "..." : value}
            />
            <Tooltip content={<CustomPercentTooltip total={total} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Bar
              dataKey="count"
              radius={[4, 4, 4, 4]}
              maxBarSize={40}
            />
          </BarChart>
        </ChartContainer>}
      </CardContent>
      {chartData.length > 0 && (
        <CardFooter className="pt-4 pb-6 border-t border-border/50">
          <ChartLegend data={legendData} total={total} columns={1} />
        </CardFooter>
      )}
    </Card>
  )
}
