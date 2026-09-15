// ===== ENUMS (espejo del backend) =====

export const SystemRole = {
    ADMIN: 'ADMIN', // Puede no usarse, pero lo mantenemos por si el backend lo exportó
    SUPERADMIN: 'SUPERADMIN',
    USER: 'USER',
} as const;
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export const OrganizationRole = {
    OWNER: 'OWNER',
    MEDICAL_DIRECTOR: 'MEDICAL_DIRECTOR',
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    SECRETARY: 'SECRETARY',
} as const;
export type OrganizationRole = (typeof OrganizationRole)[keyof typeof OrganizationRole];

export const OrganizationPlanType = {
    INDEPENDENT: 'INDEPENDENT',
    CLINIC: 'CLINIC',
} as const;
export type OrganizationPlanType = (typeof OrganizationPlanType)[keyof typeof OrganizationPlanType];

export const Status = {
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type Status = (typeof Status)[keyof typeof Status];

export const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const FieldType = {
    TEXT: 'text',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    SELECT: 'select',
    RADIO: 'radio',
    CHECKBOX: 'checkbox',
    DATE: 'date',
    RICH_TEXT: 'rich-text',
} as const;
export type FieldType = (typeof FieldType)[keyof typeof FieldType];

export const FieldLayout = {
    FULL: 'full',
    HALF: 'half',
    THIRD: 'third',
} as const;
export type FieldLayout = (typeof FieldLayout)[keyof typeof FieldLayout];

export const PatientType = {
    TITULAR: 'TITULAR',
    BENEFICIARIO: 'BENEFICIARIO',
} as const;
export type PatientType = (typeof PatientType)[keyof typeof PatientType];

export const RelationshipType = {
    CONYUGE: 'CONYUGE',
    HIJO: 'HIJO',
    PADRE: 'PADRE',
    MADRE: 'MADRE',
    OTRO: 'OTRO',
} as const;
export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export const PATIENT_TYPE_LABELS: Record<PatientType, string> = {
    TITULAR: 'Trabajador Titular',
    BENEFICIARIO: 'Beneficiario (Familiar)',
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
    CONYUGE: 'Cónyuge',
    HIJO: 'Hijo/a',
    PADRE: 'Padre',
    MADRE: 'Madre',
    OTRO: 'Otro Familiar',
};
