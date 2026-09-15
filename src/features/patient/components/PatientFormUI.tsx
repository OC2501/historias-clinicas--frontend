import { useState, useEffect, useMemo } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Loader2, Save, Plus, List, Search, Check, ChevronsUpDown, Users, UserCheck, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Gender } from '@/types/enums';
import type { Doctor, Patient } from '@/types';
import type { PatientFormValues } from '@/features/patient/hooks/usePatientForm';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatTitleCase = (str: string | null | undefined) => {
    if (!str) return '—';
    return str
        .toLowerCase()
        .split(' ')
        .map((word, idx) => {
            const prepositions = ['de', 'la', 'las', 'el', 'los', 'y', 'del', 'o', 'a', 'en'];
            if (prepositions.includes(word) && idx !== 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

interface PatientFormUIProps {
    form: UseFormReturn<PatientFormValues, any, any>;
    doctors: Doctor[];
    uniqueGerencias: string[];
    titularesList?: Patient[];
    selectedTitular?: Patient | null;
    setSelectedTitular?: (p: Patient | null) => void;
    isSubmitting: boolean;
    isEdit: boolean;
    onSubmit: (values: PatientFormValues) => void;
    userRole?: string;
}

export function PatientFormUI({
    form,
    doctors,
    uniqueGerencias,
    titularesList = [],
    selectedTitular,
    setSelectedTitular,
    isSubmitting,
    isEdit,
    onSubmit,
    userRole,
}: PatientFormUIProps) {
    const navigate = useNavigate();
    const [isCustomGerencia, setIsCustomGerencia] = useState(false);
    const [gerenciaSearch, setGerenciaSearch] = useState('');
    const [isGerenciaListOpen, setIsGerenciaListOpen] = useState(false);

    const [isTitularOpen, setIsTitularOpen] = useState(false);
    const [titularSearch, setTitularSearch] = useState('');

    const patientType = form.watch('patientType');

    useEffect(() => {
        const val = form.getValues('gerencia');
        if (val && !uniqueGerencias.includes(val)) {
            setIsCustomGerencia(true);
        }
    }, [form, uniqueGerencias]);

    const filteredGerencias = useMemo(() => {
        if (!gerenciaSearch) return uniqueGerencias;
        const search = gerenciaSearch.toLowerCase();
        return uniqueGerencias.filter(g => g.toLowerCase().includes(search));
    }, [uniqueGerencias, gerenciaSearch]);

    const filteredTitulares = useMemo(() => {
        if (!titularSearch.trim()) return titularesList;
        const q = titularSearch.toLowerCase().trim();
        const cleanQ = q.replace(/\D/g, '');
        return titularesList.filter((t) => {
            const fn = (t.firstName || '').toLowerCase();
            const ln = (t.lastName || '').toLowerCase();
            const full = `${fn} ${ln}`;
            const ci = (t.identificationNumber || '').toLowerCase();
            const cleanCi = ci.replace(/\D/g, '');
            return (
                full.includes(q) ||
                fn.includes(q) ||
                ln.includes(q) ||
                ci.includes(q) ||
                (cleanQ.length >= 2 && cleanCi.includes(cleanQ))
            );
        });
    }, [titularesList, titularSearch]);

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit, (errors) => {
                    console.log('Form errors:', errors);
                    toast.error('Por favor, revisa los errores en el formulario');
                })}
                className="space-y-6"
            >
                {/* ══════════════════════════════════════════════════════
                    1. CONDICIÓN DEL PACIENTE (TITULAR O BENEFICIARIO)
                ══════════════════════════════════════════════════════ */}
                <div className="p-4 bg-muted/40 rounded-2xl border border-muted-foreground/15 space-y-4">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Condición del Paciente (Titularidad)
                    </FormLabel>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                form.setValue('patientType', 'TITULAR');
                                form.setValue('relationship', undefined);
                                form.setValue('titularId', '');
                                setSelectedTitular?.(null);
                            }}
                            className={cn(
                                "p-3.5 rounded-xl border text-left transition-all flex items-start gap-3",
                                patientType === 'TITULAR'
                                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                                    : "border-border/70 hover:bg-muted/60 text-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0",
                                patientType === 'TITULAR' ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                                {patientType === 'TITULAR' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-foreground">Trabajador Titular</span>
                                <span className="block text-xs font-normal text-muted-foreground">Empleado / Obrero de Hidroven</span>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                form.setValue('patientType', 'BENEFICIARIO');
                                if (!form.getValues('relationship')) {
                                    form.setValue('relationship', 'HIJO');
                                }
                            }}
                            className={cn(
                                "p-3.5 rounded-xl border text-left transition-all flex items-start gap-3",
                                patientType === 'BENEFICIARIO'
                                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                                    : "border-border/70 hover:bg-muted/60 text-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0",
                                patientType === 'BENEFICIARIO' ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                                {patientType === 'BENEFICIARIO' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                                <span className="block text-sm font-bold text-foreground">Beneficiario / Carga Familiar</span>
                                <span className="block text-xs font-normal text-muted-foreground">Cónyuge, hijo, padre o madre</span>
                            </div>
                        </button>
                    </div>

                    {patientType === 'BENEFICIARIO' && (
                        <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-border/60">
                            <FormField
                                control={form.control}
                                name="relationship"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parentesco con el Titular *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || 'HIJO'}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Seleccione parentesco..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CONYUGE">Cónyuge / Pareja</SelectItem>
                                                <SelectItem value="HIJO">Hijo / Hija</SelectItem>
                                                <SelectItem value="PADRE">Padre</SelectItem>
                                                <SelectItem value="MADRE">Madre</SelectItem>
                                                <SelectItem value="OTRO">Otro Familiar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-2">
                                <FormLabel>Trabajador Titular Responsable *</FormLabel>
                                <Popover open={isTitularOpen} onOpenChange={setIsTitularOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between font-normal text-left h-10 border-input bg-background"
                                        >
                                            {selectedTitular ? (
                                                <span className="truncate text-xs font-semibold text-foreground">
                                                    <b>{selectedTitular.firstName} {selectedTitular.lastName}</b> (C.I: {selectedTitular.identificationNumber || 'S/D'})
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">Seleccionar titular...</span>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[340px] p-2" align="start">
                                        <div className="relative mb-2">
                                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por cédula o nombre..."
                                                value={titularSearch}
                                                onChange={(e) => setTitularSearch(e.target.value)}
                                                className="pl-8 h-8 text-xs"
                                            />
                                        </div>
                                        <div className="max-h-52 overflow-y-auto space-y-1">
                                            {filteredTitulares.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-3 text-center">
                                                    No se encontraron titulares.
                                                </p>
                                            ) : (
                                                <>
                                                    {filteredTitulares.slice(0, 35).map((t) => (
                                                        <button
                                                            key={t.id}
                                                            type="button"
                                                            onClick={() => {
                                                                form.setValue('titularId', t.id);
                                                                if (t.gerencia && !form.getValues('gerencia')) {
                                                                    form.setValue('gerencia', t.gerencia);
                                                                }
                                                                setSelectedTitular?.(t);
                                                                setIsTitularOpen(false);
                                                            }}
                                                            className={cn(
                                                                "w-full text-left p-2 rounded-md text-xs hover:bg-accent transition-colors flex items-center justify-between",
                                                                form.watch('titularId') === t.id && "bg-primary/10 font-bold text-primary"
                                                            )}
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-foreground">{t.firstName} {t.lastName}</p>
                                                                <p className="text-muted-foreground text-[10px]">
                                                                    C.I: {t.identificationNumber || 'S/D'} • {formatTitleCase(t.gerencia) || 'Sin gerencia'}
                                                                </p>
                                                            </div>
                                                            {form.watch('titularId') === t.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                                                        </button>
                                                    ))}
                                                    {filteredTitulares.length > 35 && (
                                                        <p className="text-[10px] text-center text-muted-foreground py-1 bg-muted/30 rounded">
                                                            Mostrando 35 de {filteredTitulares.length} titulares. Escriba para filtrar.
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Juan" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Apellido *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Pérez" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="identificationNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-1.5">
                                    <span>Nº Documento / Cédula</span>
                                    {patientType === 'TITULAR' ? (
                                        <span className="text-primary font-bold">*</span>
                                    ) : (
                                        <span className="text-muted-foreground font-normal text-xs">(Opcional si es menor)</span>
                                    )}
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={patientType === 'TITULAR' ? "Ej. 12345678" : "Ej. 12345678 (o dejar en blanco)"}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha de Nacimiento *</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Género *</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                                        <SelectItem value={Gender.FEMALE}>Femenino</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo Electrónico</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. correo@ejemplo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {patientType === 'TITULAR' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="gerencia"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <div className="flex justify-between items-center h-6">
                                        <FormLabel>Gerencia</FormLabel>
                                        <Button
                                            type="button"
                                            variant="link"
                                            onClick={() => {
                                                setIsCustomGerencia(!isCustomGerencia);
                                                field.onChange('');
                                            }}
                                            className="h-auto p-0 text-xs font-semibold text-primary hover:no-underline"
                                        >
                                            {isCustomGerencia ? (
                                                <span className="flex items-center gap-1"><List className="h-3.5 w-3.5" /> Seleccionar de la lista</span>
                                            ) : (
                                                <span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Escribir otra gerencia</span>
                                            )}
                                        </Button>
                                    </div>
                                    <FormControl>
                                        {isCustomGerencia ? (
                                            <Input 
                                                placeholder="Escribe la nueva gerencia (ej. GERENCIA DE OPERACIONES)" 
                                                {...field} 
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            />
                                        ) : (
                                            <Popover open={isGerenciaListOpen} onOpenChange={setIsGerenciaListOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={isGerenciaListOpen}
                                                        className="w-full justify-between font-normal text-left h-10 border-input bg-background"
                                                    >
                                                        {field.value ? (
                                                            <span className="truncate">{formatTitleCase(field.value)}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">Seleccione gerencia...</span>
                                                        )}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <div className="p-2 border-b bg-muted/20">
                                                        <div className="relative flex items-center">
                                                            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                placeholder="Buscar gerencia..."
                                                                value={gerenciaSearch}
                                                                onChange={(e) => setGerenciaSearch(e.target.value)}
                                                                className="pl-9 h-9"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-[220px] overflow-y-auto p-1 space-y-0.5">
                                                        {filteredGerencias.length === 0 ? (
                                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                                No se encontraron gerencias.
                                                            </div>
                                                        ) : (
                                                            filteredGerencias.map((g) => (
                                                                <button
                                                                    key={g}
                                                                    type="button"
                                                                    className={cn(
                                                                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                                                                        field.value === g && "bg-accent text-accent-foreground font-semibold"
                                                                    )}
                                                                    onClick={() => {
                                                                        field.onChange(g);
                                                                        setIsGerenciaListOpen(false);
                                                                        setGerenciaSearch('');
                                                                    }}
                                                                >
                                                                    <span className="truncate">{formatTitleCase(g)}</span>
                                                                    {field.value === g && <Check className="h-4 w-4 shrink-0 text-primary" />}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cargo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cargo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. ENFERMERA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                ) : (
                    <div className="p-4 bg-muted/30 dark:bg-muted/10 border border-border/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gerencia Asignada</p>
                                <p className="text-sm font-bold text-foreground">
                                    {selectedTitular?.gerencia ? formatTitleCase(selectedTitular.gerencia) : 'Se asociará automáticamente a la gerencia del titular'}
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[11px] font-semibold self-start sm:self-auto">
                            Heredada del Trabajador Titular
                        </Badge>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. +54 9 11 ..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dirección</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej. Calle Falsa 123" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEdit ? 'Actualizar' : 'Guardar'} Paciente
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
