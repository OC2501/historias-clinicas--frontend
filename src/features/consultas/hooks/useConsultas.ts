import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultasApi, doctorsApi, patientsApi } from '@/api';
import { toast } from 'sonner';
import type {
  Consulta,
  CreateConsultaRequest,
  UpdateConsultaRequest,
  TipoConsulta,
  ConsultaStats,
} from '../types/consultas.type';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export function useConsultas() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [gender, setGender] = useState('');
  const [gerencia, setGerencia] = useState('');
  const [tipoConsulta, setTipoConsulta] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [titularesCache, setTitularesCache] = useState<Record<string, any>>({});

  // 1. Query principal de consultas paginadas
  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      'consultas',
      page,
      limit,
      searchTerm,
      gender,
      gerencia,
      tipoConsulta,
      startDate,
      endDate,
    ],
    queryFn: async () => {
      const res = await consultasApi.getAll({
        page,
        limit,
        search: searchTerm || undefined,
        gender: gender || undefined,
        gerencia: gerencia || undefined,
        tipoConsulta: tipoConsulta || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return res.data;
    },
  });

  // 2. Query de estadísticas y KPIs en tiempo real desde el backend
  const { data: statsRes } = useQuery({
    queryKey: ['consultas-stats'],
    queryFn: async () => {
      const res = await consultasApi.getStats();
      return res.data;
    },
  });

  // 2.1 Query de doctores para poblar datos de usuario
  const { data: doctorsRes } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await doctorsApi.getAll();
      return res.data;
    },
  });

  const doctors = useMemo(() => {
    if (Array.isArray(doctorsRes)) return doctorsRes;
    if (Array.isArray((doctorsRes as any)?.data)) return (doctorsRes as any).data;
    if (Array.isArray((doctorsRes as any)?.data?.data)) return (doctorsRes as any).data.data;
    return [];
  }, [doctorsRes]);

  // 2.2. Query de gerencias únicas desde patientsApi
  const { data: gerenciasRes } = useQuery({
    queryKey: ['unique-gerencias'],
    queryFn: async () => {
      const res = await patientsApi.getUniqueGerencias();
      const raw = res.data;
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray((raw as any).data)) return (raw as any).data;
      return [];
    },
  });

  const gerencias = useMemo(() => {
    if (Array.isArray(gerenciasRes)) return gerenciasRes;
    if (gerenciasRes && Array.isArray((gerenciasRes as any).data)) return (gerenciasRes as any).data;
    return [];
  }, [gerenciasRes]);

  // Prefetch de titulares faltantes para pacientes beneficiarios en la tabla actual
  useEffect(() => {
    const rawData = response?.data || [];
    if (!Array.isArray(rawData)) return;

    const missingIds = rawData
      .filter(
        (c: Consulta) =>
          c.patient?.patientType === 'BENEFICIARIO' &&
          !c.patient?.titular &&
          c.patient?.id &&
          !titularesCache[c.patient.id]
      )
      .map((c: Consulta) => c.patient.id);

    const uniqueIds = Array.from(new Set(missingIds));
    if (uniqueIds.length === 0) return;

    let isMounted = true;
    Promise.all(
      uniqueIds.map(async (pId) => {
        try {
          const res = await patientsApi.getById(pId);
          const fullPatient = res.data;
          return { id: pId, titular: fullPatient?.titular || null };
        } catch {
          return { id: pId, titular: null };
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      setTitularesCache((prev) => {
        const next = { ...prev };
        let changed = false;
        results.forEach((r) => {
          if (r.titular && !next[r.id]) {
            next[r.id] = r.titular;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [response?.data, titularesCache]);

  // 3. Procesar y ordenar las consultas
  const consultas = useMemo(() => {
    const rawData = response?.data || [];
    if (!Array.isArray(rawData)) return [];

    return rawData.map((consulta: Consulta) => {
      let currentConsulta = consulta;

      // Enriquecer titular si falta en beneficiario y está en caché
      if (
        currentConsulta.patient?.patientType === 'BENEFICIARIO' &&
        !currentConsulta.patient?.titular &&
        currentConsulta.patient?.id &&
        titularesCache[currentConsulta.patient.id]
      ) {
        currentConsulta = {
          ...currentConsulta,
          patient: {
            ...currentConsulta.patient,
            titular: titularesCache[currentConsulta.patient.id],
          },
        };
      }

      if (!currentConsulta.doctor?.user?.name && doctors.length > 0 && currentConsulta.doctor?.id) {
        const found = doctors.find((d: any) => d.id === currentConsulta.doctor?.id);
        if (found?.user) {
          currentConsulta = {
            ...currentConsulta,
            doctor: {
              ...currentConsulta.doctor,
              user: found.user,
            },
          };
        }
      }
      return currentConsulta;
    });
  }, [response, doctors, titularesCache]);

  // 4. Metadatos de paginación
  const meta = useMemo(() => {
    if (response?.meta) return response.meta;
    return {
      page,
      lastPage:
        (response as any)?.lastPage ||
        Math.ceil((consultas?.length || 0) / limit) ||
        1,
      total: (response as any)?.total || consultas?.length || 0,
      limit,
    };
  }, [response, page, limit, consultas]);

  // 5. Estadísticas de KPIs consolidadas
  const stats: ConsultaStats = useMemo(() => {
    if (statsRes) {
      return {
        totalHoy: statsRes.totalHoy ?? 0,
        totalAtenciones: statsRes.totalAtenciones ?? meta.total,
        totalMes: statsRes.totalMes ?? 0,
        totalReposos: statsRes.totalReposos ?? 0,
        totalDiasReposo: statsRes.totalDiasReposo ?? 0,
        totalRepososActivosHoy: statsRes.totalRepososActivosHoy ?? 0,
        promedioDiario: statsRes.promedioDiario ?? 0,
      };
    }

    return {
      totalHoy: 0,
      totalAtenciones: meta.total,
      totalMes: 0,
      totalReposos: 0,
      totalDiasReposo: 0,
      totalRepososActivosHoy: 0,
      promedioDiario: 0,
    };
  }, [statsRes, meta.total]);

  // 6. Mutaciones
  const createMutation = useMutation({
    mutationFn: (data: CreateConsultaRequest) => consultasApi.create(data),
    onSuccess: () => {
      toast.success('Chequeo / Consulta registrada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      queryClient.invalidateQueries({ queryKey: ['consultas-stats'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al registrar la consulta'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConsultaRequest;
    }) => consultasApi.update(id, data),
    onSuccess: () => {
      toast.success('Consulta actualizada correctamente');
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      queryClient.invalidateQueries({ queryKey: ['consultas-stats'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al actualizar la consulta'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => consultasApi.delete(id),
    onSuccess: () => {
      toast.success('Consulta eliminada correctamente');
      queryClient.invalidateQueries({ queryKey: ['consultas'] });
      queryClient.invalidateQueries({ queryKey: ['consultas-stats'] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Error al eliminar la consulta'
      );
    },
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const setPreset = (preset: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH') => {
    setDatePreset(preset);
    setPage(1);

    const now = new Date();
    if (preset === 'TODAY') {
      const todayStr = format(now, 'yyyy-MM-dd');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'WEEK') {
      const start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      setStartDate(start);
      setEndDate(end);
    } else if (preset === 'MONTH') {
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');
      setStartDate(start);
      setEndDate(end);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setDatePreset('CUSTOM');
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setGender('');
    setGerencia('');
    setTipoConsulta('');
    setStartDate('');
    setEndDate('');
    setDatePreset('ALL');
    setPage(1);
  };

  // Función para obtener todas las consultas respetando fielmente los filtros actuales (para exportación completa)
  const fetchAllConsultas = async (): Promise<Consulta[]> => {
    const params = {
      page: 1,
      limit: 10000,
      search: searchTerm || undefined,
      gender: gender || undefined,
      gerencia: gerencia || undefined,
      tipoConsulta: tipoConsulta || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    const res = await consultasApi.getAll(params);
    let rawData = res.data?.data || [];
    const total = res.data?.meta?.total ?? res.data?.total ?? 0;

    // En el caso extraordinario de que existan más de 10.000 registros filtrados
    if (total > 10000 && total > rawData.length) {
      const resFull = await consultasApi.getAll({
        ...params,
        limit: total,
      });
      rawData = resFull.data?.data || rawData;
    }

    if (!Array.isArray(rawData)) return [];

    let mapped = rawData.map((consulta: Consulta) => {
      if (!consulta.doctor?.user?.name && doctors.length > 0 && consulta.doctor?.id) {
        const found = doctors.find((d: any) => d.id === consulta.doctor?.id);
        if (found?.user) {
          return {
            ...consulta,
            doctor: {
              ...consulta.doctor,
              user: found.user,
            },
          };
        }
      }
      return consulta;
    });

    // Enriquecer pacientes beneficiarios con su trabajador titular si la API no lo incluyó
    const missingTitularPatients = mapped.filter(
      (c) => c.patient?.patientType === 'BENEFICIARIO' && !c.patient?.titular && c.patient?.id
    );

    if (missingTitularPatients.length > 0) {
      const uniquePatientIds = Array.from(new Set(missingTitularPatients.map((c) => c.patient.id)));
      const patientCache = new Map<string, any>(Object.entries(titularesCache));
      const idsToFetch = uniquePatientIds.filter((id) => !patientCache.has(id));

      if (idsToFetch.length > 0) {
        await Promise.all(
          idsToFetch.map(async (pId) => {
            try {
              const pRes = await patientsApi.getById(pId);
              const fullPatient = pRes.data;
              if (fullPatient?.titular) {
                patientCache.set(pId, fullPatient.titular);
              }
            } catch {
              // Silencioso ante errores individuales
            }
          })
        );
      }

      if (patientCache.size > 0) {
        mapped = mapped.map((consulta) => {
          if (
            consulta.patient?.patientType === 'BENEFICIARIO' &&
            !consulta.patient?.titular &&
            patientCache.has(consulta.patient.id)
          ) {
            return {
              ...consulta,
              patient: {
                ...consulta.patient,
                titular: patientCache.get(consulta.patient.id),
              },
            };
          }
          return consulta;
        });
      }
    }

    return mapped;
  };

  return {
    consultas,
    meta,
    stats,
    isLoading,
    isFetching,
    refetch,
    searchTerm,
    setSearchTerm: handleSearchChange,
    gender,
    setGender: (val: string) => {
      setGender(val);
      setPage(1);
    },
    gerencia,
    setGerencia: (val: string) => {
      setGerencia(val);
      setPage(1);
    },
    gerencias,
    tipoConsulta,
    setTipoConsulta: (val: string) => {
      setTipoConsulta(val);
      setPage(1);
    },
    startDate,
    endDate,
    datePreset,
    setPreset,
    setCustomDates: handleCustomDateChange,
    page,
    setPage,
    limit,
    setLimit,
    resetFilters,
    fetchAllConsultas,
    createConsulta: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateConsulta: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteConsulta: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
