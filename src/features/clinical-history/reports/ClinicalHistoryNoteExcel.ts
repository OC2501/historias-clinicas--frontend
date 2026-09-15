import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClinicalHistoryNote } from '../types/clinical-history-note.types';
import { safeFormat } from '@/lib/utils';

export const exportClinicalHistoryNotesToExcel = async (notes: ClinicalHistoryNote[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notas de Evolución');

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
        { key: 'fecha', width: 22 },
        { key: 'paciente', width: 30 },
        { key: 'cedula', width: 18 },
        { key: 'subjetivo', width: 35 },
        { key: 'objetivo', width: 35 },
        { key: 'proximaCita', width: 18 },
        { key: 'alta', width: 12 },
    ];

    // 2. ENCABEZADO INSTITUCIONAL
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    titleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(1).height = 45;

    // 3. FECHA Y CONTROL
    worksheet.mergeCells('A2:H2');
    const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    worksheet.getCell('A2').value = `REPORTE DE NOTAS DE EVOLUCIÓN - EMITIDO: ${dateStr.toUpperCase()}`;
    worksheet.getCell('A2').style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells('A3:H3');
    worksheet.getCell('A3').value = 'DOCUMENTO OFICIAL CONFIDENCIAL - SEGUIMIENTO DE PACIENTES';
    worksheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    worksheet.getRow(3).height = 25;

    // 4. DASHBOARD DE ALERTAS (KPIs)
    const total = notes.length;
    const altas = notes.filter(n => n.isDischarge).length;
    const proximas = notes.filter(n => n.proximaCita).length;

    const stats = [
        { label: 'TOTAL NOTAS', val: total, color: '000000' },
        { label: 'ALTAS MÉDICAS', val: altas, color: '00C851' },
        { label: 'PRÓXIMAS CONSULTAS', val: proximas, color: '0066CC' },
        { label: 'CONTROL INTERNO', val: total, color: 'FFBB33' }
    ];

    stats.forEach((stat, idx) => {
        const colStart = idx * 2 + 1;
        const colEnd = colStart + 1;

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
        'FECHA Y HORA', 
        'PACIENTE', 
        'CÉDULA', 
        'ESTADO SUBJETIVO', 
        'ESTADO OBJETIVO', 
        'FECHA PRÓXIMA CITA', 
        'ALTA MÉDICA'
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
    notes.forEach((note, index) => {
        const patient = note.patient || (note as any).clinicalHistory?.patient;

        const row = worksheet.addRow([
            index + 1,
            safeFormat(note.fecha, 'dd/MM/yyyy • HH:mm', 'S/F'),
            patient ? `${patient.firstName} ${patient.lastName}` : 'Desconocido',
            patient?.identificationNumber || 'S/D',
            note.estadoSubjetivo || 'Sin detalles',
            note.objetivo || 'Sin detalles',
            safeFormat(note.proximaCita, 'dd/MM/yyyy', '—'),
            note.isDischarge ? 'Sí' : 'No'
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
