"use client"

import React from "react"
import { Cell, Pie, PieChart } from "recharts"
import { Activity, Target } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DischargeGaugeProps {
  rate: number | undefined;
}

export function DischargeRateGauge({ rate = 0 }: DischargeGaugeProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

  const data = [
    { name: "Altas", value: rate, fill: "url(#gaugeGradient)" },
    { name: "Restante", value: 100 - rate, fill: "rgba(0,0,0,0.05)" },
  ]

  return (
    <Card className="flex flex-col rounded-3xl border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/10 overflow-hidden h-full">
      <CardHeader className="pb-4 border-b border-border/50 px-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Target className="h-5 w-5 text-emerald-600" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Tasa de Altas</CardTitle>
        </div>
        <CardDescription className="font-semibold text-xs text-muted-foreground/70 uppercase">Eficiencia clínica</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex items-center justify-center -mt-4 px-0">
        {isMounted && <ChartContainer
          config={{
            altas: { label: "Altas", color: "#10b981" },
            restante: { label: "En proceso", color: "#e5e7eb" },
          }}
          className="mx-auto aspect-[2/1] w-full max-w-[320px]"
        >
          <PieChart>
            <defs>
              <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="gaugeShadow" height="150%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
                <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
                <feFlood floodColor="#10b981" floodOpacity="0.4" result="offsetColor" />
                <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <ChartTooltip content={<ChartTooltipContent hideLabel className="rounded-xl border-none shadow-2xl" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius="75%"
              outerRadius="100%"
              stroke="none"
              cornerRadius={10}
              paddingAngle={0}
              animationDuration={2000}
              filter="url(#gaugeShadow)"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>}
      </CardContent>
      <CardFooter className="flex-col gap-4 mt-auto px-6 pb-6 pt-0">
        <div className="flex items-center justify-between w-full bg-emerald-500/5 p-5 rounded-[2rem] border border-emerald-500/10 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white shadow-md">
              <Activity className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-black text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em]">
                Score Actual
              </span>
              <span className="text-[13px] font-black text-emerald-700/70">Rendimiento óptimo</span>
            </div>
          </div>
          <span className="text-5xl font-black tracking-tighter text-emerald-600 drop-shadow-sm">
            {parseFloat(rate.toFixed(1))}%
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
