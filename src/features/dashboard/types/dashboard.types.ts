export interface DoctorDashboard {
    totalPatients: number;
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    appointmentsByStatus: Record<string, number>;
}
