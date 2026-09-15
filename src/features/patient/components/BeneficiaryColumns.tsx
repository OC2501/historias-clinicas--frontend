import type { Patient } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Column } from '@/types/table';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import { PatientStatusBadge } from './PatientStatusBadge';
import { formatPatientAge } from '@/lib/utils';
import { Users, HeartHandshake } from 'lucide-react';

const formatTitleCase = (str: string | null | undefined) => {
    if (!str) return '—';
    return str
        .toLowerCase()
        .split(' ')
        .map((word, idx) => {
            const prepositions = ['de', 'la', 'las', 'el', 'los', 'y', 'del', 'o', 'a', 'en'];
            if (prepositions.includes(word) && idx !== 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

const RELATIONSHIP_BADGE_COLORS: Record<string, string> = {
    CONYUGE: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
    HIJO: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
    PADRE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    MADRE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
    OTRO: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
};

export const BeneficiaryColumns: Column<Patient>[] = [
    {
        header: 'Beneficiario',
        accessorKey: (patient) => (
            <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {patient?.firstName || '—'} {patient?.lastName || ''}
                </span>
                <span className="text-xs text-muted-foreground">
                    {patient?.identificationNumber ? `C.I: ${patient.identificationNumber}` : 'Sin Cédula (Menor de edad)'}
                </span>
            </div>
        ),
    },
    {
        header: 'Parentesco',
        accessorKey: (patient) => {
            const relKey = patient?.relationship || 'OTRO';
            const label = RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey;
            const colorClass = RELATIONSHIP_BADGE_COLORS[relKey] || RELATIONSHIP_BADGE_COLORS.OTRO;
            return (
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${colorClass}`}>
                    <Users className="h-3 w-3" />
                    {label}
                </span>
            );
        },
    },
    {
        header: 'Edad',
        accessorKey: (patient) => (
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {formatPatientAge(patient.birthDate)}
            </span>
        ),
    },
    {
        header: 'Género',
        accessorKey: (patient) => {
            const genders = { MALE: 'Masc.', FEMALE: 'Fem.' };
            return genders[patient.gender as keyof typeof genders] || patient.gender;
        },
    },
    {
        header: 'Trabajador Titular Responsable',
        accessorKey: (patient) => {
            if (!patient.titular) {
                return <span className="text-xs text-muted-foreground italic">No asignado</span>;
            }
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <HeartHandshake className="h-3.5 w-3.5 text-primary shrink-0" />
                        {patient.titular.firstName} {patient.titular.lastName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        C.I: {patient.titular.identificationNumber || 'S/D'} • {formatTitleCase(patient.titular.gerencia) || 'Sin Gerencia'}
                    </span>
                </div>
            );
        },
    },
    {
        header: 'Gerencia Heredada',
        accessorKey: (patient) => {
            const g = patient.gerencia || patient.titular?.gerencia;
            return (
                <div className="max-w-[140px] 2xl:max-w-[220px] truncate text-xs text-muted-foreground font-medium" title={g}>
                    {formatTitleCase(g)}
                </div>
            );
        },
    },
    {
        header: 'Estado',
        accessorKey: (patient) => (
            <PatientStatusBadge status={patient.status} />
        ),
    },
    {
        header: 'Última Atención',
        accessorKey: (patient) => {
            if (!patient.updatedAt) return <span className="text-xs text-muted-foreground">Nunca</span>;
            return (
                <span className="text-xs text-muted-foreground">
                    {format(new Date(patient.updatedAt), 'dd MMM yyyy', { locale: es })}
                </span>
            );
        },
    },
];
