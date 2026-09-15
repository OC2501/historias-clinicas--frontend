import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { safeFormat } from '@/lib/utils';
import type { Consulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS } from '../types/consultas.type';
import { Gender, RELATIONSHIP_LABELS } from '@/types/enums';

export const exportConsultasToExcel = async (
  consultas: Consulta[],
  fileName = 'Reporte_Consultas_Hidroven',
  dateRangeText?: string
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
    subHeaderBg: '0284C7',
    lightBlue: '0EA5E9',
    accentCyan: '38BDF8',
    accentIndigo: '4F46E5',
    successGreen: '10B981',
    alertOrange: 'F59E0B',
    dangerRed: 'EF4444',
    yellow: 'FEF08A',
    grayHeader: 'F1F5F9',
    zebraBg: 'F8FAFC',
    borderLight: 'CBD5E1',
    borderDark: '94A3B8',
    textDark: '0F172A',
    textMuted: '64748B',
    white: 'FFFFFF',
  };

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

  const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
  const periodStr = dateRangeText ? ` • PERÍODO: ${dateRangeText.toUpperCase()}` : '';

  // ══════════════════════════════════════════════════════════
  // 📋 HOJA 1: REGISTRO DETALLADO DE CONSULTAS Y CHEQUEOS
  // ══════════════════════════════════════════════════════════
  const wsConsultas = workbook.addWorksheet('Diario de Chequeos', {
    views: [{ showGridLines: true }],
  });

  wsConsultas.columns = [
    { key: 'no', width: 6 },
    { key: 'fecha', width: 14 },
    { key: 'hora', width: 12 },
    { key: 'paciente', width: 30 },
    { key: 'cedula', width: 16 },
    { key: 'condicion', width: 22 },
    { key: 'titular', width: 30 },
    { key: 'genero', width: 12 },
    { key: 'gerencia', width: 26 },
    { key: 'tipo', width: 22 },
    { key: 'motivo', width: 28 },
    { key: 'signos', width: 32 },
    { key: 'diagnostico', width: 36 },
    { key: 'medico', width: 26 },
    { key: 'reposo', width: 20 },
  ];

  // Banner Principal
  wsConsultas.mergeCells('A1:O1');
  const cTitle = wsConsultas.getCell('A1');
  cTitle.value = 'HIDROVEN-FALCÓN';
  cTitle.style = {
    font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsConsultas.getRow(1).height = 36;

  // Subbanner
  wsConsultas.mergeCells('A2:O2');
  const cSub = wsConsultas.getCell('A2');
  cSub.value = `LIBRO DE REGISTRO DIARIO DE CHEQUEOS Y CONSULTAS CLÍNICAS${periodStr}`;
  cSub.style = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.subHeaderBg } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsConsultas.getRow(2).height = 24;

  // Documento Confidencial
  wsConsultas.mergeCells('A3:O3');
  const cConf = wsConsultas.getCell('A3');
  cConf.value = `DOCUMENTO OFICIAL Y CONFIDENCIAL • SERVICIO MÉDICO OCUPACIONAL • EMISIÓN: ${dateStr.toUpperCase()}`;
  cConf.style = {
    font: { name: 'Arial', size: 9, bold: true, color: { argb: '713F12' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: { bottom: { style: 'thick', color: { argb: colors.navyBlue } } },
  };
  wsConsultas.getRow(3).height = 22;

  // KPIs de la hoja de consultas
  const total = consultas.length;
  const totalTitulares = consultas.filter((c) => !c.patient?.patientType || c.patient?.patientType === 'TITULAR').length;
  const totalBeneficiarios = consultas.filter((c) => c.patient?.patientType === 'BENEFICIARIO').length;
  const totalReposos = consultas.filter((c) => c.reposoMedico).length;
  const totalDiasReposo = consultas.reduce((acc, c) => acc + (c.reposoMedico ? (c.diasReposo || 1) : 0), 0);
  const cedulasUnicas = new Set(consultas.map((c) => c.patient?.identificationNumber).filter(Boolean)).size;

  const pctTit = total > 0 ? Math.round((totalTitulares / total) * 100) : 0;
  const pctBen = total > 0 ? Math.round((totalBeneficiarios / total) * 100) : 0;

  const kpisConsultas = [
    { label: 'TOTAL ATENCIONES', val: `${total} consultas`, color: colors.primaryBlue },
    { label: 'TRABAJADORES TITULARES', val: `${totalTitulares} (${pctTit}%)`, color: '0284C7' },
    { label: 'CARGA FAMILIAR (BENEFICIARIOS)', val: `${totalBeneficiarios} (${pctBen}%)`, color: colors.accentIndigo },
    { label: 'CON REPOSO / DÍAS', val: `${totalReposos} (${totalDiasReposo} días)`, color: 'DC2626' },
  ];

  const kpiCols = [
    { start: 1, end: 3 },
    { start: 4, end: 7 },
    { start: 8, end: 11 },
    { start: 12, end: 15 },
  ];

  kpisConsultas.forEach((stat, idx) => {
    const colStart = kpiCols[idx].start;
    const colEnd = kpiCols[idx].end;

    wsConsultas.mergeCells(5, colStart, 5, colEnd);
    const label = wsConsultas.getCell(5, colStart);
    label.value = stat.label;
    label.style = {
      font: { name: 'Arial', bold: true, size: 8, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    };

    wsConsultas.mergeCells(6, colStart, 6, colEnd);
    const val = wsConsultas.getCell(6, colStart);
    val.value = stat.val;
    val.style = {
      font: { name: 'Arial', bold: true, size: 11.5, color: { argb: stat.color } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraBg } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        ...thinBorder,
        bottom: { style: 'thick', color: { argb: colors.navyBlue } },
      },
    };
  });
  wsConsultas.getRow(5).height = 20;
  wsConsultas.getRow(6).height = 28;

  // Cabeceras de tabla
  const headerRow = wsConsultas.getRow(8);
  headerRow.values = [
    'N°',
    'FECHA',
    'HORA',
    'PACIENTE',
    'CÉDULA',
    'CONDICIÓN / PARENTESCO',
    'TRABAJADOR TITULAR',
    'GÉNERO',
    'GERENCIA / SEDE',
    'TIPO CONSULTA',
    'MOTIVO',
    'SIGNOS VITALES',
    'DIAGNÓSTICO EMITIDO',
    'MÉDICO / EVALUADOR',
    'REPOSO MÉDICO',
  ];
  headerRow.eachCell((cell, colNum) => {
    cell.style = {
      font: { name: 'Arial', size: 9, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
      alignment: {
        horizontal: colNum === 4 || colNum === 7 || colNum === 11 || colNum === 13 ? 'left' : 'center',
        vertical: 'middle',
        indent: colNum === 4 || colNum === 7 || colNum === 11 || colNum === 13 ? 1 : 0,
      },
      border: headerBorder,
    };
  });
  wsConsultas.getRow(8).height = 26;

  // Filas de datos
  consultas.forEach((c, index) => {
    const isBeneficiario = c.patient?.patientType === 'BENEFICIARIO';
    const relKey = c.patient?.relationship;
    const relLabel = relKey ? (RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey) : 'Familiar';

    const condicionText = isBeneficiario ? `Beneficiario (${relLabel})` : 'Trabajador Titular';

    const titularText = isBeneficiario && c.patient?.titular
      ? `${c.patient.titular.firstName} ${c.patient.titular.lastName} (C.I: ${c.patient.titular.identificationNumber || 'S/D'})`
      : isBeneficiario
      ? 'Beneficiario (Sin titular reg.)'
      : 'Titular Directo';

    const gerenciaText = c.patient?.gerencia || c.patient?.titular?.gerencia || 'No asignada';

    const cedulaText = c.patient?.identificationNumber
      ? c.patient.identificationNumber
      : isBeneficiario
      ? `Menor / S/C`
      : 'S/D';

    const vitalSigns = [
      c.presionArterial ? `PA: ${c.presionArterial}` : '',
      c.frecuenciaCardiaca ? `FC: ${c.frecuenciaCardiaca}bpm` : '',
      c.temperatura ? `T: ${c.temperatura}°C` : '',
      c.imc ? `IMC: ${c.imc}` : '',
    ]
      .filter(Boolean)
      .join(' | ') || 'N/R';

    const reposoInfo = c.reposoMedico
      ? isBeneficiario
        ? `Constancia (${c.diasReposo || 1}d)`
        : `SÍ (${c.diasReposo || 1}d)`
      : 'Sin reposo';

    const genderText =
      c.patient?.gender === Gender.MALE
        ? 'Masc'
        : c.patient?.gender === Gender.FEMALE
        ? 'Fem'
        : c.patient?.gender || '—';

    const rowNum = 9 + index;
    const r = wsConsultas.getRow(rowNum);
    r.values = [
      index + 1,
      safeFormat(c.fecha, 'dd/MM/yyyy', '—'),
      c.hora || '—',
      `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.trim() || 'Paciente Anónimo',
      cedulaText,
      condicionText,
      titularText,
      genderText,
      gerenciaText,
      TIPO_CONSULTA_LABELS[c.tipoConsulta] || c.tipoConsulta || 'Chequeo General',
      c.motivoConsulta || '—',
      vitalSigns,
      c.diagnostico || 'Evaluación Médica General',
      c.doctor?.user?.name
        ? `Dr(a). ${c.doctor.user.name}`
        : c.nurse?.name
        ? `${c.nurse.name} (Enfermería)`
        : 'No asignado',
      reposoInfo,
    ];

    const bg = index % 2 === 0 ? colors.white : colors.zebraBg;

    for (let col = 1; col <= 15; col++) {
      const cell = r.getCell(col);
      cell.style = {
        font: {
          name: 'Arial',
          size: 8.5,
          color: { argb: col === 6 && isBeneficiario ? 'B45309' : colors.textDark },
          bold: col === 6 && isBeneficiario,
        },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: {
          horizontal: col === 4 || col === 7 || col === 11 || col === 13 ? 'left' : 'center',
          vertical: 'middle',
          indent: col === 4 || col === 7 || col === 11 || col === 13 ? 1 : 0,
        },
      };
    }
    r.height = 22;
  });

  // ══════════════════════════════════════════════════════════
  // 🔬 HOJA 2: INFORME EPIDEMIOLÓGICO Y ANÁLISIS DE MORBILIDAD
  // ══════════════════════════════════════════════════════════
  const wsMorb = workbook.addWorksheet('Resumen de Morbilidad', {
    views: [{ showGridLines: true }],
  });

  wsMorb.columns = [
    { key: 'colA', width: 6 },   // N°
    { key: 'colB', width: 36 },  // Diagnóstico / Patología
    { key: 'colC', width: 14 },  // Casos Totales
    { key: 'colD', width: 14 },  // % del Total
    { key: 'colE', width: 15 },  // En Titulares
    { key: 'colF', width: 16 },  // En Beneficiarios
    { key: 'colG', width: 16 },  // Casos con Reposo
    { key: 'colH', width: 18 },  // Días Reposo Acum.
    { key: 'colI', width: 18 },  // Género Predominante
    { key: 'colJ', width: 28 },  // Gerencia con Mayor Incidencia
  ];

  // Banner Principal Hoja Morbilidad
  wsMorb.mergeCells('A1:J1');
  const mTitle = wsMorb.getCell('A1');
  mTitle.value = 'HIDROVEN-FALCÓN';
  mTitle.style = {
    font: { name: 'Arial Black', size: 12, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsMorb.getRow(1).height = 36;

  // Subbanner Morbilidad
  wsMorb.mergeCells('A2:J2');
  const mSub = wsMorb.getCell('A2');
  mSub.value = `PERFIL EPIDEMIOLÓGICO Y ANÁLISIS DE MORBILIDAD CLÍNICA${periodStr}`;
  mSub.style = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.subHeaderBg } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  wsMorb.getRow(2).height = 24;

  // Documento Confidencial
  wsMorb.mergeCells('A3:J3');
  const mConf = wsMorb.getCell('A3');
  mConf.value = `VIGILANCIA EPIDEMIOLÓGICA • DISCRIMINACIÓN TITULARES VS CARGA FAMILIAR • EMISIÓN: ${dateStr.toUpperCase()}`;
  mConf.style = {
    font: { name: 'Arial', size: 9, bold: true, color: { argb: '713F12' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: { bottom: { style: 'thick', color: { argb: colors.navyBlue } } },
  };
  wsMorb.getRow(3).height = 22;

  // Agrupación y Estadísticas de Morbilidad
  const diagMap = new Map<
    string,
    {
      casos: number;
      titularesCount: number;
      beneficiariosCount: number;
      conReposo: number;
      diasReposo: number;
      mascCount: number;
      femCount: number;
      gerencias: Record<string, number>;
    }
  >();

  let totalCasosEvaluados = 0;
  let totalRepososMorb = 0;
  let totalDiasMorb = 0;
  let totalMorbTitulares = 0;
  let totalMorbBeneficiarios = 0;

  consultas.forEach((c) => {
    const rawDiag = c.diagnostico?.trim() || c.motivoConsulta?.trim() || 'Evaluación Médica Preventiva';
    const diag = rawDiag.charAt(0).toUpperCase() + rawDiag.slice(1);

    const isBen = c.patient?.patientType === 'BENEFICIARIO';

    const current = diagMap.get(diag) || {
      casos: 0,
      titularesCount: 0,
      beneficiariosCount: 0,
      conReposo: 0,
      diasReposo: 0,
      mascCount: 0,
      femCount: 0,
      gerencias: {},
    };

    current.casos += 1;
    totalCasosEvaluados += 1;

    if (isBen) {
      current.beneficiariosCount += 1;
      totalMorbBeneficiarios += 1;
    } else {
      current.titularesCount += 1;
      totalMorbTitulares += 1;
    }

    if (c.reposoMedico) {
      current.conReposo += 1;
      totalRepososMorb += 1;
      const dias = c.diasReposo || 1;
      current.diasReposo += dias;
      totalDiasMorb += dias;
    }

    const g = c.patient?.gender;
    if (g === Gender.MALE || (g as string) === 'M') current.mascCount += 1;
    else if (g === Gender.FEMALE || (g as string) === 'F') current.femCount += 1;

    const gerencia = c.patient?.gerencia?.trim() || c.patient?.titular?.gerencia?.trim() || 'No asignada';
    current.gerencias[gerencia] = (current.gerencias[gerencia] || 0) + 1;

    diagMap.set(diag, current);
  });

  const morbidityList = Array.from(diagMap.entries())
    .map(([diagnostico, d]) => {
      let topGerencia = '—';
      let maxGCount = 0;
      Object.entries(d.gerencias).forEach(([ger, cnt]) => {
        if (cnt > maxGCount) {
          maxGCount = cnt;
          topGerencia = ger;
        }
      });

      let generoPredominante = 'Equitativo';
      if (d.mascCount > d.femCount) generoPredominante = `Masc (${d.mascCount})`;
      else if (d.femCount > d.mascCount) generoPredominante = `Fem (${d.femCount})`;
      else if (d.mascCount > 0) generoPredominante = `Mixto (${d.mascCount}M/${d.femCount}F)`;

      return {
        diagnostico,
        casos: d.casos,
        porcentaje: totalCasosEvaluados > 0 ? d.casos / totalCasosEvaluados : 0,
        titularesCount: d.titularesCount,
        beneficiariosCount: d.beneficiariosCount,
        conReposo: d.conReposo,
        diasReposo: d.diasReposo,
        generoPredominante,
        topGerencia,
      };
    })
    .sort((a, b) => b.casos - a.casos || b.diasReposo - a.diasReposo);

  // KPIs de Morbilidad
  const topDiagName = morbidityList.length > 0 ? morbidityList[0].diagnostico : 'Sin registros';
  const topDiagCases = morbidityList.length > 0 ? `${morbidityList[0].casos} casos` : '0';

  const kpisMorbilidad = [
    { label: 'PATOLOGÍAS DETECTADAS', val: `${diagMap.size} diagnósticos`, color: colors.primaryBlue },
    { label: 'PATOLOGÍA MÁS FRECUENTE', val: `${topDiagName} (${topDiagCases})`, color: '0284C7' },
    { label: 'TITULARES VS BENEFICIARIOS', val: `${totalMorbTitulares} Tit. / ${totalMorbBeneficiarios} Benef.`, color: colors.accentIndigo },
    { label: 'DÍAS TOTALES DE INCAPACIDAD', val: `${totalDiasMorb} días acumulados`, color: colors.successGreen },
  ];

  const morbKpiCols = [
    { start: 1, end: 2 },
    { start: 3, end: 5 },
    { start: 6, end: 8 },
    { start: 9, end: 10 },
  ];

  kpisMorbilidad.forEach((stat, idx) => {
    const colStart = morbKpiCols[idx].start;
    const colEnd = morbKpiCols[idx].end;

    wsMorb.mergeCells(5, colStart, 5, colEnd);
    const label = wsMorb.getCell(5, colStart);
    label.value = stat.label;
    label.style = {
      font: { name: 'Arial', bold: true, size: 8, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: thinBorder,
    };

    wsMorb.mergeCells(6, colStart, 6, colEnd);
    const val = wsMorb.getCell(6, colStart);
    val.value = stat.val;
    val.style = {
      font: { name: 'Arial', bold: true, size: 10.5, color: { argb: stat.color } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.zebraBg } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        ...thinBorder,
        bottom: { style: 'thick', color: { argb: colors.navyBlue } },
      },
    };
  });
  wsMorb.getRow(5).height = 20;
  wsMorb.getRow(6).height = 30;

  // Cabecera de la tabla de Morbilidad
  const morbHeaders = [
    'N°',
    'DIAGNÓSTICO / PATOLOGÍA REGISTRADA',
    'CASOS',
    '% DEL TOTAL',
    'EN TITULARES',
    'EN BENEFICIARIOS',
    'CASOS CON REPOSO',
    'DÍAS REPOSO ACUM.',
    'GÉNERO PREDOMINANTE',
    'GERENCIA MÁS AFECTADA',
  ];

  const mHeaderRow = wsMorb.getRow(8);
  mHeaderRow.values = morbHeaders;
  mHeaderRow.eachCell((cell, colNum) => {
    cell.style = {
      font: { name: 'Arial', size: 9, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
      alignment: {
        horizontal: colNum === 2 || colNum === 10 ? 'left' : 'center',
        vertical: 'middle',
        indent: colNum === 2 || colNum === 10 ? 1 : 0,
      },
      border: headerBorder,
    };
  });
  wsMorb.getRow(8).height = 26;

  // Filas de la tabla de Morbilidad
  let currentMorbRow = 9;
  morbidityList.forEach((m, idx) => {
    const r = wsMorb.getRow(currentMorbRow);
    r.values = [
      idx + 1,
      m.diagnostico,
      m.casos,
      m.porcentaje,
      m.titularesCount,
      m.beneficiariosCount,
      m.conReposo,
      m.diasReposo,
      m.generoPredominante,
      m.topGerencia,
    ];

    const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;

    for (let col = 1; col <= 10; col++) {
      const cell = r.getCell(col);
      cell.style = {
        font: {
          name: 'Arial',
          size: 9,
          bold: col === 2,
          color: { argb: col === 2 ? colors.navyBlue : colors.textDark },
        },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: {
          horizontal: col === 2 || col === 10 ? 'left' : 'center',
          vertical: 'middle',
          indent: col === 2 || col === 10 ? 1 : 0,
        },
      };

      if (col === 4) {
        cell.numFmt = '0.0%';
      }
    }
    r.height = 22;
    currentMorbRow++;
  });

  // Fila de TOTALES de Morbilidad
  const totalRow = wsMorb.getRow(currentMorbRow);
  totalRow.values = [
    '',
    'TOTAL GENERAL DE MORBILIDAD Y ATENCIONES',
    totalCasosEvaluados,
    totalCasosEvaluados > 0 ? 1 : 0,
    totalMorbTitulares,
    totalMorbBeneficiarios,
    totalRepososMorb,
    totalDiasMorb,
    '—',
    '—',
  ];

  for (let col = 1; col <= 10; col++) {
    const cell = totalRow.getCell(col);
    cell.style = {
      font: { name: 'Arial', size: 9.5, bold: true, color: { argb: colors.navyBlue } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } },
      border: {
        top: { style: 'thin', color: { argb: colors.borderDark } },
        bottom: { style: 'double', color: { argb: colors.navyBlue } },
        left: { style: 'thin', color: { argb: colors.borderLight } },
        right: { style: 'thin', color: { argb: colors.borderLight } },
      },
      alignment: {
        horizontal: col === 2 || col === 10 ? 'left' : 'center',
        vertical: 'middle',
        indent: col === 2 || col === 10 ? 1 : 0,
      },
    };
    if (col === 4) {
      cell.numFmt = '0.0%';
    }
  }
  totalRow.height = 26;
  currentMorbRow += 3;

  // ══════════════════════════════════════════════════════════
  // TABLA COMPLEMENTARIA 1: DESGLOSE POBLACIONAL (TITULARES VS BENEFICIARIOS)
  // ══════════════════════════════════════════════════════════
  wsMorb.mergeCells(currentMorbRow, 1, currentMorbRow, 6);
  const popTitle = wsMorb.getCell(currentMorbRow, 1);
  popTitle.value = 'DESGLOSE EPIDEMIOLÓGICO POR CONDICIÓN DE AFILIACIÓN (TITULARES Y PARENTESCO)';
  popTitle.style = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
  };
  wsMorb.getRow(currentMorbRow).height = 24;
  currentMorbRow++;

  const popHeaders = ['N°', 'CONDICIÓN / PARENTESCO', 'ATENCIONES', '% COBERTURA', 'REPOSOS', 'DÍAS REPOSO'];
  const pHeadRow = wsMorb.getRow(currentMorbRow);
  pHeadRow.values = popHeaders;
  for (let col = 1; col <= 6; col++) {
    pHeadRow.getCell(col).style = {
      font: { name: 'Arial', size: 9, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
      border: headerBorder,
      alignment: { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle', indent: col === 2 ? 1 : 0 },
    };
  }
  wsMorb.getRow(currentMorbRow).height = 24;
  currentMorbRow++;

  // Categorías de población
  const popCategories = [
    { key: 'TITULAR', label: 'Trabajadores Titulares (Personal Hidroven)' },
    { key: 'HIJO', label: 'Beneficiarios — Hijos / Hijas' },
    { key: 'CONYUGE', label: 'Beneficiarios — Cónyuges / Parejas' },
    { key: 'PADRE', label: 'Beneficiarios — Padres' },
    { key: 'MADRE', label: 'Beneficiarios — Madres' },
    { key: 'OTRO', label: 'Beneficiarios — Otros Familiares' },
  ];

  popCategories.forEach((cat, idx) => {
    let catCasos = 0;
    let catReposos = 0;
    let catDias = 0;

    consultas.forEach((c) => {
      const isBen = c.patient?.patientType === 'BENEFICIARIO';
      if (cat.key === 'TITULAR') {
        if (!isBen) {
          catCasos++;
          if (c.reposoMedico) {
            catReposos++;
            catDias += c.diasReposo || 1;
          }
        }
      } else {
        if (isBen && (c.patient?.relationship === cat.key || (!c.patient?.relationship && cat.key === 'OTRO'))) {
          catCasos++;
          if (c.reposoMedico) {
            catReposos++;
            catDias += c.diasReposo || 1;
          }
        }
      }
    });

    const r = wsMorb.getRow(currentMorbRow);
    const pct = totalCasosEvaluados > 0 ? catCasos / totalCasosEvaluados : 0;
    r.values = [idx + 1, cat.label, catCasos, pct, catReposos, catDias];

    const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;
    for (let col = 1; col <= 6; col++) {
      const cell = r.getCell(col);
      cell.style = {
        font: { name: 'Arial', size: 9, color: { argb: colors.textDark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle', indent: col === 2 ? 1 : 0 },
      };
      if (col === 4) cell.numFmt = '0.0%';
    }
    r.height = 20;
    currentMorbRow++;
  });
  currentMorbRow += 2;

  // ══════════════════════════════════════════════════════════
  // TABLA COMPLEMENTARIA 2: DISTRIBUCIÓN POR TIPO DE CONSULTA
  // ══════════════════════════════════════════════════════════
  wsMorb.mergeCells(currentMorbRow, 1, currentMorbRow, 5);
  const subTipoTitle = wsMorb.getCell(currentMorbRow, 1);
  subTipoTitle.value = 'DISTRIBUCIÓN DE ATENCIONES POR MODALIDAD O TIPO DE CONSULTA';
  subTipoTitle.style = {
    font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.navyBlue } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
  };
  wsMorb.getRow(currentMorbRow).height = 24;
  currentMorbRow++;

  const tipoHeaders = ['N°', 'TIPO DE CONSULTA / ATENCIÓN', 'CASOS REGISTRADOS', '% RELATIVO', 'REPOSOS EMITIDOS'];
  const tHeadRow = wsMorb.getRow(currentMorbRow);
  tHeadRow.values = tipoHeaders;
  for (let col = 1; col <= 5; col++) {
    tHeadRow.getCell(col).style = {
      font: { name: 'Arial', size: 9, bold: true, color: { argb: colors.white } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
      border: headerBorder,
      alignment: { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle', indent: col === 2 ? 1 : 0 },
    };
  }
  wsMorb.getRow(currentMorbRow).height = 24;
  currentMorbRow++;

  const tipoCounts: Record<string, { total: number; reposos: number }> = {};
  consultas.forEach((c) => {
    const t = c.tipoConsulta || 'OTRO';
    if (!tipoCounts[t]) tipoCounts[t] = { total: 0, reposos: 0 };
    tipoCounts[t].total += 1;
    if (c.reposoMedico) tipoCounts[t].reposos += 1;
  });

  const tipoEntries = Object.entries(tipoCounts).sort((a, b) => b[1].total - a[1].total);
  tipoEntries.forEach(([tipoKey, data], idx) => {
    const r = wsMorb.getRow(currentMorbRow);
    const label = TIPO_CONSULTA_LABELS[tipoKey as keyof typeof TIPO_CONSULTA_LABELS] || tipoKey;
    const pct = totalCasosEvaluados > 0 ? data.total / totalCasosEvaluados : 0;

    r.values = [idx + 1, label, data.total, pct, data.reposos];
    const bg = idx % 2 === 0 ? colors.white : colors.zebraBg;

    for (let col = 1; col <= 5; col++) {
      const cell = r.getCell(col);
      cell.style = {
        font: { name: 'Arial', size: 9, color: { argb: colors.textDark } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
        border: thinBorder,
        alignment: { horizontal: col === 2 ? 'left' : 'center', vertical: 'middle', indent: col === 2 ? 1 : 0 },
      };
      if (col === 4) cell.numFmt = '0.0%';
    }
    r.height = 20;
    currentMorbRow++;
  });

  // ══════════════════════════════════════════════════════════
  // DESCARGA AUTOMÁTICA
  // ══════════════════════════════════════════════════════════
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
