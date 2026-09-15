import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { Schedule } from '../types/schedule.types';

const styles = StyleSheet.create({
    page: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 8,
        color: '#334155',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#1e293b',
        paddingBottom: 8,
        marginBottom: 10,
    },
    logoMinAguas: {
        width: 100,
        height: 30,
        objectFit: 'contain',
    },
    logoHidroven: {
        width: 50,
        height: 30,
        objectFit: 'contain',
    },
    headerTextContainer: {
        alignItems: 'center',
        flex: 1,
    },
    institutionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    reportTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1a5f9c',
        marginTop: 2,
        textAlign: 'center',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        fontSize: 7,
        color: '#64748b',
    },
    gridContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        overflow: 'hidden',
        height: 420,
    },
    dayColumn: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
        backgroundColor: '#FFFFFF',
        height: '100%',
    },
    dayColumnLast: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        height: '100%',
    },
    dayHeader: {
        backgroundColor: '#1e293b',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 8,
        paddingVertical: 5,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    dayHeaderToday: {
        backgroundColor: '#1a5f9c',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 8,
        paddingVertical: 5,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    daySubheader: {
        fontSize: 6,
        color: '#e2e8f0',
        textAlign: 'center',
        marginTop: 1,
        fontWeight: 'normal',
    },
    scheduleList: {
        padding: 4,
        flex: 1,
    },
    scheduleCard: {
        padding: 5,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
        marginBottom: 4,
    },
    timeText: {
        fontWeight: 'bold',
        color: '#0f172a',
        fontSize: 7,
    },
    doctorText: {
        fontWeight: 'bold',
        color: '#1e293b',
        fontSize: 7,
        marginTop: 1,
    },
    specialtyText: {
        color: '#64748b',
        fontSize: 6,
        marginTop: 1,
    },
    roomText: {
        color: '#0284c7',
        fontSize: 6,
        marginTop: 1,
        fontWeight: 'bold',
    },
    noSchedulesText: {
        color: '#94a3b8',
        fontSize: 6,
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        right: 20,
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        paddingTop: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        color: '#94a3b8',
        fontSize: 6,
    },
    // Month layout styles
    monthHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
    },
    monthHeaderCell: {
        flex: 1,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 7,
        paddingVertical: 4,
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderLeftWidth: 1,
        borderLeftColor: '#cbd5e1',
    },
    monthDayCell: {
        width: '14.28%',
        height: 62,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
        padding: 3,
        backgroundColor: '#FFFFFF',
    },
    monthDayCellOutside: {
        width: '14.28%',
        height: 62,
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        borderRightWidth: 1,
        borderRightColor: '#cbd5e1',
        padding: 3,
        backgroundColor: '#f8fafc',
        opacity: 0.4,
    },
    monthDayNumber: {
        fontSize: 6,
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 2,
    },
    monthDayNumberToday: {
        fontSize: 6,
        fontWeight: 'bold',
        color: '#1a5f9c',
        marginBottom: 2,
    },
    monthCard: {
        padding: 2,
        borderRadius: 2,
        borderLeftWidth: 2,
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
        borderLeftColor: '#2563eb',
        marginBottom: 2,
    },
    monthCardText: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#0f172a',
    },
});

const DAYS_OF_WEEK = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
];

interface SchedulesTimetablePDFProps {
    schedules: Schedule[];
    weekDays?: Date[];
    calendarMode?: 'week' | 'month';
    monthDays?: Date[];
    currentDate?: Date;
}

