import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { UserRole } from '@/types';

interface RoleGuardProps {
    roles: UserRole[];
}

export function RoleGuard({ roles }: RoleGuardProps) {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
