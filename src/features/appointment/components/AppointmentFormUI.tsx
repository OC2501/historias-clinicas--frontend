import type { UseFormReturn } from 'react-hook-form';
import { Loader2, Save, Search, Check, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Status } from '@/types/enums';
import type { Patient, Doctor, ConsultingRoom } from '@/types';
import type { AppointmentFormValues } from '@/features/appointment/hooks/useAppointmentForm';
import { cn } from '@/lib/utils';

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
    const totalMinutes = i * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const label = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return { label, value };
}).filter(opt => {
    const hour = parseInt(opt.value.split(':')[0]);
    return hour >= 6 && hour <= 21; // Rango de 6am a 9pm
});

interface AppointmentFormUIProps {
    form: UseFormReturn<AppointmentFormValues>;
    doctors: Doctor[];
    rooms: ConsultingRoom[];
    isSubmitting: boolean;
    isEdit: boolean;
    patientSearch: string;
    setPatientSearch: (val: string) => void;
    filteredPatients: Patient[];
    selectedPatient?: Patient;
    isPatientListOpen: boolean;
    setIsPatientListOpen: (val: boolean) => void;
    onSubmit: (values: AppointmentFormValues) => void;
    userRole?: string;
}

export function AppointmentFormUI({
    form,
    doctors,
    rooms,
    isSubmitting,
    isEdit,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    selectedPatient,
    isPatientListOpen,
    setIsPatientListOpen,
    onSubmit,
    userRole
}: AppointmentFormUIProps) {
    const navigate = useNavigate();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Paciente *</FormLabel>
                            <Popover open={isPatientListOpen} onOpenChange={setIsPatientListOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {selectedPatient
                                                ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                                                : "Seleccione un paciente..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <div className="p-2 border-b">
                                        <Input
                                            placeholder="Buscar por nombre o documento..."
                                            value={patientSearch}
                                            onChange={(e) => setPatientSearch(e.target.value)}
                                            className="h-9"
                                        />
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto">
                                        {filteredPatients.length === 0 ? (
                                            <div className="p-4 text-sm text-center text-muted-foreground">
                                                No se encontraron pacientes.
                                            </div>
                                        ) : (
                                            <div className="p-1">
                                                {filteredPatients.map((patient) => (
                                                    <button
                                                        key={patient.id}
                                                        type="button"
                                                        className={cn(
                                                            "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                            field.value === patient.id && "bg-accent text-accent-foreground"
                                                        )}
                                                        onClick={() => {
                                                            form.setValue("patientId", patient.id);
                                                            setIsPatientListOpen(false);
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span>{patient.firstName} {patient.lastName}</span>
                                                            <span className="text-xs text-muted-foreground">{patient.identificationNumber}</span>
                                                        </div>
                                                        {field.value === patient.id && <Check className="h-4 w-4" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                    {userRole !== 'DOCTOR' && (
                        <FormField
                            control={form.control}
                            name="doctorId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Médico *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={userRole === 'DOCTOR'}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione médico" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {doctors.map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.user?.name || 'Médico Sin Nombre'} - {doc.specialty}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    <FormField
                        control={form.control}
                        name="consultingRoomId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Consultorio *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccione consultorio" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={room.id}>
                                                {room.nombre} {room.ubicacion ? `(${room.ubicacion})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => {
                            const [date, time] = (field.value || '').split('T');
                            return (
                                <FormItem>
                                    <FormLabel>Fecha y Hora de Inicio</FormLabel>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="date" 
                                                value={date} 
                                                onChange={(e) => field.onChange(`${e.target.value}T${time || '09:00'}`)}
                                                className="pl-9 h-10"
                                            />
                                        </div>
                                        <Select 
                                            value={time} 
                                            onValueChange={(v) => field.onChange(`${date || ''}T${v}`)}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-[130px] h-10">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <SelectValue placeholder="Hora" />
                                                    </div>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[250px]" position="popper" side="bottom" sideOffset={4} avoidCollisions={false}>
                                                {TIME_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />

                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => {
                            const [date, time] = (field.value || '').split('T');
                            return (
                                <FormItem>
                                    <FormLabel>Fecha y Hora de Finalización</FormLabel>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="date" 
                                                value={date} 
                                                onChange={(e) => field.onChange(`${e.target.value}T${time || '09:30'}`)}
                                                className="pl-9 h-10"
                                            />
                                        </div>
                                        <Select 
                                            value={time} 
                                            onValueChange={(v) => field.onChange(`${date || ''}T${v}`)}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-[130px] h-10">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <SelectValue placeholder="Hora" />
                                                    </div>
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-[250px]" position="popper" side="bottom" sideOffset={4} avoidCollisions={false}>
                                                {TIME_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                </div>

                {isEdit && (
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={Status.SCHEDULED}>Programada</SelectItem>
                                        <SelectItem value={Status.COMPLETED}>Completada</SelectItem>
                                        <SelectItem value={Status.CANCELLED}>Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Motivo de Consulta</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Control de rutina" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notas Internas</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Observaciones adicionales..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                                {isEdit ? 'Actualizar' : 'Programar'} Cita
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
