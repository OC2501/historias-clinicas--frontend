import { RegisterWizard } from '@/features/auth/components/RegisterWizard';
import { ShieldCheck, HeartPulse, Activity } from 'lucide-react';

export function RegisterPage() {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans overflow-hidden">
            {/* Left Side: Wizard Content */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-24 py-10 bg-white animate-in fade-in slide-in-from-left-4 duration-700 overflow-y-auto">
                <div className="max-w-xl w-full mx-auto py-8">
                    <RegisterWizard />
                </div>
            </div>

            {/* Right Side: Visual Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-primary">
                {/* Background Pattern / Illustration (Variant for Registration) */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/img/medical_register.png" 
                        alt="Medical Network Illustration" 
                        className="w-full h-full object-cover opacity-50 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-transparent" />
                </div>

                {/* Glassmorphism Cards */}
                <div className="relative z-10 w-full flex flex-col p-12 lg:p-16 justify-between h-full animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-widest uppercase">
                            <Activity className="h-3.5 w-3.5 text-spring-green-400" />
                            Expande tu Red Médica
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Únete a la <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Comunidad EHR</span>
                        </h2>
                        <p className="text-lg lg:text-xl text-white/70 max-w-md leading-relaxed font-light">
                            La plataforma que conecta a los mejores profesionales con la tecnología más avanzada.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-8">
                        {[
                            { icon: HeartPulse, label: 'Crecimiento Exponencial', desc: 'Gestiona más pacientes' },
                            { icon: ShieldCheck, label: 'Respaldo Total', desc: 'Soporte 24/7' }
                        ].map((item, i) => (
                            <div key={i} className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 space-y-2.5 hover:bg-white/20 transition-all duration-300">
                                <div className="p-2 rounded-xl bg-white/20 w-fit">
                                    <item.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-bold">{item.label}</h4>
                                    <p className="text-white/50 text-[10px] italic">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Animated Light Blobs */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>
        </div>
    );
}
