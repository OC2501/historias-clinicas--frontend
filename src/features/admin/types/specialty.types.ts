import { FieldType, FieldLayout } from '@/types/enums';

// ===== Estructura de plantilla dinámica =====
export interface TemplateField {
    id: string;
    label: string;
    tipo: FieldType;
    opciones?: string[];   // Para select/radio
    required: boolean;
    placeholder?: string;
    layout?: FieldLayout;  // full | half | third
}

export interface TemplateSection {
    id: string;
    titulo: string;
    campos: TemplateField[];
}

export interface TemplateStructure {
    secciones: TemplateSection[];
}

export interface SpecialtyTemplate {
    id: string;
    name: string;
    specialty: string;
    estructura: TemplateStructure;
    doctor?: { id: string };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSpecialtyRequest {
    name: string;
    specialty: string;
    estructura: TemplateStructure;
    doctorId: string;
}

export type UpdateSpecialtyRequest = Partial<CreateSpecialtyRequest>;
