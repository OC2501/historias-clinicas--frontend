import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    isSidebarOpen: boolean;
    isMobileMenuOpen: boolean;
    activeTab: string;
    
    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (isOpen: boolean) => void;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (isOpen: boolean) => void;
    setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            isMobileMenuOpen: false,
            activeTab: 'general',

            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
            toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
            setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
            setActiveTab: (tab) => set({ activeTab: tab }),
        }),
        {
            name: 'ui-storage',
            // No persistimos el estado del menú móvil para evitar bloqueos al recargar
            partialize: (state) => ({ 
                isSidebarOpen: state.isSidebarOpen,
                activeTab: state.activeTab 
            }),
        }
    )
);
