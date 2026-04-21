import { format } from 'date-fns';
import { Eye, MoreHorizontal, Printer } from 'lucide-react';
import type { ClinicalHistoryNote } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { PatientStatusBadge } from '@/features/patient/components/PatientStatusBadge';

export interface Column<T> {
    header: string;
    accessorKey: keyof T | ((item: T) => React.ReactNode);
}

export const getClinicalHistoryNoteColumns = (
    navigate: (path: string) => void,
    onPrint?: (note: ClinicalHistoryNote) => void
): Column<ClinicalHistoryNote>[] => [
    {
        header: 'Fecha',
        accessorKey: (note) => note?.fecha ? format(new Date(note.fecha), 'dd/MM/yyyy') : 'S/F',
    },
    {
        header: 'Estado Subjetivo',
        accessorKey: (note) => (
            <span className="truncate max-w-[200px] inline-block" title={note?.estadoSubjetivo}>
                {note?.estadoSubjetivo || 'Sin detalles'}
            </span>
        ),
    },

    {
        header: 'Próxima Cita',
        accessorKey: (note) => {
            if (note?.proximaCita) {
                return format(new Date(note.proximaCita), 'dd/MM/yyyy');
            }
            if (note?.isDischarge) {
                return <PatientStatusBadge status="DISCHARGED" className="scale-90 origin-left" />;
            }
            return <span className="text-muted-foreground opacity-50">Ninguna</span>;
        },
    },
    {
        header: 'Acciones',
        accessorKey: (note) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clinical-history-note/${note.id}`);
                    }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Nota
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        if (onPrint) onPrint(note);
                    }}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];
