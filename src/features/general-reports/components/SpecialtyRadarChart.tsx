"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { SpecialtyDistribution } from "../types/reports.types"
import React from "react"

const chartConfig = {
  count: {
    label: "Consultas",
    color: "var(--primary)",
  },
} satisfies ChartConfig

interface RadarProps {
  data: SpecialtyDistribution[] | undefined;
}

export function SpecialtyRadarChart({ data = [] }: RadarProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);
  const chartData = React.useMemo(() => {
    const mapped = data.map((item) => ({
      specialty: item.specialty,
      count: Number(item.count),
    }));

    // Recharts RadarChart colapsa visualmente en una línea 1D si tiene menos de 3 vértices.
    // Llenamos con vértices vacíos "invisibles" si este caso ocurre.
    while (mapped.length > 0 && mapped.length < 3) {
      mapped.push({ specialty: `(Vacio ${mapped.length})`, count: 0 });
    }

    return mapped;
  }, [data]);

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="items-center pb-4 border-b border-border/50">
        <CardTitle className="text-xl font-bold tracking-tight">Cobertura por Especialidad</CardTitle>
        <CardDescription>Análisis multidimensional de atención</CardDescription>
      </CardHeader>
      <CardContent className="pb-0 flex-1 flex items-center justify-center">
        {isMounted && <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[300px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis
              dataKey="specialty"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}
            />
            <PolarGrid className="fill-[--color-count] opacity-10" />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
              activeDot={{
                r: 6,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>}
      </CardContent>
    </Card>
  )
}
