# 🏥 Propuesta de Interfaz Frontend — Historias Clínicas

Basado en el análisis completo de tu backend NestJS, aquí tienes una propuesta detallada de cómo estructurar tu frontend con **React + Vite + shadcn/ui + Tailwind CSS**.

---

## 📊 Resumen del Backend Analizado

| Módulo | Endpoint Base | Operaciones |
|--------|--------------|-------------|
| Auth | `/auth` | `POST /register`, `POST /login` |
| Users | `/users` | CRUD completo + paginación |
| Doctor | `/doctor` | CRUD completo + paginación |
| Patient | `/patient` | CRUD completo + paginación |
| Appointment | `/appointment` | CRUD completo + paginación |
| Clinical History | `/clinical-history` | CRUD completo + paginación |
| Clinical History Note | `/clinical-history-note` | CRUD completo + paginación |
| Schedule | `/schedule` | CRUD completo + paginación |
| Consulting Room | `/consulting-room` | CRUD completo + paginación |
| Specialty (Templates) | `/specialty` | CRUD + `GET /specialty/:specialty` |
| Configuration | `/configuration` | CRUD completo + paginación |

**Roles**: `ADMIN`, `USER`, `DOCTOR`, `SECRETARY`
**Auth**: JWT con Bearer Token + Guards por rol
**Respuesta API estándar**:
```typescript
// Una entidad
{ status: { statusMsg, statusCode, error }, data: T }
// Lista paginada
{ meta: { page, lastPage, limit, total }, status: {...}, data: T[] }
```

---

## 🗂️ Estructura de Carpetas Propuesta

```
src/
├── api/                        # Capa de servicios HTTP
│   ├── axios.ts                # Instancia de Axios con interceptors JWT
│   ├── auth.api.ts             # login, register
│   ├── patients.api.ts         # CRUD pacientes
│   ├── doctors.api.ts          # CRUD doctores
│   ├── appointments.api.ts     # CRUD citas
│   ├── clinical-history.api.ts # CRUD historias clínicas
│   ├── notes.api.ts            # CRUD notas de evolución
│   ├── schedules.api.ts        # CRUD horarios
│   ├── consulting-rooms.api.ts # CRUD consultorios
│   ├── specialties.api.ts      # CRUD plantillas
│   └── users.api.ts            # CRUD usuarios
│
├── components/
│   ├── ui/                     # Componentes shadcn/ui (auto-generados)
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navegación lateral
│   │   ├── Header.tsx          # Barra superior con usuario/logout
│   │   ├── MainLayout.tsx      # Layout principal (sidebar + content)
│   │   └── AuthLayout.tsx      # Layout para login/register
│   ├── forms/
│   │   ├── DynamicForm.tsx     # ⭐ Renderizador dinámico de plantillas
│   │   ├── PatientForm.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── ScheduleForm.tsx
│   ├── tables/
│   │   ├── DataTable.tsx       # Tabla reutilizable con paginación
│   │   ├── PatientColumns.tsx
│   │   └── AppointmentColumns.tsx
│   └── shared/
│       ├── ConfirmDialog.tsx
│       ├── StatusBadge.tsx     # Badge para SCHEDULED/COMPLETED/CANCELLED
│       └── LoadingSpinner.tsx
│
├── hooks/                      # Custom hooks
│   ├── useAuth.ts              # Estado de autenticación
│   ├── usePagination.ts        # Lógica de paginación reutilizable
│   └── useDebounce.ts          # Para búsquedas
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx   # KPIs + citas del día + accesos rápidos
│   ├── patients/
│   │   ├── PatientsListPage.tsx
│   │   ├── PatientDetailPage.tsx
│   │   └── PatientFormPage.tsx (crear/editar)
│   ├── appointments/
│   │   ├── AppointmentsPage.tsx (lista/calendario)
│   │   └── AppointmentFormPage.tsx
│   ├── clinical-history/
│   │   ├── ClinicalHistoryListPage.tsx
│   │   ├── ClinicalHistoryDetailPage.tsx
│   │   └── ClinicalHistoryFormPage.tsx  # ⭐ Usa DynamicForm
│   ├── notes/
│   │   └── NoteFormPage.tsx    # Nota de evolución
│   ├── settings/
│   │   ├── SchedulePage.tsx
│   │   ├── ConsultingRoomsPage.tsx
│   │   ├── SpecialtyTemplatesPage.tsx  # ⭐ Editor de plantillas
│   │   └── UsersPage.tsx       # Solo ADMIN
│   └── NotFoundPage.tsx
│
├── context/
│   └── AuthContext.tsx         # Provider global de auth
│
├── guards/
│   └── ProtectedRoute.tsx      # Wrapper que valida JWT + rol
│   └── RoleGuard.tsx           # Renderiza solo si el rol es permitido
│
├── types/                      # Tipos TypeScript
│   ├── api.types.ts            # ApiOneResponse, ApiAllResponse, Metadata
│   ├── auth.types.ts
│   ├── patient.types.ts
│   ├── doctor.types.ts
│   ├── appointment.types.ts
│   ├── clinical-history.types.ts
│   ├── specialty.types.ts
│   └── enums.ts                # UserRole, Status, Gender, FieldType, FieldLayout
│
├── lib/
│   └── utils.ts                # Utilidades de shadcn + helpers
│
├── router.tsx                  # React Router con rutas protegidas
├── App.tsx
└── main.tsx
```

