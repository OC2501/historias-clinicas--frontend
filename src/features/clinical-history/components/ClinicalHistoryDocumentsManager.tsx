import { useState, useRef, useMemo } from 'react';
import {
    Upload,
    FileText,
    FileImage,
    FileCheck,
    Trash2,
    Eye,
    Download,
    Loader2,
    Paperclip,
    ExternalLink,
    Plus,
    Search,
    Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { uploadsApi } from '@/api';
import { clinicalHistoryApi } from '@/features/clinical-history/api/clinical-history.api';
import { clinicalHistoryNoteApi } from '@/features/clinical-history/api/clinical-history-note.api';
import type { PatientDocument } from '@/features/patient/types/patient.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFileUrl } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

interface ClinicalHistoryDocumentsManagerProps {
    documents: PatientDocument[];
    onChange?: (docs: PatientDocument[]) => void;
    historyId?: string;
    noteId?: string;
    patientId?: string;
    readOnly?: boolean;
}

const CATEGORIES = [
    'Examen de Laboratorio',
    'Radiografía / Imagen',
    'Informe Médico',
    'Estudio Especial',
    'Otros',
];

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDateSafe = (dateString: string | null | undefined, formatStr: string = 'dd MMM yyyy') => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Sin fecha';
    return format(date, formatStr, { locale: es });
};

