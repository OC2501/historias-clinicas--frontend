import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Patient, ClinicalHistory } from '@/types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333',
    },
    header: {
        borderBottomWidth: 2,
        borderBottomColor: '#1e293b',
        paddingBottom: 10,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    patientInfo: {
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    patientName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    patientDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailItem: {
        width: '33%',
        marginBottom: 4,
    },
    label: {
        fontWeight: 'bold',
        color: '#64748b',
        fontSize: 9,
    },
    historyItem: {
        marginBottom: 25,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f1f5f9',
        padding: 8,
        marginBottom: 10,
        borderRadius: 2,
    },
    historyTitle: {
        fontWeight: 'bold',
        color: '#0f172a',
    },
    historyDate: {
        fontSize: 9,
        color: '#64748b',
    },
    section: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    content: {
        lineHeight: 1.4,
    },
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 5,
    },
    badge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        fontSize: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 8,
    }
});

interface PatientFullHistoryPDFProps {
    patient: Patient;
    histories: ClinicalHistory[];
}

export const PatientFullHistoryPDF = ({ patient, histories }: PatientFullHistoryPDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy", { locale: es });

    const calculateAge = (birthDate: string | undefined) => {
        if (!birthDate) return 'N/A';
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            return (age - 1) + ' años';
        }
        return age + ' años';
    };

    return (
        <Document title={`Historial Completo - ${patient.firstName} ${patient.lastName}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>EXPEDIENTE MÉDICO COMPLETO</Text>
                        <Text style={{ color: '#64748b', marginTop: 4 }}>Reporte consolidado de consultas</Text>
                    </View>
                    <Text style={{ fontSize: 9, color: '#94a3b8' }}>Generado el {formattedDate}</Text>
                </View>

                {/* Patient Summary */}
                <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
                    <View style={styles.patientDetails}>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Identificación:</Text>
                            <Text>{patient.identificationNumber || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Edad:</Text>
                            <Text>{calculateAge(patient.birthDate)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Género:</Text>
                            <Text style={{ textTransform: 'capitalize' }}>{patient.gender || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Dirección:</Text>
                            <Text>{patient.address || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Teléfono:</Text>
                            <Text>{patient.phone || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 15, color: '#1e293b' }}>
                    Consultas Registradas ({histories.length})
                </Text>

                {histories.map((h, idx) => (
                    <View key={h.id} style={styles.historyItem} wrap={false}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyTitle}>
                                {idx + 1}. {h.specialty || 'CONSULTA GENERAL'}
                            </Text>
                            <Text style={styles.historyDate}>
                                {format(new Date(h.createdAt), "dd/MM/yyyy • HH:mm", { locale: es })}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>Médico Responsable:</Text>
                                <Text>Dr. {h.doctor?.user?.name || 'No asignado'}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Motivo de Consulta</Text>
                            <Text style={styles.content}>{h.motivoConsulta || 'No registrado'}</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Enfermedad Actual</Text>
                            <Text style={styles.content}>{h.enfermedadActual || 'No registrada'}</Text>
                        </View>

                        {h.antecedentesPersonales && Object.keys(h.antecedentesPersonales).length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Antecedentes Personales</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {Object.entries(h.antecedentesPersonales).map(([key, val]) => (
                                        <View key={key} style={{ width: '50%', marginBottom: 4 }}>
                                            <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                                            <Text style={{ fontSize: 9 }}>{String(val)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {h.habitos && Object.keys(h.habitos).length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Hábitos</Text>
                                <View style={styles.badgeContainer}>
                                    {Object.entries(h.habitos).map(([key, val]) => (
                                        <View key={key} style={styles.badge}>
                                            <Text>{key}: {String(val)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Diagnósticos</Text>
                            <View style={styles.badgeContainer}>
                                {h.diagnosticos?.map((d, i) => (
                                    <View key={i} style={styles.badge}>
                                        <Text>{d}</Text>
                                    </View>
                                ))}
                                {(!h.diagnosticos || h.diagnosticos.length === 0) && (
                                    <Text style={{ fontStyle: 'italic', fontSize: 9 }}>No se registraron diagnósticos.</Text>
                                )}
                            </View>
                        </View>

                        {h.examenFisico && Object.keys(h.examenFisico).length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Examen Físico</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: 8, borderRadius: 4 }}>
                                    {Object.entries(h.examenFisico).map(([key, val]) => (
                                        <View key={key} style={{ width: '50%', marginBottom: 4 }}>
                                            <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                                            <Text style={{ fontSize: 9 }}>{String(val)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {h.datosEspecificos && Object.keys(h.datosEspecificos).length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Datos Específicos</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                    {Object.entries(h.datosEspecificos).map(([key, val]) => (
                                        <View key={key} style={{ width: '50%', marginBottom: 4 }}>
                                            <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                                            <Text style={{ fontSize: 9 }}>{String(val)}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {h.planManejo && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Plan de Manejo</Text>
                                <View style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 2 }}>
                                    {typeof h.planManejo === 'string' ? (
                                        <Text style={styles.content}>{h.planManejo}</Text>
                                    ) : (
                                        Object.entries(h.planManejo).map(([k, v]) => (
                                            <View key={k} style={{ marginBottom: 4 }}>
                                                <Text style={[styles.label, { color: '#0f172a' }]}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                                                <Text style={{ fontSize: 9 }}>{String(v)}</Text>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </View>
                        )}

                        {h.notes && h.notes.length > 0 && (
                            <View style={[styles.section, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }]}>
                                <Text style={[styles.sectionTitle, { color: '#475569' }]}>Notas de Evolución ({h.notes.length})</Text>
                                {h.notes.map((n, i) => (
                                    <View key={n.id} style={{ marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#cbd5e1' }}>
                                        <Text style={{ fontSize: 8, color: '#64748b', marginBottom: 2 }}>
                                            {format(new Date(n.fecha || n.createdAt), "dd/MM/yyyy", { locale: es })} - Dr. {n.doctor?.user?.name || h.doctor?.user?.name || 'No asignado'}
                                        </Text>
                                        <Text style={{ fontSize: 9 }}>{n.estadoSubjetivo || 'Sin registro subjetivo'}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))}

                {histories.length === 0 && (
                    <View style={{ padding: 40, textAlign: 'center' }}>
                        <Text style={{ color: '#94a3b8' }}>No hay historias clínicas registradas para este paciente.</Text>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Este documento es un resumen oficial del historial clínico del paciente.
                </Text>

                <Text
                    style={{ position: 'absolute', bottom: 30, right: 40, fontSize: 8, color: '#94a3b8' }}
                    render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    fixed
                />
            </Page>
        </Document>
    );
};
