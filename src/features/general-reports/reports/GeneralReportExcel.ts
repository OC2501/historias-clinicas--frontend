import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import type {
  DashboardSummary,
  GerenciaDistribution,
  PatientDemographics,
  TopDiagnosis,
  AppointmentStats,
  SpecialtyDistribution,
  ConsultationTrend,
} from '../types/reports.types';
import type { Consulta } from '@/features/consultas/types/consultas.type';
import { TIPO_CONSULTA_LABELS } from '@/features/consultas/types/consultas.type';
import { getReposoStatus } from '@/features/consultas/utils/reposoUtils';
import { Gender } from '@/types/enums';
import { safeFormat } from '@/lib/utils';
import {
  generateHorizontalBarChartImage,
  generateGroupedBarChartImage,
  generateDoughnutChartImage,
  generateLineTrendChartImage,
} from './excelChartHelpers';

export interface GeneralReportExcelData {
  summary?: DashboardSummary;
  gerencias?: GerenciaDistribution[];
  demographics?: PatientDemographics;
  diagnoses?: TopDiagnosis[];
  appointments?: AppointmentStats;
  specialties?: SpecialtyDistribution[];
  trends?: ConsultationTrend[];
  consultas?: Consulta[];
  timeframe?: string;
  dateRange?: DateRange;
}

const TIMEFRAME_LABELS: Record<string, string> = {
  '1w': 'Semana Actual (Últimos 7 Días)',
  '1m': 'Último Mes (30 Días)',
  '3m': 'Último Trimestre (3 Meses)',
  '6m': 'Semestre (Ene - Jun)',
  '9m': 'Primeros 9 Meses (Ene - Sep)',
  '1y': 'Año Completo (Ene - Dic)',
  'custom': 'Período Personalizado',
};

