import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authApi } from '@/features/auth/api/auth.api';

export function ProtectedRoute() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
    const [checkingMaintenance, setCheckingMaintenance] = useState(true);
    const location = useLocation();

    useEffect(() => {
        if (!isAuthenticated || user?.systemRole === 'SUPERADMIN') {
            setCheckingMaintenance(false);
            return;
        }

        const checkMaintenance = async () => {
            try {
                const res = await authApi.getMaintenanceStatus();
                if (res.data.active) {
                    setIsMaintenanceActive(true);
                }
            } catch (err) {
                console.error('Error checking maintenance status:', err);
            } finally {
                setCheckingMaintenance(false);
            }
        };

        checkMaintenance();
    }, [isAuthenticated, user]);

    if (isLoading || (isAuthenticated && user?.systemRole !== 'SUPERADMIN' && checkingMaintenance)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isMaintenanceActive && user?.systemRole !== 'SUPERADMIN') {
        return <Navigate to="/maintenance" replace />;
    }

    // Forzar configuración de preguntas de seguridad
    const hasConfiguredSecurity = !!user?.securityQuestion1 && !!user?.securityQuestion2;
    if (!hasConfiguredSecurity && location.pathname !== '/security-setup') {
        return <Navigate to="/security-setup" replace />;
    }

    if (hasConfiguredSecurity && location.pathname === '/security-setup') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
