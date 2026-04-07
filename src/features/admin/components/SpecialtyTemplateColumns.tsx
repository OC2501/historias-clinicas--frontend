import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout, Check, X, Edit2, Trash2 } from 'lucide-react';
import type { SpecialtyTemplate } from '@/types';
import type { Column } from '@/types/table';

export const getSpecialtyTemplateColumns = (
    onEdit: (template: SpecialtyTemplate) => void,
    onDelete: (id: string) => void
): Column<SpecialtyTemplate>[] => [
    {
        header: 'Nombre',
        accessorKey: (template) => (
            <div className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-primary" />
                <span className="font-medium">{template.name}</span>
            </div>
        ),
    },
    {
        header: 'Especialidad',
        accessorKey: (template) => (
            <Badge variant="outline" className="capitalize">
                {template.specialty?.toLowerCase()}
            </Badge>
        ),
    },
    {
        header: 'Estado',
        accessorKey: (template) => (
            template.isActive ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 border-transparent text-white">
                    <Check className="h-3 w-3" /> Activa
                </Badge>
            ) : (
                <Badge variant="secondary" className="gap-1">
                    <X className="h-3 w-3" /> Inactiva
                </Badge>
            )
        ),
    },
    {
        header: 'Secciones',
        accessorKey: (template) => (
            <span className="text-sm text-muted-foreground font-medium">
                {template.estructura?.secciones?.length || 0} secciones
            </span>
        ),
    },
    {
        header: 'Acciones',
        className: 'text-right',
        accessorKey: (template) => (
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => onEdit(template)}
                >
                    <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => onDelete(template.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
];
