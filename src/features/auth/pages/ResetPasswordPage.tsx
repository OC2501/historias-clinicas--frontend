import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Stethoscope, Activity, HeartPulse, ShieldCheck, LockKeyhole, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../types/auth.schema';
import { authApi } from '../api/auth.api';

export function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: ResetPasswordFormValues) => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            await authApi.resetPassword({
                token,
                password: data.password,
            });
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'El enlace ha expirado o es inválido.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-emerald-600">¡Contraseña Actualizada!</h1>
                        <p className="text-muted-foreground">
                            Su contraseña ha sido cambiada con éxito. Será redirigido al inicio de sesión en unos segundos.
                        </p>
                    </div>
                    <Button asChild className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                        <Link to="/login">Ir al Login Ahora</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-background font-sans overflow-hidden">
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
                            Nueva Contraseña
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Establezca su nueva contraseña de acceso al portal médico.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                            {error}
                            <div className="mt-2">
                                <Link to="/forgot-password" className="text-xs underline">Solicitar un nuevo enlace</Link>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                                                Nueva Contraseña
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-12 pl-10 border-muted/30 bg-muted/5 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                                                Confirmar Contraseña
                                            </FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                    <Input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        className="h-12 pl-10 border-muted/30 bg-muted/5 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all rounded-xl text-sm"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 font-extrabold text-base rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : 'Restablecer Contraseña'}
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>

            <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-primary">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/medical_login.png"
                        alt="Medical Illustration"
                        className="w-full h-full object-cover opacity-50 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-transparent" />
                </div>

                <div className="relative z-10 w-full flex flex-col p-12 lg:p-16 justify-between h-full animate-in fade-in zoom-in duration-1000">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-widest uppercase">
                            <Activity className="h-3.5 w-3.5 text-emerald-400" />
                            Acceso Personalizado
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Recupere <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">su cuenta</span>
                        </h2>
                        <p className="text-lg lg:text-xl text-white/70 max-w-md leading-relaxed font-light">
                            Estamos aquí para ayudarle a retomar su labor médica con la mayor brevedad posible.
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
            </div>
        </div>
    );
}
