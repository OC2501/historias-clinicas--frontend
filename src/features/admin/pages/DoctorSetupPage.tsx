import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Loader2, Stethoscope, Award, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { doctorsApi } from '@/api';
import { useAuth } from '@/features/auth/hooks/useAuth';

const doctorSetupSchema = z.object({
    specialty: z.string().min(2, 'La especialidad debe tener al menos 2 caracteres'),
    licenseNumber: z.string().min(3, 'El número de licencia es requerido'),
});

type DoctorSetupValues = z.infer<typeof doctorSetupSchema>;

export default function DoctorSetupPage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<DoctorSetupValues>({
        resolver: zodResolver(doctorSetupSchema),
        defaultValues: {
            specialty: '',
            licenseNumber: '',
        },
    });

    const onSubmit = async (values: DoctorSetupValues) => {
        if (!user) return;

        setIsSubmitting(true);
        try {
            const response = await doctorsApi.create({
                userId: user.id,
                ...values,
            });

            // Actualizamos el usuario localmente con el nuevo perfil
            // El backend devuelve el perfil creado en response.data.data
            const doctorProfile = response.data;
            const updatedUser = {
                ...user,
                doctorProfile: doctorProfile
            };

            updateUser(updatedUser);

            toast.success('¡Perfil profesional creado con éxito!');
            navigate('/');

        } catch (error: any) {
            console.error('Error creating doctor profile:', error);
            toast.error(error.response?.data?.message || 'Error al crear el perfil profesional');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-none shadow-2xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit">
                        <Stethoscope className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Completa tu Perfil</CardTitle>
                        <CardDescription>
                            Para comenzar a atender pacientes, necesitamos configurar tu información profesional.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="specialty"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-muted-foreground" />
                                            Especialidad Médica
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. Cardiología, Pediatría..." {...field} className="h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="licenseNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <FileCheck className="h-4 w-4 text-muted-foreground" />
                                            Número de Licencia / Matrícula
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej. MP 12345..." {...field} className="h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full h-11 text-base font-bold mt-2" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        Activar Perfil Profesional
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
