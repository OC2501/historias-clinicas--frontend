import { useState } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText, Loader2, Info } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { MedicalReportPDF } from '@/reports/MedicalReportPDF';
import { EvolutionNotePDF } from '@/reports/EvolutionNotePDF';
import { toast } from 'sonner';

interface ClinicalHistoryPrintModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    history: any;
}

export function ClinicalHistoryPrintModal({ 
    isOpen, 
    onOpenChange, 
    history 
}: ClinicalHistoryPrintModalProps) {
    const [isGeneratingHistory, setIsGeneratingHistory] = useState(false);
    const [isGeneratingNote, setIsGeneratingNote] = useState(false);

    if (!history) return null;

    const patientName = `${history.patient?.firstName || ''} ${history.patient?.lastName || ''}`.trim();

    const handlePrintHistory = async () => {
        setIsGeneratingHistory(true);
        try {
            const doc = (
                <MedicalReportPDF 
                    data={history} 
                    patient={history.patient} 
                    doctor={history.doctor} 
                />
            );
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            toast.success('Generando reporte para impresión...');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error al generar el PDF de la historia clínica');
        } finally {
            setIsGeneratingHistory(false);
        }
    };

    const handleDownloadNote = async () => {
        // En este contexto, intentamos tomar la nota más reciente asociada a esta historia
        // o si la historia en sí misma es tratada como una nota inicial.
        // Si el backend no envía las notas directamente en el objeto history, 
        // podríamos necesitar cargarlas, pero por ahora asumimos que vienen o 
        // usamos los datos de la historia para generar una nota de evolución equivalente.
        
        const latestNote = history.notes?.[0] || history; // Fallback a la historia misma si no hay notas específicas
        
        setIsGeneratingNote(true);
        try {
            const doc = <EvolutionNotePDF note={latestNote} />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Nota_Evolucion_${history.patient?.lastName || 'Paciente'}.pdf`;
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
                            <Printer className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-xl">Opciones de Impresión</DialogTitle>
                    </div>
                    <DialogDescription className="text-sm">
                        Seleccione el formato que desea para el paciente:
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="bg-muted/50 p-4 rounded-xl border border-muted-foreground/10 mb-6 flex items-start gap-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paciente</p>
                            <p className="text-sm font-bold text-foreground">{patientName || 'Paciente no identificado'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <Button 
                            variant="outline" 
                            className="h-16 justify-start gap-4 px-4 border-primary/20 hover:bg-primary/5 hover:border-primary/40 group transition-all"
                            onClick={handlePrintHistory}
                            disabled={isGeneratingHistory}
                        >
                            <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                                {isGeneratingHistory ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-primary">Imprimir Historia Clínica</p>
                                <p className="text-xs text-muted-foreground">Documento completo con antecedentes y examen.</p>
                            </div>
                        </Button>

                        <Button 
                            variant="outline"
                            className="h-16 justify-start gap-4 px-4 border-secondary/20 hover:bg-secondary/5 hover:border-secondary/40 group transition-all"
                            onClick={handleDownloadNote}
                            disabled={isGeneratingNote}
                        >
                            <div className="p-2 bg-secondary/10 text-secondary rounded-lg group-hover:bg-secondary group-hover:text-white transition-all">
                                {isGeneratingNote ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-secondary">Descargar Nota de Evolución</p>
                                <p className="text-xs text-muted-foreground">Resumen subjetivo y plan actual.</p>
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
