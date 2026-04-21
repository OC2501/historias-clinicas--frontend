"use client"

import React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, PieChart, Pie, Cell, Label, Tooltip } from "recharts"
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
import type { PatientDemographics } from "../types/reports.types"
import { ChartLegend, type LegendItem } from "./ChartLegend"
import { CustomPercentTooltip } from "./CustomPercentTooltip"

const genderConfig = {
  male: {
    label: "Masculino",
    color: "#3b82f6",
  },
  female: {
    label: "Femenino",
    color: "#ec4899",
  },
} satisfies ChartConfig

const ageConfig = {
  count: {
    label: "Pacientes",
    color: "#6366f1",
  },
} satisfies ChartConfig

interface DemographicsProps {
  data: PatientDemographics | undefined;
}

export function PatientGenderChart({ data }: DemographicsProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);
  const genderData = [
    { gender: "Masculino", count: Number(data?.gender?.male ?? 0), fill: "#3b82f6" },
    { gender: "Femenino", count: Number(data?.gender?.female ?? 0), fill: "#ec4899" },
  ];

  const totalGender = genderData.reduce((acc, curr) => acc + curr.count, 0);

  const genderLegend: LegendItem[] = genderData.map(d => ({
    name: d.gender,
    value: d.count,
    color: d.fill
  }));

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-xl font-bold tracking-tight">Distribución por Género</CardTitle>
        <CardDescription>Pacientes activos por sexo</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-0 pt-6">
        {isMounted && <ChartContainer config={genderConfig} className="aspect-auto h-[350px] w-full flex justify-center">
          <PieChart>
            <Pie
              data={genderData}
              dataKey="count"
              nameKey="gender"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              stroke="none"
            >
              {genderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                position="center"
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {totalGender.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                          Pacientes
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
            <Tooltip content={<CustomPercentTooltip total={totalGender} />} />
          </PieChart>
        </ChartContainer>}
      </CardContent>
      {isMounted && genderData.length > 0 && (
        <CardFooter className="pt-4 border-t border-border/50">
          <ChartLegend data={genderLegend} total={totalGender} />
        </CardFooter>
      )}
    </Card>
  );
}

export function PatientAgeChart({ data }: DemographicsProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);
  const AGE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'];
  const ageData = data ? Object.entries(data.ageRanges).map(([range, count], index) => ({
    range,
    count,
    fill: AGE_COLORS[index % AGE_COLORS.length],
  })) : [];

  const totalAge = ageData.reduce((acc, curr) => acc + curr.count, 0);

  const ageLegend: LegendItem[] = ageData.map(d => ({
    name: d.range,
    value: d.count,
    color: d.fill
  }));

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-xl font-bold tracking-tight">Distribución por Edad</CardTitle>
        <CardDescription>Grupos etarios registrados</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pb-2 pt-6">
        {isMounted && (
          <ChartContainer config={ageConfig} className="aspect-auto h-[350px] w-full">
            <BarChart
              data={ageData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} opacity={0.1} />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                interval={0}
              />
              <Tooltip content={<CustomPercentTooltip total={totalAge} />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                barSize={80}
              >
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      {isMounted && ageData.length > 0 && (
        <CardFooter className="pt-4 pb-6 border-t border-border/50">
          <ChartLegend data={ageLegend} total={totalAge} />
        </CardFooter>
      )}
    </Card>
  );
}
