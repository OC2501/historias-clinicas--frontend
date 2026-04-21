import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClinicalHistoryFormUI } from '@/features/clinical-history/components/ClinicalHistoryFormUI';
import { useClinicalHistoryForm } from '@/features/clinical-history/hooks/useClinicalHistoryForm';

export function ClinicalHistoryFormPage() {
    const navigate = useNavigate();
    const {
        form,
        doctors,
        isLoading,
        isSubmitting,
        patientSearch,
        setPatientSearch,
        isPatientListOpen,
        setIsPatientListOpen,
        diagInput,
        setDiagInput,
        filteredPatients,
        selectedPatient,
        selectedDoctor,
        addDiagnostic,
        removeDiagnostic,
        onSubmit,
        user
    } = useClinicalHistoryForm();

    const [showPDF, setShowPDF] = useState(false);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0" aria-label="Volver">
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Nueva Historia Clínica</h1>
                        <p className="text-muted-foreground">
                            Inicie un nuevo registro médico detallado para el paciente.
                        </p>
                    </div>
                </div>
            </div>

            <ClinicalHistoryFormUI
                form={form}
                patients={filteredPatients}
                doctors={doctors}
                isSubmitting={isSubmitting}
                isPatientListOpen={isPatientListOpen}
                setIsPatientListOpen={setIsPatientListOpen}
                patientSearch={patientSearch}
                setPatientSearch={setPatientSearch}
                selectedPatient={selectedPatient}
                selectedDoctor={selectedDoctor}
                diagInput={diagInput}
                setDiagInput={setDiagInput}
                addDiagnostic={addDiagnostic}
                removeDiagnostic={removeDiagnostic}
                onSubmit={onSubmit}
                userRole={(user?.organizationRole || user?.systemRole)}
                showPDF={showPDF}
                setShowPDF={setShowPDF}
                filteredPatients={filteredPatients}
            />
        </div>
    );
}
