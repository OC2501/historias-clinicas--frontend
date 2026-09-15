import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Patient } from '../types/patient.types';
import { formatPatientAge } from '@/lib/utils';
import { RELATIONSHIP_LABELS } from '@/types/enums';

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

export const exportPatientsToExcel = async (patients: Patient[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pacientes');

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
        { key: 'nombre', width: 35 },
        { key: 'cedula', width: 18 },
        { key: 'genero', width: 12 },
        { key: 'edad', width: 10 },
        { key: 'gerencia', width: 30 },
        { key: 'cargo', width: 25 },
        { key: 'telefono', width: 18 },
        { key: 'correo', width: 25 },
        { key: 'estado', width: 15 },
        { key: 'registro', width: 18 },
    ];

    // 2. ENCABEZADO INSTITUCIONAL
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    titleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(1).height = 45;

    // 3. FECHA Y CONTROL
    worksheet.mergeCells('A2:K2');
    const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    worksheet.getCell('A2').value = `REPORTE GENERAL DE PACIENTES - EMITIDO: ${dateStr.toUpperCase()}`;
    worksheet.getCell('A2').style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells('A3:K3');
    worksheet.getCell('A3').value = 'DOCUMENTO OFICIAL CONFIDENCIAL - GESTIÓN DE PACIENTES';
    worksheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    worksheet.getRow(3).height = 25;

    // 4. DASHBOARD DE ALERTAS (KPIs)
    const total = patients.length;
    const activos = patients.filter(p => p.isActive !== false).length;
    const masculinos = patients.filter(p => p.gender === 'MALE').length;
    const femeninos = patients.filter(p => p.gender === 'FEMALE').length;

    const stats = [
        { label: 'TOTAL PACIENTES', val: total, color: '000000' },
        { label: 'PACIENTES ACTIVOS', val: activos, color: '00C851' },
        { label: 'PACIENTES MASCULINOS', val: masculinos, color: '0066CC' },
        { label: 'PACIENTES FEMENINOS', val: femeninos, color: 'CC0066' }
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
        'NOMBRE COMPLETO', 
        'CÉDULA', 
        'GÉNERO', 
        'EDAD', 
        'GERENCIA',
        'CARGO',
        'TELÉFONO', 
        'CORREO ELECTRÓNICO', 
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

    const calculateAge = (birthDate: string | undefined) => formatPatientAge(birthDate);

    const getGenderText = (gender: string) => {
        const genders = { MALE: 'Masculino', FEMALE: 'Femenino' };
        return genders[gender as keyof typeof genders] || gender;
    };

    // 6. DATOS DE PACIENTES
    patients.forEach((p, index) => {
        const row = worksheet.addRow([
            index + 1,
            `${p.firstName} ${p.lastName}`,
            p.identificationNumber || 'S/D',
            getGenderText(p.gender),
            calculateAge(p.birthDate),
            p.gerencia || 'No asignada',
            p.cargo || 'No asignado',
            p.phone || 'S/D',
            p.email || 'S/D',
            p.isActive !== false ? 'Activo' : 'Inactivo',
            p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : 'S/D'
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

    // 6.5. HOJAS ADICIONALES
    const configureSheetColumns = (sheet: ExcelJS.Worksheet) => {
        sheet.columns = [
            { key: 'no', width: 6 },
            { key: 'nombre', width: 35 },
            { key: 'cedula', width: 18 },
            { key: 'genero', width: 12 },
            { key: 'edad', width: 10 },
            { key: 'gerencia', width: 30 },
            { key: 'cargo', width: 25 },
            { key: 'telefono', width: 18 },
            { key: 'correo', width: 25 },
            { key: 'estado', width: 15 },
            { key: 'registro', width: 18 },
        ];
    };

    // HOJA 2: TRABAJADORES TITULARES
    const titulares = patients.filter(p => !p.patientType || p.patientType === 'TITULAR');
    const titularesSheet = workbook.addWorksheet('Titulares');
    configureSheetColumns(titularesSheet);

    titularesSheet.mergeCells('A1:K1');
    const tTitleCell = titularesSheet.getCell('A1');
    tTitleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    tTitleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    titularesSheet.getRow(1).height = 45;

    titularesSheet.mergeCells('A2:K2');
    const tSubCell = titularesSheet.getCell('A2');
    tSubCell.value = `REPORTE DE TRABAJADORES TITULARES - EMITIDO: ${dateStr.toUpperCase()}`;
    tSubCell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    titularesSheet.getRow(2).height = 25;

    titularesSheet.mergeCells('A3:K3');
    titularesSheet.getCell('A3').value = 'DOCUMENTO OFICIAL CONFIDENCIAL - GESTIÓN DE PACIENTES TITULARES';
    titularesSheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    titularesSheet.getRow(3).height = 25;

    // Stats KPIs para Titulares
    const tTotal = titulares.length;
    const tActivos = titulares.filter(p => p.isActive !== false).length;
    const tMasculinos = titulares.filter(p => p.gender === 'MALE').length;
    const tFemeninos = titulares.filter(p => p.gender === 'FEMALE').length;

    const tStats = [
        { label: 'TOTAL TITULARES', val: tTotal, color: '000000' },
        { label: 'TITULARES ACTIVOS', val: tActivos, color: '00C851' },
        { label: 'TITULARES MASCULINOS', val: tMasculinos, color: '0066CC' },
        { label: 'TITULARES FEMENINOS', val: tFemeninos, color: 'CC0066' }
    ];

    tStats.forEach((stat, idx) => {
        const colStart = idx * 2 + 1;
        const colEnd = colStart + 1;

        titularesSheet.mergeCells(5, colStart, 5, colEnd);
        const label = titularesSheet.getCell(5, colStart);
        label.value = stat.label;
        label.style = {
            font: { name: 'Arial', bold: true, size: 8, color: { argb: 'FFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } }
        };

        titularesSheet.mergeCells(6, colStart, 6, colEnd);
        const val = titularesSheet.getCell(6, colStart);
        val.value = stat.val;
        val.style = {
            font: { name: 'Arial', bold: true, size: 12, color: { argb: stat.color } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thick', color: { argb: colors.primaryBlue } } }
        };
    });
    titularesSheet.getRow(5).height = 25;
    titularesSheet.getRow(6).height = 35;

    // Header Row
    const tHeaderRow = titularesSheet.getRow(8);
    tHeaderRow.values = [
        'N°', 
        'NOMBRE COMPLETO', 
        'CÉDULA', 
        'GÉNERO', 
        'EDAD', 
        'GERENCIA',
        'CARGO',
        'TELÉFONO', 
        'CORREO ELECTRÓNICO', 
        'ESTADO', 
        'FECHA REGISTRO'
    ];
    tHeaderRow.eachCell((cell) => {
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
    titularesSheet.getRow(8).height = 25;

    // Data Rows
    titulares.forEach((p, index) => {
        const row = titularesSheet.addRow([
            index + 1,
            `${p.firstName} ${p.lastName}`,
            p.identificationNumber || 'S/D',
            getGenderText(p.gender),
            calculateAge(p.birthDate),
            p.gerencia || 'No asignada',
            p.cargo || 'No asignado',
            p.phone || 'S/D',
            p.email || 'S/D',
            p.isActive !== false ? 'Activo' : 'Inactivo',
            p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : 'S/D'
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

    // HOJA 3: BENEFICIARIOS / CARGAS FAMILIARES
    const beneficiarios = patients.filter(p => p.patientType === 'BENEFICIARIO');
    const benSheet = workbook.addWorksheet('Beneficiarios');
    benSheet.columns = [
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

    benSheet.mergeCells('A1:L1');
    const bTitleCell = benSheet.getCell('A1');
    bTitleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    bTitleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    benSheet.getRow(1).height = 45;

    benSheet.mergeCells('A2:L2');
    const bSubCell = benSheet.getCell('A2');
    bSubCell.value = `REPORTE DE BENEFICIARIOS Y CARGAS FAMILIARES - EMITIDO: ${dateStr.toUpperCase()}`;
    bSubCell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    benSheet.getRow(2).height = 25;

    benSheet.mergeCells('A3:L3');
    benSheet.getCell('A3').value = 'DOCUMENTO OFICIAL CONFIDENCIAL - GESTIÓN DE CARGAS MÉDICAS FAMILIARES';
    benSheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    benSheet.getRow(3).height = 25;

    // Stats KPIs
    const bTotal = beneficiarios.length;
    const bHijos = beneficiarios.filter(p => p.relationship === 'HIJO').length;
    const bConyuges = beneficiarios.filter(p => p.relationship === 'CONYUGE').length;
    const bPadres = beneficiarios.filter(p => p.relationship === 'PADRE' || p.relationship === 'MADRE').length;

    const bStats = [
        { label: 'TOTAL BENEFICIARIOS', val: bTotal, color: '000000' },
        { label: 'HIJOS / MENORES', val: bHijos, color: '0066CC' },
        { label: 'CÓNYUGES / PAREJAS', val: bConyuges, color: 'CC0066' },
        { label: 'PADRES / MADRES', val: bPadres, color: '007E33' }
    ];

    bStats.forEach((stat, idx) => {
        const colStart = idx * 3 + 1;
        const colEnd = colStart + 2;

        benSheet.mergeCells(5, colStart, 5, colEnd);
        const label = benSheet.getCell(5, colStart);
        label.value = stat.label;
        label.style = {
            font: { name: 'Arial', bold: true, size: 8, color: { argb: 'FFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } }
        };

        benSheet.mergeCells(6, colStart, 6, colEnd);
        const val = benSheet.getCell(6, colStart);
        val.value = stat.val;
        val.style = {
            font: { name: 'Arial', bold: true, size: 12, color: { argb: stat.color } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thick', color: { argb: colors.primaryBlue } } }
        };
    });
    benSheet.getRow(5).height = 25;
    benSheet.getRow(6).height = 35;

    // Header Row
    const bHeaderRow = benSheet.getRow(8);
    bHeaderRow.values = [
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
    bHeaderRow.eachCell((cell) => {
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
    benSheet.getRow(8).height = 25;

    // Add Data
    beneficiarios.forEach((b, index) => {
        const relKey = b.relationship || 'OTRO';
        const relLabel = RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey;
        const titular = b.titular;
        const gerencia = b.gerencia || titular?.gerencia;

        const row = benSheet.addRow([
            index + 1,
            `${b.firstName} ${b.lastName}`,
            relLabel,
            b.identificationNumber || 'S/D (Menor)',
            getGenderText(b.gender),
            calculateAge(b.birthDate),
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

    // HOJA 2: POR GÉNERO
    const genderSheet = workbook.addWorksheet('Por Género');
    configureSheetColumns(genderSheet);

    genderSheet.mergeCells('A1:K1');
    const gTitleCell = genderSheet.getCell('A1');
    gTitleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    gTitleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    genderSheet.getRow(1).height = 45;

    genderSheet.mergeCells('A2:K2');
    const gSubCell = genderSheet.getCell('A2');
    gSubCell.value = 'CLASIFICACIÓN DE PACIENTES POR GÉNERO';
    gSubCell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    genderSheet.getRow(2).height = 25;

    const genderGroups = [
        { name: 'FEMENINO', key: 'FEMALE', color: 'FCE4D6' }, // soft pink
        { name: 'MASCULINO', key: 'MALE', color: 'DDEBF7' }   // soft blue
    ];

    genderGroups.forEach((group) => {
        const groupPatients = patients.filter(p => p.gender === group.key);
        if (groupPatients.length === 0) return;

        // Group Header Row
        const groupHeaderRow = genderSheet.addRow([]);
        const groupHeaderRowNum = groupHeaderRow.number;
        genderSheet.mergeCells(`A${groupHeaderRowNum}:K${groupHeaderRowNum}`);
        const groupHeaderCell = genderSheet.getCell(`A${groupHeaderRowNum}`);
        groupHeaderCell.value = `GÉNERO: ${group.name} (TOTAL: ${groupPatients.length})`;
        groupHeaderCell.style = {
            font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.textDark } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: group.color } },
            alignment: { horizontal: 'left', vertical: 'middle' },
            border: {
                top: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } }
            }
        };
        groupHeaderRow.height = 25;

        // Table Header Row
        const tHeaderRow = genderSheet.addRow([
            'N°', 'NOMBRE COMPLETO', 'CÉDULA', 'GÉNERO', 'EDAD', 'GERENCIA', 'CARGO', 'TELÉFONO', 'CORREO ELECTRÓNICO', 'ESTADO', 'FECHA REGISTRO'
        ]);
        tHeaderRow.eachCell((cell) => {
            cell.style = {
                font: { name: 'Arial', size: 9, bold: true },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.grayHeader } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                    bottom: { style: 'thin' }
                }
            };
        });
        tHeaderRow.height = 22;

        // Add Patients
        groupPatients.forEach((p, idx) => {
            const pRow = genderSheet.addRow([
                idx + 1,
                `${p.firstName} ${p.lastName}`,
                p.identificationNumber || 'S/D',
                getGenderText(p.gender),
                calculateAge(p.birthDate),
                p.gerencia || 'No asignada',
                p.cargo || 'No asignado',
                p.phone || 'S/D',
                p.email || 'S/D',
                p.isActive !== false ? 'Activo' : 'Inactivo',
                p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : 'S/D'
            ]);
            pRow.eachCell((cell) => {
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
            pRow.height = 20;
        });

        // Spacing row
        genderSheet.addRow([]);
    });

    // HOJA 3: POR ÁREA (GERENCIA)
    const areaSheet = workbook.addWorksheet('Por Área');
    configureSheetColumns(areaSheet);

    areaSheet.mergeCells('A1:K1');
    const aTitleCell = areaSheet.getCell('A1');
    aTitleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    aTitleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    areaSheet.getRow(1).height = 45;

    areaSheet.mergeCells('A2:K2');
    const aSubCell = areaSheet.getCell('A2');
    aSubCell.value = 'CLASIFICACIÓN DE PACIENTES POR ÁREA (GERENCIA)';
    aSubCell.style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    areaSheet.getRow(2).height = 25;

    const uniqueGerencias = Array.from(new Set(patients.map(p => p.gerencia || 'No asignada'))).sort();

    uniqueGerencias.forEach((gerenciaName) => {
        const areaPatients = patients.filter(p => (p.gerencia || 'No asignada') === gerenciaName);
        if (areaPatients.length === 0) return;

        // Group Header Row
        const groupHeaderRow = areaSheet.addRow([]);
        const groupHeaderRowNum = groupHeaderRow.number;
        areaSheet.mergeCells(`A${groupHeaderRowNum}:K${groupHeaderRowNum}`);
        const groupHeaderCell = areaSheet.getCell(`A${groupHeaderRowNum}`);
        groupHeaderCell.value = `ÁREA: ${gerenciaName.toUpperCase()} (TOTAL: ${areaPatients.length})`;
        groupHeaderCell.style = {
            font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.textDark } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2EFDA' } }, // soft green
            alignment: { horizontal: 'left', vertical: 'middle' },
            border: {
                top: { style: 'thin', color: { argb: '000000' } },
                bottom: { style: 'thin', color: { argb: '000000' } }
            }
        };
        groupHeaderRow.height = 25;

        // Table Header Row
        const tHeaderRow = areaSheet.addRow([
            'N°', 'NOMBRE COMPLETO', 'CÉDULA', 'GÉNERO', 'EDAD', 'GERENCIA', 'CARGO', 'TELÉFONO', 'CORREO ELECTRÓNICO', 'ESTADO', 'FECHA REGISTRO'
        ]);
        tHeaderRow.eachCell((cell) => {
            cell.style = {
                font: { name: 'Arial', size: 9, bold: true },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.grayHeader } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                    bottom: { style: 'thin' }
                }
            };
        });
        tHeaderRow.height = 22;

        // Add Patients
        areaPatients.forEach((p, idx) => {
            const pRow = areaSheet.addRow([
                idx + 1,
                `${p.firstName} ${p.lastName}`,
                p.identificationNumber || 'S/D',
                getGenderText(p.gender),
                calculateAge(p.birthDate),
                p.gerencia || 'No asignada',
                p.cargo || 'No asignado',
                p.phone || 'S/D',
                p.email || 'S/D',
                p.isActive !== false ? 'Activo' : 'Inactivo',
                p.createdAt ? format(new Date(p.createdAt), 'dd/MM/yyyy') : 'S/D'
            ]);
            pRow.eachCell((cell) => {
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
            pRow.height = 20;
        });

        // Spacing row
        areaSheet.addRow([]);
    });

    // 7. DESCARGA NATIVA
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};
