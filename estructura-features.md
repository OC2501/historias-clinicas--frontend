Esta es una propuesta formal de mejora organizacional para el proyecto **"Clinical-History"** (Antigravity). Estas recomendaciones están diseñadas para alinear tu excelente estructura actual con las mejores prácticas de escalabilidad y sincronización con tu backend en NestJS.

---

# 🚀 Propuesta de Optimización: Arquitectura del Frontend (Antigravity)

## 1. Evolución a "Feature-Based Architecture"

Actualmente, la lógica de un mismo dominio (ej. **Patients**) está dispersa en `hooks/`, `pages/`, `types/` y `api/`. Se recomienda agrupar todo lo relacionado a un módulo funcional en una sola carpeta para mejorar la cohesión.

### Nueva Estructura Sugerida

```text
src/
├── features/
│   ├── patient/
│   │   ├── components/    # PatientFormUI, PatientColumns, etc.
│   │   ├── hooks/         # usePatient, usePatientForm.
│   │   ├── services/      # patients.api.ts.
│   │   ├── types/         # patient.types.ts + zod schemas.
│   │   └── pages/         # PatientDetailPage, PatientsListPage.
│   └── appointment/       # (Estructura idéntica)

```

**Ventajas:**

* **Localización rápida:** Si necesitas modificar las citas, solo tocas la carpeta `features/appointment`.
* **Menos conflictos en Git:** Roswin, Yeremy y tú pueden trabajar en módulos diferentes sin pisar archivos globales.

---

## 2. Sincronización de Validación (Zod + NestJS)

Dado que usas **PostgreSQL con JSONB** para las historias clínicas, la validación en el frontend es crítica para evitar errores 500 en el backend.

### Recomendación:

* Definir **Zod Schemas** en el frontend que sean un espejo de los **DTOs** de NestJS.
* Utilizar `z.infer` para que tus interfaces de TypeScript se generen automáticamente desde el esquema de validación.

```typescript
// features/clinical-history/types/history.schema.ts
import { z } from "zod";

export const historySchema = z.object({
  diagnosis: z.string().min(1, "Requerido"),
  metadata: z.record(z.any()), // Para el campo JSONB de Postgres
});

export type HistoryValues = z.infer<typeof historySchema>;

```

---

## 3. Optimización del Cliente API (Axios)

Para aprovechar el módulo de `auth` que ya tienes en NestJS, el archivo `src/api/axios.ts` debe actuar como un "Silent Operator" manejando la seguridad.

### Mejora del Interceptor:

```typescript
// src/api/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // O tu AuthContext
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

```

---

## 4. Gestión de Reportes y PDFs

Tienes una carpeta `reports/` muy valiosa. Para mejorarla:

* **Separación de Lógica:** Mantén los estilos y la estructura del PDF en `reports/templates`.
* **Generación:** Crea un hook `useReportGenerator` para manejar la lógica de descarga y los estados de carga (loading) mientras se genera el documento.

---

## 5. Tabla de Correspondencia (Frontend vs Backend)

| Dominio | Backend (NestJS) | Frontend (Feature) |
| --- | --- | --- |
| Pacientes | `src/patient/` | `src/features/patient/` |
| Citas | `src/appointment/` | `src/features/appointment/` |
| Historia Clínica | `src/clinical-history/` | `src/features/clinical-history/` |

---

### Próximos Pasos Sugeridos

¿Te gustaría que te ayude a crear un **script de ejemplo** para migrar uno de tus módulos actuales (ej. `appointment`) a esta nueva estructura de "Features"?