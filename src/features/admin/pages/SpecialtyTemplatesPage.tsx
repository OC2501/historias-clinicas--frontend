import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    Save,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { specialtiesApi, doctorsApi } from '@/api';
import { FieldType, FieldLayout } from '@/types/enums';
import type { SpecialtyTemplate, TemplateSection, TemplateField, CreateSpecialtyRequest } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

const templateSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    specialty: z.string().min(1, 'La especialidad es requerida'),
    doctorId: z.string().min(1, 'Seleccione un médico'),
    isActive: z.boolean().default(true),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

import { DataTable } from '@/components/tables/DataTable';
import { getSpecialtyTemplateColumns } from '../components/SpecialtyTemplateColumns';

export function SpecialtyTemplatesPage() {
    const [templates, setTemplates] = useState<SpecialtyTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<SpecialtyTemplate | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { user } = useAuth();

    const [secciones, setSecciones] = useState<TemplateSection[]>([]);

    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema) as any,
        defaultValues: {
            name: '',
            specialty: '',
            doctorId: '',
            isActive: true,
        },
    });

    const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => doctorsApi.getAll(),
    });

    const doctors = doctorsRes?.data?.data || [];

    // Pre-seleccionar doctor si el usuario es DOCTOR
    useMemo(() => {
        if (user?.role === 'DOCTOR' && doctors.length > 0) {
            const doctor = doctors.find((d: any) => d.user?.id === user.id);
            if (doctor && !form.getValues('doctorId')) {
                form.setValue('doctorId', doctor.id);
            }
        }
    }, [user, doctors, form]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await specialtiesApi.getAll({ page: 1, limit: 100 });
            setTemplates(res.data.data);
        } catch (error) {
            toast.error('Error al cargar plantillas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleEdit = (template: SpecialtyTemplate) => {
        setEditingTemplate(template);
        setSecciones(template.estructura?.secciones || []);
        form.reset({
            name: template.name,
            specialty: template.specialty,
            doctorId: template.doctor?.id || '',
            isActive: template.isActive,
        });
        setIsOpen(true);
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setSecciones([{
            id: crypto.randomUUID(),
            titulo: 'Primera Sección',
            campos: []
        }]);
        form.reset({
            name: '',
            specialty: '',
            doctorId: user?.role === 'DOCTOR' ? doctors.find((d: any) => d.user?.id === user.id)?.id || '' : '',
            isActive: true,
        });
        setIsOpen(true);
    };

    const handleAddSection = () => {
        setSecciones([...secciones, {
            id: crypto.randomUUID(),
            titulo: 'Nueva Sección',
            campos: []
        }]);
    };

    const handleRemoveSection = (sectionId: string) => {
        setSecciones(secciones.filter(s => s.id !== sectionId));
    };

    const handleUpdateSectionTitle = (sectionId: string, titulo: string) => {
        setSecciones(secciones.map(s => s.id === sectionId ? { ...s, titulo } : s));
    };

    const handleAddField = (sectionId: string) => {
        setSecciones(secciones.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    campos: [...s.campos, {
                        id: crypto.randomUUID(),
                        label: 'Nuevo Campo',
                        tipo: FieldType.TEXT,
                        layout: FieldLayout.FULL,
                        required: false
                    }]
                };
            }
            return s;
        }));
    };

    const handleUpdateField = (sectionId: string, fieldId: string, updates: Partial<TemplateField>) => {
        setSecciones(secciones.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    campos: s.campos.map(f => f.id === fieldId ? { ...f, ...updates } : f)
                };
            }
            return s;
        }));
    };

    const handleRemoveField = (sectionId: string, fieldId: string) => {
        setSecciones(secciones.map(s => {
            if (s.id === sectionId) {
                return {
                    ...s,
                    campos: s.campos.filter(f => f.id !== fieldId)
                };
            }
            return s;
        }));
    };

    const onSubmit = async (values: TemplateFormValues) => {
        setIsSubmitting(true);
        try {
            const { isActive, ...restValues } = values;
            const payload = {
                ...restValues,
                estructura: { secciones }
            };

            if (editingTemplate) {
                // For updates, we can include isActive if supported by backend, using 'as any' since it's requested
                await specialtiesApi.update(editingTemplate.id, { ...payload, isActive } as any);
                toast.success('Plantilla actualizada');
            } else {
                await specialtiesApi.create(payload as any);
                toast.success('Plantilla creada');
            }
            setIsOpen(false);
            loadTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar plantilla');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await specialtiesApi.delete(deleteId);
            toast.success('Plantilla eliminada');
            setDeleteId(null);
            loadTemplates();
        } catch (error) {
            toast.error('Error al eliminar plantilla');
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Plantillas de Especialidad</h1>
                    <p className="text-muted-foreground">
                        Configura los formularios dinámicos para cada especialidad médica.
                    </p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Plantilla
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Plantillas Configuradas</CardTitle>
                    <CardDescription>Estructuras dinámicas para historias clínicas y sesiones de evolución.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={getSpecialtyTemplateColumns(handleEdit, setDeleteId)}
                        data={templates}
                        isLoading={isLoading}
                        onRowClick={handleEdit}
                    />
                </CardContent>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
                        <DialogDescription>
                            Define la estructura del formulario dinámico.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre de Plantilla</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: Historia Neumonología" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="specialty"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Especialidad</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej: NEUMONOLOGÍA" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="doctorId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Médico</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccione médico" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {doctors.map((doc: any) => (
                                                        <SelectItem key={doc.id} value={doc.id}>
                                                            {doc.user?.name || `Dr. ${doc.specialty || doc.id.substring(0, 8)}`}
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
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                                            <div className="space-y-0.5">
                                                <FormLabel>Activa</FormLabel>
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
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">Secciones</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                                        <Plus className="h-4 w-4 mr-1" /> Añadir Sección
                                    </Button>
                                </div>

                                {secciones.map((seccion) => (
                                    <Card key={seccion.id} className="border-l-4 border-l-primary">
                                        <CardHeader className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                                <Input
                                                    value={seccion.titulo}
                                                    onChange={(e) => handleUpdateSectionTitle(seccion.id, e.target.value)}
                                                    className="font-bold border-none bg-transparent h-8 px-1 focus-visible:ring-0"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto text-destructive"
                                                    onClick={() => handleRemoveSection(seccion.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="py-2 px-4 space-y-3 pb-4">
                                            {seccion.campos.map((campo) => (
                                                <div key={campo.id} className="flex flex-wrap items-start gap-2 p-3 bg-muted/50 rounded-md border text-sm group">
                                                    <div className="flex-1 min-w-[200px] space-y-2">
                                                        <Input
                                                            value={campo.label}
                                                            onChange={(e) => handleUpdateField(seccion.id, campo.id, { label: e.target.value })}
                                                            placeholder="Label del campo"
                                                            className="h-8"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Select
                                                                value={campo.tipo}
                                                                onValueChange={(v) => handleUpdateField(seccion.id, campo.id, { tipo: v as FieldType })}
                                                            >
                                                                <SelectTrigger className="h-8 w-[140px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.values(FieldType).map(t => (
                                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select
                                                                value={campo.layout}
                                                                onValueChange={(v) => handleUpdateField(seccion.id, campo.id, { layout: v as FieldLayout })}
                                                            >
                                                                <SelectTrigger className="h-8 w-[120px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {Object.values(FieldLayout).map(l => (
                                                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <div className="flex items-center gap-1 px-2 border rounded-md">
                                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Req</span>
                                                                <Switch
                                                                    checked={campo.required}
                                                                    onCheckedChange={(v: boolean) => handleUpdateField(seccion.id, campo.id, { required: v })}
                                                                    className="scale-75"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100"
                                                        onClick={() => handleRemoveField(seccion.id, campo.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full border-dashed border-2 py-4"
                                                onClick={() => handleAddField(seccion.id)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> Añadir Campo
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Plantilla
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(v) => !v && setDeleteId(null)}
                onConfirm={handleDelete}
                title="¿Eliminar plantilla?"
                description="Se eliminará la configuración de este formulario. Las historias clínicas existentes no se verán afectadas."
                variant="destructive"
            />
        </div>
    );
}
