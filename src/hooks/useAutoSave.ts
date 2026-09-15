import { useEffect, useState, useRef, useCallback } from 'react';
import type { UseFormReturn, FieldValues } from 'react-hook-form';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions<T extends FieldValues> {
    form: UseFormReturn<T>;
    draftKey: string;
    onRemoteSave?: (data: T) => Promise<void> | void;
    debounceMs?: number;
    enabled?: boolean;
    onCustomRestore?: (draftData: T) => void;
}

export interface StoredDraft<T> {
    timestamp: string;
    data: T;
}

export function useAutoSave<T extends FieldValues>({
    form,
    draftKey,
    onRemoteSave,
    debounceMs = 2000,
    enabled = true,
    onCustomRestore,
}: UseAutoSaveOptions<T>) {
    const [status, setStatus] = useState<AutoSaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasDraft, setHasDraft] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);
    const isRestoringRef = useRef(false);

    // 1. Verificar si existe un borrador al iniciar
    useEffect(() => {
        if (!enabled || !draftKey) return;
        try {
            const raw = localStorage.getItem(draftKey);
            if (raw) {
                const parsed: StoredDraft<T> = JSON.parse(raw);
                if (parsed && parsed.data) {
                    setHasDraft(true);
                    setDraftTimestamp(new Date(parsed.timestamp));
                }
            }
        } catch {
            // Ignorar error de parsing
        }
    }, [draftKey, enabled]);

    // 2. Guardar borrador local o remoto
    const executeSave = useCallback(async (data: T) => {
        if (!enabled || isRestoringRef.current) return;

        setStatus('saving');
        try {
            if (onRemoteSave) {
                await onRemoteSave(data);
            } else if (draftKey) {
                const draft: StoredDraft<T> = {
                    timestamp: new Date().toISOString(),
                    data,
                };
                localStorage.setItem(draftKey, JSON.stringify(draft));
            }
            const now = new Date();
            setLastSaved(now);
            setStatus('saved');
        } catch {
            setStatus('error');
        }
    }, [enabled, onRemoteSave, draftKey]);

    // 3. Escuchar cambios en el formulario con debounce
    useEffect(() => {
        if (!enabled) return;

        // Omitir el primer render para evitar autoguardar los valores iniciales inmediatamente
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const subscription = form.watch((formData) => {
            if (isRestoringRef.current) return;
            if (!form.formState.isDirty) return;

            setStatus('idle');
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                executeSave(formData as T);
            }, debounceMs);
        });

        return () => {
            subscription.unsubscribe();
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [form, enabled, debounceMs, executeSave]);

    // 4. Advertir al usuario si intenta cerrar la ventana con cambios sin guardar
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (form.formState.isDirty && status === 'saving') {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [form.formState.isDirty, status]);

    // 5. Función para restaurar borrador
    const restoreDraft = useCallback(() => {
        if (!draftKey) return;
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) return;
            const parsed: StoredDraft<T> = JSON.parse(raw);
            if (parsed && parsed.data) {
                isRestoringRef.current = true;
                if (onCustomRestore) {
                    onCustomRestore(parsed.data);
                } else {
                    form.reset(parsed.data);
                }
                setHasDraft(false);
                setLastSaved(new Date(parsed.timestamp));
                setStatus('saved');
                setTimeout(() => {
                    isRestoringRef.current = false;
                }, 100);
            }
        } catch (error) {
            console.error('Error al restaurar borrador:', error);
            isRestoringRef.current = false;
        }
    }, [draftKey, form, onCustomRestore]);

    // 6. Función para descartar borrador
    const discardDraft = useCallback(() => {
        if (!draftKey) return;
        localStorage.removeItem(draftKey);
        setHasDraft(false);
        setDraftTimestamp(null);
        setStatus('idle');
    }, [draftKey]);

    // 7. Función para limpiar borrador tras envío exitoso
    const clearDraft = useCallback(() => {
        if (!draftKey) return;
        localStorage.removeItem(draftKey);
        setHasDraft(false);
        setDraftTimestamp(null);
    }, [draftKey]);

    return {
        status,
        lastSaved,
        hasDraft,
        draftTimestamp,
        restoreDraft,
        discardDraft,
        clearDraft,
        executeSaveNow: () => executeSave(form.getValues()),
    };
}
