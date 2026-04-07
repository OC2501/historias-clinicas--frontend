import { useFormContext } from 'react-hook-form';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import type { TemplateStructure, TemplateField } from '@/types';
import { FieldType } from '@/types/enums';
import { cn } from '@/lib/utils';

interface DynamicFormProps {
    structure: TemplateStructure;
    basePath?: string; // e.g., "formData.datosEspecificos"
}

export function DynamicForm({ structure, basePath = 'formData.datosEspecificos' }: DynamicFormProps) {
    const { control } = useFormContext();

    if (!structure || !structure.secciones) {
        return null;
    }

    return (
        <div className="space-y-8">
            {structure.secciones.map((section, sIdx) => (
                <div key={sIdx} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center bg-primary/10 text-primary border-primary/20">
                            {sIdx + 1}
                        </Badge>
                        <h3 className="text-lg font-semibold tracking-tight">{section.titulo}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {section.campos.map((field) => (
                            <div
                                key={field.id}
                                className={cn(
                                    field.layout === 'full' ? 'md:col-span-6' :
                                        field.layout === 'half' ? 'md:col-span-3' :
                                            'md:col-span-2'
                                )}
                            >
                                <DynamicField
                                    field={field}
                                    name={`${basePath}.${field.id}`}
                                    control={control}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function DynamicField({ field, name, control }: { field: TemplateField; name: string; control: any }) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field: formField }) => (
                <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </FormLabel>
                    <FormControl>
                        {renderInput(field, formField)}
                    </FormControl>
                    {field.placeholder && <FormDescription className="text-[10px]">{field.placeholder}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function renderInput(field: TemplateField, formField: any) {
    switch (field.tipo) {
        case FieldType.TEXTAREA:
            return <Textarea {...formField} placeholder={field.placeholder} className="min-h-[100px] resize-none" />;

        case FieldType.SELECT:
            return (
                <Select onValueChange={formField.onChange} value={formField.value}>
                    <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || "Seleccione..."} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.opciones?.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        case FieldType.NUMBER:
            return (
                <Input
                    type="number"
                    {...formField}
                    placeholder={field.placeholder}
                    onChange={(e) => formField.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                />
            );

        case FieldType.DATE:
            return <Input type="date" {...formField} />;

        case FieldType.RICH_TEXT:
            return (
                <RichTextEditor
                    value={formField.value || ''}
                    onChange={formField.onChange}
                    placeholder={field.placeholder}
                />
            );

        case FieldType.TEXT:
        default:
            return <Input {...formField} placeholder={field.placeholder} />;
    }
}
