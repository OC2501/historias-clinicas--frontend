import { Button } from '@/components/ui/button';
import { Clock, MapPin, Trash2 } from 'lucide-react';
import type { Schedule } from '../types/schedule.types';
import type { Column } from '@/types/table';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
];

export const getScheduleColumns = (
    onDelete: (id: string) => void
): Column<Schedule>[] => [
    {
        header: 'Médico',
        accessorKey: (schedule) => (
            <div className="flex flex-col">
                <span className="font-semibold text-primary">
                    {schedule.doctor?.user?.name 
                        ? `Dr. ${schedule.doctor.user.name}` 
                        : schedule.doctor?.id 
                            ? `Dr. (ID: ${schedule.doctor.id.substring(0, 8)})` 
                            : 'Médico no asignado'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                    {schedule.doctor?.specialty || 'Sin especialidad'}
                </span>
            </div>
        ),
    },
    {
        header: 'Día',
        accessorKey: (schedule) => (
            <span className="font-medium">
                {DAYS_OF_WEEK.find(d => d.value === schedule.diaSemana)?.label || 'Desconocido'}
            </span>
        ),
    },
    {
        header: 'Horario',
        accessorKey: (schedule) => (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                    {schedule.horaInicio.substring(0, 5)} - {schedule.horaFin.substring(0, 5)}
                </span>
            </div>
        ),
    },
    {
        header: 'Consultorio',
        accessorKey: (schedule) => (
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{schedule.consultingRoom?.nombre || 'S/C'}</span>
                </div>
                <span className="text-[10px] text-muted-foreground pl-5 truncate max-w-[150px]">
                    {schedule.consultingRoom?.ubicacion}
                </span>
            </div>
        ),
    },
    {
        header: 'Acciones',
        className: 'text-right',
        accessorKey: (schedule) => (
            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => onDelete(schedule.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
];
