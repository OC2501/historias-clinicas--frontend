import * as z from 'zod';

export const consultaSchema = z.object({
  fecha: z.string().min(1, 'La fecha de atención es obligatoria'),
  hora: z.string().optional().or(z.literal('')),
  patientId: z.string().min(1, 'Debe seleccionar un paciente'),
  doctorId: z.string().optional().or(z.literal('')),
  nurseId: z.string().optional().or(z.literal('')),
  tipoConsulta: z.enum([
    'CHEQUEO_RUTINA',
    'CONTROL',
    'CURATIVA',
    'EMERGENCIA',
    'OCUPACIONAL',
    'OTRO',
  ]).default('CHEQUEO_RUTINA'),
  motivoConsulta: z.string().min(3, 'El motivo de la consulta debe tener al menos 3 caracteres'),
  sintomas: z.string().optional().or(z.literal('')),

  // Signos Vitales
  presionArterial: z.string().optional().or(z.literal('')),
  frecuenciaCardiaca: z.string().optional().or(z.literal('')),
  frecuenciaRespiratoria: z.string().optional().or(z.literal('')),
  temperatura: z.string().optional().or(z.literal('')),
  saturacionOxigeno: z.string().optional().or(z.literal('')),
  peso: z.string().optional().or(z.literal('')),
  altura: z.string().optional().or(z.literal('')),
  imc: z.string().optional().or(z.literal('')),
  glucemia: z.string().optional().or(z.literal('')),

  // Evaluación y Conducta
  examenFisico: z.string().optional().or(z.literal('')),
  diagnostico: z.string().optional().or(z.literal('')),
  diagnosticosSecundarios: z.array(z.string()).optional(),
  tratamiento: z.string().optional().or(z.literal('')),
  examenesSolicitados: z.string().optional().or(z.literal('')),

  // Reposo Médico
  reposoMedico: z.boolean().default(false),
  diasReposo: z.number().min(1).optional().nullable(),
  fechaInicioReposo: z.string().optional().or(z.literal('')),
  fechaFinReposo: z.string().optional().or(z.literal('')),

  // Seguimiento
  observaciones: z.string().optional().or(z.literal('')),
  proximoControl: z.string().optional().or(z.literal('')),
});

export type ConsultaFormValues = z.infer<typeof consultaSchema>;
