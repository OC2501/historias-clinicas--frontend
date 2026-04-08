import { format } from 'date-fns';
import { Eye, FileText, MoreHorizontal, Printer } from 'lucide-react';
import type { ClinicalHistory } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Column } from '@/types/table';

export const getClinicalHistoryColumns = (
    navigate: (path: string) => void,
    onPrint?: (history: ClinicalHistory) => void,
    onDelete?: (history: ClinicalHistory) => void
): Column<ClinicalHistory>[] => [
    {
        header: 'Fecha',
        accessorKey: (history) => history?.fecha ? format(new Date(history.fecha), 'dd/MM/yyyy') : 'S/F',
    },
    {
        header: 'Paciente',
        accessorKey: (history) => `${history?.patient?.firstName || '—'} ${history?.patient?.lastName || ''}`,
    },
    {
        header: 'Especialidad',
        accessorKey: (history) => (
            <span className="capitalize">{history?.specialty?.toLowerCase() || 'General'}</span>
        ),
    },
    {
        header: 'Médico',
        accessorKey: (history) => {
            if (history?.doctor?.user?.name) return `Dr. ${history.doctor.user.name}`;
            if (history?.doctor?.id) return `Dr. (ID: ${history.doctor.id.substring(0, 8)})`;
            return 'Médico no asignado';
        },
    },
    {
        header: 'Acciones',
        accessorKey: (history) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clinical-history/${history.id}`);
                    }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Historial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clinical-history/notes/new?historyId=${history.id}`);
                    }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Nueva Nota
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        if (onPrint) onPrint(history);
                    }}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete(history);
                    }}
                >
                    Eliminar
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
];
