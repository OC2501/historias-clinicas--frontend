import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useUIStore } from '@/store/ui.store';

export function MainLayout() {
    const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block h-full transition-all duration-300 ease-in-out">
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
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
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
