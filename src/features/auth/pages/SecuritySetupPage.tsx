import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usersApi } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const securityQuestions = [
    "¿Cuál es el nombre de tu primera mascota?",
    "¿Cuál fue el nombre de tu primera escuela?",
    "¿En qué ciudad nació tu madre?",
    "¿Cuál es tu comida favorita?",
    "¿Cuál es el nombre de tu mejor amigo de la infancia?",
    "¿Cuál fue el modelo de tu primer auto?",
];

const securitySetupSchema = z.object({
    question1: z.string().min(1, 'Debe seleccionar una pregunta'),
    answer1: z.string().min(2, 'La respuesta debe tener al menos 2 caracteres'),
    question2: z.string().min(1, 'Debe seleccionar una pregunta'),
    answer2: z.string().min(2, 'La respuesta debe tener al menos 2 caracteres'),
}).refine((data) => data.question1 !== data.question2, {
    message: "Debe seleccionar dos preguntas diferentes",
    path: ["question2"],
});

type SecuritySetupValues = z.infer<typeof securitySetupSchema>;

export function SecuritySetupPage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<SecuritySetupValues>({
        resolver: zodResolver(securitySetupSchema),
        defaultValues: {
            question1: '',
            answer1: '',
            question2: '',
            answer2: '',
        },
    });

    const onSubmit = async (values: SecuritySetupValues) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await usersApi.update(user.id, {
                securityQuestion1: values.question1,
                securityAnswer1: values.answer1,
                securityQuestion2: values.question2,
                securityAnswer2: values.answer2,
            });

            // Actualizar store local de autenticación con el usuario devuelto
            updateUser(response.data);

            toast.success('Preguntas de seguridad configuradas con éxito');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar preguntas de seguridad');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex flex-col justify-start sm:justify-center items-center bg-[#eaebed] p-4 sm:p-6 py-8 sm:py-12 overflow-y-auto font-sans">
            <Card className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-6 my-auto animate-in fade-in zoom-in duration-500 shrink-0">
                <CardHeader className="text-center space-y-2 px-2 sm:px-6 pt-2 sm:pt-4">
                    <div className="mx-auto bg-primary/10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-1 sm:mb-2">
                        <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
                        Configurar Seguridad
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-xs sm:text-sm">
                        Para proteger su cuenta y permitir la recuperación de credenciales, configure sus preguntas de seguridad.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <FormField
                                control={form.control}
                                name="question1"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-slate-700">
                                            Pregunta de Seguridad 1
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm bg-slate-50/50">
                                                    <SelectValue placeholder="Seleccione una pregunta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {securityQuestions.map((q, idx) => (
                                                    <SelectItem key={idx} value={q}>
                                                        {q}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="answer1"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-slate-700">
                                            Respuesta 1
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Escriba su respuesta aquí"
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
                                name="question2"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-slate-700">
                                            Pregunta de Seguridad 2
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="h-11 rounded-xl border-slate-200 text-sm bg-slate-50/50">
                                                    <SelectValue placeholder="Seleccione una pregunta" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {securityQuestions.map((q, idx) => (
                                                    <SelectItem key={idx} value={q}>
                                                        {q}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="answer2"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs font-bold text-slate-700">
                                            Respuesta 2
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Escriba su respuesta aquí"
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
                                className="w-full h-12 font-bold text-sm bg-[#1a5f9c] hover:bg-[#154c7d] text-white rounded-xl shadow-md transition-all active:scale-[0.98] mt-4"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar y Continuar'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