export const SchedulesTimetablePDF = ({ 
    schedules,
    weekDays = [],
    calendarMode = 'week',
    monthDays = [],
    currentDate = new Date()
}: SchedulesTimetablePDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy • HH:mm", { locale: es });

    return (
        <Document title={`${calendarMode === 'month' ? 'Cronograma Mensual' : 'Cronograma Semanal'} de Horarios - ${format(today, 'yyyy-MM-dd')}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.institutionTitle}>PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN</Text>
                        <Text style={styles.reportTitle}>
                            {calendarMode === 'month' ? 'CRONOGRAMA MENSUAL DE HORARIOS Y DISPONIBILIDAD' : 'CRONOGRAMA SEMANAL DE HORARIOS Y DISPONIBILIDAD'}
                        </Text>
                    </View>
                    <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
                </View>

                {/* Metadata */}
                <View style={styles.metaContainer}>
                    <Text>Total de bloques registrados: {schedules.length}</Text>
                    <Text>Fecha de generación: {formattedDate}</Text>
                </View>

                {/* Grid Timetable */}
                {calendarMode === 'week' ? (
                    <View style={styles.gridContainer}>
                        {weekDays.map((day, idx) => {
                            const isLast = idx === weekDays.length - 1;
                            const todayStart = startOfDay(new Date());
                            const dayStart = startOfDay(day);

                            const daySchedules = dayStart >= todayStart
                                ? schedules
                                    .filter(s => {
                                        if (s.fecha) {
                                            const [year, month, dateVal] = s.fecha.split('-').map(Number);
                                            const scheduleDate = new Date(year, month - 1, dateVal);
                                            return isSameDay(day, scheduleDate);
                                        }
                                        return s.diaSemana === day.getDay();
                                    })
                                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                                : [];

                            const isTodayDay = isSameDay(day, today);

                            return (
                                <View key={day.toString()} style={isLast ? styles.dayColumnLast : styles.dayColumn}>
                                    <View style={isTodayDay ? styles.dayHeaderToday : styles.dayHeader}>
                                        <Text style={{ fontWeight: 'bold' }}>{format(day, 'EEEE', { locale: es }).toUpperCase()}</Text>
                                        <Text style={styles.daySubheader}>{format(day, 'dd/MM/yyyy')}</Text>
                                    </View>
                                    <View style={styles.scheduleList}>
                                        {daySchedules.length > 0 ? (
                                            daySchedules.map(s => (
                                                <View key={s.id} style={styles.scheduleCard}>
                                                    <Text style={styles.timeText}>
                                                        {s.horaInicio.substring(0, 5)} - {s.horaFin.substring(0, 5)}
                                                    </Text>
                                                    <Text style={styles.doctorText}>
                                                        {s.doctor?.user?.name ? (s.doctor.user.name.length > 18 ? `Dr. ${s.doctor.user.name.substring(0, 15)}...` : `Dr. ${s.doctor.user.name}`) : 'Médico'}
                                                    </Text>
                                                    <Text style={styles.specialtyText}>
                                                        {s.doctor?.specialty ? (s.doctor.specialty.length > 18 ? `${s.doctor.specialty.substring(0, 15)}...` : s.doctor.specialty) : 'General'}
                                                    </Text>
                                                    <Text style={styles.roomText}>
                                                        {s.consultingRoom?.nombre ? (s.consultingRoom.nombre.length > 18 ? `${s.consultingRoom.nombre.substring(0, 15)}...` : s.consultingRoom.nombre) : 'Consultorio'}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.noSchedulesText}>Sin horarios</Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={styles.monthHeaderRow}>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d) => (
                                <Text key={d} style={styles.monthHeaderCell}>{d}</Text>
                            ))}
                        </View>
                        <View style={styles.monthGrid}>
                            {monthDays.map((day) => {
                                const todayStart = new Date(today);
                                todayStart.setHours(0, 0, 0, 0);
                                const dayStart = new Date(day);
                                dayStart.setHours(0, 0, 0, 0);

                                const daySchedules = dayStart >= todayStart
                                    ? schedules
                                        .filter(s => {
                                            if (s.fecha) {
                                                const [year, month, dateVal] = s.fecha.split('-').map(Number);
                                                const scheduleDate = new Date(year, month - 1, dateVal);
                                                return isSameDay(day, scheduleDate);
                                            }
                                            return s.diaSemana === day.getDay();
                                        })
                                        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                                    : [];
                                const isTodayDay = isSameDay(day, today);
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                                return (
                                    <View key={day.toString()} style={isCurrentMonth ? styles.monthDayCell : styles.monthDayCellOutside}>
                                        <Text style={isTodayDay ? styles.monthDayNumberToday : styles.monthDayNumber}>
                                            {format(day, 'd')}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            {daySchedules.slice(0, 3).map(s => (
                                                <View key={s.id} style={styles.monthCard}>
                                                    <Text style={styles.monthCardText}>
                                                        {s.horaInicio.substring(0, 5)} {s.doctor?.user?.name ? `Dr. ${s.doctor.user.name.split(' ')[0]}` : 'Médico'}
                                                    </Text>
                                                </View>
                                            ))}
                                            {daySchedules.length > 3 && (
                                                <Text style={{ fontSize: 4.5, color: '#64748b', fontWeight: 'bold', marginTop: 1 }}>
                                                    +{daySchedules.length - 3} más
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Este reporte es de uso oficial exclusivo de HIDROVEN-FALCÓN. Contiene información confidencial y protegida.</Text>
                    <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
                </View>
            </Page>
        </Document>
    );
};
