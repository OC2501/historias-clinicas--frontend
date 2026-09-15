import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Patient } from '../types/patient.types';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import { formatPatientAge } from '@/lib/utils';

export const exportBeneficiariosToExcel = async (patients: Patient[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Beneficiarios');

    const colors = {
        primaryBlue: '002060',
        lightBlue: '00B0F0',
        yellow: 'FFFF00',
        grayHeader: 'F2F2F2',
        white: 'FFFFFF',
        textDark: '333333'
    };

    const formatTitleCase = (str: string | null | undefined) => {
        if (!str) return '—';
        return str
            .toLowerCase()
            .split(' ')
            .map((word, idx) => {
                const prepositions = ['de', 'la', 'las', 'el', 'los', 'y', 'del', 'o', 'a', 'en'];
                if (prepositions.includes(word) && idx !== 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    // 1. CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
        { key: 'no', width: 6 },
        { key: 'nombre', width: 32 },
        { key: 'parentesco', width: 18 },
        { key: 'cedula', width: 18 },
        { key: 'genero', width: 12 },
        { key: 'edad', width: 14 },
        { key: 'titular', width: 32 },
        { key: 'cedulaTitular', width: 18 },
        { key: 'gerencia', width: 30 },
        { key: 'telefono', width: 18 },
        { key: 'estado', width: 15 },
        { key: 'registro', width: 18 },
    ];

    // 2. ENCABEZADO INSTITUCIONAL
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    titleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(1).height = 45;

    // 3. FECHA Y CONTROL
    worksheet.mergeCells('A2:L2');
    const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    worksheet.getCell('A2').value = `REPORTE DE BENEFICIARIOS Y CARGAS FAMILIARES - EMITIDO: ${dateStr.toUpperCase()}`;
    worksheet.getCell('A2').style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells('A3:L3');
    worksheet.getCell('A3').value = 'DOCUMENTO OFICIAL CONFIDENCIAL - GESTIÓN DE CARGAS MÉDICAS FAMILIARES';
    worksheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    worksheet.getRow(3).height = 25;

    // 4. DASHBOARD DE ESTADÍSTICAS (KPIs)
    const total = patients.length;
    const hijos = patients.filter(p => p.relationship === 'HIJO').length;
    const conyuges = patients.filter(p => p.relationship === 'CONYUGE').length;
    const padres = patients.filter(p => p.relationship === 'PADRE' || p.relationship === 'MADRE').length;

    const stats = [
        { label: 'TOTAL BENEFICIARIOS', val: total, color: '000000' },
        { label: 'HIJOS / MENORES', val: hijos, color: '0066CC' },
        { label: 'CÓNYUGES / PAREJAS', val: conyuges, color: 'CC0066' },
        { label: 'PADRES / MADRES', val: padres, color: '007E33' }
    ];

    stats.forEach((stat, idx) => {
        const colStart = idx * 3 + 1;
        const colEnd = colStart + 2;

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
        'BENEFICIARIO', 
        'PARENTESCO', 
        'CÉDULA BENEFICIARIO', 
        'GÉNERO', 
        'EDAD', 
        'TRABAJADOR TITULAR', 
        'CÉDULA TITULAR', 
        'GERENCIA ASOCIADA', 
        'TELÉFONO', 
        'ESTADO', 
        'FECHA REGISTRO'
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

    const getGenderText = (gender: string) => {
        const genders = { MALE: 'Masculino', FEMALE: 'Femenino' };
        return genders[gender as keyof typeof genders] || gender;
    };

    // 6. DATOS DE BENEFICIARIOS
    patients.forEach((b, index) => {
        const relKey = b.relationship || 'OTRO';
        const relLabel = RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey;
        const titular = b.titular;
        const gerencia = b.gerencia || titular?.gerencia;

        const row = worksheet.addRow([
            index + 1,
            `${b.firstName} ${b.lastName}`,
            relLabel,
            b.identificationNumber || 'S/D (Menor)',
            getGenderText(b.gender),
            formatPatientAge(b.birthDate),
            titular ? `${titular.firstName} ${titular.lastName}` : 'No asignado',
            titular?.identificationNumber || 'S/D',
            formatTitleCase(gerencia),
            b.phone || titular?.phone || 'S/D',
            b.isActive !== false ? 'Activo' : 'Inactivo',
            b.createdAt ? format(new Date(b.createdAt), 'dd/MM/yyyy') : 'S/D'
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

    // Guardar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
