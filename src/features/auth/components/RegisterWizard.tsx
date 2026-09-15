import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Stethoscope } from 'lucide-react';
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            phone: '',
            planType: OrganizationPlanType.CLINIC,
            organizationName: 'Clínica Hidroven',
            organizationType: 'Clínica General',
            organizationSize: '+50 médicos',
            organizationRole: OrganizationRole.DOCTOR,
        },
        mode: 'onBlur',
        reValidateMode: 'onChange'
    });

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
        <div className="space-y-4 animate-in fade-in duration-700">
            {/* Minimalist Header */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 mb-1">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-primary">
                        Portal Clínico Hidroven-Falcón
                    </span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-primary">
                        Crear Cuenta
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Ingrese sus datos personales y seleccione su cargo para registrarse en el sistema.
                    </p>
                </div>
            </div>

            <div className="min-h-0">
                {error && (
                    <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-5">
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

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                                                <SelectItem value={OrganizationRole.DOCTOR}>Médico Especialista</SelectItem>
                                                <SelectItem value={OrganizationRole.SECRETARY}>Secretaria / Recepcionista</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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

                        <div className="flex justify-end items-center pt-4 border-t border-muted/20">
                            <Button type="submit" disabled={isLoading} className="px-10 h-12 font-extrabold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl bg-primary w-full sm:w-auto">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear mi Cuenta'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>

            <div className="pt-3 text-center">
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
