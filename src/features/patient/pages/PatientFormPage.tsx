import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePatientForm } from '@/features/patient/hooks/usePatientForm';
import { PatientFormUI } from '@/features/patient/components/PatientFormUI';

export function PatientFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // Usamos el hook centralizado para evitar duplicación de lógica
    const { 
        form, 
        doctors, 
        isSubmitting, 
        isLoading, 
        isEdit, 
        onSubmit, 
        user 
    } = usePatientForm(id === 'undefined' ? undefined : id);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Cargando formulario...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isEdit ? 'Editar Paciente' : 'Nuevo Paciente'}
                        </h1>
                        <p className="text-muted-foreground">
                            Completa la información del paciente para el registro médico.
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información del Paciente</CardTitle>
                    <CardDescription id="patient-form-description">
                        Los campos marcados con * son obligatorios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PatientFormUI 
                        form={form}
                        doctors={doctors}
                        isSubmitting={isSubmitting}
                        isEdit={isEdit}
                        onSubmit={onSubmit}
                        userRole={user?.role}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
