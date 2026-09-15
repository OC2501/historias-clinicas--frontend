"use client"

import React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import type { GerenciaDistribution } from "../types/reports.types"
import { Building2, Clock, Stethoscope } from "lucide-react"

const chartConfig = {
  totalConsultas: {
    label: "Consultas",
    color: "#3B82F6",
  },
  totalReposos: {
    label: "Reposos",
    color: "#F59E0B",
  },
} satisfies ChartConfig

interface GerenciasDistributionChartProps {
  data: GerenciaDistribution[] | undefined;
}

export function GerenciasDistributionChart({ data = [] }: GerenciasDistributionChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

  const totalConsultas = React.useMemo(() => 
    data.reduce((acc, curr) => acc + (curr.totalConsultas || 0), 0), 
    [data]
  );
  
  const totalReposos = React.useMemo(() => 
    data.reduce((acc, curr) => acc + (curr.totalReposos || 0), 0), 
    [data]
  );

  const topGerencias = React.useMemo(() => {
    return (data || []).slice(0, 8).map(g => ({
      ...g,
      shortName: g.gerencia.length > 22 ? `${g.gerencia.substring(0, 20)}...` : g.gerencia
    }));
  }, [data]);

  return (
    <Card className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg overflow-hidden h-full">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Atenciones por Gerencia</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Demanda de servicio médico y reposos por departamento
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Stethoscope className="h-3.5 w-3.5" />
              {totalConsultas} Consultas
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              {totalReposos} Reposos
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        {topGerencias.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-muted-foreground">
            <Building2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            No hay atenciones registradas por gerencia en este período.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-64 w-full">
              {isMounted && (
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <BarChart
                    data={topGerencias}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis
                      dataKey="shortName"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      width={130}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as GerenciaDistribution;
                          return (
                            <div className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                              <p className="font-bold border-b border-white/20 pb-1">{item.gerencia}</p>
                              <p className="flex justify-between gap-4">
                                <span className="opacity-80">Consultas:</span>
                                <b>{item.totalConsultas}</b>
                              </p>
                              <p className="flex justify-between gap-4 text-amber-400 dark:text-amber-600">
                                <span>Reposos emitidos:</span>
                                <b>{item.totalReposos} ({item.totalDiasReposo} días)</b>
                              </p>
                              {item.repososActivos !== undefined && item.repososActivos > 0 && (
                                <p className="flex justify-between gap-4 text-rose-400 dark:text-rose-600 font-bold">
                                  <span>De reposo hoy:</span>
                                  <span>{item.repososActivos} activo(s)</span>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="totalConsultas" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={14} />
                    <Bar dataKey="totalReposos" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={14} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>

            {/* Resumen en lista de las 4 principales gerencias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {topGerencias.slice(0, 4).map((g) => (
                <div key={g.gerencia} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-850/40 text-xs">
                  <span className="font-semibold truncate pr-2 text-slate-800 dark:text-slate-200" title={g.gerencia}>
                    {g.gerencia}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold text-[10px]">
                      {g.totalConsultas}
                    </span>
                    {g.totalReposos > 0 && (
                      <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold text-[10px]" title={`${g.totalDiasReposo} días de reposo`}>
                        {g.totalReposos} rep.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
