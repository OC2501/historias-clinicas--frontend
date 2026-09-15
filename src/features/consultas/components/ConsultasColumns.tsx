import { Eye, Edit, MoreHorizontal, Printer, Trash2, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn, safeFormat } from '@/lib/utils';
import type { Consulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS, TIPO_CONSULTA_COLORS } from '../types/consultas.type';
import { getReposoStatus } from '../utils/reposoUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import type { Column } from '@/types/table';

export const getConsultasColumns = (
  onView: (consulta: Consulta) => void,
  onEdit: (consulta: Consulta) => void,
  onPrint: (consulta: Consulta) => void,
  onDelete: (consulta: Consulta) => void
): Column<Consulta>[] => [
  {
    header: 'Fecha / Hora',
    accessorKey: (consulta) => (
      <div className="flex flex-col items-end sm:items-start text-right sm:text-left">
        <span className="font-semibold text-foreground text-sm">
          {safeFormat(consulta.fecha, 'dd/MM/yyyy')}
        </span>
        <span className="text-xs text-muted-foreground">{consulta.hora || '—'}</span>
      </div>
    ),
  },
  {
    header: 'Paciente',
    accessorKey: (consulta) => {
      const isBeneficiario = consulta.patient?.patientType === 'BENEFICIARIO';
      const relKey = consulta.patient?.relationship;
      const relLabel = relKey
        ? (RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey)
        : 'Familiar';

      return (
        <div className="flex flex-col min-w-0 items-end sm:items-start text-right sm:text-left">
          <div className="flex items-center justify-end sm:justify-start gap-1.5 flex-wrap">
            <span className="font-medium text-foreground text-sm">
              {consulta.patient?.firstName} {consulta.patient?.lastName}
            </span>
            {isBeneficiario && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 font-semibold">
                {relLabel}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-end sm:justify-start gap-1 text-xs text-muted-foreground">
            <span>C.I: {consulta.patient?.identificationNumber || 'S/D'}</span>
            {consulta.patient?.gerencia && (
              <>
                <span>•</span>
                <span className="truncate max-w-[140px]">{consulta.patient.gerencia}</span>
              </>
            )}
          </div>
          {isBeneficiario && consulta.patient?.titular && (
            <span
              className="text-[11px] text-blue-600 dark:text-blue-400 truncate max-w-[200px]"
              title={`Titular: ${consulta.patient.titular.firstName} ${consulta.patient.titular.lastName} (${consulta.patient.titular.identificationNumber || 'S/D'})`}
            >
              Tit: {consulta.patient.titular.firstName} {consulta.patient.titular.lastName}
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: 'Tipo de Chequeo',
    accessorKey: (consulta) => {
      const colorClass =
        TIPO_CONSULTA_COLORS[consulta.tipoConsulta] ||
        'border-slate-500/30 bg-slate-50 text-slate-700';
      return (
        <Badge
          variant="outline"
          className={`font-medium text-xs px-2 py-0.5 border ${colorClass}`}
        >
          {TIPO_CONSULTA_LABELS[consulta.tipoConsulta] || consulta.tipoConsulta}
        </Badge>
      );
    },
  },
  {
    header: 'Signos Vitales',
    accessorKey: (consulta) => {
      const hasVitals =
        consulta.presionArterial ||
        consulta.frecuenciaCardiaca ||
        consulta.temperatura ||
        consulta.imc;

      if (!hasVitals) {
        return <span className="text-xs text-muted-foreground italic">No registrados</span>;
      }

      return (
        <div className="flex flex-wrap gap-1 items-center justify-end sm:justify-start max-w-full sm:max-w-[200px]">
          {consulta.presionArterial && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              PA {consulta.presionArterial}
            </span>
          )}
          {consulta.frecuenciaCardiaca && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              {consulta.frecuenciaCardiaca} bpm
            </span>
          )}
          {consulta.temperatura && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
              {consulta.temperatura}°C
            </span>
          )}
          {consulta.imc && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
              IMC {consulta.imc}
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: 'Diagnóstico / Motivo',
    accessorKey: (consulta) => (
      <div className="flex flex-col min-w-0 w-full sm:max-w-[220px] items-end sm:items-start text-right sm:text-left">
        <span
          className="font-medium text-sm text-foreground line-clamp-2 sm:truncate max-w-full"
          title={consulta.diagnostico || 'Chequeo general'}
        >
          {consulta.diagnostico || 'Chequeo general'}
        </span>
        <span
          className="text-xs text-muted-foreground line-clamp-2 sm:truncate max-w-full"
          title={consulta.motivoConsulta}
        >
          {consulta.motivoConsulta}
        </span>
      </div>
    ),
  },
  {
    header: 'Médico / Evaluador',
    accessorKey: (consulta) => {
      if (consulta.doctor?.user?.name) {
        return (
          <div className="flex flex-col min-w-0 items-end sm:items-start text-right sm:text-left">
            <span className="text-sm font-medium text-foreground">
              Dr(a). {consulta.doctor.user.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {consulta.doctor?.specialty || 'Medicina General'}
            </span>
          </div>
        );
      }

      if (consulta.nurse?.name) {
        return (
          <div className="flex flex-col min-w-0 items-end sm:items-start text-right sm:text-left gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {consulta.nurse.name}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 w-fit border-cyan-300 text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-400 font-medium"
            >
              Enfermería
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-end sm:items-start text-right sm:text-left">
          <span className="text-sm font-medium text-muted-foreground italic">
            No asignado
          </span>
        </div>
      );
    },
  },
  {
    header: 'Reposo',
    accessorKey: (consulta) => {
      const reposo = getReposoStatus(consulta);
      if (reposo.status === 'NONE') {
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 text-muted-foreground font-medium">
            Sin reposo
          </Badge>
        );
      }

      return (
        <div className="flex flex-col items-end sm:items-start gap-0.5">
          <Badge
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 flex items-center gap-1 w-fit border",
              reposo.badgeColor
            )}
            title={`Del ${reposo.startDateFormatted} al ${reposo.endDateFormatted} (${reposo.label})`}
          >
            {reposo.status === 'ACTIVE' && <ShieldAlert className="h-3 w-3 shrink-0" />}
            {reposo.status === 'EXPIRING_TODAY' && <AlertTriangle className="h-3 w-3 shrink-0" />}
            {reposo.status === 'EXPIRED' && <CheckCircle2 className="h-3 w-3 shrink-0" />}
            {reposo.status === 'FUTURE' && <Clock className="h-3 w-3 shrink-0" />}
            <span>{reposo.badgeLabel}</span>
          </Badge>
          <span className="text-[9px] text-muted-foreground font-mono">
            {reposo.startDateFormatted} - {reposo.endDateFormatted}
          </span>
        </div>
      );
    },
  },
  {
    header: 'Acciones',
    accessorKey: (consulta) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Acciones de Consulta</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onView(consulta);
            }}
          >
            <Eye className="mr-2 h-4 w-4 text-blue-600" />
            Ver Detalle Completo
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(consulta);
            }}
          >
            <Edit className="mr-2 h-4 w-4 text-amber-600" />
            Editar Consulta
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPrint(consulta);
            }}
          >
            <Printer className="mr-2 h-4 w-4 text-emerald-600" />
            Imprimir Informe / Recipe
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(consulta);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Consulta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
