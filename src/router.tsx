import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from '@/guards/ProtectedRoute';
import { RoleGuard } from '@/guards/RoleGuard';
import { SystemRole, OrganizationRole } from '@/types';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { MainLayout } from '@/components/layout/MainLayout';

// ===== Pages =====
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import DoctorSetupPage from '@/features/admin/pages/DoctorSetupPage';

// Patients
import { PatientsListPage } from '@/features/patient/pages/PatientsListPage';
import { PatientFormPage } from '@/features/patient/pages/PatientFormPage';
import { PatientDetailPage } from '@/features/patient/pages/PatientDetailPage';

// Appointments
import { AppointmentsPage } from '@/features/appointment/pages/AppointmentsPage';
import { AppointmentFormPage } from '@/features/appointment/pages/AppointmentFormPage';

// Clinical History
import { ClinicalHistoryListPage } from '@/features/clinical-history/pages/ClinicalHistoryListPage';
import { ClinicalHistoryFormPage } from '@/features/clinical-history/pages/ClinicalHistoryFormPage';
import { ClinicalHistoryDetailPage } from '@/features/clinical-history/pages/ClinicalHistoryDetailPage';

// Evolution Notes
import { NoteFormPage } from '@/features/clinical-history/pages/NoteFormPage';
import { ClinicalHistoryNoteListPage } from '@/features/clinical-history/pages/ClinicalHistoryNoteListPage';
import { ClinicalHistoryNoteFormPage } from '@/features/clinical-history/pages/ClinicalHistoryNoteFormPage';
import { ClinicalHistoryNoteDetailPage } from '@/features/clinical-history/pages/ClinicalHistoryNoteDetailPage';

// Consultas y Chequeos Diarios
import { ConsultasPage } from '@/features/consultas/pages/ConsultasPage';

// Settings
import { SettingsPage } from '@/features/admin/pages/SettingsPage';
import { SchedulePage } from '@/features/admin/pages/SchedulePage';
import { ConsultingRoomsPage } from '@/features/admin/pages/ConsultingRoomsPage';
import { SpecialtyTemplatesPage } from '@/features/admin/pages/SpecialtyTemplatesPage';
import { UsersPage } from '@/features/admin/pages/UsersPage';
import ProfilePage from '@/features/admin/pages/ProfilePage';
import AuditoriaPage from '@/features/admin/pages/AuditoriaPage';
import GeneralReportsPage from '@/features/general-reports/pages/GeneralReportsPage';
import AlertsAdminPage from '@/features/alerts/pages/AlertsAdminPage';

import { SecuritySetupPage } from '@/features/auth/pages/SecuritySetupPage';

export const router = createBrowserRouter([
    // Rutas públicas (Auth)
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/forgot-password', element: <ForgotPasswordPage /> },
            { path: '/reset-password/:token', element: <ResetPasswordPage /> },
            { path: '/maintenance', element: <MaintenancePage /> },
        ],
    },

    // Rutas protegidas
    {
        element: <ProtectedRoute />,
        errorElement: <RouteErrorPage />,
        children: [
            { path: '/security-setup', element: <SecuritySetupPage /> },
            {
                element: <MainLayout />,
                children: [
                    // Dashboard
                    { path: '/', element: <DashboardPage /> },

                    // Pacientes
                    { path: '/patients', element: <PatientsListPage /> },
                    { path: '/patients/new', element: <PatientFormPage /> },
                    { path: '/patients/:id', element: <PatientDetailPage /> },
                    { path: '/patients/:id/edit', element: <PatientFormPage /> },

                    // Perfil Doctor
                    { path: '/doctor/setup', element: <DoctorSetupPage /> },

                    // Citas
                    { path: '/appointments', element: <AppointmentsPage /> },
                    { path: '/appointments/new', element: <AppointmentFormPage /> },
                    { path: '/appointments/:id/edit', element: <AppointmentFormPage /> },

                    // Historias Clínicas y Notas de Evolución (Visualización: Todo personal clínico/admin/secretaria)
                    {
                        element: <RoleGuard roles={[OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, OrganizationRole.ADMIN, OrganizationRole.OWNER, OrganizationRole.SECRETARY, SystemRole.SUPERADMIN]} />,
                        children: [
                            { path: '/clinical-history', element: <ClinicalHistoryListPage /> },
                            { path: '/clinical-history/:id', element: <ClinicalHistoryDetailPage /> },
                            { path: '/clinical-history-note', element: <ClinicalHistoryNoteListPage /> },
                            { path: '/clinical-history-note/:id', element: <ClinicalHistoryNoteDetailPage /> },
                            { path: '/consultas', element: <ConsultasPage /> },
                        ],
                    },
                    // Creación/Edición Clínica (Doctores, Enfermeras/os, Directores y Superadmin)
                    {
                        element: <RoleGuard roles={[OrganizationRole.DOCTOR, OrganizationRole.NURSE, OrganizationRole.MEDICAL_DIRECTOR, SystemRole.SUPERADMIN]} />,
                        children: [
                            { path: '/clinical-history/new', element: <ClinicalHistoryFormPage /> },
                            { path: '/clinical-history/:id/edit', element: <ClinicalHistoryFormPage /> },
                            { path: '/clinical-history/notes/new', element: <NoteFormPage /> },
                            { path: '/clinical-history-note/new', element: <ClinicalHistoryNoteFormPage /> },
                            { path: '/clinical-history-note/:id/edit', element: <ClinicalHistoryNoteFormPage /> },
                        ],
                    },

                    // Configuración
                    { path: '/settings', element: <SettingsPage /> },
                    { path: '/settings/schedule', element: <SchedulePage /> },
                    { path: '/settings/rooms', element: <ConsultingRoomsPage /> },
                    { path: '/settings/templates', element: <SpecialtyTemplatesPage /> },
                    { path: '/settings/profile', element: <ProfilePage /> },
                    { path: '/settings/reports', element: <GeneralReportsPage /> },

                    // Solo ADMIN u OWNER
                    {
                        element: <RoleGuard roles={[OrganizationRole.ADMIN, OrganizationRole.OWNER, SystemRole.SUPERADMIN]} />,
                        children: [
                            { path: '/settings/users', element: <UsersPage /> },
                            { path: '/settings/audit', element: <AuditoriaPage /> },
                            { path: '/settings/alerts', element: <AlertsAdminPage /> },
                        ],
                    },

                    // 404
                    { path: '*', element: <NotFoundPage /> },
                ],
            },
        ],
    },
], { basename: '/historias-clinicas' });

