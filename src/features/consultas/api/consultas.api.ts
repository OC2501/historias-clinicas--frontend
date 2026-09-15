import { api } from '@/api';
import type {
  Consulta,
  CreateConsultaRequest,
  UpdateConsultaRequest,
} from '../types/consultas.type';
import type { ApiAllResponse, ApiOneResponse, PaginationParams } from '@/types';

export interface ConsultaPaginationParams extends PaginationParams {
  gender?: string;
  gerencia?: string;
  tipoConsulta?: string;
  startDate?: string;
  endDate?: string;
}

export interface ConsultaStatsResponse {
  totalHoy: number;
  totalAtenciones: number;
  totalReposos: number;
  totalDiasReposo?: number;
  totalRepososActivosHoy?: number;
  totalMes: number;
  promedioDiario: number;
}

export const consultasApi = {
  getAll: (params?: ConsultaPaginationParams) =>
    api.get<ApiAllResponse<Consulta>>('consultas', { params }),

  getStats: () =>
    api.get<ConsultaStatsResponse>('consultas/stats'),

  getById: (id: string) =>
    api.get<ApiOneResponse<Consulta>>(`consultas/${id}`),

  create: (data: CreateConsultaRequest) =>
    api.post<ApiOneResponse<Consulta>>('consultas', data),

  update: (id: string, data: UpdateConsultaRequest) =>
    api.patch<ApiOneResponse<Consulta>>(`consultas/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`consultas/${id}`),
};
