export interface Configuration {
    id: string;
    clave: string;
    valor: Record<string, any>;
    descripcion?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateConfigurationRequest {
    clave: string;
    valor: Record<string, any>;
    descripcion?: string;
    userId: string;
}

export type UpdateConfigurationRequest = Partial<CreateConfigurationRequest>;
