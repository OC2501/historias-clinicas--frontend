import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { safeFormat } from '@/lib/utils';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { Consulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS } from '../types/consultas.type';
import { RELATIONSHIP_LABELS } from '@/types/enums';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    paddingBottom: 35,
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
    borderBottomColor: '#002060',
    paddingBottom: 8,
    marginBottom: 10,
  },
  logoMinAguas: {
    width: 110,
    height: 30,
    objectFit: 'contain',
  },
  logoHidroven: {
    width: 55,
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
    color: '#002060',
    textAlign: 'center',
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2,
    textAlign: 'center',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontSize: 7.5,
    color: '#64748b',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#002060',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 7.5,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
    alignItems: 'center',
  },
  tableRowAlternate: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
    alignItems: 'center',
  },
  colNo: {
    width: '4%',
    textAlign: 'center',
  },
  colFecha: {
    width: '10%',
    textAlign: 'center',
  },
  colPaciente: {
    width: '18%',
    paddingLeft: 4,
  },
  colGerencia: {
    width: '13%',
    paddingLeft: 4,
  },
  colTipo: {
    width: '13%',
    paddingLeft: 4,
  },
  colSignos: {
    width: '14%',
    paddingLeft: 4,
  },
  colDiagnostico: {
    width: '16%',
    paddingLeft: 4,
  },
  colMedico: {
    width: '12%',
    paddingLeft: 4,
  },
  patientName: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  patientSubtext: {
    fontSize: 6.5,
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 6.5,
  },
});

interface ConsultasReportsPDFProps {
  consultas: Consulta[];
  dateRangeText?: string;
}

export const ConsultasReportsPDF = ({ consultas, dateRangeText }: ConsultasReportsPDFProps) => {
  const today = new Date();
  const formattedDate = format(today, "dd 'de' MMMM, yyyy • HH:mm", { locale: es });
  const totalTitulares = consultas.filter((c) => !c.patient?.patientType || c.patient?.patientType === 'TITULAR').length;
  const totalBeneficiarios = consultas.filter((c) => c.patient?.patientType === 'BENEFICIARIO').length;

  return (
    <Document title={`Reporte de Consultas - ${format(today, 'yyyy-MM-dd')}`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.headerContainer}>
          <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionTitle}>
              SISTEMA DE HISTORIAS CLÍNICAS - HIDROVEN-FALCÓN
            </Text>
            <Text style={styles.reportTitle}>
              REPORTE CONSOLIDADO DE CONSULTAS Y CHEQUEOS DIARIOS
            </Text>
          </View>
          <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
        </View>

        {/* Metadatos */}
        <View style={styles.metaContainer}>
          <Text>
            Total de atenciones: {consultas.length} ({totalTitulares} Titulares • {totalBeneficiarios} Beneficiarios)
          </Text>
          {dateRangeText && <Text>Período: {dateRangeText}</Text>}
          <Text>Fecha de generación: {formattedDate}</Text>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <Text style={styles.colNo}>N°</Text>
            <Text style={styles.colFecha}>Fecha / Hora</Text>
            <Text style={styles.colPaciente}>Paciente / C.I.</Text>
            <Text style={styles.colGerencia}>Gerencia</Text>
            <Text style={styles.colTipo}>Tipo / Reposo</Text>
            <Text style={styles.colSignos}>Signos Vitales</Text>
            <Text style={styles.colDiagnostico}>Diagnóstico</Text>
            <Text style={styles.colMedico}>Evaluador</Text>
          </View>

          {consultas.map((c, index) => {
            const isEven = index % 2 === 0;
            const rowStyle = isEven ? styles.tableRow : styles.tableRowAlternate;

            const isBeneficiario = c.patient?.patientType === 'BENEFICIARIO';
            const relKey = c.patient?.relationship;
            const relLabel = relKey ? (RELATIONSHIP_LABELS[relKey as keyof typeof RELATIONSHIP_LABELS] || relKey) : 'Familiar';
            const gerenciaText = c.patient?.gerencia || c.patient?.titular?.gerencia || '—';

            const vitalShort = [
              c.presionArterial ? `PA: ${c.presionArterial}` : '',
              c.frecuenciaCardiaca ? `FC: ${c.frecuenciaCardiaca}` : '',
              c.temperatura ? `T: ${c.temperatura}°C` : '',
              c.imc ? `IMC: ${c.imc}` : '',
            ]
              .filter(Boolean)
              .join(' | ') || 'N/R';

            return (
              <View key={c.id} style={rowStyle} wrap={false}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <View style={styles.colFecha}>
                  <Text>{safeFormat(c.fecha, 'dd/MM/yyyy', 'S/F')}</Text>
                  <Text style={styles.patientSubtext}>{c.hora || '—'}</Text>
                </View>
                <View style={styles.colPaciente}>
                  <Text style={styles.patientName}>
                    {c.patient?.firstName} {c.patient?.lastName}
                  </Text>
                  {isBeneficiario ? (
                    <>
                      <Text style={{ fontSize: 6.5, color: '#b45309', fontWeight: 'bold' }}>
                        Beneficiario ({relLabel})
                      </Text>
                      <Text style={styles.patientSubtext}>
                        {c.patient?.identificationNumber ? `C.I.: ${c.patient.identificationNumber}` : 'Menor S/C'}
                        {c.patient?.titular ? ` • Tit: ${c.patient.titular.firstName} ${c.patient.titular.lastName}` : ''}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.patientSubtext}>
                      C.I.: {c.patient?.identificationNumber || 'S/D'}
                    </Text>
                  )}
                </View>
                <Text style={styles.colGerencia}>{gerenciaText}</Text>
                <View style={styles.colTipo}>
                  <Text>{TIPO_CONSULTA_LABELS[c.tipoConsulta] || c.tipoConsulta}</Text>
                  {c.reposoMedico && (
                    <Text style={{ color: '#dc2626', fontWeight: 'bold', fontSize: 6.5 }}>
                      {isBeneficiario ? 'Constancia: ' : 'Reposo: '}{c.diasReposo || 1} d
                    </Text>
                  )}
                </View>
                <Text style={styles.colSignos}>{vitalShort}</Text>
                <Text style={styles.colDiagnostico}>
                  {c.diagnostico || 'Evaluación normal'}
                </Text>
                <View style={styles.colMedico}>
                  <Text style={{ fontWeight: 'bold' }}>
                    {c.doctor?.user?.name
                      ? `Dr(a). ${c.doctor.user.name}`
                      : c.nurse?.name
                      ? `${c.nurse.name}`
                      : 'No asignado'}
                  </Text>
                  <Text style={styles.patientSubtext}>
                    {c.doctor?.user?.name
                      ? (c.doctor?.specialty || 'General')
                      : c.nurse?.name
                      ? 'Enfermería'
                      : '—'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Uso exclusivo del Servicio de Salud Ocupacional de HIDROVEN.</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  );
};
