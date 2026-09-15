import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClinicalHistoryFormUI } from '@/features/clinical-history/components/ClinicalHistoryFormUI';
import { useClinicalHistoryForm } from '@/features/clinical-history/hooks/useClinicalHistoryForm';
import { AutoSaveBadge } from '@/components/shared/AutoSaveBadge';

export function ClinicalHistoryFormPage() {
    const navigate = useNavigate();
    const {
        form,
        doctors,
        templates,
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
        user,
        activeTemplate,
        selectedTemplateId,
        setSelectedTemplateId,
        isEditMode,
        existingHistory,
        autoSave,
        documents,
        setDocuments,
    } = useClinicalHistoryForm();

    const [showPDF, setShowPDF] = useState(false);

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando datos clínicos...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-500">
            {/* Header móvil y desktop optimizado */}
            <div className="space-y-2 sm:space-y-0">
                {/* En mobile: Fila superior con botón Volver y el AutoSaveBadge */}
                <div className="flex items-center justify-between gap-2 sm:hidden">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(-1)} 
                        className="gap-1.5 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground" 
                        aria-label="Volver"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-xs font-medium">Volver</span>
                    </Button>
                    <AutoSaveBadge
                        status={autoSave.status}
                        lastSaved={autoSave.lastSaved}
                        isRemote={isEditMode}
                    />
                </div>

                {/* En desktop y título principal */}
                <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(-1)} 
                            className="hidden sm:flex shrink-0 -ml-1" 
                            aria-label="Volver"
                        >
                            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                                    {isEditMode ? 'Editar Historia Clínica' : 'Nueva Historia Clínica'}
                                </h1>
                                <div className="hidden sm:block">
                                    <AutoSaveBadge
                                        status={autoSave.status}
                                        lastSaved={autoSave.lastSaved}
                                        isRemote={isEditMode}
                                    />
                                </div>
                            </div>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
                                {isEditMode 
                                    ? 'Modifique la información clínica registrada para el paciente.'
                                    : 'Inicie un nuevo registro médico detallado para el paciente.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ClinicalHistoryFormUI
                form={form}
                patients={filteredPatients}
                doctors={doctors}
                templates={templates}
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
                activeTemplate={activeTemplate}
                selectedTemplateId={selectedTemplateId}
                setSelectedTemplateId={setSelectedTemplateId}
                isEditMode={isEditMode}
                existingHistory={existingHistory}
                autoSave={autoSave}
                documents={documents}
                setDocuments={setDocuments}
            />
        </div>
    );
}
