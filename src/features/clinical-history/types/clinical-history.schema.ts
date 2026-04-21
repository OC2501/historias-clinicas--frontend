import * as z from 'zod';

export const clinicalHistorySchema = z.object({
    patientId: z.string().min(1, 'Seleccione un paciente'),
    doctorId: z.string().min(1, 'Seleccione un médico'),
    specialty: z.string().min(1, 'Seleccione una especialidad'),
    motivoConsulta: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
    enfermedadActual: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    diagnosticos: z.array(z.string()).min(1, 'Agregue al menos un diagnóstico'),

    // Antecedentes Personales
    antecedentesPersonales: z.string().optional(),

    // Antecedentes Familiares
    antecedentesFamiliares: z.string().optional(),

    // Habitos
    habitosPsicobiologicos: z.string().optional(),

    // Examen Fisico
    presionArterial: z.string().optional(),
    frecuenciaRespiratoria: z.string().optional(),
    frecuenciaCardiaca: z.string().optional(),
    temperatura: z.string().optional(),
    peso: z.string().optional(),
    altura: z.string().optional(),
    imc: z.string().optional(),
    saturacionOxigeno: z.string().optional(),
    otros: z.string().optional(),

    // Plan de Manejo
    examenes: z.string().optional(),
    medicacion: z.string().optional(),

    formData: z.object({
        datosEspecificos: z.record(z.string(), z.any()).optional(),
        antecedentesFamiliares: z.string().optional(),
        antecedentesPersonales: z.string().optional(),
        habitos: z.string().optional(),
    }).optional(),
});

export type ClinicalHistoryFormValues = z.infer<typeof clinicalHistorySchema>;

export const noteSchema = z.object({
    estadoSubjetivo: z.string().min(10, 'Describa el estado actual del paciente'),
    cambiosSintomas: z.string().optional().or(z.literal('')),
    planAjustado: z.string().optional().or(z.literal('')),
    proximaCita: z.string().optional().or(z.literal('')),
    horaCita: z.string().optional().or(z.literal('')),
    consultingRoomId: z.string().optional().or(z.literal('')),
    isDischarge: z.boolean(),
    seguimiento: z.record(z.string(), z.any()).optional(),
});

export type NoteFormValues = z.infer<typeof noteSchema>;