export function ClinicalHistoryDocumentsManager({
    documents = [],
    onChange,
    historyId,
    noteId,
    patientId,
    readOnly = false,
}: ClinicalHistoryDocumentsManagerProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Examen de Laboratorio');
    const [filterCategory, setFilterCategory] = useState<string>('Todos');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Sanitize valid documents
    const safeDocuments = (documents || []).filter(
        (d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url)
    );

    const filteredDocuments = useMemo(() => {
        return safeDocuments.filter((doc) => {
            const matchesCategory = filterCategory === 'Todos' || doc.category === filterCategory;
            const matchesSearch = !searchQuery || (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [safeDocuments, filterCategory, searchQuery]);

    const handleFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            let uploadResults: any;
            if (files.length === 1) {
                const singleRes = await uploadsApi.uploadSingle(files[0]);
                uploadResults = [singleRes];
            } else {
                uploadResults = await uploadsApi.uploadMultiple(files);
            }

            const rawList = Array.isArray(uploadResults) ? uploadResults : [uploadResults];
            const newDocs: PatientDocument[] = rawList.map((res: any) => {
                const origName = res.originalname || res.filename || 'archivo';
                const fileExt = origName.includes('.') ? origName.split('.').pop()?.toLowerCase() || 'file' : 'file';
                return {
                    id: crypto.randomUUID(),
                    name: origName,
                    url: res.url,
                    fileType: fileExt,
                    size: res.size || 0,
                    category: selectedCategory,
                    createdAt: new Date().toISOString(),
                    clinicalHistoryId: historyId,
                    noteId: noteId,
                };
            });

            const updatedDocs = [...safeDocuments, ...newDocs];

            if (onChange) {
                onChange(updatedDocs);
            }

            // Persist immediately if noteId or historyId is present
            if (noteId) {
                await clinicalHistoryNoteApi.updateDocuments(noteId, updatedDocs);
                queryClient.invalidateQueries({ queryKey: ['clinical-history-note', noteId] });
                queryClient.invalidateQueries({ queryKey: ['clinical-history-notes'] });
                if (historyId) queryClient.invalidateQueries({ queryKey: ['clinical-history', historyId] });
                if (patientId) {
                    queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
                    queryClient.invalidateQueries({ queryKey: ['patients'] });
                }
            } else if (historyId) {
                await clinicalHistoryApi.updateDocuments(historyId, updatedDocs);
                queryClient.invalidateQueries({ queryKey: ['clinical-history', historyId] });
                queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
                if (patientId) {
                    queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
                    queryClient.invalidateQueries({ queryKey: ['patients'] });
                }
            }

            toast.success(
                files.length === 1
                    ? 'Examen complementario adjuntado'
                    : `${files.length} exámenes adjuntados correctamente`
            );
        } catch (error: any) {
            console.error('Error al subir archivos:', error);
            const msg = error.response?.data?.message || 'Error al subir el archivo';
            toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (docId: string, index: number) => {
        try {
            const updatedDocs = safeDocuments.filter((d, i) => (docId ? d.id !== docId : i !== index));

            if (onChange) {
                onChange(updatedDocs);
            }

            if (noteId) {
                await clinicalHistoryNoteApi.updateDocuments(noteId, updatedDocs);
                queryClient.invalidateQueries({ queryKey: ['clinical-history-note', noteId] });
                queryClient.invalidateQueries({ queryKey: ['clinical-history-notes'] });
                if (historyId) queryClient.invalidateQueries({ queryKey: ['clinical-history', historyId] });
                if (patientId) {
                    queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
                    queryClient.invalidateQueries({ queryKey: ['patients'] });
                }
            } else if (historyId) {
                await clinicalHistoryApi.updateDocuments(historyId, updatedDocs);
                queryClient.invalidateQueries({ queryKey: ['clinical-history', historyId] });
                queryClient.invalidateQueries({ queryKey: ['clinical-histories'] });
                if (patientId) {
                    queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
                    queryClient.invalidateQueries({ queryKey: ['patients'] });
                }
            }

            toast.success('Examen eliminado');
        } catch (error) {
            toast.error('Error al eliminar el examen');
        }
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            const fullUrl = getFileUrl(url);
            const response = await fetch(fullUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'documento';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch {
            window.open(getFileUrl(url), '_blank');
        }
    };

    const isImage = (fileType?: string, url?: string, name?: string) => {
        const ft = (fileType || '').toLowerCase();
        const full = `${url || ''} ${name || ''}`.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ft) ||
            /\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/i.test(full);
    };

    const isPdf = (fileType?: string, url?: string, name?: string) => {
        const ft = (fileType || '').toLowerCase();
        const full = `${url || ''} ${name || ''}`.toLowerCase();
        return ft === 'pdf' || /\.pdf(\?|$)/i.test(full);
    };

    return (
        <div className="space-y-6">
            {/* Upload Zone (Hidden in readOnly mode) */}
            {!readOnly && (
                <div className="bg-card/50 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-border/70 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
                        <div>
                            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-primary" />
                                Adjuntar Exámenes Complementarios
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Suba archivos PDF o imágenes (RX, ecos, laboratorios, informes).
                            </p>
                        </div>

                        {/* Category Selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                Categoría:
                            </span>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px] h-9 text-xs font-medium rounded-xl bg-background/80">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="text-xs font-medium">
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            const droppedFiles = Array.from(e.dataTransfer.files);
                            handleFiles(droppedFiles);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                            isDragging
                                ? 'border-primary bg-primary/5 scale-[0.99]'
                                : 'border-border/80 hover:border-primary/50 hover:bg-muted/20'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                            className="hidden"
                            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                            disabled={isUploading}
                        />

                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2 py-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-xs font-bold text-muted-foreground">Subiendo examen(es)...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 rounded-full bg-primary/10 text-primary">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-bold text-foreground">
                                        Arrastra archivos aquí o <span className="text-primary underline">haz clic para examinar</span>
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        Admite formatos PDF, JPG, PNG, WEBP (hasta 15MB cada uno)
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* List of Attached Documents */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 text-primary" />
                        Exámenes en este expediente ({filteredDocuments.length}{filterCategory !== 'Todos' || searchQuery ? ` de ${safeDocuments.length}` : ''})
                    </h5>
                    {readOnly && safeDocuments.length > 0 && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                            Sincronizados con el perfil del paciente
                        </span>
                    )}
                </div>

                {/* Filter and Search Bar when documents exist */}
                {safeDocuments.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pb-1">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre de archivo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-8 text-xs rounded-xl bg-background/80"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block" />
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-full sm:w-[190px] h-8 text-xs font-medium rounded-xl bg-background/80">
                                    <SelectValue placeholder="Todas las categorías" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {['Todos', ...CATEGORIES].map((cat) => (
                                        <SelectItem key={cat} value={cat} className="text-xs font-medium">
                                            {cat === 'Todos' ? 'Todas las categorías' : cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {safeDocuments.length === 0 ? (
                    <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center">
                        <Paperclip className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm font-semibold text-foreground/80">No hay exámenes complementarios adjuntos</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                            {readOnly
                                ? 'No se cargaron archivos para esta consulta.'
                                : 'Adjunte los exámenes o estudios del paciente para tener el expediente completo.'}
                        </p>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 flex flex-col items-center justify-center">
                        <p className="text-sm font-semibold text-foreground/80">
                            No se encontraron exámenes para el filtro seleccionado
                        </p>
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => {
                                setFilterCategory('Todos');
                                setSearchQuery('');
                            }}
                            className="text-xs text-primary mt-1"
                        >
                            Ver todos los exámenes
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {filteredDocuments.map((doc, idx) => {
                            const isImg = isImage(doc.fileType, doc.url, doc.name);
                            const isP = isPdf(doc.fileType, doc.url, doc.name);

                            return (
                                <Card
                                    key={doc.id || `doc-${idx}`}
                                    className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            {/* File Thumbnail or Icon */}
                                            <div
                                                onClick={() => setPreviewDoc(doc)}
                                                className="h-12 w-12 rounded-xl shrink-0 bg-muted/50 flex items-center justify-center cursor-pointer overflow-hidden border border-border/50 group-hover:border-primary/30 transition-colors"
                                            >
                                                {isImg ? (
                                                    <img
                                                        src={getFileUrl(doc.url)}
                                                        alt={doc.name}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : isP ? (
                                                    <FileText className="h-6 w-6 text-red-500 group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <FileImage className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                                )}
                                            </div>

                                            {/* Document Meta */}
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    onClick={() => setPreviewDoc(doc)}
                                                    className="text-xs font-bold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                                                    title={doc.name}
                                                >
                                                    {doc.name || 'Examen sin nombre'}
                                                </p>
                                                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                                                    {formatFileSize(doc.size)} • {(doc.fileType || 'ARCHIVO').toUpperCase()}
                                                </p>
                                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[9.5px] px-2 py-0 font-semibold bg-primary/10 text-primary border-primary/20"
                                                    >
                                                        {doc.category || 'Examen'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {formatDateSafe(doc.createdAt, 'dd MMM yyyy')}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewDoc(doc)}
                                                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary rounded-lg"
                                                title="Previsualizar"
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1" />
                                                Ver
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownload(doc.url, doc.name)}
                                                className="h-7 px-2 text-xs text-muted-foreground hover:text-green-600 rounded-lg"
                                                title="Descargar"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>

                                            {!readOnly && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-2xl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Eliminar este examen?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Se desvinculará y eliminará el archivo <strong>{doc.name}</strong> de esta historia clínica.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(doc.id, idx)}
                                                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold"
                                                            >
                                                                Sí, eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewDoc && (
                <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
                    <DialogContent className="max-w-4xl rounded-2xl overflow-hidden p-5 sm:p-6">
                        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b">
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold truncate max-w-[280px] sm:max-w-md">
                                    {previewDoc.name}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    {previewDoc.category} • {formatFileSize(previewDoc.size)} • {formatDateSafe(previewDoc.createdAt)}
                                </DialogDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild className="rounded-xl shrink-0">
                                <a href={getFileUrl(previewDoc.url)} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                    Abrir en pestaña
                                </a>
                            </Button>
                        </DialogHeader>

                        <div className="mt-4 flex items-center justify-center min-h-[320px] max-h-[70vh] overflow-auto bg-muted/30 rounded-xl p-3">
                            {isImage(previewDoc.fileType, previewDoc.url, previewDoc.name) ? (
                                <img
                                    src={getFileUrl(previewDoc.url)}
                                    alt={previewDoc.name}
                                    className="max-h-[65vh] object-contain rounded-lg shadow-sm"
                                />
                            ) : isPdf(previewDoc.fileType, previewDoc.url, previewDoc.name) ? (
                                <iframe
                                    src={getFileUrl(previewDoc.url)}
                                    title={previewDoc.name}
                                    className="w-full h-[65vh] rounded-lg border-0"
                                />
                            ) : (
                                <div className="text-center py-12 space-y-4">
                                    <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                                    <p className="text-sm font-semibold text-foreground/80">
                                        Vista previa no disponible para este tipo de archivo.
                                    </p>
                                    <Button
                                        onClick={() => handleDownload(previewDoc.url, previewDoc.name)}
                                        className="bg-primary text-primary-foreground rounded-xl font-bold"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar Archivo
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
