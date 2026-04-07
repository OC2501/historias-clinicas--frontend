import { api } from '@/api';
import type { DoctorDashboard, ApiOneResponse } from '@/types';

export const dashboardApi = {
    getDoctorDashboard: () =>
        api.get<ApiOneResponse<DoctorDashboard>>('doctor/dashboard'),
};
