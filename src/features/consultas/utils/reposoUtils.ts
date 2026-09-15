import { format, isToday, isBefore, isAfter, startOfDay, addDays, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';

export type ReposoStatusType = 'ACTIVE' | 'EXPIRING_TODAY' | 'EXPIRED' | 'FUTURE' | 'NONE';

export interface ReposoStatusInfo {
  status: ReposoStatusType;
  label: string;
  badgeLabel: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
  bgLight: string;
  daysRemaining?: number;
  totalDays: number;
  startDateFormatted?: string;
  endDateFormatted?: string;
  isCurrent: boolean; // true si está de reposo hoy
}

function parseLocalDate(dateInput: string | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const cleanStr = dateInput.trim();
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function getReposoStatus(consulta: {
  reposoMedico?: boolean;
  diasReposo?: number;
  fechaInicioReposo?: string | Date;
  fechaFinReposo?: string | Date;
  fecha?: string | Date;
}): ReposoStatusInfo {
  if (!consulta || !consulta.reposoMedico) {
    return {
      status: 'NONE',
      label: 'Sin reposo',
      badgeLabel: 'Sin reposo',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
      textColor: 'text-slate-500',
      borderColor: 'border-slate-200',
      bgLight: 'bg-slate-50',
      totalDays: 0,
      isCurrent: false,
    };
  }

  const totalDays = consulta.diasReposo || 1;
  const today = startOfDay(new Date());

  // Parse fechas de manera local segura
  let startDate: Date;
  if (consulta.fechaInicioReposo) {
    startDate = startOfDay(parseLocalDate(consulta.fechaInicioReposo));
  } else if (consulta.fecha) {
    startDate = startOfDay(parseLocalDate(consulta.fecha));
  } else {
    startDate = today;
  }

  let endDate: Date;
  if (consulta.fechaFinReposo) {
    endDate = startOfDay(parseLocalDate(consulta.fechaFinReposo));
  } else {
    endDate = addDays(startDate, Math.max(1, totalDays));
  }

  // Protección / Autocorrección si el registro previo guardó fechaFin <= fechaInicio por desfasamiento UTC
  if (endDate <= startDate) {
    endDate = addDays(startDate, Math.max(1, totalDays));
  }

  const startDateFormatted = format(startDate, 'dd/MM/yyyy');
  const endDateFormatted = format(endDate, 'dd/MM/yyyy');

  // 1. Si vence exactamente hoy
  if (isToday(endDate)) {
    return {
      status: 'EXPIRING_TODAY',
      label: 'Vence Hoy (Reintegro mañana)',
      badgeLabel: `Vence Hoy (${totalDays}d)`,
      badgeColor: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs shadow-amber-500/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-300 dark:border-amber-800',
      bgLight: 'bg-amber-50 dark:bg-amber-950/30',
      daysRemaining: 0,
      totalDays,
      startDateFormatted,
      endDateFormatted,
      isCurrent: true,
    };
  }

  // 2. Si ya pasó la fecha fin -> Culminado / Vencido
  if (isAfter(today, endDate)) {
    return {
      status: 'EXPIRED',
      label: 'Reposo Culminado (Reintegrado)',
      badgeLabel: `Culminado (${totalDays}d)`,
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
      textColor: 'text-slate-600 dark:text-slate-400',
      borderColor: 'border-slate-200 dark:border-slate-800',
      bgLight: 'bg-slate-50 dark:bg-slate-900/50',
      daysRemaining: 0,
      totalDays,
      startDateFormatted,
      endDateFormatted,
      isCurrent: false,
    };
  }

  // 3. Si la fecha de inicio es en el futuro
  if (isBefore(today, startDate)) {
    const daysUntilStart = differenceInCalendarDays(startDate, today);
    return {
      status: 'FUTURE',
      label: `Programado (Inicia en ${daysUntilStart} día${daysUntilStart > 1 ? 's' : ''})`,
      badgeLabel: `Programado (${totalDays}d)`,
      badgeColor: 'bg-blue-600 text-white border-blue-700 shadow-xs shadow-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-300 dark:border-blue-800',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30',
      daysRemaining: totalDays,
      totalDays,
      startDateFormatted,
      endDateFormatted,
      isCurrent: false,
    };
  }

  // 4. Está activo / vigente hoy
  const daysRemaining = Math.max(1, differenceInCalendarDays(endDate, today));
  return {
    status: 'ACTIVE',
    label: `En Reposo Activo (Quedan ${daysRemaining} día${daysRemaining > 1 ? 's' : ''})`,
    badgeLabel: `Activo (${totalDays}d • -${daysRemaining}d)`,
    badgeColor: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs shadow-rose-500/20 animate-pulse',
    textColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-800',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
    daysRemaining,
    totalDays,
    startDateFormatted,
    endDateFormatted,
    isCurrent: true,
  };
}
