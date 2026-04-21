import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { SystemRole, OrganizationRole } from '@/types';

interface RoleGuardProps {
    roles: Array<SystemRole | OrganizationRole>;
}

export function RoleGuard({ roles }: RoleGuardProps) {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Permitir acceso si el rol del sistema o de organización está en la lista de permitidos
    const hasAccess = 
        roles.includes(user.systemRole as any) || 
        (user.organizationRole && roles.includes(user.organizationRole as any));

    if (!hasAccess) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
