import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { Appointment } from '../types/appointment.types';

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
        paddingVertical: 4,
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
    scheduleCardScheduled: {
        padding: 4,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
        marginBottom: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
    },
    scheduleCardCompleted: {
        padding: 4,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5',
        marginBottom: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#059669',
    },
    scheduleCardCancelled: {
        padding: 4,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: '#f43f5e',
        backgroundColor: '#fff1f2',
        marginBottom: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#e11d48',
    },
    timeText: {
        fontWeight: 'bold',
        color: '#0f172a',
        fontSize: 7,
    },
    patientText: {
        fontWeight: 'bold',
        color: '#1e293b',
        fontSize: 7,
        marginTop: 1,
    },
    doctorText: {
        color: '#64748b',
        fontSize: 6,
        marginTop: 1,
    },
    roomText: {
        color: '#0284c7',
        fontSize: 5.5,
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
        marginBottom: 2,
    },
    monthCardScheduled: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
        borderLeftColor: '#2563eb',
    },
    monthCardCompleted: {
        borderColor: '#10b981',
        backgroundColor: '#ecfdf5',
        borderLeftColor: '#059669',
    },
    monthCardCancelled: {
        borderColor: '#f43f5e',
        backgroundColor: '#fff1f2',
        borderLeftColor: '#e11d48',
    },
    monthCardText: {
        fontSize: 5,
        fontWeight: 'bold',
        color: '#0f172a',
    },
});

interface AppointmentsTimetablePDFProps {
    appointments: Appointment[];
    weekDays: Date[];
    calendarMode?: 'week' | 'month';
    monthDays?: Date[];
    currentDate?: Date;
}

export const AppointmentsTimetablePDF = ({ 
    appointments, 
    weekDays,
    calendarMode = 'week',
    monthDays = [],
    currentDate = new Date()
}: AppointmentsTimetablePDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy • HH:mm", { locale: es });

    const getCardStyle = (status: string) => {
        if (status === 'COMPLETED') return styles.scheduleCardCompleted;
        if (status === 'CANCELLED') return styles.scheduleCardCancelled;
        return styles.scheduleCardScheduled;
    };

    return (
        <Document title={`${calendarMode === 'month' ? 'Cronograma Mensual' : 'Cronograma Semanal'} de Citas - ${format(today, 'yyyy-MM-dd')}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.institutionTitle}>PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN</Text>
                        <Text style={styles.reportTitle}>
                            {calendarMode === 'month' ? 'CRONOGRAMA MENSUAL DE CITAS MÉDICAS' : 'CRONOGRAMA SEMANAL DE CITAS MÉDICAS'}
                        </Text>
                    </View>
                    <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
                </View>

                {/* Metadata */}
                <View style={styles.metaContainer}>
                    <Text>Total de citas en el periodo: {appointments.length}</Text>
                    <Text>Fecha de generación: {formattedDate}</Text>
                </View>

                {/* Grid Timetable */}
                {calendarMode === 'week' ? (
                    <View style={styles.gridContainer}>
                        {weekDays.map((day, idx) => {
                            const isLast = idx === weekDays.length - 1;
                            const dayAppointments = appointments
                                .filter(app => isSameDay(new Date(app.startTime), day))
                                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                            return (
                                <View key={day.toString()} style={isLast ? styles.dayColumnLast : styles.dayColumn}>
                                    <View style={styles.dayHeader}>
                                        <Text style={{ fontWeight: 'bold' }}>{format(day, 'EEEE', { locale: es }).toUpperCase()}</Text>
                                        <Text style={styles.daySubheader}>{format(day, 'dd/MM/yyyy')}</Text>
                                    </View>
                                    <View style={styles.scheduleList}>
                                        {dayAppointments.length > 0 ? (
                                            dayAppointments.map(app => (
                                                <View key={app.id} style={getCardStyle(app.status)}>
                                                    <Text style={styles.timeText}>
                                                        {format(new Date(app.startTime), 'HH:mm')} - {format(new Date(app.endTime), 'HH:mm')}
                                                    </Text>
                                                    <Text style={styles.patientText}>
                                                        {app.patient?.firstName} {app.patient?.lastName}
                                                    </Text>
                                                    <Text style={styles.doctorText}>
                                                        {app.doctor?.user?.name ? `Dr. ${app.doctor.user.name}` : 'Médico'}
                                                    </Text>
                                                    <Text style={styles.roomText}>
                                                        {app.consultingRoom?.nombre || '—'}
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.noSchedulesText}>Sin citas</Text>
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
                                const dayAppointments = appointments
                                    .filter(app => isSameDay(new Date(app.startTime), day))
                                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                                const isTodayDay = isSameDay(day, new Date());
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                                const getMonthCardStyle = (status: string) => {
                                    if (status === 'COMPLETED') return styles.monthCardCompleted;
                                    if (status === 'CANCELLED') return styles.monthCardCancelled;
                                    return styles.monthCardScheduled;
                                };

                                return (
                                    <View key={day.toString()} style={isCurrentMonth ? styles.monthDayCell : styles.monthDayCellOutside}>
                                        <Text style={isTodayDay ? styles.monthDayNumberToday : styles.monthDayNumber}>
                                            {format(day, 'd')}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            {dayAppointments.slice(0, 3).map(app => (
                                                <View key={app.id} style={[styles.monthCard, getMonthCardStyle(app.status)]}>
                                                    <Text style={styles.monthCardText}>
                                                        {format(new Date(app.startTime), 'HH:mm')} {app.patient?.firstName} {app.patient?.lastName?.charAt(0)}.
                                                    </Text>
                                                </View>
                                            ))}
                                            {dayAppointments.length > 3 && (
                                                <Text style={{ fontSize: 4.5, color: '#64748b', fontWeight: 'bold', marginTop: 1 }}>
                                                    +{dayAppointments.length - 3} más
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
