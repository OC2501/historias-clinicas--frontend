// ===== ENUMS (espejo del backend) =====

export const UserRole = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    DOCTOR: 'DOCTOR',
    SECRETARY: 'SECRETARY',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

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
