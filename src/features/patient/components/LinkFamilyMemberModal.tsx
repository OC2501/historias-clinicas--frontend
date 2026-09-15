import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, UserPlus, Check, AlertCircle, Briefcase, Building2, X } from 'lucide-react';
import { patientsApi } from '@/api';
import { toast } from 'sonner';
import { RelationshipType, RELATIONSHIP_LABELS } from '@/types/enums';
import type { Patient } from '@/types';
import { formatTitleCase } from '@/lib/utils';

interface LinkFamilyMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    titular: Patient;
    onSuccess: () => void;
}

export const LinkFamilyMemberModal: React.FC<LinkFamilyMemberModalProps> = ({
    isOpen,
    onClose,
    titular,
    onSuccess,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [relationship, setRelationship] = useState<RelationshipType>('CONYUGE');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Perform search
    useEffect(() => {
        if (!isOpen) return;

        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        let isMounted = true;
        setIsSearching(true);

        patientsApi.getAll({ search: debouncedQuery, limit: 8 })
            .then((res) => {
                if (!isMounted) return;
                const items: Patient[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                // Exclude titular themselves
                const filtered = items.filter((p: Patient) => p.id !== titular.id);
                setResults(filtered);
            })
            .catch((err) => {
                console.error('Error searching patients:', err);
            })
            .finally(() => {
                if (isMounted) setIsSearching(false);
            });

        return () => {
            isMounted = false;
        };
    }, [debouncedQuery, isOpen, titular.id]);

    // Reset form when modal closes or opens
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setDebouncedQuery('');
            setResults([]);
            setSelectedPatient(null);
            setRelationship('CONYUGE');
        }
    }, [isOpen]);

    const handleLink = async () => {
        if (!selectedPatient) {
            toast.error('Por favor selecciona un paciente o trabajador para vincular');
            return;
        }

        setIsSubmitting(true);
        try {
            await patientsApi.linkFamilyMember(titular.id, {
                memberId: selectedPatient.id,
                relationship,
            });
            toast.success(
                `${selectedPatient.firstName} ${selectedPatient.lastName} fue vinculado(a) como familiar exitosamente.`
            );
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error linking family member:', error);
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Ocurrió un error al vincular al familiar.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAlreadyLinked = (p: Patient) => {
        return titular.familyMembers?.some((m) => m.id === p.id);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden gap-0 rounded-2xl border-none shadow-2xl">
                {/* Header con gradiente elegante */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
                            <UserPlus className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-white tracking-tight">
                                Vincular Familiar Existente
                            </DialogTitle>
                            <DialogDescription className="text-blue-100 text-xs mt-0.5">
                                Asocia a un trabajador o paciente ya registrado como carga familiar del titular.
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Resumen del titular */}
                    <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/15 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-200">Titular Responsable:</span>
                            <span className="font-bold text-white">
                                {titular.firstName} {titular.lastName}
                            </span>
                        </div>
                        <span className="font-mono text-blue-100 bg-white/10 px-2 py-0.5 rounded text-[11px]">
                            C.I: {titular.identificationNumber || 'S/D'}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-5 bg-background max-h-[70vh] overflow-y-auto">
                    {/* Paso 1: Selección de Paciente / Trabajador */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span>1. Buscar Trabajador / Paciente por Cédula o Nombre *</span>
                            {selectedPatient && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                >
                                    <X className="h-3 w-3" /> Cambiar selección
                                </button>
                            )}
                        </Label>

                        {!selectedPatient ? (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ej: 12345678 o Carlos Pérez..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-11 text-sm bg-muted/30 focus-visible:ring-blue-500 rounded-xl"
                                        autoFocus
                                    />
                                    {isSearching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>

                                {/* Resultados de Búsqueda */}
                                {debouncedQuery.length >= 2 && (
                                    <div className="border border-border/80 rounded-xl max-h-56 overflow-y-auto p-1.5 space-y-1.5 bg-card/50 shadow-inner">
                                        {isSearching && results.length === 0 ? (
                                            <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                                Buscando pacientes registrados...
                                            </div>
                                        ) : results.length === 0 ? (
                                            <div className="py-6 text-center text-xs text-muted-foreground">
                                                No se encontraron pacientes ni trabajadores con "{debouncedQuery}".
                                            </div>
                                        ) : (
                                            results.map((p) => {
                                                const alreadyInFamily = isAlreadyLinked(p);
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => {
                                                            if (!alreadyInFamily) setSelectedPatient(p);
                                                        }}
                                                        className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 text-left ${
                                                            alreadyInFamily
                                                                ? 'opacity-60 bg-muted/40 border-dashed border-border cursor-not-allowed'
                                                                : 'hover:bg-accent/70 hover:border-blue-500/50 cursor-pointer border-border/60 bg-card'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <Avatar className="h-9 w-9 shrink-0 border border-primary/20">
                                                                <AvatarFallback className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                                    {p.firstName?.charAt(0)}{p.lastName?.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <p className="font-semibold text-xs text-foreground truncate">
                                                                        {p.firstName} {p.lastName}
                                                                    </p>
                                                                    {p.patientType === 'TITULAR' ? (
                                                                        <Badge className="text-[9px] font-bold px-1.5 py-0 bg-blue-600 text-white hover:bg-blue-600 border-none">
                                                                            Trabajador Titular
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-[9px] font-semibold px-1.5 py-0 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300/60">
                                                                            Beneficiario
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                                                    <span className="font-mono">
                                                                        C.I: {p.identificationNumber || 'Sin C.I.'}
                                                                    </span>
                                                                    {p.gerencia && (
                                                                        <span className="truncate max-w-[140px] text-[10px]">
                                                                            • {formatTitleCase(p.gerencia)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {alreadyInFamily ? (
                                                            <Badge variant="secondary" className="text-[10px] shrink-0 text-muted-foreground">
                                                                Ya vinculado
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 shrink-0 font-semibold"
                                                            >
                                                                Seleccionar
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Paciente Seleccionado */
                            <div className="p-3.5 rounded-xl border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border-2 border-blue-500/40">
                                        <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                                            {selectedPatient.firstName?.charAt(0)}{selectedPatient.lastName?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-foreground">
                                                {selectedPatient.firstName} {selectedPatient.lastName}
                                            </h4>
                                            {selectedPatient.patientType === 'TITULAR' ? (
                                                <Badge className="text-[10px] font-bold bg-blue-600 text-white">
                                                    Trabajador Titular
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300">
                                                    Beneficiario
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="font-mono">
                                                C.I: {selectedPatient.identificationNumber || 'Sin C.I.'}
                                            </span>
                                            {selectedPatient.gerencia && (
                                                <span>• {formatTitleCase(selectedPatient.gerencia)}</span>
                                            )}
                                            {selectedPatient.cargo && (
                                                <span>({formatTitleCase(selectedPatient.cargo)})</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Paso 2: Selección del Parentesco */}
                    <div className="space-y-2">
                        <Label htmlFor="relationship-select" className="text-xs font-bold text-foreground">
                            2. Parentesco con el Titular *
                        </Label>
                        <Select
                            value={relationship}
                            onValueChange={(val) => setRelationship(val as RelationshipType)}
                        >
                            <SelectTrigger id="relationship-select" className="h-11 rounded-xl bg-background border-input">
                                <SelectValue placeholder="Selecciona parentesco..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">
                            Se registrará a este paciente en el núcleo familiar del titular bajo el parentesco seleccionado.
                        </p>
                    </div>

                    {/* Nota informativa */}
                    <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs text-muted-foreground flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                            {selectedPatient?.patientType === 'TITULAR'
                                ? 'Al vincular a este trabajador, mantendrá su nómina, cargo y su expediente clínico único intacto, sin duplicar su cédula.'
                                : 'El expediente clínico del paciente permanecerá unificado bajo su misma cédula de identidad.'}
                        </span>
                    </div>
                </div>

                <DialogFooter className="p-4 px-6 border-t bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-xl h-10 px-5 text-xs"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleLink}
                        disabled={!selectedPatient || isSubmitting}
                        className="rounded-xl h-10 px-6 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Vinculando...
                            </>
                        ) : (
                            <>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Vincular Familiar
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
