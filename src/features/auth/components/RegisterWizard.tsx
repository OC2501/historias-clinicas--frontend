import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, Building, ArrowRight, ArrowLeft, Stethoscope } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '../types/auth.schema';
import { OrganizationPlanType, OrganizationRole } from '@/types/enums';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function RegisterWizard() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            phone: '',
            planType: undefined,
            organizationName: '',
            organizationType: '',
            organizationSize: '',
            organizationRole: undefined,
        },
        mode: 'onBlur',
        reValidateMode: 'onChange'
    });

    const isClinic = form.watch('planType') === OrganizationPlanType.CLINIC;

    useEffect(() => {
        form.clearErrors();
    }, [step, form]);

    const nextStep = async () => {
        let valid = false;
        if (step === 1) {
            valid = await form.trigger('planType');
            if (valid) {
                form.clearErrors(['name', 'email', 'password', 'phone']); // Limpieza preventiva
                setStep(isClinic ? 2 : 3);
            }
        } else if (step === 2) {
            valid = await form.trigger(['organizationName', 'organizationType', 'organizationRole']);
            if (valid) {
                form.clearErrors(['name', 'email', 'password', 'phone']); // Limpieza preventiva
                setStep(3);
            }
        }
    };

    const prevStep = () => {
        if (step === 3) {
            setStep(isClinic ? 2 : 1);
        } else {
            setStep(step - 1);
        }
    };

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            await register(data);
            toast.success('Cuenta creada exitosamente. Ya puede iniciar sesión.');
            navigate('/login');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Error al crear la cuenta. Intente nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Minimalist Header & Step Indicator */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-primary">
                        EHR System
                    </span>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase">
                            Paso {step === 1 ? '1' : step === 2 ? '2' : '3'} de 3
                        </span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-primary">
                        {step === 1 && 'Seleccione su Perfil'}
                        {step === 2 && 'Centro Médico'}
                        {step === 3 && 'Datos de la Cuenta'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {step === 1 && 'Elija cómo desea utilizar la plataforma.'}
                        {step === 2 && 'Complete la información de su institución sanitaria.'}
                        {step === 3 && 'Ingrese sus datos personales para finalizar.'}
                    </p>
                </div>

                {/* Elegant Segmented Progress */}
                <div className="flex w-full h-1 gap-1.5 pt-2">
                    <div className={`flex-1 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary' : 'bg-muted/20'}`} />
                    <div className={`flex-1 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary' : 'bg-muted/20'}`} />
                    <div className={`flex-1 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary' : 'bg-muted/20'}`} />
                </div>
            </div>

            <div className="min-h-[400px]">
                {error && (
                    <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* STEP 1: PLAN TYPE */}
                        {step === 1 && (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div
                                    className={`group cursor-pointer relative p-0.5 rounded-2xl transition-all duration-300 ${form.watch('planType') === OrganizationPlanType.INDEPENDENT ? 'bg-primary shadow-xl ring-4 ring-primary/5' : 'bg-muted/10 hover:bg-muted/20'}`}
                                    onClick={() => form.setValue('planType', OrganizationPlanType.INDEPENDENT)}
                                >
                                    <div className="bg-white dark:bg-card rounded-[calc(1rem-1px)] p-6 h-full flex flex-col items-center text-center space-y-4">
                                        <div className={`p-4 rounded-2xl transition-all duration-300 ${form.watch('planType') === OrganizationPlanType.INDEPENDENT ? 'bg-primary text-white scale-110' : 'bg-primary/5 text-primary group-hover:bg-primary/10'}`}>
                                            <User size={32} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary">Médico Independiente</h3>
                                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Ideal para consultas privadas y profesionales autónomos.</p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`group cursor-pointer relative p-0.5 rounded-2xl transition-all duration-300 ${form.watch('planType') === OrganizationPlanType.CLINIC ? 'bg-primary shadow-xl ring-4 ring-primary/5' : 'bg-muted/10 hover:bg-muted/20'}`}
                                    onClick={() => form.setValue('planType', OrganizationPlanType.CLINIC)}
                                >
                                    <div className="bg-white dark:bg-card rounded-[calc(1rem-1px)] p-6 h-full flex flex-col items-center text-center space-y-4">
                                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[9px] px-2 py-0.5 font-black rounded-full tracking-widest">PREMIUM</div>
                                        <div className={`p-4 rounded-2xl transition-all duration-300 ${form.watch('planType') === OrganizationPlanType.CLINIC ? 'bg-primary text-white scale-110' : 'bg-primary/5 text-primary group-hover:bg-primary/10'}`}>
                                            <Building size={32} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-primary">Centro Médico</h3>
                                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Gestión multi-usuario para clínicas, laboratorios y hospitales.</p>
                                        </div>
                                    </div>
                                </div>

                                {form.formState.errors.planType && (
                                    <p className="text-destructive text-xs font-bold col-span-1 sm:col-span-2 text-center animate-bounce">{form.formState.errors.planType.message}</p>
                                )}
                            </div>
                        )}

                        {/* STEP 2: CLINIC DETAILS */}
                        {step === 2 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                                <FormField
                                    control={form.control}
                                    name="organizationName"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Nombre del Centro Médico</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej: Clínica San Rafael"
                                                    autoComplete="organization"
                                                    className="h-12 border-muted/30 bg-muted/5 focus:bg-white transition-all rounded-xl text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="organizationType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Tipo</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 border-muted/30 bg-muted/5 rounded-xl">
                                                            <SelectValue placeholder="Seleccione..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Clínica General">Clínica General</SelectItem>
                                                        <SelectItem value="Centro de Especialidades">Centro de Especialidades</SelectItem>
                                                        <SelectItem value="Hospital">Hospital</SelectItem>
                                                        <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="organizationSize"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Plantilla</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 border-muted/30 bg-muted/5 rounded-xl">
                                                            <SelectValue placeholder="Tamaño..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="2-5 médicos">2-5 médicos</SelectItem>
                                                        <SelectItem value="6-20 médicos">6-20 médicos</SelectItem>
                                                        <SelectItem value="21-50 médicos">21-50 médicos</SelectItem>
                                                        <SelectItem value="+50 médicos">+50 médicos</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="organizationRole"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">¿Cuál es su cargo?</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-12 border-muted/30 bg-muted/5 rounded-xl">
                                                        <SelectValue placeholder="Seleccione su rol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value={OrganizationRole.OWNER}>Propietario / Administrador</SelectItem>
                                                    <SelectItem value={OrganizationRole.MEDICAL_DIRECTOR}>Director Médico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* STEP 3: PERSONAL DETAILS */}
                        {step === 3 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Nombre Completo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Juan Pérez"
                                                    autoComplete="name"
                                                    className="h-12 border-muted/30 bg-muted/5 focus:bg-white transition-all rounded-xl text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Email Profesional</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="nombre@ejemplo.com"
                                                        type="email"
                                                        autoComplete="email"
                                                        className="h-12 border-muted/30 bg-muted/5 focus:bg-white transition-all rounded-xl text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem className="space-y-1.5">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Teléfono</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="+123456789"
                                                        type="tel"
                                                        autoComplete="tel"
                                                        className="h-12 border-muted/30 bg-muted/5 focus:bg-white transition-all rounded-xl text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem className="space-y-1.5">
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">Establecer Contraseña</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    className="h-12 border-muted/30 bg-muted/5 focus:bg-white transition-all rounded-xl text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-8 border-t border-muted/20">
                            {step > 1 ? (
                                <Button type="button" variant="ghost" onClick={prevStep} className="px-5 h-12 text-muted-foreground hover:text-primary hover:bg-muted/10 transition-all rounded-xl font-bold">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                                </Button>
                            ) : (
                                <div />
                            )}

                            {step < 3 ? (
                                <Button type="button" onClick={nextStep} className="px-8 h-12 font-extrabold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl">
                                    Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isLoading} className="px-10 h-12 font-extrabold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl bg-primary">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear mi Cuenta'}
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </div>

            <div className="pt-6 text-center">
                <p className="text-muted-foreground text-sm">
                    ¿Ya tiene una cuenta?{' '}
                    <Link to="/login" className="text-primary hover:underline font-extrabold decoration-2 underline-offset-4">
                        Inicie sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
