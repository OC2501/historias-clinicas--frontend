import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Stethoscope, ShieldCheck, Activity, HeartPulse } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if ((user.organizationRole || user.systemRole) === 'ADMIN') {
                    navigate('/settings/users');
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans overflow-hidden">
            {/* Left Side: Form */}
            <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-24 py-10 bg-white animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="max-w-md w-full mx-auto space-y-8">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-primary">
                                EHR System
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
                            Iniciar Sesión
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Acceda a su plataforma de gestión médica personalizada.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                                                Correo Electrónico
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="doctor@ejemplo.com"
                                                    className="h-12 border-muted/30 bg-muted/5 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm"
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
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                                                Contraseña
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="h-12 border-muted/30 bg-muted/5 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember" className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                    <label
                                        htmlFor="remember"
                                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                                    >
                                        Recordarme
                                    </label>
                                </div>
                                <Link
                                    to="/forgot-password"
                                    className="text-xs font-bold text-primary hover:underline underline-offset-4"
                                >
                                    ¿Olvidó su contraseña?
                                </Link>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 font-extrabold text-base rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                                        Procesando...
                                    </>
                                ) : 'Ingresar al Portal'}
                            </Button>
                        </form>
                    </Form>

                    <div className="pt-4 border-t border-muted/20 text-center">
                        <p className="text-muted-foreground text-sm">
                            ¿No tiene una cuenta?{' '}
                            <Link to="/register" className="text-primary hover:underline font-extrabold decoration-2 underline-offset-4">
                                Regístrese aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Visual Branding */}
            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-primary">
                {/* Background Pattern / Illustration */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/medical_login.png"
                        alt="Medical Illustration"
                        className="w-full h-full object-cover opacity-50 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-transparent" />
                </div>

                {/* Glassmorphism Cards */}
                <div className="relative z-10 w-full flex flex-col p-12 lg:p-16 justify-between h-full animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-widest uppercase">
                            <Activity className="h-3.5 w-3.5 text-emerald-400" />
                            Tecnología Médica de Vanguardia
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Bienvenido a <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">EHR System</span>
                        </h2>
                        <p className="text-lg lg:text-xl text-white/70 max-w-md leading-relaxed font-light">
                            Gestión inteligente y automatizada diseñada para los mejores centros de salud.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-8">
                        {[
                            { icon: HeartPulse, label: 'Precisión Clínica', desc: 'Diagnósticos asistidos' },
                            { icon: ShieldCheck, label: 'Seguridad Total', desc: 'Datos encriptados' }
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
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>
        </div>
    );
}
