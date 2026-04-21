import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Trash2,
    GripVertical,
    Save,
    Loader2,
    Search,
    BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
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
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { specialtiesApi, doctorsApi } from '@/api';
import { FieldType, FieldLayout } from '@/types/enums';
import type { SpecialtyTemplate, TemplateSection, TemplateField } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Predefinidos para agilizar la creación
const SPECIALTY_PRESETS: Record<string, { titulo: string, campos: any[] }[]> = {
    'MEDICINA GENERAL': [
        {
            titulo: 'Motivo y Enfermedad Actual',
            campos: [
                { label: 'Motivo de Consulta', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: true },
                { label: 'Relato de la Enfermedad', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: true },
            ]
        },
        {
            titulo: 'Antecedentes',
            campos: [
                { label: 'Antecedentes Personales', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false },
                { label: 'Antecedentes Familiares', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false },
                { label: 'Alergias', tipo: FieldType.TEXT, layout: FieldLayout.FULL, required: false },
            ]
        },
        {
            titulo: 'Examen Físico y Signos Vitales',
            campos: [
                { label: 'Tensión Arterial', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false },
                { label: 'Frecuencia Cardíaca', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false },
                { label: 'Temperatura', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false },
                { label: 'Peso (Kg)', tipo: FieldType.NUMBER, layout: FieldLayout.HALF, required: false },
                { label: 'Talla (Cm)', tipo: FieldType.NUMBER, layout: FieldLayout.HALF, required: false },
                { label: 'Observaciones Físicas', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false },
            ]
        }
    ],
    'PEDIATRÍA': [
        {
            titulo: 'Consulta Pediátrica',
            campos: [
                { label: 'Motivo de Consulta', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: true },
                { label: 'Peso al nacer', tipo: FieldType.TEXT, layout: FieldLayout.HALF, required: false },
                { label: 'Desarrollo Psicomotriz', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false },
            ]
        }
    ]
};

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
    const [search, setSearch] = useState('');
    const { user } = useAuth();

    // Paginación
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [meta, setMeta] = useState<any>(null);

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

    const { data: doctorsRes } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const res = await doctorsApi.getAll();
            return res.data;
        },
    });

    const doctors = doctorsRes?.data || [];

    // Pre-seleccionar doctor si el usuario es DOCTOR
    useMemo(() => {
        if (user && (user.organizationRole || user.systemRole) === 'DOCTOR' && doctors.length > 0) {
            const doctor = doctors.find((d: any) => d.user?.id === user.id);
            if (doctor && !form.getValues('doctorId')) {
                form.setValue('doctorId', doctor.id);
            }
        }
    }, [user, doctors, form]);
    const filteredTemplates = useMemo(() => {
        if (!search) return templates;
        const lowerSearch = search.toLowerCase();
        return templates.filter(t =>
            t.name.toLowerCase().includes(lowerSearch) ||
            (t.specialty || '').toLowerCase().includes(lowerSearch)
        );
    }, [templates, search]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleApplyPreset = (specialtyKey: string) => {
        const preset = SPECIALTY_PRESETS[specialtyKey];
        if (preset) {
            const mappedSections: TemplateSection[] = preset.map(s => ({
                id: crypto.randomUUID(),
                titulo: s.titulo,
                campos: s.campos.map(f => ({
                    ...f,
                    id: crypto.randomUUID(),
                }))
            }));
            setSecciones(mappedSections);
            form.setValue('specialty', specialtyKey);
            toast.success(`Campos de ${specialtyKey} cargados`);
        }
    };

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await specialtiesApi.getAll({ page, limit });
            setTemplates(res.data.data || res.data || []);
            setMeta(res.data.meta || {
                total: (res.data as any).total || 0,
                lastPage: (res.data as any).lastPage || 1
            });
        } catch (error) {
            toast.error('Error al cargar plantillas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, [page, limit]);

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
            doctorId: user && (user.organizationRole || user.systemRole) === 'DOCTOR' ? doctors.find((d: any) => d.user?.id === user.id)?.id || '' : '',
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
            // NUNCA enviar isActive al crear/actualizar (error backend)
            const { isActive, ...restValues } = values;
            const payload = {
                ...restValues,
                estructura: { secciones }
            };

            if (editingTemplate) {
                await specialtiesApi.update(editingTemplate.id, payload as any);
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

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o especialidad..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                columns={getSpecialtyTemplateColumns(handleEdit, setDeleteId)}
                data={filteredTemplates}
                isLoading={isLoading}
                onRowClick={handleEdit}
                pagination={meta ? {
                    currentPage: page,
                    totalPages: meta.lastPage,
                    pageSize: limit,
                    totalItems: meta.total,
                    onPageChange: setPage,
                    onPageSizeChange: setLimit
                } : undefined}
            />

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl">
                    <div className="bg-slate-50/80 backdrop-blur-sm border-b p-6">
                        <DialogHeader>
                            <div className="flex items-center justify-between gap-6 px-1">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                            {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                                        </DialogTitle>
                                        <FormField
                                            control={form.control}
                                            name="isActive"
                                            render={({ field }) => (
                                                <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-full shadow-sm ml-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter pl-1">Status</span>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        className="scale-[0.6] data-[state=checked]:bg-emerald-500"
                                                    />
                                                </div>
                                            )}
                                        />
                                    </div>
                                    <DialogDescription className="text-slate-500 font-medium">
                                        Define la estructura del formulario dinámico de evolución.
                                    </DialogDescription>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!editingTemplate && (
                                        <Select onValueChange={handleApplyPreset}>
                                            <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200 shadow-sm transition-all hover:border-primary/30">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                                <SelectValue placeholder="Cargar Preset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(SPECIALTY_PRESETS).map(key => (
                                                    <SelectItem key={key} value={key} className="font-medium cursor-pointer">
                                                        {key}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                        <Form {...form}>
                            <form className="space-y-8">
                                {/* Informació General */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre de Plantilla</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ej: Historia Neumonología"
                                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="specialty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider">Especialidad</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ej: NEUMONOLOGÍA"
                                                        className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="doctorId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider">Médico Asignado</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all shadow-none">
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
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <GripVertical className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800">Secciones del Formulario</h3>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddSection}
                                            className="h-9 border-dashed border-2 px-4 hover:border-primary hover:text-primary transition-all"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Añadir Sección
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {secciones.map((seccion) => (
                                            <div key={seccion.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
                                                <div className="flex items-center gap-3 px-5 py-3 bg-slate-50/50 border-b border-slate-100 group-hover:bg-primary/5 transition-colors">
                                                    <GripVertical className="h-4 w-4 text-slate-300 cursor-move" />
                                                    <Input
                                                        value={seccion.titulo}
                                                        onChange={(e) => handleUpdateSectionTitle(seccion.id, e.target.value)}
                                                        className="font-bold border-none bg-transparent h-9 text-slate-700 px-0 focus-visible:ring-0 text-base flex-1"
                                                        placeholder="Título de la sección..."
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        onClick={() => handleRemoveSection(seccion.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="p-5 space-y-3">
                                                    {seccion.campos.map((campo) => (
                                                        <div key={campo.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50/50 border border-slate-100 rounded-xl transition-all hover:bg-white hover:border-slate-200 hover:shadow-sm">
                                                            <div className="flex-1 w-full space-y-1">
                                                                <input
                                                                    value={campo.label}
                                                                    onChange={(e) => handleUpdateField(seccion.id, campo.id, { label: e.target.value })}
                                                                    placeholder="Label del campo..."
                                                                    className="w-full bg-transparent border-none text-sm font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-0"
                                                                />
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <Select
                                                                    value={campo.tipo}
                                                                    onValueChange={(v) => handleUpdateField(seccion.id, campo.id, { tipo: v as FieldType })}
                                                                >
                                                                    <SelectTrigger className="h-8 w-[140px] bg-white border-slate-200 text-xs shadow-none">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.values(FieldType).map(t => (
                                                                            <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>

                                                                <Select
                                                                    value={campo.layout}
                                                                    onValueChange={(v) => handleUpdateField(seccion.id, campo.id, { layout: v as FieldLayout })}
                                                                >
                                                                    <SelectTrigger className="h-8 w-[110px] bg-white border-slate-200 text-xs shadow-none">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {Object.values(FieldLayout).map(l => (
                                                                            <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>

                                                                <div className="flex items-center gap-2 pl-2 pr-1 h-8 bg-white border border-slate-200 rounded-lg shadow-none">
                                                                    <span className="text-[9px] uppercase font-bold text-slate-400">Req</span>
                                                                    <Switch
                                                                        checked={campo.required}
                                                                        onCheckedChange={(v: boolean) => handleUpdateField(seccion.id, campo.id, { required: v })}
                                                                        className="scale-[0.6] data-[state=checked]:bg-primary"
                                                                    />
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                    onClick={() => handleRemoveField(seccion.id, campo.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full h-11 border-dashed border-2 text-slate-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all mt-2"
                                                        onClick={() => handleAddField(seccion.id)}
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" /> Añadir Campo en {seccion.titulo}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>

                    <div className="bg-slate-50/80 backdrop-blur-sm border-t p-6">
                        <DialogFooter className="flex items-center justify-between gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="px-8 text-slate-500 hover:text-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="px-8 h-11 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {editingTemplate ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
                            </Button>
                        </DialogFooter>
                    </div>
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
