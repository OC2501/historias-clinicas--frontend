import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Stethoscope, ShieldCheck, Activity, HeartPulse, Droplet } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { OrganizationRole, SystemRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { loginSchema, type LoginFormValues } from '../types/auth.schema';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await login(data);
            // Leer el usuario directamente desde el store (no de localStorage con key incorrecta)
            const user = useAuthStore.getState().user;
            const isAdmin =
                user?.organizationRole === OrganizationRole.ADMIN ||
                user?.organizationRole === OrganizationRole.OWNER ||
                user?.systemRole === SystemRole.SUPERADMIN;
            navigate(isAdmin ? '/settings/users' : '/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
            <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#eaebed] font-sans overflow-y-auto lg:overflow-hidden">
                {/* Left Side: Institutional Blue Banner */}
                <div className="hidden lg:flex lg:w-1/2 bg-[#1a5f9c] text-white p-8 sm:p-12 lg:p-20 flex-col justify-between relative overflow-hidden shrink-0 animate-in fade-in duration-700">
                    <div className="relative z-10 space-y-8 my-auto max-w-lg">
                        {/* Icon Header */}
                        <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
                            <Stethoscope className="h-8 w-8 text-white" />
                        </div>

                        {/* Title */}
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                                Portal Clínico <br />
                                Hidroven-Falcón.
                            </h1>
                            <p className="text-white/80 text-base sm:text-lg leading-relaxed font-normal max-w-md">
                                Control total sobre historias clínicas, citas, pacientes y consultas en una plataforma diseñada para la eficiencia médica.
                            </p>
                        </div>

                        {/* Footer Tag */}
                        <div className="pt-6 border-t border-white/20">
                            <p className="text-xs uppercase tracking-widest font-semibold text-white/60">
                                MINAGUAS / HIDROVEN-FALCÓN
                            </p>
                        </div>
                    </div>

                    {/* Subtle Background Pattern / Glow */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/10 rounded-full blur-3xl pointer-events-none" />
                </div>

                {/* Right Side: Form Panel */}
                <div className="flex-1 flex flex-col justify-start lg:justify-center items-center p-4 sm:p-10 lg:p-16 bg-[#eaebed] overflow-y-auto min-h-0 animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="w-full max-w-md space-y-4 sm:space-y-6 text-center mb-4 sm:mb-6 my-auto">
                        {/* Stethoscope Logo (Only on Mobile/Tablet) */}
                        <div className="lg:hidden mx-auto inline-flex p-3 sm:p-4 rounded-2xl bg-[#1a5f9c] text-white shadow-md mb-2">
                            <Stethoscope className="h-7 w-7 sm:h-8 sm:w-8" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1c1e] tracking-tight">
                            Bienvenido de nuevo
                        </h2>
                        <p className="text-slate-500 text-xs sm:text-sm">
                            Ingresa tus credenciales para acceder al sistema
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl border border-slate-200/80 space-y-5 sm:space-y-6">
                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-600 font-medium text-left">
                                {error}
                            </div>
                        )}

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 text-left">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel className="text-xs font-bold text-slate-700">
                                                Usuario / Correo
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="doctor@ejemplo.com o usuario"
                                                    className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#1a5f9c]/20 rounded-xl text-sm transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-xs font-bold text-slate-700">
                                                    Contraseña
                                                </FormLabel>
                                                <Link
                                                    to="/forgot-password"
                                                    className="text-xs font-semibold text-[#1a5f9c] hover:underline"
                                                >
                                                    ¿Olvidaste tu clave?
                                                </Link>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#1a5f9c]/20 rounded-xl text-sm transition-all"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-12 font-bold text-sm bg-[#1a5f9c] hover:bg-[#154c7d] text-white rounded-xl shadow-md transition-all active:scale-[0.98] mt-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Accediendo...
                                        </>
                                    ) : (
                                        'Acceder al Panel'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    {/* Footer Copyright */}
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-8">
                        © 2026 HIDROVEN-FALCÓN • V1.0.0
                    </p>
                </div>
            </div>
        );
    }
