import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { 
    Search, 
    User, 
    Calendar, 
    History,
    Loader2,
    Plus,
    Stethoscope,
    Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi, appointmentsApi, consultasApi } from '@/api';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { RELATIONSHIP_LABELS } from '@/types/enums';

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search.trim(), 250);
    const navigate = useNavigate();

    // ⌘K shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Limpiar texto al cerrar
    useEffect(() => {
        if (!open) {
            setSearch('');
        }
    }, [open]);

    // Búsqueda en vivo de pacientes contra la base de datos
    const { data: patientsRes, isLoading: isLoadingPatients, isFetching: isFetchingPatients } = useQuery({
        queryKey: ['global-search-patients', debouncedSearch],
        queryFn: () => patientsApi.getAll({ search: debouncedSearch || undefined, limit: 50 }),
        enabled: open,
    });

    // Búsqueda en vivo de citas
    const { data: appointmentsRes, isLoading: isLoadingAppointments, isFetching: isFetchingAppointments } = useQuery({
        queryKey: ['global-search-appointments', debouncedSearch],
        queryFn: () => appointmentsApi.getAll({ search: debouncedSearch || undefined, limit: 5 }),
        enabled: open,
    });

    const patients = patientsRes?.data?.data || [];
    const appointments = appointmentsRes?.data?.data || [];
    const isSearching = isFetchingPatients || isFetchingAppointments || isLoadingPatients || isLoadingAppointments;

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <>
            <div 
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-muted/30 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer w-64 group"
            >
                <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
                <span className="text-sm">Búsqueda rápida...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>

            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput 
                    placeholder="Buscar pacientes por nombre o cédula, citas..." 
                    value={search}
                    onValueChange={setSearch}
                />
                <CommandList className="max-h-[420px]">
                    <CommandEmpty>
                        {isSearching ? (
                            <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
                                <span>Buscando en la base de datos...</span>
                            </div>
                        ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                {debouncedSearch ? `No se encontraron resultados para "${debouncedSearch}".` : 'Escribe para buscar...'}
                            </div>
                        )}
                    </CommandEmpty>
                    
                    {/* Acciones Rápidas (visibles cuando no hay búsqueda o coincide) */}
                    {!debouncedSearch && (
                        <>
                            <CommandGroup heading="Acciones Rápidas">
                                <CommandItem onSelect={() => runCommand(() => navigate('/patients/new'))} className="cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4 text-primary" />
                                    <span>Nuevo Paciente</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => navigate('/consultas?new=true'))} className="cursor-pointer">
                                    <Stethoscope className="mr-2 h-4 w-4 text-emerald-600" />
                                    <span>Nueva Consulta / Chequeo</span>
                                </CommandItem>
                                <CommandItem onSelect={() => runCommand(() => navigate('/appointments/new'))} className="cursor-pointer">
                                    <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                                    <span>Nueva Cita</span>
                                </CommandItem>
                            </CommandGroup>
                            <CommandSeparator />
                        </>
                    )}

                    {/* Resultados de Pacientes */}
                    {patients.length > 0 && (
                        <CommandGroup heading={`Pacientes (${patients.length})`}>
                            {patients.map((p) => {
                                const isBeneficiario = p.patientType === 'BENEFICIARIO';
                                const relKey = p.relationship || 'OTRO';
                                const relLabel = RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey;

                                return (
                                    <CommandItem
                                        key={p.id}
                                        onSelect={() => runCommand(() => navigate(`/patients/${p.id}`))}
                                        className="cursor-pointer py-2.5"
                                    >
                                        {isBeneficiario ? (
                                            <Users className="mr-2.5 h-4 w-4 text-blue-500 shrink-0" />
                                        ) : (
                                            <User className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                                        )}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm truncate">
                                                    {p.firstName} {p.lastName}
                                                </span>
                                                {isBeneficiario && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-semibold text-blue-600 border-blue-200 dark:border-blue-800">
                                                        {relLabel}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {p.identificationNumber ? `C.I: ${p.identificationNumber}` : 'Sin Cédula'} 
                                                {p.gerencia ? ` • ${p.gerencia}` : (p.titular?.gerencia ? ` • ${p.titular.gerencia}` : '')}
                                                {isBeneficiario && p.titular ? ` • Titular: ${p.titular.firstName} ${p.titular.lastName}` : ''}
                                            </span>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    )}

                    {/* Resultados de Citas */}
                    {appointments.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading={`Citas Registradas (${appointments.length})`}>
                                {appointments.map((app) => (
                                    <CommandItem
                                        key={app.id}
                                        onSelect={() => runCommand(() => navigate(`/appointments`))}
                                        className="cursor-pointer py-2"
                                    >
                                        <History className="mr-2.5 h-4 w-4 text-amber-500 shrink-0" />
                                        <div className="flex items-center justify-between w-full min-w-0">
                                            <span className="text-sm truncate">
                                                {app.patient?.firstName} {app.patient?.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                {app.startTime ? format(new Date(app.startTime), 'dd/MM HH:mm') : 'S/F'}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
