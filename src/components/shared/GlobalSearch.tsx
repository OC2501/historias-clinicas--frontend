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
    Plus
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { patientsApi, appointmentsApi } from '@/api';
import { format } from 'date-fns';

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
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

    // Queries
    const { data: patientsRes, isLoading: isLoadingPatients } = useQuery({
        queryKey: ['search-patients'],
        queryFn: () => patientsApi.getAll({ limit: 10 }),
        enabled: open,
    });

    const { data: appointmentsRes, isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['search-appointments'],
        queryFn: () => appointmentsApi.getAll({ limit: 10 }),
        enabled: open,
    });

    const patients = patientsRes?.data?.data || [];
    const appointments = appointmentsRes?.data?.data || [];

    const filteredPatients = patients.filter(p => 
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase()) ||
        p.identificationNumber?.includes(search)
    );

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

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput 
                    placeholder="Escribe para buscar pacientes, citas..." 
                    value={search}
                    onValueChange={setSearch}
                />
                <CommandList className="max-h-[400px]">
                    <CommandEmpty>
                        {isLoadingPatients || isLoadingAppointments ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Buscando...</span>
                            </div>
                        ) : (
                            "No se encontraron resultados."
                        )}
                    </CommandEmpty>
                    
                    <CommandGroup heading="Acciones Rápidas">
                        <CommandItem onSelect={() => runCommand(() => navigate('/patients/new'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Paciente
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate('/appointments/new'))}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Nueva Cita
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Pacientes">
                        {filteredPatients.map((p) => (
                            <CommandItem
                                key={p.id}
                                onSelect={() => runCommand(() => navigate(`/patients/${p.id}`))}
                            >
                                <User className="mr-2 h-4 w-4" />
                                <span>{p.firstName} {p.lastName}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{p.identificationNumber}</span>
                            </CommandItem>
                        ))}
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Citas Hoy">
                        {appointments.slice(0, 5).map((app) => (
                            <CommandItem
                                key={app.id}
                                onSelect={() => runCommand(() => navigate(`/appointments`))}
                            >
                                <History className="mr-2 h-4 w-4" />
                                <span>{app.patient?.firstName} {app.patient?.lastName}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                    {format(new Date(app.startTime), 'HH:mm')}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
