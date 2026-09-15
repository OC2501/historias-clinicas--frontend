// ===== Estructura de respuesta estándar del backend =====

export interface ApiStatus {
    statusMsg: string;
    statusCode: number;
    error: string | null;
}

export interface ApiMetadata {
    page: number;
    lastPage: number;
    limit: number;
    total: number;
}

// Respuesta de un solo recurso
export type ApiOneResponse<T> = T;

// Respuesta paginada de múltiples recursos
export interface ApiAllResponse<T> {
    meta?: ApiMetadata;
    status?: ApiStatus;
    data: T[];
    total?: number;
    page?: number;
    limit?: number;
    lastPage?: number;
}

// Parámetros de paginación para queries
export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    patientId?: string;
    doctorId?: string;
    specialty?: string;
    isActive?: boolean;
    gender?: string;
    gerencia?: string;
    patientType?: string;
    relationship?: string;
}
