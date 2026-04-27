import { useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Stethoscope, Activity, HeartPulse, ShieldCheck, ArrowLeft, MailCheck } from 'lucide-react';
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
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../types/auth.schema';
import { authApi } from '../api/auth.api';

export function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await authApi.forgotPassword(data.email);
            setIsSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al procesar la solicitud. Intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
                        <MailCheck className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-primary">¡Correo Enviado!</h1>
                        <p className="text-muted-foreground">
                            Si el correo <strong>{form.getValues('email')}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
                        </p>
                    </div>
                    <Button asChild className="w-full h-12 rounded-xl">
                        <Link to="/login">Volver al Inicio de Sesión</Link>
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
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al login
                        </Link>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-primary">
                                EHR System
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-primary">
                            Recuperar Contraseña
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Ingrese su correo electrónico para recibir las instrucciones de recuperación.
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                            <Button
                                type="submit"
                                className="w-full h-12 font-extrabold text-base rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : 'Enviar Instrucciones'}
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
                            Seguridad de Datos Médicos
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                            Protegemos <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">su acceso</span>
                        </h2>
                        <p className="text-lg lg:text-xl text-white/70 max-w-md leading-relaxed font-light">
                            Utilizamos encriptación de grado militar para asegurar que sus credenciales siempre estén a salvo.
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
