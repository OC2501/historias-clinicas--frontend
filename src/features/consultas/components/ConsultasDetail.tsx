import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { safeFormat } from '@/lib/utils';
import {
  Activity,
  Calendar,
  Clock,
  Edit,
  FileText,
  Heart,
  Pill,
  Printer,
  ShieldAlert,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react';
import type { Consulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS, TIPO_CONSULTA_COLORS } from '../types/consultas.type';
import { patientsApi } from '@/api';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn, formatPatientAge } from '@/lib/utils';
import { getReposoStatus } from '../utils/reposoUtils';

interface ConsultasDetailProps {
  consulta: Consulta | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (consulta: Consulta) => void;
  onPrint: (consulta: Consulta) => void;
}

export function ConsultasDetail({
  consulta,
  isOpen,
  onClose,
  onEdit,
  onPrint,
}: ConsultasDetailProps) {
  if (!consulta) return null;

  const patient = consulta.patient;
  const doctor = consulta.doctor;
  const nurse = consulta.nurse;

  const [fetchedTitular, setFetchedTitular] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (patient?.patientType === 'BENEFICIARIO' && !patient?.titular && patient?.id) {
      patientsApi
        .getById(patient.id)
        .then((res) => {
          if (isMounted) {
            const fullPatient = (res.data as any)?.data || res.data;
            if (fullPatient?.titular) {
              setFetchedTitular(fullPatient.titular);
            }
          }
        })
        .catch(() => {});
    } else {
      setFetchedTitular(null);
    }
    return () => {
      isMounted = false;
    };
  }, [patient?.id, patient?.patientType, patient?.titular]);

  const titular = patient?.titular || fetchedTitular;
  const isBeneficiario = patient?.patientType === 'BENEFICIARIO';
  const relKey = patient?.relationship;
  const relLabel = relKey
    ? (RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey)
    : 'Familiar';

  const getInitials = (name?: string) => {
    if (!name) return 'HC';
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  };

  const getImcColor = (imcStr?: string) => {
    if (!imcStr) return 'text-slate-400';
    const imc = parseFloat(imcStr);
    if (isNaN(imc)) return 'text-slate-400';
    if (imc < 18.5) return 'text-blue-600 dark:text-blue-400';
    if (imc < 25) return 'text-emerald-600 dark:text-emerald-400';
    if (imc < 30) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const formatGender = (gender?: string) => {
    if (!gender) return '—';
    const g = String(gender).toUpperCase();
    if (g === 'MALE' || g === 'M' || g === 'MASCULINO') return 'Masculino';
    if (g === 'FEMALE' || g === 'F' || g === 'FEMENINO') return 'Femenino';
    return gender;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-none w-full sm:w-[94vw] md:w-[88vw] h-[100dvh] sm:h-[90vh] md:h-[88vh] max-h-[100dvh] sm:max-h-[90vh] md:max-h-[88vh] p-0 gap-0 overflow-hidden rounded-none sm:rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 flex flex-col border dark:border-slate-800"
      >
        {/* ═══════════════════════════════════════════════
            1. ENCABEZADO SUPERIOR
        ═══════════════════════════════════════════════ */}
        <div className="px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DialogTitle className="text-base sm:text-2xl font-black tracking-wider sm:tracking-widest text-slate-900 dark:text-slate-100 uppercase truncate">
                  Detalle de Consulta Médica
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detalle completo de la consulta médica
                </DialogDescription>
                <Badge
                  variant="outline"
                  className={`font-bold uppercase text-[9px] sm:text-[10px] tracking-wider px-2 py-0.5 border ${TIPO_CONSULTA_COLORS[consulta.tipoConsulta]}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 inline-block" />
                  {TIPO_CONSULTA_LABELS[consulta.tipoConsulta] || consulta.tipoConsulta}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {safeFormat(consulta.fecha, 'dd/MM/yyyy', 'S/F')}
                </span>
                {consulta.hora && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {consulta.hora}
                  </span>
                )}
                {doctor?.user?.name ? (
                  <span className="flex items-center gap-1 text-primary font-bold truncate max-w-[200px] sm:max-w-none">
                    <Stethoscope className="h-3 w-3" />
                    Dr(a). {doctor.user.name} ({doctor.specialty || 'General'})
                  </span>
                ) : nurse?.name ? (
                  <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400 font-bold truncate max-w-[200px] sm:max-w-none">
                    <User className="h-3 w-3" />
                    {nurse.name} (Enfermería)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground italic">
                    No asignado
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            2. CUERPO HORIZONTAL (PANEL LATERAL + CONTENIDO)
        ═══════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0">
          {/* ── PANEL LATERAL IZQUIERDO: PACIENTE Y SIGNOS VITALES ── */}
          <div className="w-full md:w-80 lg:w-96 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/40 dark:bg-slate-850/30 overflow-y-visible md:overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
            {/* Ficha del Paciente */}
            <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-2xs">
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xs sm:text-sm">
                    {getInitials(patient ? `${patient.firstName} ${patient.lastName}` : '')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente no asignado'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">
                    C.I: {patient?.identificationNumber || 'S/D'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 uppercase text-[9px] font-bold block">Edad / Género</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {formatPatientAge(patient?.birthDate)} • {formatGender(patient?.gender)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[9px] font-bold block">Teléfono</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {patient?.phone || 'No registrado'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 uppercase text-[9px] font-bold block">Gerencia</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                    {patient?.gerencia || 'No asignada'}
                  </span>
                </div>
                {patient?.cargo && (
                  <div className="col-span-2">
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">Cargo</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {patient.cargo}
                    </span>
                  </div>
                )}
                {isBeneficiario && (
                  <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 uppercase text-[9px] font-bold">Condición</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 font-semibold">
                        Beneficiario ({relLabel})
                      </Badge>
                    </div>
                    {titular ? (
                      <div className="bg-blue-50/60 dark:bg-blue-950/30 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40">
                        <span className="text-blue-600 dark:text-blue-400 uppercase text-[9px] font-bold block">
                          Trabajador Titular
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                          {titular.firstName} {titular.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono block">
                          C.I: {titular.identificationNumber || 'S/D'} {titular.gerencia ? `• ${titular.gerencia}` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic block">
                        Sin titular registrado
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Constantes Biométricas / Triaje */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-rose-500" />
                  Signos Vitales
                </p>
                {consulta.imc && (
                  <span className={cn("text-xs font-mono font-bold", getImcColor(consulta.imc))}>
                    IMC: {consulta.imc}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Presión Art.</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {consulta.presionArterial || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">mmHg</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Frec. Cardíaca</span>
                  <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {consulta.frecuenciaCardiaca || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">bpm</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Frec. Resp.</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {consulta.frecuenciaRespiratoria || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">rpm</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Temperatura</span>
                  <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {consulta.temperatura || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">°C</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Sat. O2</span>
                  <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                    {consulta.saturacionOxigeno || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">%</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Peso</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {consulta.peso || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">kg</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Talla</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {consulta.altura || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">cm</span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Glucemia</span>
                  <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {consulta.glucemia || '—'}
                  </span>
                  <span className="text-[8px] text-slate-400">mg/dL</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── PANEL PRINCIPAL DERECHO: HISTORIA, DIAGNÓSTICO, RECETA Y REPOSO ── */}
          <div className="flex-1 overflow-y-visible md:overflow-y-auto p-4 sm:p-6 md:p-8 pb-28 md:pb-8 space-y-6 bg-white dark:bg-slate-900">
            {/* 1. Motivo, Síntomas y Diagnóstico */}
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                  Motivo de Consulta / Chequeo
                </p>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {consulta.motivoConsulta}
                  </p>
                </div>
              </div>

              {consulta.sintomas && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                    Sintomatología / Evolución
                  </p>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {consulta.sintomas}
                    </p>
                  </div>
                </div>
              )}

              {consulta.examenFisico && (
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                    Hallazgos al Examen Físico
                  </p>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {consulta.examenFisico}
                    </p>
                  </div>
                </div>
              )}

              {/* Diagnóstico Principal Emitido */}
              <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 shadow-2xs">
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase block">
                  Diagnóstico Médico Emitido
                </span>
                <p className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {consulta.diagnostico || 'Evaluación Médica General Normal'}
                </p>
              </div>
            </div>

            {/* 2. Tratamiento y Receta Médica */}
            {(consulta.tratamiento || consulta.examenesSolicitados) && (
              <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <Pill className="h-4 w-4" />
                  <span>Tratamiento, Receta e Indicaciones</span>
                </div>
                {consulta.tratamiento && (
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800/80 dark:text-emerald-300/80 uppercase block">
                      Prescripción Farmacológica / Recipe
                    </span>
                    <p className="text-xs font-mono text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      {consulta.tratamiento}
                    </p>
                  </div>
                )}
                {consulta.examenesSolicitados && (
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800/80 dark:text-emerald-300/80 uppercase block">
                      Exámenes Paraclínicos Solicitados
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                      {consulta.examenesSolicitados}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Constancia de Reposo Laboral */}
            {consulta.reposoMedico && (() => {
              const reposo = getReposoStatus(consulta);
              return (
                <div className={cn("p-4 rounded-xl space-y-3 shadow-2xs border", reposo.bgLight, reposo.borderColor)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className={cn("h-4 w-4", reposo.textColor)} />
                      <span className={reposo.textColor}>Constancia de Reposo Laboral</span>
                    </div>
                    <Badge className={cn("text-[11px] font-bold px-2.5 py-0.5 border shadow-xs", reposo.badgeColor)}>
                      {reposo.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">Días Otorgados</span>
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                        {reposo.totalDays} Día(s)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">Fecha Inicio</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {reposo.startDateFormatted || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase text-[9px] font-bold block">Reincorporación Estimada</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {reposo.endDateFormatted || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. Observaciones y Próximo Control */}
            {(consulta.observaciones || consulta.proximoControl) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-850/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                {consulta.observaciones && (
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">
                      Observaciones / Recomendaciones
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                      {consulta.observaciones}
                    </p>
                  </div>
                )}
                {consulta.proximoControl && (
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] font-bold block">
                      Próximo Control Sugerido
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                      {format(new Date(consulta.proximoControl), "dd 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            3. FOOTER INFERIOR
        ═══════════════════════════════════════════════ */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 sm:px-8 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 flex-shrink-0 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] sm:text-xs font-bold tracking-wider text-slate-400 uppercase hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-2 sm:px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-center"
          >
            Cerrar
          </button>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-2 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-emerald-500/40 hover:bg-emerald-50 text-emerald-700 dark:text-emerald-300"
              onClick={() => onPrint(consulta)}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Imprimir Informe / Recipe</span>
              <span className="sm:hidden">Imprimir Récipe</span>
            </Button>
            <Button
              className="gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-6 text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/25 cursor-pointer"
              onClick={() => {
                onClose();
                onEdit(consulta);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editar Consulta</span>
              <span className="sm:hidden">Editar</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
