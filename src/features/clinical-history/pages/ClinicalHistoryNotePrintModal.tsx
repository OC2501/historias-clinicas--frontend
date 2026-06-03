import { useState } from 'react';
import { differenceInYears } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Info, MessageSquare } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { EvolutionNotePDF } from '@/features/clinical-history/pdf/EvolutionNotePDF';
import { toast } from 'sonner';

interface ClinicalHistoryNotePrintModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    note: any;
}

export function ClinicalHistoryNotePrintModal({
    isOpen,
    onOpenChange,
    note
}: ClinicalHistoryNotePrintModalProps) {
    const [isGeneratingNote, setIsGeneratingNote] = useState(false);

    if (!note) return null;

    // Obtenemos el nombre del paciente del historial asociado si está disponible
    const patientObj = note.patient || note.clinicalHistory?.patient || note.history?.patient;
    const patientName = patientObj
        ? `${patientObj.firstName || ''} ${patientObj.lastName || ''}`.trim()
        : 'Paciente';

    const patientAge = patientObj?.birthDate 
        ? differenceInYears(new Date(), new Date(patientObj.birthDate)) 
        : null;

    const handleDownloadNote = async () => {
        setIsGeneratingNote(true);
        try {
            // Mapeamos los datos al formato que espera EvolutionNotePDF
            const pdfData = {
                data: {
                    estadoSubjetivo: note.estadoSubjetivo,
                    objetivo: note.objetivo,
                    diagnostico: note.diagnostico,
                    tratamientoActual: note.tratamientoActual,
                    cambiosSintomas: note.cambiosSintomas,
                    proximaCita: note.proximaCita,
                    horaCita: note.horaCita
                },
                seguimiento: {
                    peso: note.peso,
                    presionArterial: note.presionArterial
                },
                planAjustado: {
                    medicacion: note.planAjustado?.medicacion || note.planManejoAjustado,
                    indicaciones: note.planAjustado?.indicaciones || note.indicacionesGenerales
                },
                patient: {
                    name: patientName,
                    age: patientAge ?? 'N/A'
                }
            };

            const doc = <EvolutionNotePDF note={note} {...pdfData} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Nota_Evolucion_${patientName.replace(/\s+/g, '_')}_${note.id.substring(0, 5)}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Nota de evolución descargada');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar el PDF de la nota');
        } finally {
            setIsGeneratingNote(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2 text-primary">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-xl">Opciones de Impresión</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                        Documento generado para la nota seleccionada:
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="bg-muted/50 p-4 rounded-xl border border-muted-foreground/10 mb-6 flex items-start gap-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</p>
                            <p className="text-sm font-bold text-foreground">{patientName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            className="h-20 justify-start gap-4 px-4 border-primary/20 hover:bg-primary/5 hover:border-primary/40 group transition-all"
                            onClick={handleDownloadNote}
                            disabled={isGeneratingNote}
                        >
                            <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                {isGeneratingNote ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-base text-primary">Descargar Nota de Evolución</p>
                                <p className="text-xs text-muted-foreground">Generar archivo PDF.</p>
                            </div>
                        </Button>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
