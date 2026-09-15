import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Schedule } from '../types/schedule.types';

export const exportSchedulesToExcel = async (schedules: Schedule[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cronograma Semanal');

    const colors = {
        primaryBlue: '002060',
        lightBlue: '00B0F0',
        yellow: 'FFFF00',
        grayHeader: 'F2F2F2',
        white: 'FFFFFF',
        textDark: '333333',
        cardBg: 'F8FAFC',
        cardBorder: 'E2E8F0'
    };

    // 1. CONFIGURACIÓN DE COLUMNAS (7 días de la semana)
    worksheet.columns = [
        { key: 'lunes', width: 25 },
        { key: 'martes', width: 25 },
        { key: 'miercoles', width: 25 },
        { key: 'jueves', width: 25 },
        { key: 'viernes', width: 25 },
        { key: 'sabado', width: 25 },
        { key: 'domingo', width: 25 },
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

    // 3. SUBENCABEZADO
    worksheet.mergeCells('A2:G2');
    const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    worksheet.getCell('A2').value = `CRONOGRAMA SEMANAL DE HORARIOS Y DISPONIBILIDAD - EMITIDO: ${dateStr.toUpperCase()}`;
    worksheet.getCell('A2').style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = 'DOCUMENTO OFICIAL DE GESTIÓN DE HORARIOS DE ATENCIÓN';
    worksheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    worksheet.getRow(3).height = 25;

    // 4. CABECERAS DE DÍAS (Fila 5)
    const DAYS = [
        { key: 1, label: 'LUNES' },
        { key: 2, label: 'MARTES' },
        { key: 3, label: 'MIÉRCOLES' },
        { key: 4, label: 'JUEVES' },
        { key: 5, label: 'VIERNES' },
        { key: 6, label: 'SÁBADO' },
        { key: 0, label: 'DOMINGO' }
    ];

    const dayHeaderRow = worksheet.getRow(5);
    dayHeaderRow.values = DAYS.map(d => d.label);
    dayHeaderRow.eachCell((cell) => {
        cell.style = {
            font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thick', color: { argb: '000000' } }
            }
        };
    });
    dayHeaderRow.height = 30;

    // 5. ORGANIZAR DATOS
    // Agrupar horarios por día de la semana
    const schedulesByDay = DAYS.reduce((acc, day) => {
        acc[day.key] = schedules
            .filter(s => s.diaSemana === day.key)
            .sort((a, b) => a.horaInicio.localeCompare(b.horaFin));
        return acc;
    }, {} as Record<number, Schedule[]>);

    // Encontrar la cantidad máxima de horarios en un solo día
    const maxSchedulesCount = Math.max(...DAYS.map(d => (schedulesByDay[d.key] || []).length));

    // Rellenar las filas
    for (let rowIndex = 0; rowIndex < maxSchedulesCount; rowIndex++) {
        const rowData = DAYS.map(day => {
            const list = schedulesByDay[day.key] || [];
            const sched = list[rowIndex];
            if (!sched) return '';

            const docName = sched.doctor?.user?.name ? `Dr. ${sched.doctor.user.name}` : 'Médico';
            const spec = sched.doctor?.specialty || 'General';
            const room = sched.consultingRoom?.nombre || 'Consultorio';
            const time = `${sched.horaInicio.substring(0, 5)} - ${sched.horaFin.substring(0, 5)}`;

            return `${time}\n${docName}\n(${spec})\n${room}`;
        });

        const newRow = worksheet.addRow(rowData);
        newRow.height = 65; // Alto para albergar las 4 líneas del bloque

        newRow.eachCell((cell) => {
            if (cell.value) {
                cell.style = {
                    font: { name: 'Arial', size: 9 },
                    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.cardBg } },
                    border: {
                        top: { style: 'thin', color: { argb: colors.cardBorder } },
                        left: { style: 'thin', color: { argb: colors.cardBorder } },
                        bottom: { style: 'thin', color: { argb: colors.cardBorder } },
                        right: { style: 'thin', color: { argb: colors.cardBorder } }
                    }
                };
            } else {
                cell.style = {
                    font: { name: 'Arial', size: 9 },
                    alignment: { horizontal: 'center', vertical: 'middle' },
                    border: {
                        top: { style: 'thin', color: { argb: 'F1F5F9' } },
                        left: { style: 'thin', color: { argb: 'F1F5F9' } },
                        bottom: { style: 'thin', color: { argb: 'F1F5F9' } },
                        right: { style: 'thin', color: { argb: 'F1F5F9' } }
                    }
                };
            }
        });
    }

    // 6. DESCARGA
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
};
