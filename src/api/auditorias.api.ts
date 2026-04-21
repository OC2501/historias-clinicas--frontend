import { api } from "./axios";

export const getAuditorias = async (params?: { page?: number; limit?: number }) => {
  const { data } = await api.get("/auditorias", { params });
  return data;
};
