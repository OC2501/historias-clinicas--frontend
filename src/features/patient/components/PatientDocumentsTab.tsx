import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
    Upload,
    FileText,
    FileImage,
    FileCheck,
    Trash2,
    Eye,
    Download,
    Search,
    Filter,
    Plus,
    Loader2,
    AlertCircle,
    Paperclip,
    ExternalLink,
    Stethoscope,
    MessageSquare,
    User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useQueryClient } from '@tanstack/react-query';
import { api, patientsApi, uploadsApi } from '@/api';
import type { Patient, PatientDocument } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getFileUrl } from '@/lib/utils';

interface PatientDocumentsTabProps {
    patient: Patient;
    allDocuments?: PatientDocument[];
}

const CATEGORIES = [
    'Todos',
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

export function PatientDocumentsTab({ patient, allDocuments }: PatientDocumentsTabProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('Examen de Laboratorio');
    const [filterCategory, setFilterCategory] = useState<string>('Todos');
    const [originFilter, setOriginFilter] = useState<'all' | 'histories' | 'notes' | 'profile'>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);

    // Use consolidated allDocuments if provided, otherwise fall back to patient.documents only
    const documents: PatientDocument[] = allDocuments
        ? allDocuments
        : (patient.documents || []).filter((d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url));

    const originCounts = useMemo(() => {
        let histories = 0;
        let notes = 0;
        let profile = 0;

        documents.forEach((d) => {
            if (d.noteId) {
                notes++;
            } else if (d.clinicalHistoryId) {
                histories++;
            } else {
                profile++;
            }
        });

        return {
            all: documents.length,
            histories,
            notes,
            profile,
        };
    }, [documents]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { Todos: documents.length };
        CATEGORIES.forEach((cat) => {
            if (cat !== 'Todos') {
                counts[cat] = documents.filter((d) => d.category === cat).length;
            }
        });
        return counts;
    }, [documents]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            let uploadResults: any;
            if (files.length === 1) {
                const singleRes = await uploadsApi.uploadSingle(files[0]);
                console.log('[DEBUG] uploadSingle response:', singleRes);
                uploadResults = [singleRes];
            } else {
                uploadResults = await uploadsApi.uploadMultiple(files);
                console.log('[DEBUG] uploadMultiple response:', uploadResults);
            }

            const rawList = Array.isArray(uploadResults) ? uploadResults : [uploadResults];
            console.log('[DEBUG] rawList:', rawList);

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
                };
            });
            console.log('[DEBUG] newDocs:', newDocs);

            // Get current docs, filtering out any malformed entries (null, nested arrays, missing name+url)
            const currentDocs = (Array.isArray(patient.documents) ? patient.documents : [])
                .filter((d: any) => d && typeof d === 'object' && !Array.isArray(d) && (d.name || d.url));
            const updatedDocs = [...currentDocs, ...newDocs];
            console.log('[DEBUG] updatedDocs:', updatedDocs);

            // Strip any internal tracking fields before sending to backend, keeping clinicalHistory and note metadata
            const cleanDocs = updatedDocs.map((d: any) => ({
                id: d.id,
                name: d.name,
                url: d.url,
                fileType: d.fileType,
                size: d.size,
                category: d.category,
                createdAt: d.createdAt,
                clinicalHistoryId: d.clinicalHistoryId,
                clinicalHistorySpecialty: d.clinicalHistorySpecialty,
                clinicalHistoryDate: d.clinicalHistoryDate,
                noteId: d.noteId,
                noteDate: d.noteDate,
            }));
            console.log('[DEBUG] cleanDocs to send:', cleanDocs);

            const updateRes = await patientsApi.updateDocuments(patient.id, cleanDocs);
            console.log('[DEBUG] updateDocuments response:', updateRes);

            toast.success(
                files.length === 1
                    ? 'Documento subido correctamente'
                    : `${files.length} documentos subidos correctamente`
            );

            queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        } catch (error: any) {
            console.error('Error al subir documento:', error);
            const msg = error.response?.data?.message || 'Error al subir el archivo';
            toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteDocument = async (docId: string | undefined, docIndex?: number) => {
        try {
            let updatedDocs: PatientDocument[];
            if (docId) {
                updatedDocs = documents.filter((d) => d.id !== docId);
            } else if (docIndex !== undefined) {
                updatedDocs = documents.filter((_, i) => i !== docIndex);
            } else {
                toast.error('No se puede identificar el documento');
                return;
            }

            const cleanDocs = updatedDocs
                .filter((d: any) => d && typeof d === 'object' && !Array.isArray(d))
                .map(({ ...d }: any) => {
                    delete d._originalIndex;
                    return d;
                });

            await patientsApi.updateDocuments(patient.id, cleanDocs);

            toast.success('Documento eliminado correctamente');
            queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        } catch (error) {
            toast.error('Error al eliminar el documento');
        }
    };

    const isCorruptDoc = (doc: PatientDocument) => !doc.url && !doc.name && !doc.fileType;

    const filteredDocs = documents
        .map((doc, originalIndex) => ({ ...doc, _originalIndex: originalIndex }))
        .filter((doc) => {
            if (!doc || typeof doc !== 'object') return false;
            const docName = doc.name || '';
            const matchesCategory = filterCategory === 'Todos' || doc.category === filterCategory;
            const matchesSearch = docName.toLowerCase().includes((searchTerm || '').toLowerCase());
            const matchesOrigin =
                originFilter === 'all' ||
                (originFilter === 'notes' && !!doc.noteId) ||
                (originFilter === 'histories' && !!doc.clinicalHistoryId && !doc.noteId) ||
                (originFilter === 'profile' && !doc.clinicalHistoryId && !doc.noteId);
            return matchesCategory && matchesSearch && matchesOrigin;
        });

    const isImage = (type?: string, url?: string, name?: string) => {
        const checkStr = `${type || ''} ${url || ''} ${name || ''}`.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].some((ext) => checkStr.includes(ext));
    };

    const isPdf = (type?: string, url?: string, name?: string) => {
        const checkStr = `${type || ''} ${url || ''} ${name || ''}`.toLowerCase();
        return checkStr.includes('pdf');
    };

    const resolveDocUrl = (doc: { url?: string | null; name?: string | null }): string | null => {
        if (doc.url) return doc.url;
        // Try reconstructing from name if url is missing
        if (doc.name) {
            return `/api/uploads/file/${doc.name}`;
        }
        return null;
    };

    const handleDownload = async (url: string | undefined | null, filename: string, fallbackName?: string) => {
        const resolvedUrl = url || (fallbackName ? `/api/uploads/file/${fallbackName}` : null);
        if (!resolvedUrl) {
            toast.error('URL de archivo no disponible');
            return;
        }
        try {
            const fullUrl = getFileUrl(resolvedUrl);
            const response = await fetch(fullUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type') || 'application/octet-stream';
            const blob = await response.blob();
            const typedBlob = new Blob([blob], { type: contentType });
            const blobUrl = window.URL.createObjectURL(typedBlob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'documento';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success(`Descarga iniciada: ${filename}`);
        } catch (error) {
            console.error('Error al descargar:', error);
            // fallback: abrir en nueva pestaña
            window.open(getFileUrl(resolvedUrl), '_blank');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Upload Controls Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-card">
                <CardHeader className="border-b bg-muted/5 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Paperclip className="h-5 w-5 text-primary" />
                                Estudios y Documentos Adjuntos
                                {documents.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 font-bold text-xs bg-primary/10 text-primary border-primary/20">
                                        {documents.length}
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Gestione los exámenes de laboratorio, radiografías e informes adjuntos al paciente.
                            </CardDescription>
                        </div>

                        {/* Upload Controls */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-48 h-10 rounded-xl bg-background border-slate-200">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {CATEGORIES.filter((c) => c !== 'Todos').map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="rounded-xl px-5 h-10 font-bold bg-[#1a5f9c] hover:bg-[#154c7d] text-white shadow-md transition-all shrink-0"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Subir Archivo
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Filter and Search Bar */}
                <CardContent className="p-6">
                    <div className="flex flex-col gap-3 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                            {/* Search input */}
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar archivo por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-950 text-slate-800 dark:text-slate-100"
                                />
                            </div>

                            {/* Origin Filter Selector */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                    <Filter className="h-3.5 w-3.5" /> Origen:
                                </span>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setOriginFilter('all')}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${originFilter === 'all'
                                                ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <span>Todos</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${originFilter === 'all'
                                                ? 'bg-slate-100 dark:bg-slate-800 text-foreground'
                                                : 'bg-slate-200/80 dark:bg-slate-700/60 text-muted-foreground'
                                            }`}>
                                            {originCounts.all}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOriginFilter('histories')}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${originFilter === 'histories'
                                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <Stethoscope className="h-3 w-3" />
                                        <span>De Historias</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${originFilter === 'histories'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                : 'bg-slate-200/80 dark:bg-slate-700/60 text-muted-foreground'
                                            }`}>
                                            {originCounts.histories}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOriginFilter('notes')}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${originFilter === 'notes'
                                                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <MessageSquare className="h-3 w-3" />
                                        <span>De Notas</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${originFilter === 'notes'
                                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                                                : 'bg-slate-200/80 dark:bg-slate-700/60 text-muted-foreground'
                                            }`}>
                                            {originCounts.notes}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOriginFilter('profile')}
                                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1.5 ${originFilter === 'profile'
                                                ? 'bg-white dark:bg-slate-900 text-foreground shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        <User className="h-3 w-3" />
                                        <span>Carga en Perfil</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${originFilter === 'profile'
                                                ? 'bg-slate-100 dark:bg-slate-800 text-foreground'
                                                : 'bg-slate-200/80 dark:bg-slate-700/60 text-muted-foreground'
                                            }`}>
                                            {originCounts.profile}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Category filter pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
                            {CATEGORIES.map((cat) => {
                                const count = categoryCounts[cat] ?? 0;
                                return (
                                    <Badge
                                        key={cat}
                                        variant={filterCategory === cat ? 'default' : 'outline'}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${filterCategory === cat
                                                ? 'bg-[#1a5f9c] text-white shadow-sm'
                                                : 'hover:bg-muted text-muted-foreground dark:text-slate-400 border-slate-200 dark:border-slate-800'
                                            }`}
                                    >
                                        <span>{cat}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${filterCategory === cat
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-200/70 dark:bg-slate-800 text-muted-foreground'
                                            }`}>
                                            {count}
                                        </span>
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    {/* Document Grid / List */}
                    {filteredDocs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocs.map((doc, idx) => {
                                const corrupt = isCorruptDoc(doc);
                                const docUrl = resolveDocUrl(doc);
                                const originalIndex = (doc as any)._originalIndex ?? idx;
                                return (
                                    <div
                                        key={doc.id || doc.url || `doc-${idx}`}
                                        className={`group relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${corrupt
                                                ? 'border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/20'
                                                : 'border-slate-200 dark:border-slate-800 bg-card hover:border-[#1a5f9c]/40 dark:hover:border-[#1a5f9c]/40 hover:shadow-md'
                                            }`}
                                    >
                                        {corrupt && (
                                            <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[11px] font-semibold">
                                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                                Registro dañado — elimínalo y vuelve a subir el archivo
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`p-3 rounded-xl shrink-0 ${corrupt ? 'bg-red-100 dark:bg-red-950/50 text-red-400 dark:text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-[#1a5f9c] group-hover:bg-[#1a5f9c]/10 transition-colors'}`}>
                                                        {isImage(doc.fileType, doc.url, doc.name) ? (
                                                            <FileImage className="h-6 w-6" />
                                                        ) : isPdf(doc.fileType, doc.url, doc.name) ? (
                                                            <FileText className="h-6 w-6 text-red-500" />
                                                        ) : (
                                                            <FileCheck className="h-6 w-6" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1a5f9c] dark:group-hover:text-[#3b82f6] transition-colors">
                                                            {doc.name || 'Documento sin nombre'}
                                                        </p>
                                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                                            {formatFileSize(doc.size)} • {(doc.fileType || 'ARCHIVO').toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px] px-2.5 py-0.5 rounded-md">
                                                    {doc.category || 'Otros'}
                                                </Badge>
                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                    {formatDateSafe(doc.createdAt, 'dd MMM yyyy')}
                                                </span>
                                            </div>

                                            {/* Origin indicator */}
                                            {doc.noteId ? (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/clinical-history-note/${doc.noteId}`)}
                                                        className="w-full text-left p-1.5 rounded-lg bg-violet-50/70 hover:bg-violet-100/80 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 border border-violet-200/60 dark:border-violet-800/50 transition-colors group/btn flex items-center justify-between gap-1.5"
                                                        title="Ver nota de evolución de origen"
                                                    >
                                                        <span className="flex items-center gap-1.5 min-w-0 text-[11px] font-semibold text-violet-700 dark:text-violet-300 truncate">
                                                            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
                                                            <span className="truncate">
                                                                Nota de Evolución{doc.clinicalHistorySpecialty ? ` · ${doc.clinicalHistorySpecialty}` : ''}{doc.clinicalHistoryDate ? ` · ${formatDateSafe(doc.clinicalHistoryDate, 'dd/MM/yyyy')}` : ''}
                                                            </span>
                                                        </span>
                                                        <ExternalLink className="h-3 w-3 text-violet-500 shrink-0 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            ) : doc.clinicalHistoryId ? (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/clinical-history/${doc.clinicalHistoryId}`)}
                                                        className="w-full text-left p-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/50 transition-colors group/btn flex items-center justify-between gap-1.5"
                                                        title="Ver historia clínica de origen"
                                                    >
                                                        <span className="flex items-center gap-1.5 min-w-0 text-[11px] font-semibold text-blue-700 dark:text-blue-300 truncate">
                                                            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                                            <span className="truncate">
                                                                Historia: {doc.clinicalHistorySpecialty || 'Especialidad'}{doc.clinicalHistoryDate ? ` · ${formatDateSafe(doc.clinicalHistoryDate, 'dd/MM/yyyy')}` : ''}
                                                            </span>
                                                        </span>
                                                        <ExternalLink className="h-3 w-3 text-blue-500 shrink-0 group-hover/btn:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <User className="h-3 w-3 shrink-0 opacity-70" />
                                                    <span>Carga en Perfil</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            {!corrupt && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setPreviewDoc({ ...doc, url: docUrl || doc.url })}
                                                        className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-[#1a5f9c] dark:hover:text-[#3b82f6] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                        title="Previsualizar"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                        Ver
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownload(docUrl, doc.name)}
                                                        className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                                        title="Descargar"
                                                    >
                                                        <Download className="h-3.5 w-3.5 mr-1" />
                                                        Descargar
                                                    </Button>
                                                </>
                                            )}

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar este documento?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Se eliminará permanentemente el archivo <strong>{doc.name || 'este documento'}</strong> del expediente del paciente.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteDocument(doc.id, originalIndex)}
                                                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                                        >
                                                            Sí, eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-16 text-center flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                            <p className="text-base font-bold text-slate-700 dark:text-slate-300">Sin documentos registrados</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
                                {filterCategory !== 'Todos' || searchTerm
                                    ? 'No se encontraron documentos con los filtros seleccionados.'
                                    : 'Utilice el botón "Subir Archivo" para adjuntar exámenes, informes y radiografías del paciente.'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Preview Dialog */}
            {previewDoc && (
                <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
                    <DialogContent className="max-w-4xl rounded-2xl overflow-hidden p-6">
                        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
                            <div>
                                <DialogTitle className="text-lg font-bold">{previewDoc.name}</DialogTitle>
                                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                    {previewDoc.category} • {formatFileSize(previewDoc.size)}
                                </DialogDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild className="rounded-xl">
                                <a href={getFileUrl(resolveDocUrl(previewDoc) || '')} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-1.5" />
                                    Abrir en nueva pestaña
                                </a>
                            </Button>
                        </DialogHeader>

                        <div className="mt-4 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-auto bg-slate-100 dark:bg-slate-900 rounded-xl p-4">
                            {isImage(previewDoc.fileType, previewDoc.url, previewDoc.name) ? (
                                <img
                                    src={getFileUrl(resolveDocUrl(previewDoc) || '')}
                                    alt={previewDoc.name}
                                    className="max-h-[65vh] object-contain rounded-lg shadow-sm"
                                />
                            ) : isPdf(previewDoc.fileType, previewDoc.url, previewDoc.name) ? (
                                <iframe
                                    src={getFileUrl(resolveDocUrl(previewDoc) || '')}
                                    title={previewDoc.name}
                                    className="w-full h-[65vh] rounded-lg border-0"
                                />
                            ) : (
                                <div className="text-center py-12 space-y-4">
                                    <FileText className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto" />
                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        Vista previa no disponible para este tipo de archivo.
                                    </p>
                                    <Button
                                        onClick={() => handleDownload(resolveDocUrl(previewDoc), previewDoc.name)}
                                        className="bg-[#1a5f9c] hover:bg-[#154c7d] text-white rounded-xl font-bold"
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
