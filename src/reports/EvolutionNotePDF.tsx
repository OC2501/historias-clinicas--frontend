import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333',
    },
    header: {
        backgroundColor: '#1e293b',
        padding: 20,
        marginBottom: 20,
        borderRadius: 4,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 10,
        marginTop: 2,
    },
    headerDate: {
        color: '#cbd5e1',
        fontSize: 10,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 4,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    gridItem: {
        width: '50%',
        marginBottom: 6,
    },
    label: {
        fontWeight: 'bold',
        color: '#64748b',
        marginBottom: 2,
    },
    value: {
        fontSize: 10,
    },
    card: {
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
    },
    highlightCard: {
        backgroundColor: '#eff6ff',
        padding: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginBottom: 10,
    },
    nextVisitCard: {
        backgroundColor: '#f0fdf4',
        padding: 12,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    },
});

interface EvolutionNotePDFProps {
    data: {
        estadoSubjetivo: string;
        cambiosSintomas?: string;
        proximaCita?: string;
    };
    seguimiento: {
        peso?: string;
        presionArterial?: string;
    };
    planAjustado: {
        medicacion?: string;
        indicaciones?: string;
    };
}

export const EvolutionNotePDF = ({ data, seguimiento, planAjustado }: EvolutionNotePDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy", { locale: es });

    const formatProximaCita = (dateStr?: string) => {
        if (!dateStr) return null;
        try {
            return format(new Date(dateStr), "dd/MM/yyyy") + ' (Estimada)';
        } catch {
            return dateStr;
        }
    };

    const hasSeguimiento = seguimiento.peso || seguimiento.presionArterial;
    const hasPlan = planAjustado.medicacion || planAjustado.indicaciones;

    return (
        <Document title="Nota de Evolución">
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>NOTA DE EVOLUCIÓN</Text>
                        <Text style={styles.headerSubtitle}>Registro de seguimiento clínico</Text>
                    </View>
                    <Text style={styles.headerDate}>{formattedDate}</Text>
                </View>

                {/* II. Anamnesis de Evolución */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>I. Anamnesis de Evolución</Text>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.label}>Estado Subjetivo:</Text>
                        <Text style={styles.value}>{data.estadoSubjetivo || 'No registrado'}</Text>
                    </View>
                    {data.cambiosSintomas && (
                        <View>
                            <Text style={styles.label}>Cambios en los Síntomas:</Text>
                            <Text style={styles.value}>{data.cambiosSintomas}</Text>
                        </View>
                    )}
                </View>

                {/* III. Datos de Seguimiento */}
                {hasSeguimiento && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>II. Datos de Seguimiento</Text>
                        <View style={styles.card}>
                            <View style={styles.grid}>
                                {seguimiento.peso && (
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Peso (kg):</Text>
                                        <Text style={styles.value}>{seguimiento.peso}</Text>
                                    </View>
                                )}
                                {seguimiento.presionArterial && (
                                    <View style={styles.gridItem}>
                                        <Text style={styles.label}>Presión Arterial (mmHg):</Text>
                                        <Text style={styles.value}>{seguimiento.presionArterial}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* V. Plan Ajustado */}
                {hasPlan && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>III. Plan Ajustado</Text>
                        <View style={styles.highlightCard}>
                            {planAjustado.medicacion && (
                                <View style={{ marginBottom: 8 }}>
                                    <Text style={styles.label}>Medicamentos / Tratamiento:</Text>
                                    <Text style={styles.value}>{planAjustado.medicacion}</Text>
                                </View>
                            )}
                            {planAjustado.indicaciones && (
                                <View>
                                    <Text style={styles.label}>Indicaciones Generales:</Text>
                                    <Text style={styles.value}>{planAjustado.indicaciones}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* VI. Próxima Visita */}
                {data.proximaCita && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>IV. Próxima Visita</Text>
                        <View style={styles.nextVisitCard}>
                            <View>
                                <Text style={styles.label}>Fecha Estimada:</Text>
                                <Text style={[styles.value, { fontSize: 12, fontWeight: 'bold' }]}>
                                    {formatProximaCita(data.proximaCita)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Footer */}
                <Text style={styles.footer}>
                    Generado automáticamente por el Sistema de Gestión de Historias Clínicas - {formattedDate}
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