export const exportGeneralReportToExcel = async (
  data: GeneralReportExcelData,
  fileName: string = `Reporte_Inteligencia_Medica_Hidroven_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Historias Clínicas Hidroven';
  workbook.lastModifiedBy = 'Servicio Médico Ocupacional';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ══════════════════════════════════════════════════════════
  // PALETA DE COLORES CORPORATIVOS
  // ══════════════════════════════════════════════════════════
  const colors = {
    navyBlue: '002060',
    primaryBlue: '1E3A8A',
    accentCyan: '0EA5E9',
    accentIndigo: '4F46E5',
    successGreen: '10B981',
    alertAmber: 'F59E0B',
    dangerRed: 'EF4444',
    headerBg: '002060',
    subHeaderBg: '0284C7',
    kpiTitleBg: 'F1F5F9',
    zebraBg: 'F8FAFC',
    borderLight: 'CBD5E1',
    borderDark: '94A3B8',
    textMain: '0F172A',
    textMuted: '64748B',
    white: 'FFFFFF',
  };

  const periodTitle = TIMEFRAME_LABELS[data.timeframe || '1w'] || data.timeframe || 'Últimos 7 Días';
  const genDateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: colors.borderLight } },
    bottom: { style: 'thin', color: { argb: colors.borderLight } },
    left: { style: 'thin', color: { argb: colors.borderLight } },
    right: { style: 'thin', color: { argb: colors.borderLight } },
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: colors.navyBlue } },
    bottom: { style: 'medium', color: { argb: colors.navyBlue } },
    left: { style: 'thin', color: { argb: colors.borderLight } },
    right: { style: 'thin', color: { argb: colors.borderLight } },
  };

  // ══════════════════════════════════════════════════════════
  // 📊 HOJA 1: RESUMEN EJECUTIVO Y KPIS
  // ══════════════════════════════════════════════════════════
  const wsSummary = workbook.addWorksheet('Resumen Ejecutivo', {
    views: [{ showGridLines: true }],
  });

  wsSummary.columns = [
    { key: 'colA', width: 34 },
    { key: 'colB', width: 18 },
    { key: 'colC', width: 34 },
    { key: 'colD', width: 18 },
    { key: 'colE', width: 4 },
    { key: 'colF', width: 30 },
    { key: 'colG', width: 18 },
  ];

  // Banner Principal
  wsSummary.mergeCells('A1:G1');
  const mainHeader = wsSummary.getCell('A1');
  mainHeader.value = 'HIDROVEN-FALCÓN';
  mainHeader.style = {
    font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsSummary.getRow(1).height = 36;

  // Subbanner
  wsSummary.mergeCells('A2:G2');
  const subHeader = wsSummary.getCell('A2');
  subHeader.value = `INFORME EJECUTIVO DE INTELIGENCIA MÉDICA Y VIGILANCIA EPIDEMIOLÓGICA • PERÍODO: ${periodTitle.toUpperCase()}`;
  subHeader.style = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.subHeaderBg } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsSummary.getRow(2).height = 24;

  wsSummary.mergeCells('A3:G3');
  const infoCell = wsSummary.getCell('A3');
  infoCell.value = `DOCUMENTO OFICIAL Y CONFIDENCIAL • GENERADO EL: ${genDateStr.toUpperCase()}`;
  infoCell.style = {
    font: { name: 'Arial', size: 9, italic: true, color: { argb: colors.textMuted } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsSummary.getRow(3).height = 20;

  // Sección 1: Indicadores Clave
  wsSummary.mergeCells('A5:D5');
  wsSummary.getCell('A5').value = '1. INDICADORES CLAVE DE GESTIÓN Y AUSENTISMO (KPIS)';
  wsSummary.getCell('A5').style = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.navyBlue } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.kpiTitleBg } },
    border: headerBorder,
    alignment: { vertical: 'middle', indent: 1 },
  };
  wsSummary.getRow(5).height = 26;

  const kpiData = [
    ['Total Pacientes Registrados Activos', data.summary?.totalPatients ?? 0, 'Total Atenciones Clínicas', data.summary?.totalConsultations ?? 0],
    ['Trabajadores Titulares', data.summary?.titularesCount ?? 0, 'Consultas y Chequeos Diarios', data.summary?.totalConsultasDirectas ?? 0],
    ['Cargas Familiares (Beneficiarios)', data.summary?.beneficiariosCount ?? 0, 'Notas Médicas de Evolución', data.summary?.totalNotes ?? 0],
    ['Historias Clínicas Creadas', data.summary?.totalHistories ?? 0, 'Reposos Médicos Emitidos', data.summary?.totalReposos ?? 0],
    ['Personal de Reposo Hoy (Activos)', data.summary?.repososActivosHoy ?? 0, 'Días de Reposo Otorgados', data.summary?.totalDiasReposo ?? 0],
    ['Médicos en Actividad', data.summary?.activeDoctors ?? 0, 'Total Citas Programadas', data.summary?.totalAppointments ?? 0],
  ];

  kpiData.forEach((rowVals, idx) => {
    const rowNum = 6 + idx;
    const r = wsSummary.getRow(rowNum);
    r.values = [rowVals[0], rowVals[1], rowVals[2], rowVals[3]];
    r.height = 22;

    const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;

    wsSummary.getCell(`A${rowNum}`).style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
      alignment: { vertical: 'middle', indent: 1 },
    };

    wsSummary.getCell(`B${rowNum}`).style = {
      font: { name: 'Arial Black', size: 10, color: { argb: idx === 4 ? colors.dangerRed : colors.navyBlue } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
      alignment: { horizontal: 'center', vertical: 'middle' },
    };

    wsSummary.getCell(`C${rowNum}`).style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
      alignment: { vertical: 'middle', indent: 1 },
    };

    wsSummary.getCell(`D${rowNum}`).style = {
      font: { name: 'Arial Black', size: 10, color: { argb: colors.accentIndigo } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
      border: thinBorder,
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
  });

  // Gráficas en Hoja Resumen
  try {
    const titulares = data.summary?.titularesCount ?? 0;
    const beneficiarios = data.summary?.beneficiariosCount ?? 0;

    const popChartBase64 = generateDoughnutChartImage({
      title: 'Composición de Pacientes',
      subtitle: 'Distribución Titulares vs Cargas Familiares',
      items: [
        { label: 'Titulares', value: titulares, color: '#4F46E5' },
        { label: 'Beneficiarios', value: beneficiarios, color: '#0EA5E9' },
      ],
      centerText: (titulares + beneficiarios).toLocaleString(),
      centerSubtext: 'Pacientes',
      width: 480,
      height: 260,
    });

    const popImgId = workbook.addImage({ base64: popChartBase64, extension: 'png' });
    wsSummary.addImage(popImgId, {
      tl: { col: 0, row: 13 },
      ext: { width: 440, height: 240 },
    });
  } catch (err) {
    console.error('Error generating summary chart:', err);
  }

  if (data.specialties && data.specialties.length > 0) {
    try {
      const specItems = data.specialties.slice(0, 8).map(s => ({
        label: s.specialty || 'General',
        value: Number(s.count) || 0,
      }));

      const specChartBase64 = generateHorizontalBarChartImage({
        title: 'Distribución por Especialidad Médica',
        subtitle: 'Atenciones acumuladas según servicio médico',
        items: specItems,
        width: 520,
        height: 260,
      });

      const specImgId = workbook.addImage({ base64: specChartBase64, extension: 'png' });
      wsSummary.addImage(specImgId, {
        tl: { col: 4.8, row: 4.5 },
        ext: { width: 460, height: 240 },
      });
    } catch (err) {
      console.error('Error generating specialties chart:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 🏢 HOJA 2: ATENCIONES POR GERENCIA
  // ══════════════════════════════════════════════════════════
  if (data.gerencias && data.gerencias.length > 0) {
    const wsGerencias = workbook.addWorksheet('Atenciones por Gerencia', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
    });

    wsGerencias.columns = [
      { key: 'gerencia', width: 38 },
      { key: 'consultas', width: 16 },
      { key: 'reposos', width: 16 },
      { key: 'repososActivos', width: 18 },
      { key: 'dias', width: 20 },
      { key: 'pctConsultas', width: 18 },
      { key: 'tasaReposo', width: 18 },
    ];

    wsGerencias.mergeCells('A1:G1');
    const gTitle = wsGerencias.getCell('A1');
    gTitle.value = 'DISTRIBUCIÓN DE ATENCIONES MÉDICAS Y REPOSOS POR GERENCIA / SEDE';
    gTitle.style = {
      font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsGerencias.getRow(1).height = 32;

    wsGerencias.mergeCells('A2:G2');
    const gSub = wsGerencias.getCell('A2');
    gSub.value = `SERVICIO MÉDICO OCUPACIONAL • PERÍODO: ${periodTitle.toUpperCase()}`;
    gSub.style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accentCyan } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsGerencias.getRow(2).height = 22;

    const headers = [
      'Gerencia / Departamento',
      'Total Consultas',
      'Reposos Totales',
      'De Reposo Hoy',
      'Días de Reposo',
      '% Incidencia',
      'Tasa Reposo (%)',
    ];

    const hRow = wsGerencias.getRow(4);
    hRow.values = headers;
    hRow.height = 26;
    headers.forEach((_, colIdx) => {
      const cell = hRow.getCell(colIdx + 1);
      cell.style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: headerBorder,
        alignment: { horizontal: colIdx === 0 ? 'left' : 'center', vertical: 'middle' },
      };
    });

    const totalConsultasSum = data.gerencias.reduce((sum, g) => sum + (g.totalConsultas || 0), 0) || 1;
    const startDataRow = 5;

    data.gerencias.forEach((g, idx) => {
      const rowIdx = startDataRow + idx;
      const pctConsultas = (g.totalConsultas / totalConsultasSum);
      const tasaReposo = g.totalConsultas > 0 ? (g.totalReposos / g.totalConsultas) : 0;

      const r = wsGerencias.getRow(rowIdx);
      r.values = [
        g.gerencia || 'No Especificada',
        g.totalConsultas,
        g.totalReposos,
        g.repososActivos || 0,
        g.totalDiasReposo,
        pctConsultas,
        tasaReposo,
      ];
      r.height = 20;

      const isEven = idx % 2 === 0;
      const bg = isEven ? colors.white : colors.zebraBg;

      r.getCell(1).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(2).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(3).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.alertAmber } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(4).style = {
        font: { name: 'Arial Black', size: 9.5, color: { argb: colors.dangerRed } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(5).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(6).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(7).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };
    });

    // Fila Totales
    const lastDataRow = startDataRow + data.gerencias.length - 1;
    const totalRowIdx = lastDataRow + 1;
    const totalRow = wsGerencias.getRow(totalRowIdx);
    totalRow.height = 24;

    totalRow.getCell(1).value = 'TOTAL GENERAL';
    totalRow.getCell(2).value = { formula: `SUM(B${startDataRow}:B${lastDataRow})` };
    totalRow.getCell(3).value = { formula: `SUM(C${startDataRow}:C${lastDataRow})` };
    totalRow.getCell(4).value = { formula: `SUM(D${startDataRow}:D${lastDataRow})` };
    totalRow.getCell(5).value = { formula: `SUM(E${startDataRow}:E${lastDataRow})` };
    totalRow.getCell(6).value = { formula: `SUM(F${startDataRow}:F${lastDataRow})` };
    totalRow.getCell(7).value = { formula: `AVERAGE(G${startDataRow}:G${lastDataRow})` };

    for (let c = 1; c <= 7; c++) {
      const cell = totalRow.getCell(c);
      cell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.kpiTitleBg } },
        border: {
          top: { style: 'thin', color: { argb: colors.borderDark } },
          bottom: { style: 'double', color: { argb: colors.navyBlue } },
          left: { style: 'thin', color: { argb: colors.borderLight } },
          right: { style: 'thin', color: { argb: colors.borderLight } },
        },
        numFmt: c === 6 || c === 7 ? '0.0%' : '#,##0',
        alignment: { horizontal: c === 1 ? 'left' : 'center', vertical: 'middle', indent: c === 1 ? 1 : 0 },
      };
    }

    // Gráfica de Gerencias
    try {
      const topGerencias = data.gerencias.slice(0, 7);
      const gerChartBase64 = generateGroupedBarChartImage({
        title: 'Comparativa de Consultas vs Reposos por Gerencia',
        subtitle: 'Atenciones médicas registradas por cada departamento',
        labels: topGerencias.map(g => g.gerencia || 'Sede'),
        datasets: [
          { name: 'Consultas', values: topGerencias.map(g => g.totalConsultas), color: '#4F46E5' },
          { name: 'Reposos Médicos', values: topGerencias.map(g => g.totalReposos), color: '#EF4444' },
        ],
        width: 650,
        height: 320,
      });

      const gerImgId = workbook.addImage({ base64: gerChartBase64, extension: 'png' });
      wsGerencias.addImage(gerImgId, {
        tl: { col: 0, row: totalRowIdx + 2 },
        ext: { width: 620, height: 300 },
      });
    } catch (err) {
      console.error('Error generating gerencias chart:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 🩺 HOJA 3: TOP MORBILIDAD (VIGILANCIA EPIDEMIOLÓGICA DETALLADA)
  // ══════════════════════════════════════════════════════════
  if (data.diagnoses && data.diagnoses.length > 0) {
    const wsDiag = workbook.addWorksheet('Top Morbilidad', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
    });

    wsDiag.columns = [
      { key: 'rank', width: 8 },
      { key: 'diag', width: 38 },
      { key: 'cat', width: 28 },
      { key: 'casos', width: 16 },
      { key: 'pct', width: 16 },
      { key: 'reposos', width: 18 },
      { key: 'dias', width: 18 },
      { key: 'nivel', width: 16 },
    ];

    wsDiag.mergeCells('A1:H1');
    wsDiag.getCell('A1').value = 'MORBILIDAD EPIDEMIOLÓGICA - PATOLOGÍAS, DIAGNÓSTICOS Y REPOSOS ASOCIADOS';
    wsDiag.getCell('A1').style = {
      font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsDiag.getRow(1).height = 32;

    wsDiag.mergeCells('A2:H2');
    wsDiag.getCell('A2').value = `VIGILANCIA EPIDEMIOLÓGICA Y AUSENTISMO • PERÍODO: ${periodTitle.toUpperCase()}`;
    wsDiag.getCell('A2').style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accentCyan } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsDiag.getRow(2).height = 22;

    const dHeaders = [
      '#',
      'Diagnóstico / Patología',
      'Categoría Clínica / Sistema',
      'Casos Atendidos',
      '% del Total',
      'Reposos Concedidos',
      'Días Totales',
      'Incidencia',
    ];
    const dHeaderRow = wsDiag.getRow(4);
    dHeaderRow.values = dHeaders;
    dHeaderRow.height = 26;

    dHeaders.forEach((_, colIdx) => {
      const cell = dHeaderRow.getCell(colIdx + 1);
      cell.style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: headerBorder,
        alignment: { horizontal: colIdx === 1 || colIdx === 2 ? 'left' : 'center', vertical: 'middle' },
      };
    });

    const totalCasos = data.diagnoses.reduce((sum, d) => sum + (d.count || 0), 0) || 1;
    const startDataRow = 5;

    data.diagnoses.forEach((d, idx) => {
      const rowIdx = startDataRow + idx;
      const pct = d.count / totalCasos;
      const nivel = idx < 3 ? 'Alta' : idx < 7 ? 'Moderada' : 'Frecuente';

      const r = wsDiag.getRow(rowIdx);
      r.values = [
        idx + 1,
        d.name || 'Sin Diagnóstico',
        d.category || 'Medicina General',
        d.count,
        pct,
        d.repososCount || 0,
        d.totalDiasReposo || 0,
        nivel,
      ];
      r.height = 20;

      const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;

      r.getCell(1).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(2).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(3).style = {
        font: { name: 'Arial', size: 9.5, italic: true, color: { argb: colors.accentIndigo } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(4).style = {
        font: { name: 'Arial Black', size: 9.5, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(5).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(6).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.dangerRed } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(7).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.dangerRed } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(8).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: idx < 3 ? colors.dangerRed : colors.accentIndigo } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { horizontal: 'center', vertical: 'middle' },
      };
    });

    // Fila Total
    const lastDataRow = startDataRow + data.diagnoses.length - 1;
    const totalRowIdx = lastDataRow + 1;
    const totalRow = wsDiag.getRow(totalRowIdx);
    totalRow.height = 24;

    totalRow.getCell(1).value = '';
    totalRow.getCell(2).value = 'TOTAL GENERAL';
    totalRow.getCell(3).value = '';
    totalRow.getCell(4).value = { formula: `SUM(D${startDataRow}:D${lastDataRow})` };
    totalRow.getCell(5).value = { formula: `SUM(E${startDataRow}:E${lastDataRow})` };
    totalRow.getCell(6).value = { formula: `SUM(F${startDataRow}:F${lastDataRow})` };
    totalRow.getCell(7).value = { formula: `SUM(G${startDataRow}:G${lastDataRow})` };
    totalRow.getCell(8).value = '';

    for (let c = 1; c <= 8; c++) {
      const cell = totalRow.getCell(c);
      cell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.kpiTitleBg } },
        border: {
          top: { style: 'thin', color: { argb: colors.borderDark } },
          bottom: { style: 'double', color: { argb: colors.navyBlue } },
          left: { style: 'thin', color: { argb: colors.borderLight } },
          right: { style: 'thin', color: { argb: colors.borderLight } },
        },
        numFmt: c === 5 ? '0.0%' : '#,##0',
        alignment: { horizontal: c === 2 ? 'left' : 'center', vertical: 'middle', indent: c === 2 ? 1 : 0 },
      };
    }

    // Gráfica de Morbilidad
    try {
      const topItems = data.diagnoses.slice(0, 8).map(d => ({
        label: d.name,
        value: d.count,
        color: '#4F46E5',
      }));

      const diagChartBase64 = generateHorizontalBarChartImage({
        title: 'Top Patologías Más Frecuentes',
        subtitle: 'Ranking de diagnósticos atendidos en el servicio médico',
        items: topItems,
        width: 650,
        height: 320,
      });

      const diagImgId = workbook.addImage({ base64: diagChartBase64, extension: 'png' });
      wsDiag.addImage(diagImgId, {
        tl: { col: 0, row: totalRowIdx + 2 },
        ext: { width: 620, height: 300 },
      });
    } catch (err) {
      console.error('Error generating diagnosis chart:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 📋 HOJA 4: DIARIO DE CHEQUEOS Y CONSULTAS
  // ══════════════════════════════════════════════════════════
  if (data.consultas && data.consultas.length > 0) {
    const wsConsultas = workbook.addWorksheet('Diario de Chequeos', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
    });

    wsConsultas.columns = [
      { key: 'no', width: 6 },
      { key: 'fecha', width: 14 },
      { key: 'hora', width: 12 },
      { key: 'paciente', width: 28 },
      { key: 'cedula', width: 16 },
      { key: 'genero', width: 12 },
      { key: 'gerencia', width: 24 },
      { key: 'tipo', width: 20 },
      { key: 'pa', width: 12 },
      { key: 'fc', width: 10 },
      { key: 'temp', width: 10 },
      { key: 'imc', width: 10 },
      { key: 'diagnostico', width: 34 },
      { key: 'medico', width: 24 },
      { key: 'reposo', width: 20 },
    ];

    wsConsultas.mergeCells('A1:O1');
    const cTitle = wsConsultas.getCell('A1');
    cTitle.value = 'REGISTRO DIARIO DE CHEQUEOS MÉDICOS, TRIAJES Y CONSULTAS CLÍNICAS';
    cTitle.style = {
      font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsConsultas.getRow(1).height = 32;

    wsConsultas.mergeCells('A2:O2');
    const cSub = wsConsultas.getCell('A2');
    cSub.value = `LIBRO DE REGISTRO CLÍNICO • PERÍODO: ${periodTitle.toUpperCase()} • TOTAL: ${data.consultas.length} ATENCIONES`;
    cSub.style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accentCyan } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsConsultas.getRow(2).height = 22;

    const cHeaders = [
      'N°',
      'Fecha',
      'Hora',
      'Paciente',
      'Cédula',
      'Género',
      'Gerencia / Sede',
      'Tipo de Atención',
      'P.A.',
      'F.C.',
      'Temp.',
      'IMC',
      'Diagnóstico Emitido',
      'Médico / Evaluador',
      'Reposo / Estado',
    ];

    const cHeaderRow = wsConsultas.getRow(4);
    cHeaderRow.values = cHeaders;
    cHeaderRow.height = 26;

    cHeaders.forEach((_, colIdx) => {
      const cell = cHeaderRow.getCell(colIdx + 1);
      cell.style = {
        font: { name: 'Arial', size: 9, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: headerBorder,
        alignment: { horizontal: colIdx === 3 || colIdx === 12 ? 'left' : 'center', vertical: 'middle' },
      };
    });

    data.consultas.forEach((c, idx) => {
      const rowIdx = 5 + idx;
      const patientName = `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.trim();
      const doctorName = c.doctor?.user?.name
        ? `Dr(a). ${c.doctor.user.name}`
        : c.nurse?.name
        ? `${c.nurse.name} (Enfermería)`
        : 'No asignado';
      const reposoInfo = getReposoStatus(c);

      let reposoText = 'Sin reposo';
      if (c.reposoMedico) {
        reposoText = `${reposoInfo.badgeLabel} (${c.diasReposo || 1}d)`;
      }

      const r = wsConsultas.getRow(rowIdx);
      r.values = [
        idx + 1,
        safeFormat(c.fecha, 'dd/MM/yyyy', '—'),
        c.hora || '—',
        patientName || 'Paciente Anónimo',
        c.patient?.identificationNumber || (c.patient?.patientType === 'BENEFICIARIO' ? 'Menor S/C' : '—'),
        c.patient?.gender === Gender.MALE ? 'Masc' : c.patient?.gender === Gender.FEMALE ? 'Fem' : c.patient?.gender || '—',
        c.patient?.gerencia || c.patient?.titular?.gerencia || 'No asignada',
        TIPO_CONSULTA_LABELS[c.tipoConsulta] || c.tipoConsulta,
        c.presionArterial || '—',
        c.frecuenciaCardiaca ? `${c.frecuenciaCardiaca} bpm` : '—',
        c.temperatura ? `${c.temperatura} °C` : '—',
        c.imc || '—',
        c.diagnostico || c.motivoConsulta || 'Consulta General',
        doctorName,
        reposoText,
      ];
      r.height = 20;

      const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;

      for (let col = 1; col <= 15; col++) {
        const cell = r.getCell(col);
        cell.style = {
          font: { name: 'Arial', size: 9, color: { argb: colors.textMain } },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
          border: thinBorder,
          alignment: {
            horizontal: col === 4 || col === 13 ? 'left' : 'center',
            vertical: 'middle',
            indent: col === 4 || col === 13 ? 1 : 0,
          },
        };

        if (col === 15 && c.reposoMedico) {
          cell.font = {
            name: 'Arial',
            size: 9,
            bold: true,
            color: { argb: reposoInfo.status === 'ACTIVE' ? colors.dangerRed : colors.alertAmber },
          };
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 👥 HOJA 5: DEMOGRAFÍA DE PACIENTES
  // ══════════════════════════════════════════════════════════
  if (data.demographics) {
    const wsDemo = workbook.addWorksheet('Demografía', {
      views: [{ showGridLines: true }],
    });

    wsDemo.columns = [
      { key: 'colA', width: 28 },
      { key: 'colB', width: 16 },
      { key: 'colC', width: 18 },
      { key: 'colD', width: 6 },
      { key: 'colE', width: 28 },
      { key: 'colF', width: 16 },
      { key: 'colG', width: 18 },
    ];

    wsDemo.mergeCells('A1:G1');
    wsDemo.getCell('A1').value = 'PERFIL DEMOGRÁFICO DE LA POBLACIÓN ATENDIDA';
    wsDemo.getCell('A1').style = {
      font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsDemo.getRow(1).height = 32;

    wsDemo.mergeCells('A2:G2');
    wsDemo.getCell('A2').value = `ANÁLISIS POR GÉNERO Y GRUPOS ETARIOS • PERÍODO: ${periodTitle.toUpperCase()}`;
    wsDemo.getCell('A2').style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accentCyan } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsDemo.getRow(2).height = 22;

    // Tabla 1: Género
    wsDemo.mergeCells('A4:C4');
    wsDemo.getCell('A4').value = '1. DISTRIBUCIÓN POR GÉNERO';
    wsDemo.getCell('A4').style = {
      font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.navyBlue } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.kpiTitleBg } },
      border: headerBorder,
      alignment: { vertical: 'middle', indent: 1 },
    };
    wsDemo.getRow(4).height = 24;

    const gRowHead = wsDemo.getRow(5);
    gRowHead.values = ['Género', 'Pacientes', '% del Total'];
    ['A5', 'B5', 'C5'].forEach((cellRef, i) => {
      wsDemo.getCell(cellRef).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: thinBorder,
        alignment: { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle', indent: i === 0 ? 1 : 0 },
      };
    });

    const mCount = data.demographics.gender?.male ?? 0;
    const fCount = data.demographics.gender?.female ?? 0;
    const oCount = data.demographics.gender?.other ?? 0;
    const totalGender = (mCount + fCount + oCount) || 1;

    const genderRows = [
      ['Masculino', mCount, mCount / totalGender],
      ['Femenino', fCount, fCount / totalGender],
      ['Otro', oCount, oCount / totalGender],
    ];

    genderRows.forEach((vals, i) => {
      const rowNum = 6 + i;
      const r = wsDemo.getRow(rowNum);
      r.values = vals;
      r.height = 20;
      const bg = i % 2 === 0 ? colors.white : colors.zebraBg;

      r.getCell(1).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(2).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(3).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };
    });

    // Tabla 2: Rangos Etarios
    wsDemo.mergeCells('E4:G4');
    wsDemo.getCell('E4').value = '2. DISTRIBUCIÓN POR RANGOS DE EDAD';
    wsDemo.getCell('E4').style = {
      font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.navyBlue } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.kpiTitleBg } },
      border: headerBorder,
      alignment: { vertical: 'middle', indent: 1 },
    };

    const aRowHead = wsDemo.getRow(5);
    aRowHead.getCell(5).value = 'Grupo de Edad';
    aRowHead.getCell(6).value = 'Pacientes';
    aRowHead.getCell(7).value = '% del Total';

    ['E5', 'F5', 'G5'].forEach((cellRef, i) => {
      wsDemo.getCell(cellRef).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: thinBorder,
        alignment: { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle', indent: i === 0 ? 1 : 0 },
      };
    });

    const ageRanges = data.demographics.ageRanges || { '0-12': 0, '13-18': 0, '19-60': 0, '60+': 0 };
    const ageLabelsMap: Record<string, string> = {
      '0-12': '0 - 12 años (Pediátrico)',
      '13-18': '13 - 18 años (Juvenil)',
      '19-60': '19 - 60 años (Adulto / Laboral)',
      '60+': '60+ años (Tercera Edad)',
    };

    const totalAge = Object.values(ageRanges).reduce((s, v) => s + (Number(v) || 0), 0) || 1;

    Object.entries(ageRanges).forEach(([k, val], i) => {
      const rowNum = 6 + i;
      const numVal = Number(val) || 0;
      const r = wsDemo.getRow(rowNum);
      r.getCell(5).value = ageLabelsMap[k] || k;
      r.getCell(6).value = numVal;
      r.getCell(7).value = numVal / totalAge;
      r.height = 20;

      const bg = i % 2 === 0 ? colors.white : colors.zebraBg;

      r.getCell(5).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(6).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(7).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };
    });

    // Gráficas Demográficas
    try {
      const genderChartBase64 = generateDoughnutChartImage({
        title: 'Distribución por Género',
        subtitle: 'Proporción masculina y femenina',
        items: [
          { label: 'Masculino', value: mCount, color: '#3B82F6' },
          { label: 'Femenino', value: fCount, color: '#EC4899' },
          ...(oCount > 0 ? [{ label: 'Otro', value: oCount, color: '#8B5CF6' }] : []),
        ],
        centerText: (mCount + fCount + oCount).toLocaleString(),
        centerSubtext: 'Total',
        width: 440,
        height: 250,
      });

      const gImgId = workbook.addImage({ base64: genderChartBase64, extension: 'png' });
      wsDemo.addImage(gImgId, {
        tl: { col: 0, row: 11 },
        ext: { width: 400, height: 230 },
      });

      const ageItems = Object.entries(ageRanges).map(([k, val]) => ({
        label: k,
        value: Number(val) || 0,
        color: '#0EA5E9',
      }));

      const ageChartBase64 = generateHorizontalBarChartImage({
        title: 'Población por Grupos Etarios',
        subtitle: 'Distribución en rangos de edad',
        items: ageItems,
        width: 460,
        height: 250,
      });

      const aImgId = workbook.addImage({ base64: ageChartBase64, extension: 'png' });
      wsDemo.addImage(aImgId, {
        tl: { col: 4, row: 11 },
        ext: { width: 420, height: 230 },
      });
    } catch (err) {
      console.error('Error generating demographics charts:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 📈 HOJA 6: TENDENCIA TEMPORAL DE CONSULTAS
  // ══════════════════════════════════════════════════════════
  if (data.trends && data.trends.length > 0) {
    const wsTrends = workbook.addWorksheet('Tendencia Temporal', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
    });

    wsTrends.columns = [
      { key: 'fecha', width: 22 },
      { key: 'consultas', width: 18 },
      { key: 'pct', width: 18 },
    ];

    wsTrends.mergeCells('A1:C1');
    wsTrends.getCell('A1').value = 'EVOLUCIÓN TEMPORAL DE ATENCIONES CLÍNICAS';
    wsTrends.getCell('A1').style = {
      font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsTrends.getRow(1).height = 32;

    wsTrends.mergeCells('A2:C2');
    wsTrends.getCell('A2').value = `HISTÓRICO Y TENDENCIAS • PERÍODO: ${periodTitle.toUpperCase()}`;
    wsTrends.getCell('A2').style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accentCyan } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsTrends.getRow(2).height = 22;

    const tHeaders = ['Fecha / Período', 'Consultas Registradas', '% del Total'];
    const tHeaderRow = wsTrends.getRow(4);
    tHeaderRow.values = tHeaders;
    tHeaderRow.height = 26;

    tHeaders.forEach((_, colIdx) => {
      const cell = tHeaderRow.getCell(colIdx + 1);
      cell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: headerBorder,
        alignment: { horizontal: colIdx === 0 ? 'left' : 'center', vertical: 'middle' },
      };
    });

    const totalTrends = data.trends.reduce((s, t) => s + Number(t.count || 0), 0) || 1;
    const startDataRow = 5;

    data.trends.forEach((t, idx) => {
      const rowIdx = startDataRow + idx;
      const countVal = Number(t.count) || 0;
      const r = wsTrends.getRow(rowIdx);
      r.values = [t.date, countVal, countVal / totalTrends];
      r.height = 20;

      const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;

      r.getCell(1).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(2).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(3).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };
    });

    // Gráfica de Tendencia
    try {
      const trendChartBase64 = generateLineTrendChartImage({
        title: 'Tendencia Cronológica de Consultas',
        subtitle: `Comportamiento en ${periodTitle}`,
        labels: data.trends.map(t => t.date),
        data: data.trends.map(t => Number(t.count) || 0),
        color: '#6366F1',
        width: 650,
        height: 320,
      });

      const trendImgId = workbook.addImage({ base64: trendChartBase64, extension: 'png' });
      wsTrends.addImage(trendImgId, {
        tl: { col: 3.5, row: 3.5 },
        ext: { width: 620, height: 300 },
      });
    } catch (err) {
      console.error('Error generating trend chart:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  // 📅 HOJA 7: GESTIÓN DE CITAS
  // ══════════════════════════════════════════════════════════
  if (data.appointments) {
    const wsApp = workbook.addWorksheet('Gestión de Citas', {
      views: [{ showGridLines: true }],
    });

    wsApp.columns = [
      { key: 'colA', width: 26 },
      { key: 'colB', width: 16 },
      { key: 'colC', width: 18 },
      { key: 'colD', width: 6 },
      { key: 'colE', width: 24 },
      { key: 'colF', width: 16 },
    ];

    wsApp.mergeCells('A1:F1');
    wsApp.getCell('A1').value = 'GESTIÓN Y ASISTENCIA DE CITAS MÉDICAS';
    wsApp.getCell('A1').style = {
      font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsApp.getRow(1).height = 32;

    wsApp.mergeCells('A2:F2');
    wsApp.getCell('A2').value = `ESTADÍSTICAS OPERATIVAS DE CITAS • PERÍODO: ${periodTitle.toUpperCase()}`;
    wsApp.getCell('A2').style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accentCyan } },
      alignment: { horizontal: 'center', vertical: 'middle' },
    };
    wsApp.getRow(2).height = 22;

    wsApp.mergeCells('A4:C4');
    wsApp.getCell('A4').value = '1. ESTADO DE CITAS AGENDADAS';
    wsApp.getCell('A4').style = {
      font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.navyBlue } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.kpiTitleBg } },
      border: headerBorder,
      alignment: { vertical: 'middle', indent: 1 },
    };

    const statusRowHead = wsApp.getRow(5);
    statusRowHead.values = ['Estado', 'Total Citas', '% del Total'];
    ['A5', 'B5', 'C5'].forEach((cellRef, i) => {
      wsApp.getCell(cellRef).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        border: thinBorder,
        alignment: { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle', indent: i === 0 ? 1 : 0 },
      };
    });

    const statusStats = data.appointments.statusStats || { SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 };
    const totalApp = data.appointments.total || (statusStats.SCHEDULED + statusStats.COMPLETED + statusStats.CANCELLED) || 1;

    const statusLabels: Record<string, { label: string; color: string }> = {
      COMPLETED: { label: 'Completadas / Asistidas', color: '#10B981' },
      SCHEDULED: { label: 'Programadas / Pendientes', color: '#0EA5E9' },
      CANCELLED: { label: 'Canceladas / No Asistidas', color: '#EF4444' },
    };

    Object.entries(statusStats).forEach(([k, count], i) => {
      const rowNum = 6 + i;
      const r = wsApp.getRow(rowNum);
      const labelObj = statusLabels[k] || { label: k, color: '#64748B' };
      r.values = [labelObj.label, count, count / totalApp];
      r.height = 20;

      const bg = i % 2 === 0 ? colors.white : colors.zebraBg;

      r.getCell(1).style = {
        font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.textMain } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { vertical: 'middle', indent: 1 },
      };

      r.getCell(2).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.navyBlue } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '#,##0',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };

      r.getCell(3).style = {
        font: { name: 'Arial', size: 9.5, color: { argb: colors.textMuted } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        numFmt: '0.0%',
        alignment: { horizontal: 'center', vertical: 'middle' },
      };
    });

    try {
      const appStatusItems = Object.entries(statusStats).map(([k, count]) => {
        const info = statusLabels[k] || { label: k, color: '#64748B' };
        return { label: info.label, value: count, color: info.color };
      });

      const appChartBase64 = generateDoughnutChartImage({
        title: 'Cumplimiento de Citas Médicas',
        subtitle: 'Proporción de citas atendidas vs canceladas',
        items: appStatusItems,
        centerText: totalApp.toLocaleString(),
        centerSubtext: 'Citas',
        width: 480,
        height: 250,
      });

      const appImgId = workbook.addImage({ base64: appChartBase64, extension: 'png' });
      wsApp.addImage(appImgId, {
        tl: { col: 0, row: 11 },
        ext: { width: 440, height: 230 },
      });
    } catch (err) {
      console.error('Error generating appointments chart:', err);
    }
  }

  // ══════════════════════════════════════════════════════════
  // GENERACIÓN Y DESCARGA DEL ARCHIVO .XLSX
  // ══════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};
