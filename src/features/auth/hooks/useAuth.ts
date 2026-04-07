import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
    const { 
        user, 
        token, 
        isAuthenticated, 
        isLoading, 
        login, 
        register,
        logout, 
        updateUser 
    } = useAuthStore();

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
    };
}
