import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Mail, Edit2, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import { OrganizationRole } from '@/types/enums';
import type { Column } from '@/types/table';

export const getUserColumns = (
    currentUser: User | null,
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
                case 'SUPERADMIN': 
                    return <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/25 font-bold shadow-none rounded-full px-2.5 py-0.5 transition-all">SUPERADMIN</Badge>;
                case OrganizationRole.ADMIN: 
                    return <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/25 font-semibold shadow-none rounded-full px-2.5 py-0.5 transition-all">ADMIN</Badge>;
                case OrganizationRole.DOCTOR: 
                    return <Badge className="bg-sky-500/10 text-sky-500 border border-sky-500/20 hover:bg-sky-500/25 font-semibold shadow-none rounded-full px-2.5 py-0.5 transition-all">MÉDICO</Badge>;
                case OrganizationRole.NURSE: 
                    return <Badge className="bg-teal-500/10 text-teal-600 border border-teal-500/20 hover:bg-teal-500/25 font-semibold shadow-none rounded-full px-2.5 py-0.5 transition-all">ENFERMERÍA</Badge>;
                case OrganizationRole.SECRETARY: 
                    return <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/25 font-semibold shadow-none rounded-full px-2.5 py-0.5 transition-all">SECRETARÍA/O</Badge>;
                case OrganizationRole.OWNER: 
                    return <Badge className="bg-violet-500/10 text-violet-500 border border-violet-500/20 hover:bg-violet-500/25 font-bold shadow-none rounded-full px-2.5 py-0.5 transition-all">PROPIETARIO</Badge>;
                case OrganizationRole.MEDICAL_DIRECTOR: 
                    return <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/25 font-bold shadow-none rounded-full px-2.5 py-0.5 transition-all">DIRECTOR</Badge>;
                case 'USER': 
                    return <Badge className="bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/25 font-semibold shadow-none rounded-full px-2.5 py-0.5 transition-all">USUARIO</Badge>;
                default: 
                    return <Badge variant="secondary" className="shadow-none rounded-full">{role}</Badge>;
            }
        },
    },
    {
        header: 'Acciones',
        className: 'text-right',
        accessorKey: (user) => {
            const isSuperadmin = user.systemRole === 'SUPERADMIN';
            const isSelf = user.id === currentUser?.id;
            const canEdit = !isSuperadmin || currentUser?.systemRole === 'SUPERADMIN';
            const canDelete = (!isSuperadmin || currentUser?.systemRole === 'SUPERADMIN') && !isSelf;

            return (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => onEdit(user)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => onDelete(user.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            );
        },
    },
];
