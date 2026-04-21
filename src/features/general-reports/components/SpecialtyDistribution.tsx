"use client"

import * as React from "react"
import { Label, Pie, PieChart, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SpecialtyDistribution } from "../types/reports.types"
import { ChartLegend, type LegendItem } from "./ChartLegend"
import { CustomPercentTooltip } from "./CustomPercentTooltip"

// Colores modernos para especialidades
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface SpecialtyChartProps {
  data: SpecialtyDistribution[] | undefined;
}

export function SpecialtyDistributionChart({ data = [] }: SpecialtyChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      specialty: item.specialty,
      count: Number(item.count),
      fill: COLORS[index % COLORS.length]
    }));
  }, [data]);

  const totalConsultations = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [chartData]);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      count: { label: "Consultas" }
    };
    data.forEach((item, index) => {
      config[item.specialty] = {
        label: item.specialty,
        color: COLORS[index % COLORS.length]
      };
    });
    return config;
  }, [data]);

  const legendData: LegendItem[] = chartData.map(d => ({
    name: d.specialty,
    value: d.count,
    color: d.fill
  }));

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="items-center pb-4 border-b border-border/50">
        <div className="space-y-1 text-center">
          <CardTitle className="text-xl font-bold tracking-tight">Carga por Especialidad</CardTitle>
          <CardDescription>Distribución de historias por área</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2 pt-6">
        {isMounted && <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[350px]"
        >
          <PieChart>
            <Tooltip content={<CustomPercentTooltip total={totalConsultations} />} />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="specialty"
              innerRadius={70}
              outerRadius={100}
              strokeWidth={5}
              stroke="none"
              paddingAngle={5}
            >
              <Label
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
                          {totalConsultations.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          Consultas
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>}
      </CardContent>
      {chartData.length > 0 && (
        <CardFooter className="pt-4 pb-6 border-t border-border/50">
          <ChartLegend data={legendData} total={totalConsultations} />
        </CardFooter>
      )}
    </Card>
  )
}
