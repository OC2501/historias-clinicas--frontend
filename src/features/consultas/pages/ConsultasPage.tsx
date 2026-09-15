import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
  Activity,
  Calendar,
  Download,
  FileSpreadsheet,
  Filter,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  Stethoscope,
  Users,
  X,
  Loader2,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { safeFormat } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/tables/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { patientsApi } from '@/api';

import { useConsultas } from '../hooks/useConsultas';
import { getConsultasColumns } from '../components/ConsultasColumns';
import { ConsultasForm } from '../components/ConsultasForm';
import { ConsultasDetail } from '../components/ConsultasDetail';
import { ConsultaReportPDF } from '../pdf/ConsultaReportPDF';
import { ConsultasReportsPDF } from '../pdf/ConsultasReportsPDF';
import { exportConsultasToExcel } from '../reports/consultasReportExcel';
import type { Consulta, TipoConsulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS } from '../types/consultas.type';
import type { ConsultaFormValues } from '../types/consultas.schema';

export function ConsultasPage() {
  const {
    consultas,
    meta,
    stats,
    isLoading,
    searchTerm,
    setSearchTerm,
    gender,
    setGender,
    gerencia,
    setGerencia,
    gerencias,
    tipoConsulta,
    setTipoConsulta,
    startDate,
    endDate,
    datePreset,
    setPreset,
    setCustomDates,
    page,
    setPage,
    limit,
    setLimit,
    resetFilters,
    fetchAllConsultas,
    createConsulta,
    updateConsulta,
    deleteConsulta,
    isCreating,
    isUpdating,
    isDeleting,
  } = useConsultas();

  // Parámetros de URL (ej: /consultas?patientId=xxx)
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  // Estados locales para modales y acciones
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [consultaToDelete, setConsultaToDelete] = useState<Consulta | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Auto-abrir modal si se pasa patientId en la URL
  useEffect(() => {
    if (urlPatientId) {
      setEditingConsulta(null);
      setIsFormOpen(true);
    }
  }, [urlPatientId]);

  // Manejador para abrir formulario en modo creación
  const handleOpenCreate = () => {
    setEditingConsulta(null);
    setIsFormOpen(true);
  };

  // Manejador para abrir formulario en modo edición
  const handleOpenEdit = (consulta: Consulta) => {
    setEditingConsulta(consulta);
    setIsFormOpen(true);
  };

  // Manejador para abrir detalle
  const handleOpenDetail = (consulta: Consulta) => {
    setSelectedConsulta(consulta);
    setIsDetailOpen(true);
  };

  // Manejador de guardado (Crear o Actualizar)
  const handleFormSubmit = async (data: ConsultaFormValues) => {
    try {
      if (editingConsulta) {
        await updateConsulta({
          id: editingConsulta.id,
          data: {
            ...data,
            hora: data.hora || undefined,
            doctorId: data.doctorId ? data.doctorId : undefined,
            nurseId: data.nurseId ? data.nurseId : undefined,
            sintomas: data.sintomas || undefined,
            presionArterial: data.presionArterial || undefined,
            frecuenciaCardiaca: data.frecuenciaCardiaca || undefined,
            frecuenciaRespiratoria: data.frecuenciaRespiratoria || undefined,
            temperatura: data.temperatura || undefined,
            saturacionOxigeno: data.saturacionOxigeno || undefined,
            peso: data.peso || undefined,
            altura: data.altura || undefined,
            imc: data.imc || undefined,
            glucemia: data.glucemia || undefined,
            examenFisico: data.examenFisico || undefined,
            diagnostico: data.diagnostico || undefined,
            diagnosticosSecundarios: data.diagnosticosSecundarios || undefined,
            tratamiento: data.tratamiento || undefined,
            examenesSolicitados: data.examenesSolicitados || undefined,
            reposoMedico: data.reposoMedico ?? false,
            diasReposo: data.diasReposo || undefined,
            fechaInicioReposo: data.fechaInicioReposo || undefined,
            fechaFinReposo: data.fechaFinReposo || undefined,
            observaciones: data.observaciones || undefined,
            proximoControl: data.proximoControl || undefined,
          },
        });
      } else {
        await createConsulta({
          ...data,
          hora: data.hora || undefined,
          doctorId: data.doctorId || undefined,
          nurseId: data.nurseId || undefined,
          sintomas: data.sintomas || undefined,
          presionArterial: data.presionArterial || undefined,
          frecuenciaCardiaca: data.frecuenciaCardiaca || undefined,
          frecuenciaRespiratoria: data.frecuenciaRespiratoria || undefined,
          temperatura: data.temperatura || undefined,
          saturacionOxigeno: data.saturacionOxigeno || undefined,
          peso: data.peso || undefined,
          altura: data.altura || undefined,
          imc: data.imc || undefined,
          glucemia: data.glucemia || undefined,
          examenFisico: data.examenFisico || undefined,
          diagnostico: data.diagnostico || undefined,
          diagnosticosSecundarios: data.diagnosticosSecundarios || undefined,
          tratamiento: data.tratamiento || undefined,
          examenesSolicitados: data.examenesSolicitados || undefined,
          reposoMedico: data.reposoMedico ?? false,
          diasReposo: data.diasReposo || undefined,
          fechaInicioReposo: data.fechaInicioReposo || undefined,
          fechaFinReposo: data.fechaFinReposo || undefined,
          observaciones: data.observaciones || undefined,
          proximoControl: data.proximoControl || undefined,
        });
      }
      setIsFormOpen(false);
      setEditingConsulta(null);
      if (urlPatientId) {
        searchParams.delete('patientId');
        setSearchParams(searchParams, { replace: true });
      }
    } catch {
      // Error manejado en hook
    }
  };

  // Manejador para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!consultaToDelete) return;
    try {
      await deleteConsulta(consultaToDelete.id);
      setConsultaToDelete(null);
    } catch {
      // Error manejado en hook
    }
  };

  // Manejador para imprimir informe individual en PDF
  const handlePrintSingle = async (consulta: Consulta) => {
    try {
      const toastId = toast.loading('Generando informe médico en PDF...');
      let finalConsulta = consulta;

      // Enriquecer titular si es beneficiario y falta la relación
      if (
        consulta.patient?.patientType === 'BENEFICIARIO' &&
        !consulta.patient?.titular &&
        consulta.patient?.id
      ) {
        try {
          const pRes = await patientsApi.getById(consulta.patient.id);
          const fullPatient = pRes.data;
          if (fullPatient?.titular) {
            finalConsulta = {
              ...consulta,
              patient: {
                ...consulta.patient,
                titular: fullPatient.titular,
              },
            };
          }
        } catch {
          // Continuar con los datos disponibles
        }
      }

      const blob = await pdf(<ConsultaReportPDF consulta={finalConsulta} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const patientName = `${finalConsulta.patient?.firstName || ''}_${finalConsulta.patient?.lastName || ''}`.trim() || 'Paciente';
      link.download = `Informe_Medico_${patientName}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success('Informe PDF descargado con éxito');
    } catch (error) {
      toast.error('Error al generar el PDF de la consulta');
    }
  };

  const getDateRangeCaption = () => {
    const parts: string[] = [];

    if (datePreset === 'TODAY') {
      parts.push(format(new Date(), "dd/MM/yyyy"));
    } else if (startDate && endDate) {
      if (startDate === endDate) parts.push(safeFormat(startDate, 'dd/MM/yyyy'));
      else parts.push(`${safeFormat(startDate, 'dd/MM/yyyy')} al ${safeFormat(endDate, 'dd/MM/yyyy')}`);
    } else if (startDate) {
      parts.push(`Desde ${safeFormat(startDate, 'dd/MM/yyyy')}`);
    } else if (endDate) {
      parts.push(`Hasta ${safeFormat(endDate, 'dd/MM/yyyy')}`);
    } else if (datePreset === 'WEEK') {
      parts.push('Semana en curso');
    } else if (datePreset === 'MONTH') {
      parts.push('Mes en curso');
    }

    if (gerencia) {
      parts.push(`Sede: ${gerencia}`);
    }
    if (tipoConsulta && TIPO_CONSULTA_LABELS[tipoConsulta as TipoConsulta]) {
      parts.push(`Tipo: ${TIPO_CONSULTA_LABELS[tipoConsulta as TipoConsulta]}`);
    }
    if (gender) {
      parts.push(`Género: ${gender === 'M' || gender === 'MALE' ? 'Masc' : 'Fem'}`);
    }
    if (searchTerm) {
      parts.push(`Filtro: "${searchTerm}"`);
    }

    return parts.length > 0 ? parts.join(' • ') : undefined;
  };

  // Manejador para exportar reporte grupal en PDF (todas las consultas filtradas)
  const handleExportGroupPdf = async () => {
    if (meta.total === 0 && (!consultas || consultas.length === 0)) {
      toast.warning('No hay consultas registradas para exportar');
      return;
    }
    const toastId = toast.loading('Recopilando consultas para el reporte PDF...');
    try {
      setIsExportingPdf(true);
      const allConsultas = await fetchAllConsultas();
      if (!allConsultas || allConsultas.length === 0) {
        toast.dismiss(toastId);
        toast.warning('No se encontraron consultas con los filtros seleccionados');
        return;
      }

      toast.loading(`Generando reporte PDF (${allConsultas.length} consultas)...`, { id: toastId });
      const dateRangeText = getDateRangeCaption();
      const blob = await pdf(
        <ConsultasReportsPDF consultas={allConsultas} dateRangeText={dateRangeText} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Consultas_Hidroven_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success(`Reporte PDF con ${allConsultas.length} consultas descargado con éxito`);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al exportar el reporte general en PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Manejador para exportar a Excel (todas las consultas filtradas)
  const handleExportExcel = async () => {
    if (meta.total === 0 && (!consultas || consultas.length === 0)) {
      toast.warning('No hay consultas registradas para exportar');
      return;
    }
    const toastId = toast.loading('Recopilando consultas para el archivo Excel...');
    try {
      setIsExportingExcel(true);
      const allConsultas = await fetchAllConsultas();
      if (!allConsultas || allConsultas.length === 0) {
        toast.dismiss(toastId);
        toast.warning('No se encontraron consultas con los filtros seleccionados');
        return;
      }

      toast.loading(`Generando archivo Excel (${allConsultas.length} consultas)...`, { id: toastId });
      const dateRangeText = getDateRangeCaption();
      await exportConsultasToExcel(allConsultas, 'Reporte_Consultas_Hidroven', dateRangeText);
      toast.dismiss(toastId);
      toast.success(`Archivo Excel con ${allConsultas.length} consultas generado y descargado con éxito`);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Error al generar el archivo Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Columnas para la tabla
  const columns = getConsultasColumns(
    handleOpenDetail,
    handleOpenEdit,
    handlePrintSingle,
    (consulta) => setConsultaToDelete(consulta)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Stethoscope className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Chequeos Diarios y Consultas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestión de triajes, evaluaciones médicas cotidianas, recetas y constancias de reposo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-semibold order-first sm:order-last cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Consulta</span>
          </Button>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm gap-1.5 border-border shadow-2xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
              onClick={handleExportExcel}
              disabled={isExportingExcel || isLoading}
            >
              {isExportingExcel ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              <span>{isExportingExcel ? 'Exportando...' : 'Excel'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto h-10 sm:h-9 text-xs sm:text-sm gap-1.5 border-border shadow-2xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
              onClick={handleExportGroupPdf}
              disabled={isExportingPdf || isLoading}
            >
              {isExportingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              <span>{isExportingPdf ? 'Exportando...' : 'PDF'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS Y KPIS (ACTUALIZADAS EN TIEMPO REAL) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 shadow-2xs bg-gradient-to-br from-blue-500/5 to-transparent">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Consultas Hoy</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats.totalHoy}</h3>
              <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium truncate">
                Atenciones de hoy
              </p>
            </div>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-2xs bg-gradient-to-br from-emerald-500/5 to-transparent">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Total Atenciones</p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats.totalAtenciones ?? meta.total}</h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
                Registros activos
              </p>
            </div>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-2xs bg-gradient-to-br from-red-500/5 to-transparent">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">De Reposo Hoy / Total</p>
              <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
                <h3 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.totalRepososActivosHoy ?? 0}
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  / {stats.totalReposos ?? 0} emitidos
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-red-600 dark:text-red-400 mt-0.5 font-medium truncate">
                {stats.totalDiasReposo ? `${stats.totalDiasReposo} días acumulados` : 'Incapacidades laborales'}
              </p>
            </div>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-2xs bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">Promedio Diario</p>
              <h3 className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 sm:mt-1">
                {stats.promedioDiario}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">
                Consultas / día
              </p>
            </div>
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. BARRA DE BÚSQUEDA Y FILTROS INTEGRALES CON FECHAS */}
      <Card className="border-border/60 shadow-2xs">
        <CardContent className="p-4 space-y-3.5">
          {/* Fila 1: Búsqueda y Selectores de Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
            {/* Input de Búsqueda */}
            <div className="md:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, cédula, diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro por Tipo de Consulta */}
            <div className="md:col-span-3">
              <Select value={tipoConsulta || 'ALL'} onValueChange={(val) => setTipoConsulta(val === 'ALL' ? '' : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de chequeo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los tipos</SelectItem>
                  {Object.entries(TIPO_CONSULTA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Gerencia */}
            <div className="md:col-span-3">
              <Select
                value={gerencia || 'ALL'}
                onValueChange={(val) => setGerencia(val === 'ALL' ? '' : val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas las gerencias" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="ALL">Todas las gerencias</SelectItem>
                  {(Array.isArray(gerencias) ? gerencias : []).map((g: string) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Género */}
            <div className="md:col-span-2">
              <Select value={gender || 'ALL'} onValueChange={(val) => setGender(val === 'ALL' ? '' : val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Género..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los géneros</SelectItem>
                  <SelectItem value="MALE">Masculino</SelectItem>
                  <SelectItem value="FEMALE">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fila 2: Filtros de Fecha (Presets Rápidos + Rango Desde/Hasta) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2.5 border-t border-border/50">
            {/* Presets rápidos */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Período:
              </span>
              <Button
                type="button"
                variant={datePreset === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset('ALL')}
                className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Todas
              </Button>
              <Button
                type="button"
                variant={datePreset === 'TODAY' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset('TODAY')}
                className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Hoy
              </Button>
              <Button
                type="button"
                variant={datePreset === 'WEEK' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset('WEEK')}
                className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Esta Semana
              </Button>
              <Button
                type="button"
                variant={datePreset === 'MONTH' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset('MONTH')}
                className="h-8 px-2.5 text-xs rounded-lg cursor-pointer"
              >
                Este Mes
              </Button>
            </div>

            {/* Selector de Rango Personalizado */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">Desde:</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setCustomDates(e.target.value, endDate)}
                  className="h-8 w-34 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium">Hasta:</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setCustomDates(startDate, e.target.value)}
                  className="h-8 w-34 text-xs"
                />
              </div>

              {(searchTerm || tipoConsulta || gender || gerencia || startDate || endDate || datePreset !== 'ALL') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1 cursor-pointer"
                  title="Limpiar todos los filtros"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Limpiar</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. TABLA DE DATOS */}
      <DataTable
        columns={columns}
        data={consultas}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalPages: meta.lastPage,
          pageSize: limit,
          totalItems: meta.total,
          onPageChange: setPage,
          onPageSizeChange: setLimit,
        }}
      />

      {/* 5. MODAL FORMULARIO (Crear / Editar) */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingConsulta(null);
            if (urlPatientId) {
              searchParams.delete('patientId');
              setSearchParams(searchParams, { replace: true });
            }
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="!max-w-none w-[96vw] md:w-[88vw] h-[92vh] md:h-[88vh] max-h-[92vh] md:max-h-[88vh] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 flex flex-col border dark:border-slate-800"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Formulario de Consulta Médica</DialogTitle>
            <DialogDescription>Crear o editar consulta médica</DialogDescription>
          </DialogHeader>
          <ConsultasForm
            initialData={editingConsulta}
            initialPatientId={urlPatientId || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingConsulta(null);
              if (urlPatientId) {
                searchParams.delete('patientId');
                setSearchParams(searchParams, { replace: true });
              }
            }}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* 6. MODAL DE DETALLE */}
      <ConsultasDetail
        consulta={selectedConsulta}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedConsulta(null);
        }}
        onEdit={(consulta) => {
          handleOpenEdit(consulta);
        }}
        onPrint={handlePrintSingle}
      />

      {/* 7. DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmDialog
        open={!!consultaToDelete}
        onOpenChange={(open) => !open && setConsultaToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar consulta médica?"
        description={`¿Está seguro de que desea eliminar la consulta de "${consultaToDelete?.patient?.firstName} ${consultaToDelete?.patient?.lastName}" del día ${consultaToDelete?.fecha}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Consulta"
        variant="destructive"
      />
    </div>
  );
}
