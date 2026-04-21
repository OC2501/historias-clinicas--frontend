import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, Edit2, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import { OrganizationRole } from '@/types/enums';
import type { Column } from '@/types/table';

export const getUserColumns = (
    onEdit: (user: User) => void,
    onDelete: (id: string) => void
): Column<User>[] => [
    {
        header: 'Nombre',
        accessorKey: (user) => (
            <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.name}</span>
            </div>
        ),
    },
    {
        header: 'Email',
        accessorKey: (user) => (
            <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm truncate max-w-[150px]">{user.email}</span>
            </div>
        ),
    },
    {
        header: 'Rol',
        accessorKey: (user) => {
            const role = user.organizationRole || user.systemRole;
            switch (role) {
                case OrganizationRole.ADMIN: return <Badge className="bg-red-500 hover:bg-red-600">ADMIN</Badge>;
                case OrganizationRole.DOCTOR: return <Badge className="bg-blue-500 hover:bg-blue-600">MÉDICO</Badge>;
                case OrganizationRole.SECRETARY: return <Badge className="bg-orange-500 hover:bg-orange-600">SECRETARÍA/O</Badge>;
                case OrganizationRole.OWNER: return <Badge className="bg-purple-500 hover:bg-purple-600">PROPIETARIO</Badge>;
                case OrganizationRole.MEDICAL_DIRECTOR: return <Badge className="bg-green-500 hover:bg-green-600">DIRECTOR</Badge>;
                default: return <Badge variant="secondary">{role}</Badge>;
            }
        },
    },
    {
        header: 'Acciones',
        className: 'text-right',
        accessorKey: (user) => (
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={() => onEdit(user)}
                >
                    <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => onDelete(user.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    },
];
