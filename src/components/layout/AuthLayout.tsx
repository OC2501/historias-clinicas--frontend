import { Outlet } from 'react-router';

export function AuthLayout() {
    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#F6F3EA] flex flex-col">
            {/* Animated Mesh Gradient Background (Innovative & Premium) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div 
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/40 blur-[100px] animate-pulse" 
                    style={{ animationDuration: '8s' }}
                />
                <div 
                    className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-indigo-300/20 blur-[100px] animate-pulse" 
                    style={{ animationDuration: '12s', animationDelay: '1s' }}
                />
                <div 
                    className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-slate-300/30 blur-[120px] animate-pulse" 
                    style={{ animationDuration: '10s', animationDelay: '2s' }}
                />
            </div>
            
            {/* Geometric accents (Elegance) */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#303854 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />

            <div className="relative z-10 w-full flex-1 flex flex-col">
                <Outlet />
            </div>
        </div>
    );
}
