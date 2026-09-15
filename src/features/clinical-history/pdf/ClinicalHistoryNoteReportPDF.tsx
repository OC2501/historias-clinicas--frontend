import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { ClinicalHistoryNote } from '../types/clinical-history-note.types';
import { safeFormat } from '@/lib/utils';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#334155',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#1e293b',
        paddingBottom: 10,
        marginBottom: 15,
    },
    logoMinAguas: {
        width: 120,
        height: 35,
        objectFit: 'contain',
    },
    logoHidroven: {
        width: 60,
        height: 35,
        objectFit: 'contain',
    },
    headerTextContainer: {
        alignItems: 'center',
        flex: 1,
    },
    institutionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a5f9c',
        marginTop: 4,
        textAlign: 'center',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        fontSize: 8,
        color: '#64748b',
    },
    table: {
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        overflow: 'hidden',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 8,
        paddingVertical: 6,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 6,
        alignItems: 'center',
    },
    tableRowAlternate: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingVertical: 6,
        alignItems: 'center',
    },
    colNo: {
        width: '5%',
        textAlign: 'center',
    },
    colFecha: {
        width: '20%',
        textAlign: 'center',
    },
    colPaciente: {
        width: '30%',
        paddingLeft: 8,
    },
    colSubjetivo: {
        width: '30%',
        paddingLeft: 8,
    },
    colProximaCita: {
        width: '15%',
        textAlign: 'center',
    },
    patientName: {
        fontWeight: 'bold',
        color: '#0f172a',
    },
    patientSubtext: {
        fontSize: 7,
        color: '#64748b',
        marginTop: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        color: '#94a3b8',
        fontSize: 7,
    },
});

interface ClinicalHistoryNoteReportPDFProps {
    notes: ClinicalHistoryNote[];
}

export const ClinicalHistoryNoteReportPDF = ({ notes }: ClinicalHistoryNoteReportPDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy • HH:mm", { locale: es });

    return (
        <Document title={`Reporte de Notas de Evolución - ${format(today, 'yyyy-MM-dd')}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.institutionTitle}>PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN</Text>
                        <Text style={styles.reportTitle}>REPORTE GENERAL DE NOTAS DE EVOLUCIÓN</Text>
                    </View>
                    <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
                </View>

                {/* Metadata */}
                <View style={styles.metaContainer}>
                    <Text>Total notas de evolución: {notes.length}</Text>
                    <Text>Fecha de generación: {formattedDate}</Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.colNo}>N°</Text>
                        <Text style={styles.colFecha}>Fecha y Hora</Text>
                        <Text style={styles.colPaciente}>Paciente</Text>
                        <Text style={styles.colSubjetivo}>Estado Subjetivo</Text>
                        <Text style={styles.colProximaCita}>Próxima Cita</Text>
                    </View>

                    {/* Data Rows */}
                    {notes.map((note, index) => {
                        const isEven = index % 2 === 0;
                        const rowStyle = isEven ? styles.tableRow : styles.tableRowAlternate;
                        const patient = note.patient || note.clinicalHistory?.patient;

                        return (
                            <View key={note.id} style={rowStyle} wrap={false}>
                                <Text style={styles.colNo}>{index + 1}</Text>
                                <Text style={styles.colFecha}>
                                    {safeFormat(note.fecha, 'dd/MM/yyyy • HH:mm', 'S/F')}
                                </Text>
                                <View style={styles.colPaciente}>
                                    <Text style={styles.patientName}>{patient ? `${patient.firstName} ${patient.lastName}` : 'Cargando...'}</Text>
                                    <Text style={styles.patientSubtext}>C.I.: {patient?.identificationNumber || 'S/D'}</Text>
                                </View>
                                <Text style={styles.colSubjetivo}>
                                    {note.estadoSubjetivo || 'Sin registro subjetivo'}
                                </Text>
                                <Text style={styles.colProximaCita}>
                                    {note.proximaCita ? format(new Date(note.proximaCita), 'dd/MM/yyyy') : note.isDischarge ? 'Alta Médica' : 'Ninguna'}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Este reporte es de uso oficial exclusivo de HIDROVEN-FALCÓN. Contiene información confidencial y protegida.</Text>
                    <Text
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                        fixed
                    />
                </View>
            </Page>
        </Document>
    );
};
