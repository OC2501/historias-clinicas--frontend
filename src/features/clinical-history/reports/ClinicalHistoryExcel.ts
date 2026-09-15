import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClinicalHistory } from '../types/clinical-history.types';
import { safeFormat } from '@/lib/utils';

export const exportClinicalHistoriesToExcel = async (histories: ClinicalHistory[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historiales');

    const colors = {
        primaryBlue: '002060',
        lightBlue: '00B0F0',
        yellow: 'FFFF00',
        grayHeader: 'F2F2F2',
        white: 'FFFFFF',
        textDark: '333333'
    };

    // 1. CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
        { key: 'no', width: 6 },
        { key: 'fecha', width: 15 },
        { key: 'paciente', width: 30 },
        { key: 'cedula', width: 18 },
        { key: 'especialidad', width: 25 },
        { key: 'medico', width: 30 },
        { key: 'diagnostico', width: 45 },
    ];

    // 2. ENCABEZADO INSTITUCIONAL
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    titleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(1).height = 45;

    // 3. FECHA Y CONTROL
    worksheet.mergeCells('A2:G2');
    const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    worksheet.getCell('A2').value = `REPORTE DE CONSULTAS MÉDICAS - EMITIDO: ${dateStr.toUpperCase()}`;
    worksheet.getCell('A2').style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = 'DOCUMENTO CONFIDENCIAL - HISTORIAL DE ATENCIONES';
    worksheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    worksheet.getRow(3).height = 25;

    // 4. DASHBOARD DE ALERTAS (KPIs)
    const total = histories.length;
    // Agrupamos especialidades para un KPI
    const especialidadesDistintas = Array.from(new Set(histories.map(h => h.specialty))).filter(Boolean).length;

    const stats = [
        { label: 'TOTAL ATENCIONES', val: total, color: '000000' },
        { label: 'ESPECIALIDADES ACTIVAS', val: especialidadesDistintas, color: '0066CC' },
        { label: 'REGISTROS ÚNICOS', val: total, color: '00C851' },
        { label: 'CONTROL REGISTROS', val: total, color: 'FFBB33' }
    ];

    const statCols = [
        { start: 1, end: 2 },
        { start: 3, end: 4 },
        { start: 5, end: 5 },
        { start: 6, end: 7 }
    ];

    stats.forEach((stat, idx) => {
        const colStart = statCols[idx].start;
        const colEnd = statCols[idx].end;

        // Combinar y estilar etiqueta (Fila 5)
        worksheet.mergeCells(5, colStart, 5, colEnd);
        const label = worksheet.getCell(5, colStart);
        label.value = stat.label;
        label.style = {
            font: { name: 'Arial', bold: true, size: 8, color: { argb: 'FFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thin' }
            }
        };

        // Combinar y estilar valor (Fila 6)
        worksheet.mergeCells(6, colStart, 6, colEnd);
        const val = worksheet.getCell(6, colStart);
        val.value = stat.val;
        val.style = {
            font: { name: 'Arial', bold: true, size: 12, color: { argb: stat.color } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thick', color: { argb: colors.primaryBlue } }
            }
        };
    });
    worksheet.getRow(5).height = 25;
    worksheet.getRow(6).height = 35;

    // 5. CABECERAS DE TABLA
    const headerRow = worksheet.getRow(8);
    headerRow.values = [
        'N°', 
        'FECHA', 
        'PACIENTE', 
        'CÉDULA', 
        'ESPECIALIDAD', 
        'MÉDICO TRATANTE', 
        'DIAGNÓSTICOS ASOCIADOS'
    ];
    headerRow.eachCell((cell) => {
        cell.style = {
            font: { name: 'Arial', size: 9, bold: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.grayHeader } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thick', color: { argb: colors.primaryBlue } }
            }
        };
    });
    worksheet.getRow(8).height = 25;

    // 6. DATOS
    histories.forEach((h, index) => {
        const diagnosticsText = Array.isArray(h.diagnosticos) ? h.diagnosticos.join(', ') : 'Ninguno';

        const row = worksheet.addRow([
            index + 1,
            safeFormat(h.fecha, 'dd/MM/yyyy', 'S/F'),
            `${h.patient?.firstName || ''} ${h.patient?.lastName || ''}`,
            h.patient?.identificationNumber || 'S/D',
            h.specialty || 'General',
            h.doctor?.user?.name ? `Dr. ${h.doctor.user.name}` : 'No asignado',
            diagnosticsText
        ]);

        row.eachCell((cell) => {
            cell.style = {
                font: { name: 'Arial', size: 9 },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin', color: { argb: 'e2e8f0' } },
                    left: { style: 'thin', color: { argb: 'e2e8f0' } },
                    bottom: { style: 'thin', color: { argb: 'e2e8f0' } },
                    right: { style: 'thin', color: { argb: 'e2e8f0' } }
                }
            };
        });
        row.height = 22;
    });

    // 7. DESCARGA
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};