---

## 🖥️ Páginas y Flujos Clave

### 1. 🔐 Autenticación (`/login`, `/register`)
- Formulario con shadcn `<Input>`, `<Button>`, `<Card>`
- Al hacer login → guardar JWT en `localStorage` o `httpOnly cookie`
- Decodificar el token para obtener `role` y `userId`
- Redirigir según rol:
  - **DOCTOR** → Dashboard médico
  - **SECRETARY** → Dashboard de citas/pacientes
  - **ADMIN** → Panel de administración

### 2. 📊 Dashboard (`/dashboard`)
Usando los datos de `DoctorDashboardDto`:

```
┌─────────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │ Total    │ │ Citas    │ │ Citas         │   │
│  │ Pacientes│ │ Hoy      │ │ Pendientes    │   │
│  │   124    │ │    8     │ │     3         │   │
│  └──────────┘ └──────────┘ └───────────────┘   │
│                                                  │
│  ┌─ Próximas Citas ─────────────────────────┐   │
│  │ 09:00  Juan Pérez      Neumonología     │   │
│  │ 09:30  María García    Cardiología      │   │
│  │ 10:00  Carlos López    Control          │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  ┌─ Accesos Rápidos ────────────────────────┐   │
│  │ [+ Nuevo Paciente] [+ Nueva Cita]       │   │
│  │ [+ Nueva Historia]                      │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Componentes shadcn**: `Card`, `Table`, `Badge` (para status)

### 3. 👥 Gestión de Pacientes (`/patients`)

**Lista** → `DataTable` con columnas: Nombre, Cédula, Teléfono, Género, Doctor asignado, Acciones
- Búsqueda por nombre/cédula
- Paginación del backend (`page`, `limit`)
- Acciones: Ver perfil, Editar, Nueva historia, Nueva cita

**Detalle del Paciente** → Vista con tabs:

```
┌─ Perfil de Paciente ────────────────────────┐
│  Juan Pérez  |  V-12345678  |  M  |  35 años│
│                                              │
│  [Datos Personales] [Historias] [Citas]      │
│  ─────────────────────────────────────────── │
│                                              │
│  Tab: Historias Clínicas                     │
│  ┌──────────────────────────────────────┐    │
│  │ 2026-03-01  Neumonología  [Ver]     │    │
│  │ 2026-02-15  Cardiología   [Ver]     │    │
│  │ 2026-01-20  Control       [Ver]     │    │
│  └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

**Componentes shadcn**: `Tabs`, `Table`, `Dialog`, `Badge`, `Avatar`

### 4. 📝 Historia Clínica — Formularios Dinámicos ⭐ (Core del sistema)

Este es el **componente más importante**. Tu `SpecialtyTemplateEntity` define la estructura de formularios dinámicos con secciones y campos tipados.

#### Flujo:
1. Doctor selecciona paciente y especialidad
2. Frontend carga la plantilla de esa especialidad vía `GET /specialty/specialty/:specialty`
3. El componente `DynamicForm` renderiza los campos según la `estructura` de la plantilla

#### Componente `DynamicForm.tsx`:

