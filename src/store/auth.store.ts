import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, LoginRequest } from '@/types';
import { authApi } from '@/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (data: LoginRequest) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            setLoading: (isLoading) => set({ isLoading }),

            login: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await authApi.login(data);
                    const { user, token } = response.data;
                    
                    set({ 
                        user, 
                        token, 
                        isAuthenticated: true, 
                        isLoading: false 
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true });
                try {
                    await authApi.register(data);
                    set({ isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: () => {
                set({ 
                    user: null, 
                    token: null, 
                    isAuthenticated: false 
                });
                // Limpiar caché de queries si fuera necesario
            },

            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            // Solo persistimos user, token e isAuthenticated
            partialize: (state) => ({ 
                user: state.user, 
                token: state.token, 
                isAuthenticated: state.isAuthenticated 
            }),
        }
    )
);
