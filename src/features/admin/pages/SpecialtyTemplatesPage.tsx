import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Trash2,
    Loader2,
    Search,
    LayoutTemplate,
    ClipboardList,
    ChevronRight,
    ArrowRight,
    X,
    Layers,
    FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
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
import { cn } from '@/lib/utils';

import { specialtiesApi } from '@/api';
import { FieldType, FieldLayout } from '@/types/enums';
import type { SpecialtyTemplate, TemplateSection, TemplateField } from '@/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/tables/DataTable';
import { getSpecialtyTemplateColumns } from '../components/SpecialtyTemplateColumns';

const FIELD_TYPE_LABELS: Record<string, string> = {
    'text': 'Texto corto',
    'textarea': 'Texto largo',
    'number': 'Número',
    'select': 'Lista de opciones',
    'radio': 'Selección única',
    'checkbox': 'Casilla',
    'date': 'Fecha',
    'rich-text': 'Editor de texto',
};

const FIELD_LAYOUT_LABELS: Record<string, string> = {
    'full': 'Ancho completo',
    'half': 'Mitad',
    'third': 'Un tercio',
};

const SECTION_ICONS = [ClipboardList, FileText, Layers, LayoutTemplate];

const SPECIALTY_PRESETS: Record<string, { titulo: string; campos: any[] }[]> = {
    'HISTORIA BÁSICA': [
        {
            titulo: 'Anamnesis e Historia',
            campos: [
                { label: 'Motivo de Consulta', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: true, placeholder: 'Escriba el motivo principal de la visita...' },
                { label: 'Enfermedad Actual', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: true, placeholder: 'Cronología y descripción de los síntomas...' },
            ],
        },
        {
            titulo: 'Antecedentes',
            campos: [
                { label: 'Enfermedades y Cirugías', tipo: FieldType.RICH_TEXT, layout: FieldLayout.HALF, required: false, placeholder: 'Ej. Asma, alergias, cirugías previas, etc.' },
                { label: 'Enfermedades del núcleo familiar', tipo: FieldType.RICH_TEXT, layout: FieldLayout.HALF, required: false, placeholder: 'Ej. Padre hipertenso, Madre diabética...' },
                { label: 'Hábitos', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Ej. Tabaquismo, alcohol, actividad física, alimentación...' },
            ],
        },
        {
            titulo: 'Constantes Vitales y Examen',
            campos: [
                { label: 'Presión Arterial', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '120/80 mmHg' },
                { label: 'Frec. Cardíaca', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '75 lpm' },
                { label: 'Frec. Respiratoria', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '15 rpm' },
                { label: 'Sat. O2 (%)', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '98' },
                { label: 'Temp. (°C)', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '36.5' },
                { label: 'Peso (kg)', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '70' },
                { label: 'Altura (cm)', tipo: FieldType.TEXT, layout: FieldLayout.HALF, required: false, placeholder: '175' },
                { label: 'IMC', tipo: FieldType.TEXT, layout: FieldLayout.HALF, required: false, placeholder: '22.5' },
                { label: 'Otros', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Describa hallazgos adicionales relevantes...' },
            ],
        },
    ],
    'HISTORIA CLÍNICA ODONTOLÓGICA': [
        {
            titulo: 'Anamnesis e Historia',
            campos: [
                { label: 'Tiempo, Inicio y Curso', tipo: FieldType.TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Tiempo de enfermedad, Inicio y Curso...' },
                { label: 'Signos y Síntomas Principales', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false, placeholder: 'Detalle los signos y síntomas principales...' },
                { label: 'Funciones Biológicas', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false, placeholder: 'Apetito, sed, sueño, sudor, peso, orina, deposiciones, estado de ánimo...' },
                { label: 'Riesgos', tipo: FieldType.TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Describa riesgos del paciente...' },
            ],
        },
        {
            titulo: 'Antecedentes',
            campos: [
                { label: 'Antecedentes Personales (Generales y Fisiológicos)', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Residencias, ocupaciones, vivienda, crianza de animales, parto, desarrollo...' },
                { label: 'Antecedentes Patológicos', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Enfermedades previas, alergias, cirugías, hospitalizaciones, hábitos nocivos...' },
                { label: 'Antecedentes Estomatológicos', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Última visita al dentista, tratamientos previos, anestesia, reacciones adversas...' },
                { label: 'Antecedentes Familiares', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Antecedentes familiares relevantes...' },
                { label: 'R.A.S.A. (Sistemas y Aparatos)', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Revisión anamnésica de Cabeza, Ojos, Oídos, Nariz, Boca, Faringe, Cuello, Tórax...' },
            ],
        },
        {
            titulo: 'Constantes Vitales y Examen',
            campos: [
                { label: 'Presión Arterial', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '120/80 mmHg' },
                { label: 'Frec. Cardíaca', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '75 lpm' },
                { label: 'Frec. Respiratoria', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '15 rpm' },
                { label: 'Sat. O2 (%)', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '98' },
                { label: 'Temp. (°C)', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '36.5' },
                { label: 'Peso (kg)', tipo: FieldType.TEXT, layout: FieldLayout.THIRD, required: false, placeholder: '70' },
                { label: 'Altura (cm)', tipo: FieldType.TEXT, layout: FieldLayout.HALF, required: false, placeholder: '175' },
                { label: 'IMC', tipo: FieldType.TEXT, layout: FieldLayout.HALF, required: false, placeholder: '22.5' },
                { label: 'Examen Clínico General', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Ectoscopia, piel y anexos, TCS, sistema oseomioarticular, linfoadenomegalias...' },
                { label: 'Examen Estomatológico Extraoral', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Cráneo, cara, perfil, ATM, cuello, músculos de la masticación...' },
                { label: 'Examen Estomatológico Intraoral', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Apertura bucal, labios, mucosa yugal, paladar, orofaringe, lengua, encías...' },
                { label: 'Saliva y Mapeo de Lesiones', tipo: FieldType.RICH_TEXT, layout: FieldLayout.FULL, required: false, placeholder: 'Cantidad y tipo de saliva, especificaciones de lesiones buco-maxilofaciales...' },
            ],
        },
        {
            titulo: 'Tratamiento y Evolución',
            campos: [
                { label: 'Plan de Trabajo y Exámenes Auxiliares', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false, placeholder: 'Plan de trabajo para el diagnóstico y resultado de exámenes auxiliares...' },
                { label: 'Diagnóstico Definitivo', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false, placeholder: 'Escriba el diagnóstico definitivo...' },
                { label: 'Plan de Tratamiento y Tratamientos Realizados', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false, placeholder: 'Plan de tratamiento y detalles de tratamientos realizados...' },
                { label: 'Control y Evolución', tipo: FieldType.TEXTAREA, layout: FieldLayout.FULL, required: false, placeholder: 'Control de consultas de evolución...' },
            ],
        },
    ],
};

const templateSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    specialty: z.string().min(1, 'La especialidad es requerida'),
    isActive: z.boolean().default(true),
});
type TemplateFormValues = z.infer<typeof templateSchema>;

export function SpecialtyTemplatesPage() {
    const [templates, setTemplates] = useState<SpecialtyTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<SpecialtyTemplate | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [meta, setMeta] = useState<any>(null);
    const [secciones, setSecciones] = useState<TemplateSection[]>([]);

    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema) as any,
        defaultValues: { name: '', specialty: '', isActive: true },
    });

    const filteredTemplates = useMemo(() => {
        if (!search) return templates;
        const q = search.toLowerCase();
        return templates.filter(
            (t) => t.name.toLowerCase().includes(q) || (t.specialty || '').toLowerCase().includes(q)
        );
    }, [templates, search]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await specialtiesApi.getAll({ page, limit });
            setTemplates(res.data.data || res.data || []);
            const metaObj = res.data.meta || res.data;
            setMeta({ total: metaObj.total || (Array.isArray(res.data.data) ? res.data.data.length : 0), lastPage: metaObj.lastPage || 1 });
        } catch {
            toast.error('Error al cargar plantillas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadTemplates(); }, [page, limit]);

    const generateId = () => {
        if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    };

    const openModal = (template?: SpecialtyTemplate) => {
        if (template) {
            setEditingTemplate(template);
            const secs = template.estructura?.secciones || [];
            setSecciones(secs);
            setActiveSectionId(secs[0]?.id ?? null);
            form.reset({ name: template.name, specialty: template.specialty, isActive: template.isActive });
        } else {
            setEditingTemplate(null);
            const firstSec: TemplateSection = { id: generateId(), titulo: 'General', campos: [] };
            setSecciones([firstSec]);
            setActiveSectionId(firstSec.id);
            form.reset({ name: '', specialty: '', isActive: true });
        }
        setIsOpen(true);
    };

    const handleApplyPreset = (key: string) => {
        const preset = SPECIALTY_PRESETS[key];
        if (!preset) return;
        const mapped: TemplateSection[] = preset.map((s) => ({
            id: generateId(),
            titulo: s.titulo,
            campos: s.campos.map((f) => ({ ...f, id: generateId() })),
        }));
        setSecciones(mapped);
        setActiveSectionId(mapped[0]?.id ?? null);
        form.setValue('specialty', key);
        toast.success(`Preset "${key}" cargado`);
    };

    const addSection = () => {
        const s: TemplateSection = { id: generateId(), titulo: 'Nueva sección', campos: [] };
        setSecciones((p) => [...p, s]);
        setActiveSectionId(s.id);
    };

    const removeSection = (id: string) =>
        setSecciones((p) => {
            const next = p.filter((s) => s.id !== id);
            if (activeSectionId === id) setActiveSectionId(next[0]?.id ?? null);
            return next;
        });

    const updateTitle = (id: string, titulo: string) =>
        setSecciones((p) => p.map((s) => (s.id === id ? { ...s, titulo } : s)));

    const addField = (sId: string) =>
        setSecciones((p) =>
            p.map((s) =>
                s.id !== sId
                    ? s
                    : {
                        ...s,
                        campos: [
                            ...s.campos,
                            { id: generateId(), label: '', tipo: FieldType.TEXT, layout: FieldLayout.FULL, required: false },
                        ],
                    }
            )
        );

    const updateField = (sId: string, fId: string, up: Partial<TemplateField>) =>
        setSecciones((p) =>
            p.map((s) =>
                s.id !== sId ? s : { ...s, campos: s.campos.map((f) => (f.id === fId ? { ...f, ...up } : f)) }
            )
        );

    const removeField = (sId: string, fId: string) =>
        setSecciones((p) =>
            p.map((s) => (s.id !== sId ? s : { ...s, campos: s.campos.filter((f) => f.id !== fId) }))
        );

    const onSubmit = async (values: TemplateFormValues) => {
        setIsSubmitting(true);
        try {
            const { isActive, ...rest } = values;
            const payload = { ...rest, estructura: { secciones } };
            if (editingTemplate) {
                await specialtiesApi.update(editingTemplate.id, payload as any);
                toast.success('Plantilla actualizada');
            } else {
                await specialtiesApi.create(payload as any);
                toast.success('Plantilla creada');
            }
            setIsOpen(false);
            loadTemplates();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al guardar');
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
        } catch {
            toast.error('Error al eliminar');
        }
    };

    const activeSection = secciones.find((s) => s.id === activeSectionId) ?? null;

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                        <LayoutTemplate className="w-8 h-8 text-primary" />
                        Plantillas de Especialidad
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Configura los formularios dinámicos para cada especialidad médica.</p>
                </div>
                <Button onClick={() => openModal()} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Plantilla
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o especialidad..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            <DataTable
                columns={getSpecialtyTemplateColumns((t) => openModal(t), setDeleteId)}
                data={filteredTemplates}
                isLoading={isLoading}
                onRowClick={(t) => openModal(t)}
                pagination={
                    meta
                        ? {
                            currentPage: page,
                            totalPages: meta.lastPage,
                            pageSize: limit,
                            totalItems: meta.total,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit,
                        }
                        : undefined
                }
            />

            {/* ═══════════════════════════════════════════════
                MODAL — estilo limpio / referencia
            ═══════════════════════════════════════════════ */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="!max-w-none w-[96vw] md:w-[88vw] h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 flex flex-col border dark:border-slate-800"
                >

                    {/* ── ENCABEZADO ── */}
                    <div className="px-4 md:px-8 pt-5 md:pt-7 pb-4 md:pb-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2">
                                {/* Título */}
                                <div className="flex items-center gap-3">
                                    <DialogTitle className="text-xl md:text-2xl font-black tracking-widest text-slate-900 dark:text-slate-100 uppercase">
                                        {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                                    </DialogTitle>
                                    <DialogDescription className="sr-only">
                                        Formulario para configurar plantilla de especialidad
                                    </DialogDescription>
                                    {/* Badge estado */}
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <button
                                                type="button"
                                                onClick={() => field.onChange(!field.value)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all',
                                                    field.value
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                                )}
                                            >
                                                <span className={cn('w-1.5 h-1.5 rounded-full', field.value ? 'bg-emerald-500' : 'bg-slate-400')} />
                                                {field.value ? 'Activa' : 'Inactiva'}
                                            </button>
                                        )}
                                    />
                                </div>
                                {/* Subtítulo con datos */}
                                <div className="flex items-center gap-5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                                    <span className="flex items-center gap-1.5">
                                        <LayoutTemplate className="h-3.5 w-3.5" />
                                        {secciones.length} sección{secciones.length !== 1 ? 'es' : ''}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <ClipboardList className="h-3.5 w-3.5" />
                                        {secciones.reduce((acc, s) => acc + s.campos.length, 0)} campo{secciones.reduce((acc, s) => acc + s.campos.length, 0) !== 1 ? 's' : ''} totales
                                    </span>
                                </div>
                            </div>

                            {/* Preset + Cerrar */}
                            <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                                {!editingTemplate && (
                                    <Select onValueChange={handleApplyPreset}>
                                        <SelectTrigger className="h-9 w-[175px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                                            <SelectValue placeholder="Cargar preset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(SPECIALTY_PRESETS).map((k) => (
                                                <SelectItem key={k} value={k} className="font-medium text-sm">{k}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── CUERPO HORIZONTAL ── */}
                    <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0">

                        {/* ── SIDEBAR IZQUIERDO ── */}
                        <div className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 md:overflow-hidden">
                            {/* Info básica */}
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
                                <Form {...form}>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Nombre</p>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Historia Clínica..."
                                                        className="h-8 text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[9px]" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="specialty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Especialidad</p>
                                                <FormControl>
                                                    <Input
                                                        placeholder="NEUMONOLOGÍA..."
                                                        className="h-8 text-sm border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[9px]" />
                                            </FormItem>
                                        )}
                                    />
                                </Form>
                            </div>

                            {/* Nav secciones */}
                            <div className="md:flex-1 md:overflow-y-auto py-5 px-4 space-y-0.5 dark:bg-slate-900">
                                <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-3 px-2">
                                    Secciones del Formulario
                                </p>

                                {secciones.map((sec, idx) => {
                                    const Icon = SECTION_ICONS[idx % SECTION_ICONS.length];
                                    const isActive = activeSectionId === sec.id;
                                    return (
                                        <button
                                            key={sec.id}
                                            type="button"
                                            onClick={() => setActiveSectionId(sec.id)}
                                            className={cn(
                                                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200'
                                            )}
                                        >
                                            <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-slate-400 dark:text-slate-500')} />
                                            <span className={cn(
                                                'flex-1 text-xs font-bold uppercase tracking-wider truncate',
                                                isActive ? 'text-primary-foreground font-semibold' : 'text-slate-500 dark:text-slate-400'
                                            )}>
                                                {sec.titulo || `Sección ${idx + 1}`}
                                            </span>
                                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />}
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={addSection}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-slate-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-slate-800/40 transition-all mt-1 border border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/30"
                                >
                                    <Plus className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Añadir sección</span>
                                </button>
                            </div>
                        </div>

                        {/* ── PANEL DERECHO — Editor de sección activa ── */}
                        <div className="flex-1 flex flex-col md:overflow-hidden bg-slate-50/30 dark:bg-slate-950/20">
                            {activeSection ? (
                                <>
                                    {/* Título de sección */}
                                    <div className="px-4 md:px-10 pt-6 md:pt-8 pb-4 md:pb-6 flex-shrink-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <input
                                                    value={activeSection.titulo}
                                                    onChange={(e) => updateTitle(activeSection.id, e.target.value)}
                                                    className="w-full text-3xl font-black tracking-widest text-slate-900 dark:text-slate-100 uppercase bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0"
                                                    placeholder="NOMBRE DE SECCIÓN"
                                                />
                                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                                    {activeSection.campos.length === 0
                                                        ? 'Agrega campos a esta sección usando el botón de abajo.'
                                                        : `${activeSection.campos.length} campo${activeSection.campos.length !== 1 ? 's' : ''} configurado${activeSection.campos.length !== 1 ? 's' : ''}.`}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSection(activeSection.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex-shrink-0 mt-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Campos */}
                                    <div className="flex-1 md:overflow-y-auto px-4 md:px-10 space-y-3 pb-4">
                                        {activeSection.campos.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                                    <ClipboardList className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <p className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-sm">Sin campos</p>
                                                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Agrega campos para comenzar</p>
                                            </div>
                                        )}

                                        {activeSection.campos.map((campo, idx) => (
                                            <div key={campo.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                                {/* Fila superior: número + nombre del campo */}
                                                <div className="px-5 pt-4 pb-3 border-b border-slate-50 dark:border-slate-800/60">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Nombre del campo</p>
                                                            <input
                                                                value={campo.label}
                                                                onChange={(e) => updateField(activeSection.id, campo.id, { label: e.target.value })}
                                                                placeholder="Ej: Tensión Arterial, Peso, Observaciones..."
                                                                className="w-full text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-0"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeField(activeSection.id, campo.id)}
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-200 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all flex-shrink-0"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Fila inferior: controles */}
                                                <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
                                                    {/* Tipo */}
                                                    <div>
                                                        <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Tipo</p>
                                                        <Select
                                                            value={campo.tipo}
                                                            onValueChange={(v) => updateField(activeSection.id, campo.id, { tipo: v as FieldType })}
                                                        >
                                                            <SelectTrigger className="h-8 w-[155px] border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(FieldType).map((t) => (
                                                                    <SelectItem key={t} value={t} className="text-sm">{FIELD_TYPE_LABELS[t] ?? t}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Ancho */}
                                                    <div>
                                                        <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Ancho</p>
                                                        <Select
                                                            value={campo.layout}
                                                            onValueChange={(v) => updateField(activeSection.id, campo.id, { layout: v as FieldLayout })}
                                                        >
                                                            <SelectTrigger className="h-8 w-[140px] border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(FieldLayout).map((l) => (
                                                                    <SelectItem key={l} value={l} className="text-sm">{FIELD_LAYOUT_LABELS[l] ?? l}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* Opciones (solo para select) */}
                                                    {campo.tipo === FieldType.SELECT && (
                                                        <div className="flex-1 min-w-[200px]">
                                                            <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Opciones (separadas por comas)</p>
                                                            <Input
                                                                placeholder="Ej: Opción 1, Opción 2, Opción 3"
                                                                className="h-8 text-xs border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900"
                                                                value={campo.opciones?.join(', ') || ''}
                                                                onChange={(e) => updateField(activeSection.id, campo.id, {
                                                                    opciones: e.target.value.split(',').map(o => o.trim())
                                                                })}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Obligatorio */}
                                                    <div>
                                                        <p className="text-[9px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1.5">Obligatorio</p>
                                                        <div className="flex items-center gap-2 h-8">
                                                            <Switch
                                                                checked={campo.required}
                                                                onCheckedChange={(v: boolean) => updateField(activeSection.id, campo.id, { required: v })}
                                                                className="data-[state=checked]:bg-primary"
                                                            />
                                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                                                {campo.required ? 'Sí' : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Añadir campo */}
                                    <div className="px-4 md:px-10 py-4 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => addField(activeSection.id)}
                                            className="w-full h-11 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all text-xs font-bold uppercase tracking-widest cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4" /> Añadir Campo
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
                                        <LayoutTemplate className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-sm">Selecciona una sección</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">O crea una nueva desde el panel izquierdo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between gap-4 flex-shrink-0 bg-white dark:bg-slate-900">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold tracking-widest text-slate-400 uppercase hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black tracking-widest uppercase px-8 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 disabled:opacity-60 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    {editingTemplate ? 'Actualizar' : 'Guardar Plantilla'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
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
