import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment } from '../types/appointment.types';

export const exportAppointmentsToExcel = async (appointments: Appointment[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Agenda');

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
        { key: 'paciente', width: 30 },
        { key: 'cedula', width: 18 },
        { key: 'medico', width: 30 },
        { key: 'especialidad', width: 20 },
        { key: 'fecha', width: 15 },
        { key: 'horario', width: 18 },
        { key: 'consultorio', width: 18 },
        { key: 'estado', width: 15 },
    ];

    // 2. ENCABEZADO INSTITUCIONAL
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN';
    titleCell.style = {
        font: { name: 'Arial Black', size: 14, color: { argb: colors.white }, underline: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primaryBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(1).height = 45;

    // 3. FECHA Y CONTROL
    worksheet.mergeCells('A2:I2');
    const dateStr = format(new Date(), "eeee, dd 'de' MMMM 'de' yyyy", { locale: es });
    worksheet.getCell('A2').value = `CONTROL DE CITAS MÉDICAS - EMITIDO: ${dateStr.toUpperCase()}`;
    worksheet.getCell('A2').style = {
        font: { name: 'Arial', size: 10, bold: true, color: { argb: colors.white } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBlue } },
        alignment: { horizontal: 'center', vertical: 'middle' }
    };
    worksheet.getRow(2).height = 25;

    worksheet.mergeCells('A3:I3');
    worksheet.getCell('A3').value = 'DOCUMENTO OFICIAL CONFIDENCIAL - GESTIÓN DE AGENDA';
    worksheet.getCell('A3').style = {
        font: { name: 'Arial', size: 9, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.yellow } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thick', color: { argb: '000000' } } }
    };
    worksheet.getRow(3).height = 25;

    // 4. DASHBOARD DE ALERTAS (KPIs)
    const total = appointments.length;
    const programadas = appointments.filter(a => a.status === 'SCHEDULED').length;
    const completadas = appointments.filter(a => a.status === 'COMPLETED').length;
    const canceladas = appointments.filter(a => a.status === 'CANCELLED').length;

    const stats = [
        { label: 'TOTAL CITAS', val: total, color: '000000' },
        { label: 'PROGRAMADAS', val: programadas, color: '0066CC' },
        { label: 'COMPLETADAS', val: completadas, color: '00C851' },
        { label: 'CANCELADAS', val: canceladas, color: 'FF4444' }
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
        'PACIENTE', 
        'CÉDULA', 
        'MÉDICO TRATANTE', 
        'ESPECIALIDAD', 
        'FECHA', 
        'HORARIO', 
        'CONSULTORIO', 
        'ESTADO'
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

    const getStatusText = (status: string) => {
        const labels: Record<string, string> = {
            SCHEDULED: 'Programada',
            COMPLETED: 'Completada',
            CANCELLED: 'Cancelada',
        };
        return labels[status] || status;
    };

    // 6. DATOS
    appointments.forEach((a, index) => {
        const row = worksheet.addRow([
            index + 1,
            `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`,
            a.patient?.identificationNumber || 'S/D',
            a.doctor?.user?.name ? `Dr. ${a.doctor.user.name}` : 'No asignado',
            a.doctor?.specialty || 'General',
            a.startTime ? format(new Date(a.startTime), 'dd/MM/yyyy') : 'S/F',
            a.startTime ? `${format(new Date(a.startTime), 'HH:mm')} - ${format(new Date(a.endTime), 'HH:mm')}` : '—',
            a.consultingRoom?.nombre || '—',
            getStatusText(a.status)
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
