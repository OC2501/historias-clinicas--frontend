import type { Appointment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, User, ChevronDown, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import type { Column } from '@/types/table';
import { Status } from '@/types/enums';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const getAppointmentColumns = (onStatusChange: (id: string, status: Status) => void): Column<Appointment>[] => [
    {
        header: 'Paciente',
        accessorKey: (item) => (
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-sm">
                        {item.patient?.firstName || '—'} {item.patient?.lastName || ''}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {item.patient?.identificationNumber || 'S/D'}
                    </span>
                </div>
            </div>
        ),
    },
    {
        header: 'Médico',
        accessorKey: (item) => (
            <div className="flex flex-col">
                <span className="text-sm font-medium">
                    {item.doctor?.user?.name 
                        ? `Dr. ${item.doctor.user.name}` 
                        : item.doctor?.id 
                            ? `Dr. (ID: ${item.doctor.id.substring(0, 8)})` 
                            : 'Médico no asignado'}
                </span>
                <span className="text-xs text-muted-foreground">{item.doctor?.specialty || 'General'}</span>
            </div>
        ),
    },
    {
        header: 'Horario',
        accessorKey: (item) => (
            <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                    {format(new Date(item.startTime), 'HH:mm')} - {format(new Date(item.endTime), 'HH:mm')}
                </span>
            </div>
        ),
    },
    {
        header: 'Estado',
        accessorKey: (item) => {
            const status = item.status as Status;
            const colors: Record<Status, string> = {
                [Status.SCHEDULED]: 'bg-primary/10 text-primary border-primary/20',
                [Status.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                [Status.CANCELLED]: 'bg-destructive/10 text-destructive border-destructive/20',
            };
            const labels: Record<Status, string> = {
                [Status.SCHEDULED]: 'Programada',
                [Status.COMPLETED]: 'Completada',
                [Status.CANCELLED]: 'Cancelada',
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                            <Badge
                                variant="outline"
                                className={`${colors[status]} cursor-pointer py-1 px-2.5 flex items-center gap-1.5 transition-all hover:opacity-80 shadow-none`}
                            >
                                {labels[status] || status}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Badge>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-primary/10 shadow-xl">
                        <DropdownMenuItem 
                            className="gap-2 rounded-lg cursor-pointer"
                            onClick={() => onStatusChange(item.id, Status.SCHEDULED)}
                        >
                            <Calendar className="h-4 w-4 text-primary" />
                            Programada
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="gap-2 rounded-lg cursor-pointer"
                            onClick={() => onStatusChange(item.id, Status.COMPLETED)}
                        >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Completada
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="gap-2 rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                            onClick={() => onStatusChange(item.id, Status.CANCELLED)}
                        >
                            <XCircle className="h-4 w-4" />
                            Cancelada
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
