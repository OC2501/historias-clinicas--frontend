import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { Patient } from '../types/patient.types';
import { RELATIONSHIP_LABELS } from '@/types/enums';
import { formatPatientAge } from '@/lib/utils';

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
        color: '#0284c7',
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
        backgroundColor: '#0f172a',
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
        width: '4%',
        textAlign: 'center',
    },
    colBeneficiario: {
        width: '20%',
        paddingLeft: 8,
    },
    colParentesco: {
        width: '12%',
        paddingLeft: 5,
    },
    colCedula: {
        width: '10%',
        textAlign: 'center',
    },
    colEdadSexo: {
        width: '11%',
        textAlign: 'center',
    },
    colTitular: {
        width: '21%',
        paddingLeft: 5,
    },
    colGerencia: {
        width: '14%',
        paddingLeft: 5,
    },
    colUltimaAtencion: {
        width: '8%',
        textAlign: 'center',
    },
    beneficiaryName: {
        fontWeight: 'bold',
        color: '#0f172a',
    },
    subtext: {
        fontSize: 7,
        color: '#64748b',
        marginTop: 1,
    },
    badgeParentesco: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#0369a1',
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

interface BeneficiariosReportsPdfProps {
    patients: Patient[];
}

export const BeneficiariosReportsPdf = ({ patients }: BeneficiariosReportsPdfProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy • HH:mm", { locale: es });

    const getGenderText = (gender: string) => {
        const genders = { MALE: 'M', FEMALE: 'F' };
        return genders[gender as keyof typeof genders] || gender;
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

    return (
        <Document title={`Reporte de Beneficiarios - ${format(today, 'yyyy-MM-dd')}`}>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header Institucional */}
                <View style={styles.headerContainer}>
                    <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.institutionTitle}>PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN</Text>
                        <Text style={styles.reportTitle}>REPORTE DE BENEFICIARIOS Y CARGAS FAMILIARES</Text>
                    </View>
                    <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
                </View>

                {/* Metadata */}
                <View style={styles.metaContainer}>
                    <Text>Total registros: {patients.length} beneficiarios</Text>
                    <Text>Fecha de generación: {formattedDate}</Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeaderRow}>
                        <Text style={styles.colNo}>N°</Text>
                        <Text style={styles.colBeneficiario}>Beneficiario</Text>
                        <Text style={styles.colParentesco}>Parentesco</Text>
                        <Text style={styles.colCedula}>Cédula</Text>
                        <Text style={styles.colEdadSexo}>Edad/Sexo</Text>
                        <Text style={styles.colTitular}>Trabajador Titular</Text>
                        <Text style={styles.colGerencia}>Gerencia Asociada</Text>
                        <Text style={styles.colUltimaAtencion}>Atención</Text>
                    </View>

                    {/* Data Rows */}
                    {patients.map((beneficiario, index) => {
                        const isEven = index % 2 === 0;
                        const rowStyle = isEven ? styles.tableRow : styles.tableRowAlternate;
                        const relKey = beneficiario.relationship || 'OTRO';
                        const relLabel = RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey;
                        const titular = beneficiario.titular;
                        const gerencia = beneficiario.gerencia || titular?.gerencia;

                        return (
                            <View key={beneficiario.id} style={rowStyle} wrap={false}>
                                <Text style={styles.colNo}>{index + 1}</Text>
                                
                                <View style={styles.colBeneficiario}>
                                    <Text style={styles.beneficiaryName}>
                                        {beneficiario.firstName} {beneficiario.lastName}
                                    </Text>
                                    <Text style={styles.subtext}>
                                        ID: {beneficiario.id.substring(0, 8)}...
                                    </Text>
                                </View>

                                <View style={styles.colParentesco}>
                                    <Text style={styles.badgeParentesco}>{relLabel}</Text>
                                </View>

                                <Text style={styles.colCedula}>
                                    {beneficiario.identificationNumber || 'S/D (Menor)'}
                                </Text>

                                <Text style={styles.colEdadSexo}>
                                    {formatPatientAge(beneficiario.birthDate)} / {getGenderText(beneficiario.gender)}
                                </Text>

                                <View style={styles.colTitular}>
                                    {titular ? (
                                        <>
                                            <Text style={styles.beneficiaryName}>
                                                {titular.firstName} {titular.lastName}
                                            </Text>
                                            <Text style={styles.subtext}>
                                                C.I: {titular.identificationNumber || 'S/D'}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text style={styles.subtext}>No asignado</Text>
                                    )}
                                </View>

                                <Text style={styles.colGerencia}>
                                    {formatTitleCase(gerencia)}
                                </Text>

                                <Text style={styles.colUltimaAtencion}>
                                    {beneficiario.updatedAt 
                                        ? format(new Date(beneficiario.updatedAt), 'dd/MM/yyyy', { locale: es })
                                        : 'Nunca'}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>Este reporte es de uso oficial exclusivo de HIDROVEN-FALCÓN. Contiene información confidencial y protegida de cargas familiares.</Text>
                    <Text
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                        fixed
                    />
                </View>
            </Page>
        </Document>
    );
};
