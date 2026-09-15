import type { Patient } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Column } from '@/types/table';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import { PatientStatusBadge } from './PatientStatusBadge';
import { formatPatientAge } from '@/lib/utils';

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

export const PatientColumns: Column<Patient>[] = [
    {
        header: 'Paciente',
        accessorKey: (patient) => {
            const isBeneficiario = patient?.patientType === 'BENEFICIARIO';
            const rel = patient?.relationship ? (RELATIONSHIP_LABELS[patient.relationship as keyof typeof RELATIONSHIP_LABELS] || patient.relationship) : 'Familiar';
            return (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                            {patient?.firstName || '—'} {patient?.lastName || ''}
                        </span>
                        {isBeneficiario && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-md">
                                {rel}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {patient?.identificationNumber ? `C.I: ${patient.identificationNumber}` : 'Sin Cédula'}
                        {isBeneficiario && patient?.titular ? ` • Titular: ${patient.titular.firstName} ${patient.titular.lastName}` : ''}
                    </span>
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
        header: 'Edad',
        accessorKey: (patient) => (
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
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
        header: 'Gerencia',
        accessorKey: (patient) => (
            <div className="max-w-[120px] 2xl:max-w-[220px] truncate text-xs text-muted-foreground font-medium" title={patient.gerencia}>
                {formatTitleCase(patient.gerencia)}
            </div>
        ),
    },
    {
        header: 'Cargo',
        accessorKey: (patient) => (
            <div className="max-w-[100px] 2xl:max-w-[200px] truncate text-xs text-muted-foreground" title={patient.cargo}>
                {formatTitleCase(patient.cargo)}
            </div>
        ),
    },
    {
        header: 'Teléfono',
        accessorKey: (patient) => (
            <div className="text-xs text-muted-foreground">
                {patient.phone || '—'}
            </div>
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
