Para integrar la funcionalidad de exportación y la generación de documentos basados en tu stack de **NestJS, React y PostgreSQL**, he preparado una guía estructurada.

Dado que ya estás utilizando `JSONB` en el backend para la flexibilidad de las historias clínicas, el reto es mapear esos datos dinámicos a una estructura fija en el documento.

---

## Instrucciones para el Desarrollo de Exportación (Markdown)

Copia y utiliza el siguiente contenido para dar contexto a tu herramienta de IA o para documentar el flujo de trabajo:

### 1. Lógica de Estructuración (Word/Docx)

Para la generación de archivos "tipo Word", utilizaremos la librería `docx` en el frontend o backend. La prioridad es mantener la jerarquía de la **Anamnesis** y los **Campos Dinámicos**.

* **Mapeo de Datos:**
* **Encabezado:** Datos del Paciente (Nombre, ID, Edad) + Datos del Médico.
* **Cuerpo Fijo:** Motivo de consulta, Enfermedad actual y Diagnósticos (mapeados desde el array `diagnosticos`).
* **Cuerpo Dinámico:** Iterar sobre el objeto `formData.datosEspecificos`. Si una especialidad tiene campos como "Frecuencia Cardíaca", debe aparecer como `Título: Valor`.


* **Estilos:** Utilizar tablas con bordes invisibles para alinear etiquetas a la izquierda y valores a la derecha, emulando un formato institucional.

### 2. Implementación de Exportación PDF

Para que los botones de exportar PDF funcionen integrando tus componentes de `react-pdf`, se deben seguir estos pasos:

#### A. Componente de Previsualización y Descarga

En lugar de solo definir el documento, implementaremos un `PDFDownloadLink` en las páginas de `ClinicalHistoryFormPage`:

```tsx
import { PDFDownloadLink } from '@react-pdf/renderer';
import { MedicalReportPDF } from '@/components/pdf/MedicalReportPDF';

// En el render del botón:
<PDFDownloadLink 
  document={<MedicalReportPDF data={currentHistoryData} />} 
  fileName={`HC_${patientName}_${date}.pdf`}
>
  {({ loading }) => (
    <Button variant="outline" disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : 'Exportar PDF'}
    </Button>
  )}
</PDFDownloadLink>

```

#### B. Adaptación del Schema de PDF

El componente `MyDocument` debe ser actualizado para recibir las `props` del formulario:

```tsx
const MedicalReportPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Historia Clínica - {data.specialty}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.title}>Anamnesis</Text>
        <Text>Motivo: {data.motivoConsulta}</Text>
        <Text>Enfermedad Actual: {data.enfermedadActual}</Text>
      </View>
      {/* Mapeo dinámico de JSONB */}
      <View style={styles.section}>
        <Text style={styles.title}>Examen Físico Especializado</Text>
        {Object.entries(data.formData.datosEspecificos).map(([key, value]) => (
          <Text key={key}>{key}: {value}</Text>
        ))}
      </View>
    </Page>
  </Document>
);

```

### 3. Consideraciones Técnicas

* **Fechas:** Utilizar `format` de `date-fns` para que las fechas en el PDF/Word sean legibles (ej. "07 de marzo, 2026").
* **Notas de Evolución:** Al exportar una nota de evolución desde `ClinicalHistoryNoteFormPage`, el documento debe incluir los campos de `seguimiento` (Peso, Presión Arterial) y el `planAjustado` de forma destacada.


-------

Ejemplo de armado de pdf

Esta hoja está diseñada para servir como plantilla visual para la exportación a PDF (y también para Word), ya que mantiene una estructura jerárquica clara para los datos.

Desglose del Diseño de la Hoja (Modelo para PDF)
Al observar la imagen, notarás cómo hemos organizado la información para que sea legible y profesional:

Encabezado Institucional:

Un banner azul superior con el título claro: "HISTORIA CLÍNICA DE NEUMONOLOGÍA" (basado en la especialidad seleccionada en el formulario de la derecha).

Incluye un logotipo médico y un espacio para la fecha automática ("07/03/2026").

I. DATOS DEL PACIENTE (Información Contextual):

Una tarjeta de información general (similar a la Resumen Paciente del código).

Mapea los datos del paciente selectedPatient: Nombre (Ana Martínez), ID (21.054.897), Edad (34), Género (FEMENINO) y el Médico Tratante (Dr. Carlos Ruiz).

II. ANAMNESIS DE EVOLUCIÓN (Mapeo de la Nota):

Esta sección se alimenta de los campos de ClinicalHistoryNoteFormPage (formulario de la izquierda).

Estado Subjetivo: Se muestra el texto ingresado ("Paciente refiere disnea leve al caminar...").

Cambios en los Síntomas: ("Tos ha disminuido un 40%...").

III. DATOS DE SEGUIMIENTO (Datos Dinámicos JSONB):

Mapea el objeto seguimiento del formulario de notas.

Muestra los valores registrados: Peso (kg): 72.3, Presión Arterial (mmHg): 135/85.

IV. EXAMEN FÍSICO ESPECÍFICO (La parte más compleja):

Esta es la sección dinámica que se genera a partir de la SpecialtyTemplate (plantilla de la especialidad).

En este ejemplo (Neumonología), mapea los campos que el médico completó en DynamicForm: FR (Resp): 18 rpm, FC (Card): 82 lpm, SatO2: 94%, Murmullo Vesicular: Conservado, Ruidos Agregados: Sibilancias espiratorias leves, etc.

Cada uno de estos campos es un par clave-valor extraído directamente del JSONB de formData.datosEspecificos.

V. PLAN AJUSTADO:

Mapea el objeto planAjustado del formulario de notas.

Sección destacada con: Medicamentos / Tratamiento ("Continuar Salbutamol SOS...") e Indicaciones Generales ("Reposo relativo...").

VI. PRÓXIMA VISITA:

Mapea el campo proximaCita de la nota.

Muestra la fecha formateada: 04/04/2026 (Estimada).




