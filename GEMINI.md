# 🏥 Historias Clínicas - Frontend React

Este proyecto es el frontend de un sistema de gestión de historias clínicas, construido con **React 19**, **TypeScript** y **Vite**. Utiliza una arquitectura basada en características (features) para mejorar la escalabilidad y mantenibilidad.

## 🚀 Tecnologías Principales

- **Framework:** React 19 + Vite 8 (Beta)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS v4 + shadcn/ui
- **Gestión de Estado & API:** TanStack Query (React Query) v5 + Axios
- **Formularios:** React Hook Form + Zod (validación)
- **Enrutamiento:** React Router v7
- **Reportes:** @react-pdf/renderer (Generación de PDFs)
- **Iconos:** Lucide React

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura **Feature-Based**. Cada módulo funcional reside en `src/features/`.

```text
src/
├── api/                # Configuración global de Axios e interceptores
├── components/         # Componentes compartidos (layout, shared, ui, tables)
├── features/           # Módulos funcionales (Core del negocio)
│   ├── admin/          # Configuración de usuarios, horarios, consultorios y plantillas
│   ├── appointment/    # Gestión de citas médicas
│   ├── auth/           # Login, registro y contexto de autenticación
│   ├── clinical-history/# Gestión de historias clínicas y notas de evolución
│   ├── dashboard/      # Panel principal con KPIs y accesos rápidos
│   └── patient/        # Gestión de pacientes
├── guards/             # Protecciones de rutas (ProtectedRoute, RoleGuard)
├── hooks/              # Hooks globales reutilizables
├── lib/                # Utilidades (cn, etc.)
├── pages/              # Páginas de error y 404
├── reports/            # Plantillas de PDF (EvolutionNote, MedicalReport)
├── types/              # Tipos globales y esquemas Zod
├── App.tsx             # Componente raíz
├── router.tsx          # Definición de rutas
└── main.tsx            # Punto de entrada
```

### Anatomía de una Feature

Cada carpeta dentro de `src/features/` suele contener:
- `api/`: Llamadas a la API específicas del módulo.
- `components/`: Componentes exclusivos del módulo.
- `hooks/`: Lógica de estado y efectos (e.g., `usePatientForm`).
- `pages/`: Componentes de página que se registran en el router.
- `types/`: Esquemas de Zod e interfaces de TypeScript.

## 🛠️ Comandos Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila el proyecto para producción (incluye validación de tipos).
- `npm run lint`: Ejecuta ESLint para verificar el estilo de código.
- `npm run preview`: Previsualiza la compilación de producción localmente.

## 🔑 Autenticación y Seguridad

- **JWT:** El token se almacena en `localStorage` y se envía automáticamente en cada petición mediante un interceptor de Axios en `src/api/axios.ts`.
- **AuthContext:** Gestiona el estado global del usuario y los métodos de login/logout.
- **Guards:** Las rutas están protegidas por `ProtectedRoute` (autenticación) y `RoleGuard` (autorización por roles: `ADMIN`, `DOCTOR`, `USER`, `SECRETARY`).

## 📝 Convenciones de Desarrollo

1. **Formularios Dinámicos:** El componente `DynamicForm` en `clinical-history` es fundamental. Renderiza formularios basados en una estructura JSON definida en las plantillas de especialidad (`SpecialtyTemplate`).
2. **Validación:** Siempre usa **Zod** para definir esquemas de validación que coincidan con los DTOs del backend.
3. **API Calls:** Usa **TanStack Query** para todas las peticiones de datos. Las mutaciones deben invalidar las queries relacionadas para mantener los datos sincronizados.
4. **UI:** Usa preferentemente componentes de `src/components/ui` (shadcn). Si necesitas un componente nuevo, instálalo vía `npx shadcn@latest add [componente]`.
5. **Estilos:** Aprovecha las capacidades de **Tailwind CSS v4**. Evita el CSS plano a menos que sea estrictamente necesario.
6. **PDFs:** Los reportes médicos se generan en el cliente usando `@react-pdf/renderer`. Las plantillas se encuentran en `src/reports/`.

## 📡 Integración con el Backend

- La URL base de la API se configura mediante la variable de entorno `VITE_API_URL` (default: `http://localhost:3000/api`).
- Las respuestas de la API siguen un formato estándar: `{ status: { statusMsg, statusCode }, data: T }`.
