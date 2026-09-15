import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { Consulta } from '../types/consultas.type';
import { TIPO_CONSULTA_LABELS } from '../types/consultas.type';
import { safeFormat } from '@/lib/utils';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#002060',
    paddingBottom: 8,
    marginBottom: 12,
  },
  logoMinAguas: {
    width: 110,
    height: 32,
    objectFit: 'contain',
  },
  logoHidroven: {
    width: 55,
    height: 32,
    objectFit: 'contain',
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  countryTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
  },
  institutionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#002060',
    textAlign: 'center',
    marginTop: 1,
  },
  serviceTitle: {
    fontSize: 8,
    color: '#0284c7',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 1,
  },
  docTitleBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'center',
    marginBottom: 10,
  },
  docTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#166534',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#002060',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    marginBottom: 6,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  col1: {
    width: '100%',
    paddingRight: 4,
    marginBottom: 4,
  },
  col2: {
    width: '50%',
    paddingRight: 6,
    marginBottom: 4,
  },
  col3: {
    width: '33.33%',
    paddingRight: 4,
    marginBottom: 4,
  },
  col4: {
    width: '25%',
    paddingRight: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 7.5,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 8.5,
    color: '#0f172a',
    marginTop: 1,
  },
  vitalBadge: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  vitalLabel: {
    fontSize: 7,
    color: '#64748b',
    fontWeight: 'bold',
  },
  vitalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#002060',
    marginTop: 1,
  },
  cardBlock: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#fafafa',
    marginBottom: 6,
  },
  reposoCard: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
    borderRadius: 4,
    padding: 6,
    marginBottom: 6,
  },
  signatureContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  signatureBox: {
    width: '42%',
    borderTopWidth: 1,
    borderTopColor: '#475569',
    paddingTop: 4,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: 7,
  },
});

interface ConsultaReportPDFProps {
  consulta: Consulta;
}

