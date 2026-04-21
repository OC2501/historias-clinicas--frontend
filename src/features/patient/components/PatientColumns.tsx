import type { Patient } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Column } from '@/types/table';
import { PatientStatusBadge } from './PatientStatusBadge';

export const PatientColumns: Column<Patient>[] = [
    {
        header: 'Paciente',
        accessorKey: (patient) => (
            <div className="flex flex-col">
                <span className="font-medium">{patient?.firstName || '—'} {patient?.lastName || ''}</span>
                <span className="text-xs text-muted-foreground">{patient?.identificationNumber || 'S/D'}</span>
            </div>
        ),
    },
    {
        header: 'Estado',
        accessorKey: (patient) => (
            <PatientStatusBadge status={patient.status} />
        ),
    },
    {
        header: 'Edad',
        accessorKey: (patient) => {
            if (!patient.birthDate) return 'N/A';
            try {
                const birth = new Date(patient.birthDate);
                const age = new Date().getFullYear() - birth.getFullYear();
                return `${age} años`;
            } catch {
                return 'N/A';
            }
        },
    },
    {
        header: 'Género',
        accessorKey: (patient) => {
            const genders = { MALE: 'Masc.', FEMALE: 'Fem.' };
            return genders[patient.gender as keyof typeof genders] || patient.gender;
        },
    },
    {
        header: 'Teléfono',
        accessorKey: 'phone',
    },
    {
        header: 'Última Atención',
        accessorKey: (patient) => {
            if (!patient.updatedAt) return 'Nunca';
            return format(new Date(patient.updatedAt), 'dd MMM yyyy', { locale: es });
        },
    },
];
