import { useNavigate } from 'react-router';
import {ArrowLeft} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppointmentFormUI } from '@/features/appointment/components/AppointmentFormUI';
import { useAppointmentForm } from '@/features/appointment/hooks/useAppointmentForm';

export function AppointmentFormPage() {
    const navigate = useNavigate();
    
    const {
        form,
        doctors,
        rooms,
        isLoading,
        isSubmitting,
        isEdit,
        patientSearch,
        setPatientSearch,
        isPatientListOpen,
        setIsPatientListOpen,
        filteredPatients,
        selectedPatient,
        onSubmit,
        user
    } = useAppointmentForm();

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isEdit ? 'Editar Cita' : 'Nueva Cita'}
                        </h1>
                        <p className="text-muted-foreground">
                            Organiza el tiempo y recursos para la atención médica.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalles de la Cita</CardTitle>
                </CardHeader>
                <CardContent>
                    <AppointmentFormUI
                        form={form}
                        filteredPatients={filteredPatients}
                        doctors={doctors}
                        rooms={rooms}
                        isSubmitting={isSubmitting}
                        isEdit={isEdit}
                        patientSearch={patientSearch}
                        setPatientSearch={setPatientSearch}
                        isPatientListOpen={isPatientListOpen}
                        setIsPatientListOpen={setIsPatientListOpen}
                        selectedPatient={selectedPatient}
                        onSubmit={onSubmit}
                        userRole={(user?.organizationRole || user?.systemRole)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