```tsx
// Mapeo de tipos de campo a componentes shadcn
const fieldMap = {
  text:     <Input />,
  textarea: <Textarea />,
  number:   <Input type="number" />,
  select:   <Select />,          // con opciones[]
  radio:    <RadioGroup />,      // con opciones[]
  checkbox: <Checkbox />,
  date:     <DatePicker />       // Calendar + Popover de shadcn
};

// Mapeo de layout a clases Tailwind
const layoutMap = {
  full:  'col-span-12',
  half:  'col-span-6',
  third: 'col-span-4',
};
```

#### Estructura visual:

```
┌─ Nueva Historia Clínica ─────────────────────────┐
│  Paciente: [Select paciente]                      │
│  Especialidad: [Select especialidad]              │
│  Fecha: [DatePicker]                              │
│                                                    │
│  ═══ Sección: Motivo de Consulta ══════════       │
│  ┌────────────────────────────────────────┐       │
│  │ [Textarea - Motivo de consulta]       │       │
│  └────────────────────────────────────────┘       │
│                                                    │
│  ═══ Sección: Examen Físico ══════════════        │
│  ┌──────────────┐ ┌──────────────┐                │
│  │ FC: [____]   │ │ FR: [____]   │  ← half       │
│  └──────────────┘ └──────────────┘                │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────┐   │
│  │ PA: [____]   │ │ T°: [____]  │ │ SpO2    │   │  ← third
│  └──────────────┘ └──────────────┘ └─────────┘   │
│                                                    │
│  ═══ Sección: Datos Específicos ══════════        │
│  [Campos dinámicos según la especialidad]         │
│                                                    │
│  ═══ Sección: Diagnósticos ═══════════════        │
│  [+ Agregar diagnóstico]                          │
│  • Asma bronquial  [x]                            │
│  • EPOC            [x]                            │
│                                                    │
│  [Cancelar]                     [Guardar Historia] │
└───────────────────────────────────────────────────┘
```

**Componentes shadcn**: `Form`, `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `Calendar`, `Popover`, `Separator`, `Card`

### 5. 📋 Notas de Evolución

Para cada historia clínica, se pueden agregar notas de seguimiento:

```
┌─ Nueva Nota de Evolución ────────────────────┐
│  Fecha: [DatePicker]                         │
│                                              │
│  Estado Subjetivo del Paciente:              │
│  ┌────────────────────────────────────┐      │
│  │ [Textarea]                        │      │
│  └────────────────────────────────────┘      │
│                                              │
│  Seguimiento: (campos JSON dinámicos)        │
│  [Campos según la especialidad]              │
│                                              │
│  Plan Ajustado:                              │
│  ┌────────────────────────────────────┐      │
│  │ [Textarea o campos JSON]          │      │
│  └────────────────────────────────────┘      │
│                                              │
│  Próxima Cita: [DatePicker]                  │
│                                              │
│  [Cancelar]              [Guardar Nota]      │
└──────────────────────────────────────────────┘
```

### 6. 📅 Citas (`/appointments`)

Dos vistas posibles:
- **Vista Lista**: `DataTable` con filtros por estado (`SCHEDULED`, `COMPLETED`, `CANCELLED`)
- **Vista Calendario**: Usando una librería como `react-big-calendar` o similar

```
┌─ Citas ──────────────────────────────────────┐
│  [Vista Lista 📋] [Vista Calendario 📅]       │
│  Filtros: [Estado ▾] [Doctor ▾] [Fecha ▾]   │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ Hora   │ Paciente    │ Doctor │ Estado  │ │
│  │ 09:00  │ Juan Pérez  │ Dr. X  │ 🟡 Pend│ │
│  │ 09:30  │ María G.    │ Dr. X  │ 🟢 Comp│ │
│  │ 10:00  │ Carlos L.   │ Dr. Y  │ 🔴 Canc│ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Componentes shadcn**: `Table`, `Badge` (coloreado por status), `Select`, `DatePicker`, `Dialog`

### 7. ⚙️ Configuración

#### Horarios del Doctor (`/settings/schedule`)
- Tabla editable: Día de la semana × Hora inicio × Hora fin × Consultorio
- Usar `Select` para días y consultorios, `TimePicker` para horas

#### Consultorios (`/settings/consulting-rooms`)
- CRUD simple con `DataTable` + `Dialog` para crear/editar

#### Plantillas de Especialidad (`/settings/templates`) ⭐
- **Editor visual de formularios**: Drag-and-drop de campos
- Cada campo tiene: label, tipo, opciones, required, layout
- Esta es la interfaz más compleja → puede ser un "form builder"

