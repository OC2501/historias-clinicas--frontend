import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Register a font if needed, or use standard fonts
// Font.register({ family: 'Helvetica', src: ... });

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
        marginBottom: 15,
    },
    badgeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    badge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        fontSize: 9,
        color: '#475569',
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

interface MedicalReportPDFProps {
    data: any;
    patient?: any;
    doctor?: any;
}

const stripHtml = (html: any): string => {
    if (!html) return 'No registrado';

    // Si es un objeto, lo formateamos recursivamente o por llaves
    if (typeof html === 'object') {
        return Object.entries(html)
            .map(([k, v]) => {
                const label = k.replace(/([A-Z])/g, ' $1').toUpperCase();
                const value = typeof v === 'string' ? stripHtml(v) : String(v);
                return `${label}: ${value}`;
            })
            .join('\n');
    }

    return String(html)
        .replace(/<p[^>]*>/g, '')
        .replace(/<\/p>/g, '\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<li[^>]*>/g, '• ')
        .replace(/<\/li>/g, '\n')
        .replace(/<[^>]+>/g, '') // remove remaining tags
        .replace(/&nbsp;/g, ' ')
        .trim() || 'No registrado';
};

const pdfLabelsMap: Record<string, string> = {
    presionArterial: 'Presión Arterial',
    frecuenciaCardiaca: 'Frecuencia Cardíaca',
    frecuenciaRespiratoria: 'Frec. Respiratoria',
    saturacionOxigeno: 'Sat. O2 (%)',
    temperatura: 'Temp. (°C)',
    peso: 'Peso (Kg)',
    altura: 'Altura (cm)',
    imc: 'IMC',
    otros: 'EXÁMENES ADICIONALES',
    examenes: 'Exámenes',
    medicacion: 'Medicación'
};

const formatPdfLabel = (key: string) => pdfLabelsMap[key] || key.replace(/([A-Z])/g, ' $1').toUpperCase();

export const MedicalReportPDF = ({ data, patient, doctor }: MedicalReportPDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy", { locale: es });

    // Helper para obtener antecedentes familiares de posibles ubicaciones
    const antFamiliares = data.antecedentesFamiliares || data.datosEspecificos?.antecedentesFamiliares;

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
        <Document title={`Historia Clínica - ${patient?.firstName || ''} ${patient?.lastName || ''}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>HISTORIA CLÍNICA</Text>
                        <Text style={{ color: '#94a3b8', marginTop: 2 }}>{data.specialty || 'GENERAL'}</Text>
                    </View>
                    <Text style={styles.headerDate}>{formattedDate}</Text>
                </View>

                {/* Patient Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>I. Datos del Paciente</Text>
                    <View style={styles.card}>
                        <View style={styles.grid}>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Nombre completo:</Text>
                                <Text style={styles.value}>{patient?.firstName} {patient?.lastName}</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Identificación:</Text>
                                <Text style={styles.value}>{patient?.identificationNumber || 'N/A'}</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Edad / Género:</Text>
                                <Text style={styles.value}>
                                    {calculateAge(patient?.birthDate)} / {patient?.gender || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.label}>Médico Tratante:</Text>
                                <Text style={styles.value}>{doctor?.user?.name || 'No asignado'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Anamnesis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>II. Anamnesis</Text>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.label}>Motivo de Consulta:</Text>
                        <Text style={styles.value}>{data.motivoConsulta}</Text>
                    </View>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={styles.label}>Enfermedad Actual:</Text>
                        <Text style={styles.value}>{data.enfermedadActual}</Text>
                    </View>

                    {data.antecedentesPersonales && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={styles.label}>Antecedentes Personales:</Text>
                            <Text style={styles.value}>
                                {typeof data.antecedentesPersonales === 'string'
                                    ? stripHtml(data.antecedentesPersonales)
                                    : stripHtml((data.antecedentesPersonales as any).descripcion || 'Ninguno')}
                            </Text>
                        </View>
                    )}

                    {antFamiliares && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={styles.label}>Antecedentes Familiares:</Text>
                            <Text style={styles.value}>{stripHtml(antFamiliares)}</Text>
                        </View>
                    )}

                    {data.habitos && (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={styles.label}>Hábitos Psicobiológicos:</Text>
                            <Text style={styles.value}>
                                {typeof data.habitos === 'string'
                                    ? stripHtml(data.habitos)
                                    : stripHtml((data.habitos as any).descripcion || 'N/A')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Diagnostics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>III. Diagnósticos</Text>
                    <View style={styles.badgeContainer}>
                        {data.diagnosticos?.map((diag: string, index: number) => (
                            <View key={index} style={styles.badge}>
                                <Text>{diag}</Text>
                            </View>
                        ))}
                        {(!data.diagnosticos || data.diagnosticos.length === 0) && (
                            <Text style={[styles.value, { fontStyle: 'italic' }]}>No se registraron diagnósticos.</Text>
                        )}
                    </View>
                </View>

                {/* Examen Físico y Datos Específicos */}
                {(data.examenFisico || data.datosEspecificos) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>IV. Examen Físico y Datos Específicos</Text>

                        {data.examenFisico && Object.keys(data.examenFisico).length > 0 && (
                            <View style={[styles.card, { padding: 8, marginBottom: 8 }]}>
                                <Text style={[styles.label, { marginBottom: 6, fontSize: 10 }]}>Examen Físico / Constantes Vitales:</Text>
                                <View style={styles.grid}>
                                    {Object.entries(data.examenFisico)
                                        .filter(([key]) => key !== 'otros')
                                        .map(([key, val]) => (
                                            <View key={key} style={[styles.gridItem, { width: '33%', marginBottom: 8 }]}>
                                                <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold' }}>{formatPdfLabel(key)}:</Text>
                                                <Text style={[styles.value, { marginTop: 1 }]}>{String(val)}</Text>
                                            </View>
                                        ))}
                                </View>
                                {data.examenFisico.otros && data.examenFisico.otros !== 'N/A' && data.examenFisico.otros !== '' && (
                                    <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6 }}>
                                        <Text style={{ fontSize: 8, color: '#64748b', fontWeight: 'bold', marginBottom: 2 }}>OTROS:</Text>
                                        <Text style={styles.value}>{stripHtml(data.examenFisico.otros)}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {data.datosEspecificos && Object.keys(data.datosEspecificos).length > 0 && (
                            <View style={styles.grid}>
                                {Object.entries(data.datosEspecificos).map(([key, value]) => (
                                    <View key={key} style={styles.gridItem}>
                                        <Text style={styles.label}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                                        <Text style={styles.value}>{String(value)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Plan Manejo */}
                {data.planManejo && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>V. Plan Tratamiento / Manejo</Text>
                        <View style={styles.card}>
                            {typeof data.planManejo === 'string' ? (
                                <Text style={styles.value}>{data.planManejo}</Text>
                            ) : (
                                Object.entries(data.planManejo).map(([k, v]) => (
                                    <View key={k} style={{ marginBottom: 6 }}>
                                        <Text style={styles.label}>{k.replace(/([A-Z])/g, ' $1').toUpperCase()}:</Text>
                                        <Text style={styles.value}>{String(v)}</Text>
                                    </View>
                                ))
                            )}
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
