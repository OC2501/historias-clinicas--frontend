import React, { useEffect, useState } from 'react';
import { getAuditorias } from '@/api/auditorias.api';
import {
  Activity,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Shield,
  Download,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { pdf } from '@react-pdf/renderer';
import { AuditoriasReportPDF } from '@/features/auditoria/pdf/AuditoriasReportPDF';
import { exportAuditoriasToExcel } from '@/features/auditoria/reports/AuditoriasExcel';

interface Auditoria {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  descripcion: string;
  ip: string;
  createdAt: string;
  usuario: {
    name: string;
    email: string;
  };
}

import { DataTable } from '@/components/tables/DataTable';
import type { Column } from '@/types/table';
import { Button } from '@/components/ui/button';

const AuditoriaPage: React.FC = () => {
  const [logs, setLogs] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getAuditorias({ page, limit });
      // El backend devuelve los logs directamente o dentro de data
      setLogs(response.data || response);
      setMeta(response.meta || {
        total: response.total || 0,
        lastPage: response.lastPage || 1
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAllLogs = async () => {
    const response = await getAuditorias({ page: 1, limit: 10000 });
    const allLogs = response.data || response;
    return allLogs.filter((log: Auditoria) => {
      const matchesSearch = searchTerm === '' ||
        log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entidad.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === null || log.accion === actionFilter;

      return matchesSearch && matchesAction;
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const filtered = await getFilteredAllLogs();
      const blob = await pdf(<AuditoriasReportPDF logs={filtered} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Auditoria_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const filtered = await getFilteredAllLogs();
      await exportAuditoriasToExcel(filtered, 'Reporte_Auditoria');
    } catch (error) {
      console.error('Error generating Excel:', error);
    } finally {
      setIsExportingExcel(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  const getActionColor = (accion: string) => {
    switch (accion) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'LOGIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const columns: Column<Auditoria>[] = [
    {
      header: 'Fecha y Hora',
      accessorKey: (log) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {format(new Date(log.createdAt), 'dd MMM, HH:mm', { locale: es })}
          </span>
        </div>
      ),
    },
    {
      header: 'Usuario',
      accessorKey: (log) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {log.usuario.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{log.usuario.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{log.usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Acción',
      accessorKey: (log) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionColor(log.accion)}`}>
          {log.accion}
        </span>
      ),
    },
    {
      header: 'Detalle',
      accessorKey: (log) => (
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium line-clamp-2 italic">
            "{log.descripcion}"
          </p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-semibold text-primary">{log.entidad}</span>
          </div>
        </div>
      ),
    },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entidad.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === null || log.accion === actionFilter;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2 sm:gap-2.5">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
            Centro de Auditoría
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Monitoreo y trazabilidad de acciones críticas en la organización.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={isExportingExcel || loading || !logs || logs.length === 0}
              className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 h-9 sm:h-10"
            >
              {isExportingExcel ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              {isExportingExcel ? 'Exportando...' : 'Exportar Excel'}
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting || loading || !logs || logs.length === 0}
              className="text-xs sm:text-sm h-9 sm:h-10"
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground bg-card px-3 sm:px-4 py-2 rounded-xl border shadow-xs justify-center">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 animate-pulse shrink-0" />
            Sistema en tiempo real
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card p-5 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros de búsqueda
            </h3>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar descripción o usuario..."
                className="w-full pl-10 pr-4 py-2 bg-background border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Acciones Rápidas</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setActionFilter(actionFilter === 'CREATE' ? null : 'CREATE')}
                  className={`px-3 py-2 rounded-lg transition-colors font-medium ${actionFilter === 'CREATE'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  Solo Creaciones
                </button>
                <button
                  onClick={() => setActionFilter(actionFilter === 'DELETE' ? null : 'DELETE')}
                  className={`px-3 py-2 rounded-lg transition-colors font-medium ${actionFilter === 'DELETE'
                    ? 'bg-rose-500 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                >
                  Solo Eliminaciones
                </button>
                <button
                  onClick={() => setActionFilter(actionFilter === 'UPDATE' ? null : 'UPDATE')}
                  className={`px-3 py-2 rounded-lg transition-colors font-medium col-span-2 ${actionFilter === 'UPDATE'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                >
                  Solo Actualizaciones
                </button>
              </div>
              <button
                onClick={() => { setSearchTerm(''); setActionFilter(null); }}
                className="w-full mt-2 py-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>


          <div className="hidden md:block group relative overflow-hidden bg-gradient-to-br from-[#303854] to-[#4c5a85] p-6 rounded-2xl text-white shadow-xl shadow-primary/10 border border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-[#303854]/30 hover:-translate-y-1">
            {/* Decorative element */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />

            <div className="relative flex flex-col gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-6 h-6 text-white" />
              </div>

              <div>
                <h4 className="font-bold text-xl mb-2 tracking-tight">Seguridad activa</h4>
                <p className="text-white/80 text-sm leading-relaxed font-medium">
                  Todos los cambios en pacientes, citas e historias clínicas son registrados permanentemente para garantizar el cumplimiento y la seguridad de los datos.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/40">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Protección Certificada
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <DataTable
            columns={columns}
            data={filteredLogs}
            isLoading={loading}
            renderMobileCard={(log) => (
              <div className="rounded-2xl border bg-card p-4 shadow-xs hover:shadow-md transition-all space-y-3">
                {/* Cabecera de la tarjeta: Usuario + Acción */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {log.usuario?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {log.usuario?.name || 'Usuario desconocido'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.usuario?.email || ''}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getActionColor(log.accion)}`}>
                    {log.accion}
                  </span>
                </div>

                {/* Descripción / Detalle */}
                <div className="p-3 bg-muted/40 rounded-xl border border-muted/60">
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed italic">
                    "{log.descripcion}"
                  </p>
                </div>

                {/* Pie: Entidad afectada + Fecha y hora */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-muted/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Entidad:</span>
                    <span className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[11px] font-semibold border border-primary/10">
                      {log.entidad}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground shrink-0">
                    <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                    <span>{format(new Date(log.createdAt), 'dd MMM, HH:mm', { locale: es })}</span>
                  </div>
                </div>
              </div>
            )}
            pagination={meta ? {
              currentPage: page,
              totalPages: meta.lastPage,
              pageSize: limit,
              totalItems: meta.total,
              onPageChange: setPage,
              onPageSizeChange: setLimit
            } : undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditoriaPage;
