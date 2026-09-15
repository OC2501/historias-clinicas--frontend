import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useUIStore } from '@/store/ui.store';
import { AlertsModal } from '@/features/alerts/components/AlertsModal';

export function MainLayout() {
    const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

    return (
        <div className="flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-background">
            {/* Alerts Modal - shown automatically on first login with unread alerts */}
            <AlertsModal />

            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-[100dvh] max-h-[100dvh] sticky top-0 transition-all duration-300 ease-in-out shrink-0 relative z-30">
                <Sidebar />
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-72 p-0 border-none">
                    <SheetTitle className="sr-only">Navegación</SheetTitle>
                    <Sidebar isMobile onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden min-w-0 h-full">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
                    <div className="mx-auto max-w-7xl">
                        <Breadcrumbs />
                        <div className="mt-4">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
