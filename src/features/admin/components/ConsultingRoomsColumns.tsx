import { Button } from '@/components/ui/button';
import type { ConsultingRoom } from '@/types';
import { Edit2, Trash2 } from 'lucide-react';
import type { Column } from '@/types/table';
import { Badge } from '@/components/ui/badge';

export const getConsultingRoomColumns = (
    onEdit: (room: ConsultingRoom) => void,
    onDelete: (id: string) => void
): Column<ConsultingRoom>[] => [
    {
        header: 'Consultorio',
        accessorKey: (consultingRoom) => (
            <div className="flex flex-col">
                <span className="font-semibold text-primary">{consultingRoom?.nombre || '—'}</span>
            </div>
        ),
    },
    {
        header: 'Ubicación',
        accessorKey: (consultingRoom) => {
            return (
                <span className="text-muted-foreground italic">
                    {consultingRoom.ubicacion || 'Sin ubicación'}
                </span>
            );
        },
    },
    {
        header: 'Estado',
        accessorKey: (consultingRoom) => {
            return (
                <Badge 
                    variant={consultingRoom.disponible ? "default" : "outline"} 
                    className={consultingRoom.disponible ? "bg-emerald-500 hover:bg-emerald-600 border-transparent text-white" : ""}
                >
                    {consultingRoom.disponible ? 'Disponible' : 'Ocupado'}
                </Badge>
            );
        },
    },
    {
        header: 'Acciones',
        className: 'text-right',
        accessorKey: (consultingRoom) => {
            return (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => onEdit(consultingRoom)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => onDelete(consultingRoom.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];