#### Gestión de Usuarios (`/settings/users`) — Solo ADMIN
- CRUD de usuarios con asignación de roles

---

## 🔧 Stack Técnico Recomendado

| Categoría | Herramienta | Razón |
|-----------|------------|-------|
| Framework | **Vite + React** | Rápido, moderno |
| UI Components | **shadcn/ui** | Componentes accesibles y personalizables |
| Estilos | **Tailwind CSS** | Utilidades + diseño responsivo |
| Routing | **React Router v7** | Rutas protegidas por rol |
| State Management | **TanStack Query (React Query)** | Cache, refetch automático, paginación |
| Forms | **React Hook Form + Zod** | Validación + integración con shadcn |
| HTTP Client | **Axios** | Interceptors para JWT |
| Iconos | **Lucide React** | Ya viene con shadcn |
| Fechas | **date-fns** | Manipulación de fechas |
| Tablas | **TanStack Table** | Ya integrado con shadcn DataTable |
| Calendario (opcional) | **react-big-calendar** | Para vista de citas |

---

## 🔐 Sistema de Rutas y Permisos

```tsx
// router.tsx - Ejemplo de estructura
<Routes>
  {/* Público */}
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
  </Route>

  {/* Protegido - Requiere autenticación */}
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="/" element={<DashboardPage />} />
      
      {/* DOCTOR + SECRETARY */}
      <Route path="/patients" element={<PatientsListPage />} />
      <Route path="/patients/:id" element={<PatientDetailPage />} />
      <Route path="/appointments" element={<AppointmentsPage />} />
      
      {/* Solo DOCTOR */}
      <Route element={<RoleGuard roles={['DOCTOR']} />}>
        <Route path="/clinical-history/new" element={<ClinicalHistoryFormPage />} />
        <Route path="/clinical-history/:id" element={<ClinicalHistoryDetailPage />} />
      </Route>
      
      {/* Solo ADMIN */}
      <Route element={<RoleGuard roles={['ADMIN']} />}>
        <Route path="/settings/users" element={<UsersPage />} />
      </Route>
      
      {/* Configuración */}
      <Route path="/settings/schedule" element={<SchedulePage />} />
      <Route path="/settings/rooms" element={<ConsultingRoomsPage />} />
      <Route path="/settings/templates" element={<SpecialtyTemplatesPage />} />
    </Route>
  </Route>
</Routes>
```

---

## 🧭 Navegación del Sidebar

```
📊 Dashboard
──────────────
👥 Pacientes
📅 Citas
📝 Historias Clínicas
──────────────
⚙️ Configuración
   ├── Horarios
   ├── Consultorios
   ├── Plantillas
   └── Usuarios (solo ADMIN)
```

**Componentes shadcn**: `Sheet` (mobile) + sidebar custom con `NavigationMenu`

---

## 📦 Orden de Implementación Sugerido

| Fase | Descripción | Prioridad |
|------|-------------|-----------|
| **1** | Auth (Login/Register) + Layout + Sidebar + ProtectedRoute | 🔴 Alta |
| **2** | Dashboard con KPIs básicos | 🔴 Alta |
| **3** | CRUD de Pacientes (lista + formulario + detalle) | 🔴 Alta |
| **4** | CRUD de Citas (lista + formulario) | 🟡 Media |
| **5** | Historia Clínica con DynamicForm | 🔴 Alta |
| **6** | Notas de Evolución | 🟡 Media |
| **7** | Horarios y Consultorios | 🟡 Media |
| **8** | Editor de Plantillas de Especialidad | 🟢 Baja |
| **9** | Gestión de Usuarios (ADMIN) | 🟢 Baja |
| **10** | Vista Calendario para Citas | 🟢 Baja |

---

## 💡 Tips Clave para tu Implementación

1. **Interceptor de Axios**: Agrega automáticamente el `Authorization: Bearer <token>` a cada request
2. **TanStack Query**: Úsalo para cachear listas paginadas y refetch automático tras mutaciones
3. **React Hook Form + Zod**: Valida los formularios en el frontend de la misma forma que `class-validator` lo hace en el backend
4. **DynamicForm**: Es el componente más poderoso — renderiza cualquier plantilla de especialidad sin escribir código extra por especialidad
5. **Skeleton loaders**: Usa `Skeleton` de shadcn durante la carga para una UX premium