export const ConsultaReportPDF = ({ consulta }: ConsultaReportPDFProps) => {
  const patient = consulta.patient;
  const doctor = consulta.doctor;
  const nurse = consulta.nurse;
  const formattedDate = safeFormat(
    consulta.fecha,
    "dd 'de' MMMM, yyyy",
    'No registrada'
  );

  return (
    <Document title={`Consulta - ${patient?.firstName || 'Paciente'} ${patient?.lastName || ''}`}>
      <Page size="A4" style={styles.page}>
        {/* Cabecera Institucional */}
        <View style={styles.headerContainer}>
          <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.institutionTitle}>PORTAL CLÍNICO DE HISTORIAS - HIDROVEN-FALCÓN</Text>
            <Text style={styles.serviceTitle}>SERVICIO MÉDICO Y SALUD OCUPACIONAL</Text>
          </View>
          <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
        </View>

        {/* Título de Documento */}
        <View style={styles.docTitleBadge}>
          <Text style={styles.docTitle}>
            INFORME DE CONSULTA MÉDICA / CHEQUEO DIARIO
          </Text>
        </View>

        {/* 1. Datos del Paciente */}
        <Text style={styles.sectionTitle}>1. DATOS DE IDENTIFICACIÓN DEL PACIENTE</Text>
        <View style={styles.cardBlock}>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>Nombres y Apellidos</Text>
              <Text style={[styles.value, { fontWeight: 'bold' }]}>
                {patient?.firstName} {patient?.lastName}
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Cédula de Identidad</Text>
              <Text style={styles.value}>{patient?.identificationNumber || 'S/D'}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Condición</Text>
              <Text style={[styles.value, { fontWeight: 'bold', color: patient?.patientType === 'BENEFICIARIO' ? '#b45309' : '#002060' }]}>
                {patient?.patientType === 'BENEFICIARIO'
                  ? `Beneficiario (${patient?.relationship || 'Familiar'})`
                  : 'Trabajador Titular'}
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Género</Text>
              <Text style={styles.value}>
                {patient?.gender === 'MALE'
                  ? 'Masculino'
                  : patient?.gender === 'FEMALE'
                  ? 'Femenino'
                  : (patient?.gender || 'No registrado')}
              </Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Gerencia / Dpto.</Text>
              <Text style={styles.value}>{patient?.gerencia || 'No asignada'}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Cargo Ocupacional</Text>
              <Text style={styles.value}>{patient?.cargo || 'No registrado'}</Text>
            </View>
            {patient?.patientType === 'BENEFICIARIO' && patient?.titular && (
              <View style={[styles.col1, { marginTop: 3, paddingTop: 3, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' }]}>
                <Text style={styles.label}>Trabajador Titular Responsable</Text>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>
                  {patient.titular.firstName} {patient.titular.lastName} (C.I: {patient.titular.identificationNumber || 'S/D'}) — {patient.titular.gerencia || 'Sin gerencia'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 2. Datos de la Atención */}
        <Text style={styles.sectionTitle}>2. REGISTRO DE LA ATENCIÓN</Text>
        <View style={styles.cardBlock}>
          <View style={styles.grid}>
            <View style={styles.col3}>
              <Text style={styles.label}>Fecha de Atención</Text>
              <Text style={styles.value}>{formattedDate}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Hora</Text>
              <Text style={styles.value}>{consulta.hora || 'No registrada'}</Text>
            </View>
            <View style={styles.col3}>
              <Text style={styles.label}>Tipo de Chequeo</Text>
              <Text style={[styles.value, { fontWeight: 'bold' }]}>
                {TIPO_CONSULTA_LABELS[consulta.tipoConsulta] || consulta.tipoConsulta}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Signos Vitales y Triaje */}
        <Text style={styles.sectionTitle}>3. SIGNOS VITALES Y CONSTANTES BIOMÉTRICAS</Text>
        <View style={styles.grid}>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Presión Arterial</Text>
              <Text style={styles.vitalValue}>{consulta.presionArterial || '—'} mmHg</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Frec. Cardíaca</Text>
              <Text style={styles.vitalValue}>{consulta.frecuenciaCardiaca || '—'} bpm</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Frec. Respiratoria</Text>
              <Text style={styles.vitalValue}>{consulta.frecuenciaRespiratoria || '—'} rpm</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Temperatura</Text>
              <Text style={styles.vitalValue}>{consulta.temperatura || '—'} °C</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Saturación O2</Text>
              <Text style={styles.vitalValue}>{consulta.saturacionOxigeno || '—'} %</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Peso (kg)</Text>
              <Text style={styles.vitalValue}>{consulta.peso || '—'} kg</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Talla (cm)</Text>
              <Text style={styles.vitalValue}>{consulta.altura || '—'} cm</Text>
            </View>
          </View>
          <View style={styles.col4}>
            <View style={styles.vitalBadge}>
              <Text style={styles.vitalLabel}>Índice IMC</Text>
              <Text style={styles.vitalValue}>{consulta.imc || '—'}</Text>
            </View>
          </View>
        </View>

        {/* 4. Evaluación Médica y Diagnóstico */}
        <Text style={styles.sectionTitle}>4. EVALUACIÓN MÉDICA Y DIAGNÓSTICO</Text>
        <View style={styles.cardBlock}>
          <Text style={styles.label}>Motivo de Consulta / Chequeo</Text>
          <Text style={[styles.value, { marginBottom: 4 }]}>{consulta.motivoConsulta}</Text>

          {consulta.sintomas && (
            <>
              <Text style={styles.label}>Sintomatología / Anamnesis</Text>
              <Text style={[styles.value, { marginBottom: 4 }]}>{consulta.sintomas}</Text>
            </>
          )}

          {consulta.examenFisico && (
            <>
              <Text style={styles.label}>Hallazgos al Examen Físico</Text>
              <Text style={[styles.value, { marginBottom: 4 }]}>{consulta.examenFisico}</Text>
            </>
          )}

          <Text style={styles.label}>Diagnóstico Principal</Text>
          <Text style={[styles.value, { fontWeight: 'bold', color: '#002060' }]}>
            {consulta.diagnostico || 'Evaluación Médica de Rutina Sin Hallazgos Patológicos'}
          </Text>
        </View>

        {/* 5. Tratamiento y Conducta */}
        <Text style={styles.sectionTitle}>5. TRATAMIENTO, RECETA E INDICACIONES</Text>
        <View style={styles.cardBlock}>
          <Text style={styles.label}>Prescripción Farmacológica / Indicaciones</Text>
          <Text style={[styles.value, { marginBottom: 4 }]}>
            {consulta.tratamiento || 'Recomendaciones higiénico-dietéticas generales.'}
          </Text>

          {consulta.examenesSolicitados && (
            <>
              <Text style={styles.label}>Exámenes Paraclínicos Solicitados</Text>
              <Text style={styles.value}>{consulta.examenesSolicitados}</Text>
            </>
          )}
        </View>

        {/* 6. Reposo Médico (si aplica) */}
        {consulta.reposoMedico && (
          <>
            <Text style={styles.sectionTitle}>6. CONSTANCIA DE REPOSO MÉDICO LABORAL</Text>
            <View style={styles.reposoCard}>
              <View style={styles.grid}>
                <View style={styles.col3}>
                  <Text style={styles.label}>Días de Reposo Otorgados</Text>
                  <Text style={[styles.value, { fontWeight: 'bold', color: '#dc2626' }]}>
                    {consulta.diasReposo} DÍA(S) CONTINUO(S)
                  </Text>
                </View>
                <View style={styles.col3}>
                  <Text style={styles.label}>Fecha Inicio</Text>
                  <Text style={styles.value}>
                    {safeFormat(consulta.fechaInicioReposo, 'dd/MM/yyyy')}
                  </Text>
                </View>
                <View style={styles.col3}>
                  <Text style={styles.label}>Fecha Fin / Reincorporación</Text>
                  <Text style={styles.value}>
                    {safeFormat(consulta.fechaFinReposo, 'dd/MM/yyyy')}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Firmas y Validación */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: 'bold', fontSize: 8.5 }}>
              {doctor?.user?.name
                ? `Dr(a). ${doctor.user.name}`
                : nurse?.name
                ? `${nurse.name}`
                : 'Médico / Evaluador'}
            </Text>
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>
              {doctor?.user?.name
                ? (doctor?.specialty || 'Medicina Ocupacional / General')
                : nurse?.name
                ? 'Personal de Enfermería / Salud Ocupacional'
                : 'Servicio Médico y Salud Ocupacional'}
            </Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>
              Firma y Sello Profesional
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: 'bold', fontSize: 8.5 }}>Firma del Trabajador / Paciente</Text>
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 1 }}>
              C.I.: {patient?.identificationNumber || '—'}
            </Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', marginTop: 1 }}>Conforme con la atención</Text>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>Documento médico legal emitido por el Servicio Médico de HIDROVEN.</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
            fixed
          />
        </View>
      </Page>
    </Document>
  );
};
