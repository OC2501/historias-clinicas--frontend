# Estructura Actual del Frontend (React)

A continuación se muestra la estructura del directorio `src` de tu proyecto, donde reside todo el código de la aplicación:

```text
src
|   App.css
|   App.tsx
|   index.css
|   main.tsx
|   router.tsx
|   
+---api
|       appointments.api.ts
|       auth.api.ts
|       axios.ts
|       clinical-history-note.api.ts
|       clinical-history.api.ts
|       configuration.api.ts
|       consulting-rooms.api.ts
|       dashboard.api.ts
|       doctors.api.ts
|       index.ts
|       patients.api.ts
|       schedules.api.ts
|       specialties.api.ts
|       users.api.ts
|       
+---assets
|       react.svg
|       
+---components
|   +---forms
|   |   |   AppointmentForm.tsx
|   |   |   DynamicForm.tsx
|   |   |   PatientForm.tsx
|   |   |   ScheduleForm.tsx
|   |   |   
|   |   +---appointment
|   |   |       AppointmentFormUI.tsx
|   |   |       
|   |   +---clinical-history
|   |   |       ClinicalHistoryFormUI.tsx
|   |   |       
|   |   \---patient
|   |           PatientFormUI.tsx
|   |           
|   +---layout
|   |       AuthLayout.tsx
|   |       Breadcrumbs.tsx
|   |       Header.tsx
|   |       MainLayout.tsx
|   |       Sidebar.tsx
|   |       
|   +---shared
|   |       ConfirmDialog.tsx
|   |       LoadingSpinner.tsx
|   |       PatientDetailComponents.tsx
|   |       StatusBadge.tsx
|   |       
|   +---tables
|   |       AppointmentColumns.tsx
|   |       ClinicalHistoryColumns.tsx
|   |       ClinicalHistoryNoteColumns.tsx
|   |       ConsultingRoomsColumns.tsx
|   |       DataTable.tsx
|   |       PatientColumns.tsx
|   |       
|   \---ui
|           alert-dialog.tsx
|           avatar.tsx
|           badge.tsx
|           button.tsx
|           calendar.tsx
|           card.tsx
|           checkbox.tsx
|           dialog.tsx
|           dropdown-menu.tsx
|           form.tsx
|           input.tsx
|           label.tsx
|           popover.tsx
|           radio-group.tsx
|           scroll-area.tsx
|           select.tsx
|           separator.tsx
|           sheet.tsx
|           skeleton.tsx
|           sonner.tsx
|           switch.tsx
|           table.tsx
|           tabs.tsx
|           textarea.tsx
|           tooltip.tsx
|           
+---context
|       AuthContext.tsx
|       
+---guards
|       ProtectedRoute.tsx
|       RoleGuard.tsx
|       
+---hooks
|       useAppointmentForm.ts
|       useAppointments.ts
|       useAppTheme.ts
|       useAuth.ts
|       useClinicalHistory.ts
|       useClinicalHistoryForm.ts
|       useDebounce.ts
|       usePagination.ts
|       usePatient.ts
|       usePatientForm.ts
|       usePatients.ts
|       
+---lib
|       utils.ts
|       
+---pages
|   |   NotFoundPage.tsx
|   |   
|   +---appointments
|   |       AppointmentFormPage.tsx
|   |       AppointmentsPage.tsx
|   |       
|   +---auth
|   |       LoginPage.tsx
|   |       RegisterPage.tsx
|   |       
|   +---clinical-history
|   |       ClinicalHistoryDetailPage.tsx
|   |       ClinicalHistoryFormPage.tsx
|   |       ClinicalHistoryListPage.tsx
|   |       
|   +---clinical-history-note
|   |       ClinicalHistoryNoteDetailPage.tsx
|   |       ClinicalHistoryNoteFormPage.tsx
|   |       ClinicalHistoryNoteListPage.tsx
|   |       
|   +---dashboard
|   |       DashboardPage.tsx
|   |       
|   +---doctor
|   |       DoctorSetupPage.tsx
|   |       
|   +---notes
|   |       NoteFormPage.tsx
|   |       
|   +---patients
|   |       PatientDetailPage.tsx
|   |       PatientFormPage.tsx
|   |       PatientsListPage.tsx
|   |       
|   \---settings
|           ConsultingRoomsPage.tsx
|           SchedulePage.tsx
|           SpecialtyTemplatesPage.tsx
|           UsersPage.tsx
|           
+---reports
|       EvolutionNotePDF.tsx
|       MedicalReportPDF.tsx
|       
\---types
        api.types.ts
        appointment.types.ts
        auth.types.ts
        clinical-history-note.types.ts
        clinical-history.types.ts
        configuration.types.ts
        consulting-room.types.ts
        dashboard.types.ts
        doctor.types.ts
        enums.ts
        http-status.ts
        index.ts
        patient.types.ts
        schedule.types.ts
        specialty.types.ts
        user.types.ts
```

## Resumen de Módulos

* **`api/`**: Contratos, instancias de Axios y servicios conectados al backend (Auth, Patients, Doctors, etc.).
* **`assets/`**: Recursos estáticos como imágenes y SVGs.
* **`components/`**: Lógica de presentación dividida en:
  * `forms/`: Formularios de las entidades.
  * `layout/`: Estructura base como Sidebar, Header y Layouts protegidos.
  * `shared/`: Componentes reutilizables, modales de confirmación, badges de estado.
  * `tables/`: Definición de las columnas usando table libraries y el componente base DataTable.
  * `ui/`: Componentes atómicos de diseño (probable integración con Shadcn UI).
* **`context/`**: Contextos globales como el de Autenticación (`AuthContext.tsx`).
* **`guards/`**: Componentes para protección de rutas y evaluación de roles.
* **`hooks/`**: Custom hooks que manejan la lógica de negocio, consumen la API y los estados de formularios y paginación.
* **`lib/`**: Funciones de utilidad auxiliares.
* **`pages/`**: Las vistas/rutas completas del sistema agrupadas por dominio (Auth, Patients, Dashboard, Settings, etc.).
* **`reports/`**: Componentes especializados en la generación y exportación de PDFs médicos.
* **`types/`**: Definiciones de interfaces y tipos en TypeScript que tipan respuestas de API y estados.
