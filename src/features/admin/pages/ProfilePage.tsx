import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Loader2, User, Building2, ShieldCheck, Mail, Briefcase, Award, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usersApi, organizationsApi, doctorsApi } from '@/api';
import { OrganizationPlanType, OrganizationRole } from '@/types';

// Esquemas de validación
const accountSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Correo electrónico inválido'),
});

const organizationSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    type: z.string().optional(),
    size: z.string().optional(),
    allowAdminAudit: z.boolean(),
});

const professionalSchema = z.object({
    specialty: z.string().min(2, 'La especialidad debe tener al menos 2 caracteres'),
    licenseNumber: z.string().min(2, 'El número de licencia debe tener al menos 2 caracteres'),
});

const securitySchema = z.object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type AccountValues = z.infer<typeof accountSchema>;
type OrganizationValues = z.infer<typeof organizationSchema>;
type ProfessionalValues = z.infer<typeof professionalSchema>;
type SecurityValues = z.infer<typeof securitySchema>;

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
    const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);
    const [isSubmittingProfessional, setIsSubmittingProfessional] = useState(false);
    const [isSubmittingSecurity, setIsSubmittingSecurity] = useState(false);

    const accountForm = useForm<AccountValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
        },
    });

    const orgForm = useForm<OrganizationValues>({
        resolver: zodResolver(organizationSchema),
        defaultValues: {
            name: user?.organization?.name || '',
            type: user?.organization?.type || '',
            size: user?.organization?.size || '',
            allowAdminAudit: user?.organization?.allowAdminAudit || false,
        },
    });

    const profForm = useForm<ProfessionalValues>({
        resolver: zodResolver(professionalSchema),
        defaultValues: {
            specialty: user?.doctorProfile?.specialty || '',
            licenseNumber: user?.doctorProfile?.licenseNumber || '',
        },
    });

    const securityForm = useForm<SecurityValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    // Actualizar valores por defecto cuando el usuario cargue
    useEffect(() => {
        if (user) {
            accountForm.reset({
                name: user.name,
                email: user.email,
            });
            if (user.organization) {
                orgForm.reset({
                    name: user.organization.name,
                    type: user.organization.type || '',
                    size: user.organization.size || '',
                    allowAdminAudit: user.organization.allowAdminAudit || false,
                });
            }
            if (user.doctorProfile) {
                profForm.reset({
                    specialty: user.doctorProfile.specialty || '',
                    licenseNumber: user.doctorProfile.licenseNumber || '',
                });
            }
        }
    }, [user, accountForm, orgForm, profForm]);

    const onAccountSubmit = async (values: AccountValues) => {
        if (!user) return;
        setIsSubmittingAccount(true);
        try {
            const response = await usersApi.update(user.id, values);
            const updatedUser = response.data;
            
            const emailChanged = values.email !== user.email;
            
            updateUser({ ...user, ...updatedUser });
            toast.success(emailChanged 
                ? 'Perfil actualizado. Si cambiaste el correo, es posible que debas iniciar sesión nuevamente.' 
                : 'Información personal actualizada con éxito');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar el perfil');
        } finally {
            setIsSubmittingAccount(false);
        }
    };

    const onOrgSubmit = async (values: OrganizationValues) => {
        if (!user?.organization?.id) return;
        setIsSubmittingOrg(true);
        try {
            const response = await organizationsApi.update(user.organization.id, values);
            const updatedOrg = response.data;
            
            updateUser({ 
                ...user, 
                organization: { ...user.organization, ...updatedOrg } 
            });
            
            toast.success('Información de la organización actualizada');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar la organización');
        } finally {
            setIsSubmittingOrg(false);
        }
    };

    const onProfessionalSubmit = async (values: ProfessionalValues) => {
        if (!user?.doctorProfile?.id) return;
        setIsSubmittingProfessional(true);
        try {
            const response = await doctorsApi.update(user.doctorProfile.id, values);
            const updatedProfile = response.data;
            
            updateUser({ 
                ...user, 
                doctorProfile: { ...user.doctorProfile, ...updatedProfile } 
            });
            
            toast.success('Información profesional actualizada');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar el perfil profesional');
        } finally {
            setIsSubmittingProfessional(false);
        }
    };

    const onSecuritySubmit = async (values: SecurityValues) => {
        if (!user) return;
        setIsSubmittingSecurity(true);
        try {
            await usersApi.update(user.id, { password: values.password });
            toast.success('Contraseña actualizada con éxito');
            securityForm.reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar la contraseña');
        } finally {
            setIsSubmittingSecurity(false);
        }
    };

    const isIndependent = user?.organization?.planType === OrganizationPlanType.INDEPENDENT;
    const isOwner = user?.organizationRole === OrganizationRole.OWNER;
    const hasDoctorProfile = !!user?.doctorProfile;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <User className="h-8 w-8 text-primary" />
                    Mi Perfil
                </h1>
                <p className="text-muted-foreground mt-1">
                    Gestione su información personal y configuraciones de cuenta.
                </p>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className={cn(
                    "grid w-full mb-8",
                    hasDoctorProfile ? "lg:w-[540px] grid-cols-4" : "lg:w-[400px] grid-cols-3"
                )}>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Cuenta
                    </TabsTrigger>
                    {hasDoctorProfile && (
                        <TabsTrigger value="professional" className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Profesional
                        </TabsTrigger>
                    )}
                    <TabsTrigger value="organization" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {isIndependent ? 'Consultorio' : 'Clínica'}
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Seguridad
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Personal</CardTitle>
                            <CardDescription>
                                Actualice su nombre y dirección de correo electrónico.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...accountForm}>
                                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4 max-w-md">
                                    <FormField
                                        control={accountForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Completo</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Su nombre" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={accountForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    Correo Electrónico
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder="correo@ejemplo.com" />
                                                </FormControl>
                                                <FormDescription>
                                                    Este correo se usa para iniciar sesión.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSubmittingAccount}>
                                        {isSubmittingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Guardar Cambios
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {hasDoctorProfile && (
                    <TabsContent value="professional">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información Profesional</CardTitle>
                                <CardDescription>
                                    Gestione su especialidad y credenciales médicas.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...profForm}>
                                    <form onSubmit={profForm.handleSubmit(onProfessionalSubmit)} className="space-y-4 max-w-md">
                                        <FormField
                                            control={profForm.control}
                                            name="specialty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Award className="h-4 w-4 text-muted-foreground" />
                                                        Especialidad Médica
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Ej. Cardiología" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={profForm.control}
                                            name="licenseNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                                                        Número de Licencia / Matrícula
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="MP 123456" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" disabled={isSubmittingProfessional}>
                                            {isSubmittingProfessional ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Guardar Credenciales
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="organization">
                    <Card>
                        <CardHeader>
                            <CardTitle>{isIndependent ? 'Detalles del Consultorio' : 'Detalles de la Clínica'}</CardTitle>
                            <CardDescription>
                                {isIndependent 
                                    ? 'Configure la información de su consultorio independiente.' 
                                    : 'Administre la información pública de su centro médico.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...orgForm}>
                                <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-4 max-w-md">
                                    <FormField
                                        control={orgForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Comercial</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Nombre de la clínica o consultorio" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={orgForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    Tipo de Centro
                                                </FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Ej. Policlínica, Unidad Dental..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {!isIndependent && (
                                        <FormField
                                            control={orgForm.control}
                                            name="size"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        Tamaño del Centro
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Ej. 2-5 médicos" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {isOwner && !isIndependent && (
                                        <FormField
                                            control={orgForm.control}
                                            name="allowAdminAudit"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Permitir Auditoría a Admins</FormLabel>
                                                        <FormDescription>
                                                            Los administradores podrán ver el dashboard de auditoría.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <Button type="submit" disabled={isSubmittingOrg}>
                                        {isSubmittingOrg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Actualizar Información
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Seguridad de la Cuenta</CardTitle>
                            <CardDescription>
                                Cambie su contraseña para mantener su cuenta segura.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...securityForm}>
                                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4 max-w-md">
                                    <FormField
                                        control={securityForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nueva Contraseña</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" placeholder="••••••••" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={securityForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirmar Contraseña</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" placeholder="••••••••" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" variant="destructive" disabled={isSubmittingSecurity}>
                                        {isSubmittingSecurity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Cambiar Contraseña
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
