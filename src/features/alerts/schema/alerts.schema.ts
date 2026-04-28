import z from "zod";

const alertSchema = z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
    type: z.enum(['INFO', 'WARNING', 'DANGER', 'SUCCESS']).default('INFO'),
    expiresAt: z.string().optional(),
});

export type AlertFormValues = z.infer<typeof alertSchema>;
export default alertSchema;