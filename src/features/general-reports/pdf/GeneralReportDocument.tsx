import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  DashboardSummary,
  SpecialtyDistribution,
  PatientDemographics,
  ConsultationTrend,
  TopDiagnosis,
  AppointmentStats,
} from '../types/reports.types';
import { NativePieChart } from './NativePieChart';
import { NativeAreaChart } from './NativeAreaChart';
import { NativeBarChart } from './NativeBarChart';
import { NativeHorizontalBarChart } from './NativeHorizontalBarChart';
import { NativeGaugeChart } from './NativeGaugeChart';
import { NativeRadarChart } from './NativeRadarChart';

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIMARY = '#4F46E5';
const SECONDARY = '#0ea5e9';
const SURFACE = '#f8fafc';
const BORDER = '#e2e8f0';
const TEXT_PRIMARY = '#1e293b';
const TEXT_MUTED = '#64748b';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_PRIMARY,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: `1.5pt solid ${PRIMARY}`,
  },
  headerBadge: {
    backgroundColor: PRIMARY,
    padding: '5 10',
    borderRadius: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 3,
  },
  headerRight: {
    width: 70,
    alignItems: 'flex-end',
  },
  headerPeriod: {
    fontSize: 7,
    color: TEXT_MUTED,
    textAlign: 'right',
  },
  // Stats Grid
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    padding: 10,
    backgroundColor: SURFACE,
    borderRadius: 6,
    borderLeft: `3pt solid ${PRIMARY}`,
  },
  statLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_PRIMARY,
  },
  statSub: {
    fontSize: 7,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  // Section
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PRIMARY,
    backgroundColor: '#eef2ff',
    padding: '5 8',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderRadius: 3,
  },
  chartBox: {
    padding: 12,
    border: `1pt solid ${BORDER}`,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  row2col: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  colBordered: {
    flex: 1,
    padding: 10,
    border: `1pt solid ${BORDER}`,
    borderRadius: 6,
  },
  colTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 32,
    right: 32,
    fontSize: 7,
    textAlign: 'center',
    color: '#94a3b8',
    borderTop: `0.5pt solid ${BORDER}`,
    paddingTop: 6,
  },
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface GeneralReportDocumentProps {
  summary: DashboardSummary | undefined;
  specialties: SpecialtyDistribution[] | undefined;
  demographics: PatientDemographics | undefined;
  trends: ConsultationTrend[] | undefined;
  diagnoses: TopDiagnosis[] | undefined;
  appointments: AppointmentStats | undefined;
  timeframe: string;
  isDoctor: boolean;
}

// ─── Header Component ─────────────────────────────────────────────────────────

const TIMEFRAME_LABELS: Record<string, string> = {
  '1w': 'Últimos 7 días',
  '1m': 'Último mes',
  '3m': 'Últimos 3 meses',
  '6m': 'Semestre (Ene - Jun)',
  '9m': 'Primeros 9 meses (Ene - Sep)',
  '1y': 'Año completo (Ene - Dic)',
  'custom': 'Período personalizado',
};

// ─── Document ─────────────────────────────────────────────────────────────────

export const GeneralReportDocument = ({
  summary,
  specialties = [],
  demographics,
  trends = [],
  diagnoses = [],
  appointments,
  timeframe,
  isDoctor = false,
}: GeneralReportDocumentProps) => {
  const safeSum = summary ?? {
    totalPatients: 0,
    totalConsultations: 0,
    activeDoctors: 0,
    dischargeRate: 0,
  };

  const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  const periodLabel = TIMEFRAME_LABELS[timeframe] ?? timeframe;

  // Chart data derivations
  const genderData = [
    { label: 'Masculino', value: demographics?.gender?.male ?? 0, color: '#3b82f6' },
    { label: 'Femenino', value: demographics?.gender?.female ?? 0, color: '#ec4899' },
    { label: 'Otro', value: demographics?.gender?.other ?? 0, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  const ageData = demographics
    ? Object.entries(demographics.ageRanges).map(([label, value], i) => ({
      label,
      value: Number(value),
      color: ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'][i],
    }))
    : [];

  const specialtyPieData = (specialties ?? []).map((s, i) => ({
    label: s.specialty,
    value: Number(s.count),
    color: ['#4F46E5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 7],
  }));

  const appointmentsStatusPieData = [
    { label: 'Agendadas', value: appointments?.statusStats?.SCHEDULED ?? 0, color: '#f59e0b' },
    { label: 'Completadas', value: appointments?.statusStats?.COMPLETED ?? 0, color: '#10b981' },
    { label: 'Canceladas', value: appointments?.statusStats?.CANCELLED ?? 0, color: '#ef4444' },
  ];

  const appointmentsByDayBarData = (appointments?.byDay ?? []).map(dayStat => ({
    label: dayStat.day.substring(0, 3),
    value: dayStat.count,
    color: PRIMARY,
  }));

  // Is daily grouping (based on whether dates contain full day YYYY-MM-DD)

  const ReportHeader = ({ page, total }: { page: number; total: number }) => (
    <View style={styles.header}>
      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeText}>Reportes Clínicos</Text>
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Reporte General</Text>
        <Text style={styles.headerSubtitle}>Generado el {dateStr}</Text>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.headerPeriod}>Período: {periodLabel}</Text>
        <Text style={[styles.headerPeriod, { marginTop: 3 }]}>Pág. {page} de {total}</Text>
      </View>
    </View>
  );

  return (
    <Document title={`Reporte General ${dateStr}`} author="Sistema Historias Clínicas">

      {/* ── PAGE 1: Resumen ejecutivo + Tendencias ── */}
      <Page size="LETTER" style={styles.page}>
        <ReportHeader page={1} total={3} />

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#6366f1' }]}>
            <Text style={styles.statLabel}>Pacientes registrados</Text>
            <Text style={styles.statValue}>{safeSum.totalPatients.toLocaleString()}</Text>
            <Text style={styles.statSub}>en el período</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: SECONDARY }]}>
            <Text style={styles.statLabel}>Total Consultas</Text>
            <Text style={styles.statValue}>{safeSum.totalConsultations.toLocaleString()}</Text>
            <Text style={styles.statSub}>notas clínicas activas</Text>
          </View>
          {!isDoctor && (
            <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
              <Text style={styles.statLabel}>Médicos Activos</Text>
              <Text style={styles.statValue}>{safeSum.activeDoctors.toLocaleString()}</Text>
              <Text style={styles.statSub}>en el período</Text>
            </View>
          )}
          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.statLabel}>Tasa de Altas</Text>
            <Text style={styles.statValue}>{safeSum.dischargeRate.toFixed(1)}%</Text>
            <Text style={styles.statSub}>pacientes dados de alta</Text>
          </View>
        </View>

        {/* Consultation Trends */}
        <Text style={styles.sectionTitle}>Tendencia de Consultas</Text>
        <View style={styles.chartBox}>
          <NativeAreaChart data={trends} timeframe={timeframe} color={PRIMARY} />
        </View>

        {/* Conditional Section based on isDoctor */}
        {!isDoctor ? (
          <>
            <Text style={styles.sectionTitle}>Carga por Especialidad</Text>
            <View style={styles.row2col}>
              <View style={styles.colBordered}>
                <Text style={styles.colTitle}>Distribución (Pie)</Text>
                <NativePieChart data={specialtyPieData} size={130} />
              </View>
              <View style={styles.colBordered}>
                <Text style={styles.colTitle}>Cobertura (Radar)</Text>
                <NativeRadarChart data={specialties ?? []} size={160} color={PRIMARY} />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Manejo de Agenda y Carga Laboral</Text>
            <View style={styles.row2col}>
              <View style={styles.colBordered}>
                <Text style={styles.colTitle}>Carga por Día</Text>
                <NativeBarChart data={appointmentsByDayBarData} height={120} color={PRIMARY} />
              </View>
              <View style={styles.colBordered}>
                <Text style={styles.colTitle}>Estado de Citas</Text>
                <NativePieChart data={appointmentsStatusPieData} size={130} isDonut />
              </View>
            </View>
          </>
        )}

        <Text style={styles.footer}>
          Sistema de Historias Clínicas — Reporte General | {dateStr} | Documento Confidencial
        </Text>
      </Page>

      {/* ── PAGE 2: Demografía ── */}
      <Page size="LETTER" style={styles.page}>
        <ReportHeader page={2} total={3} />

        <Text style={styles.sectionTitle}>Demografía de Pacientes</Text>
        <View style={styles.row2col}>
          {/* Gender */}
          <View style={styles.colBordered}>
            <Text style={styles.colTitle}>Distribución por Género</Text>
            <NativePieChart data={genderData} size={130} isDonut />
          </View>
          {/* Age */}
          <View style={styles.colBordered}>
            <Text style={styles.colTitle}>Grupos Etarios</Text>
            <NativeBarChart
              data={ageData}
              height={120}
            />
          </View>
        </View>

        {/* Tasa de Altas Gauge */}
        <Text style={styles.sectionTitle}>Indicador de Alta Médica</Text>
        <View style={[styles.chartBox, { alignItems: 'center', paddingVertical: 20 }]}>
          <NativeGaugeChart rate={safeSum.dischargeRate} size={200} color="#10b981" />
          <Text style={{ fontSize: 9, color: TEXT_MUTED, marginTop: 8, textAlign: 'center' }}>
            El {safeSum.dischargeRate.toFixed(1)}% de las consultas terminaron en alta médica durante el período analizado.
          </Text>
        </View>

        <Text style={styles.footer}>
          Sistema de Historias Clínicas — Reporte General | {dateStr} | Documento Confidencial
        </Text>
      </Page>

      {/* ── PAGE 3: Top Diagnósticos ── */}
      <Page size="LETTER" style={styles.page}>
        <ReportHeader page={3} total={3} />

        <Text style={styles.sectionTitle}>Top 10 Diagnósticos más Frecuentes</Text>
        <View style={styles.chartBox}>
          <NativeHorizontalBarChart data={diagnoses.slice(0, 10)} width={380} />
        </View>

        {/* Summary table of diagnoses counts */}
        {diagnoses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Detalle por Diagnóstico</Text>
            <View style={{ border: `1pt solid ${BORDER}`, borderRadius: 4, overflow: 'hidden' }}>
              {/* Table header */}
              <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9' }}>
                <Text style={{ width: '60%', padding: '5 8', fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEXT_MUTED }}>
                  Diagnóstico
                </Text>
                <Text style={{ width: '20%', padding: '5 8', fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEXT_MUTED, textAlign: 'center' }}>
                  Casos
                </Text>
                <Text style={{ width: '20%', padding: '5 8', fontSize: 8, fontFamily: 'Helvetica-Bold', color: TEXT_MUTED, textAlign: 'center' }}>
                  % del Total
                </Text>
              </View>
              {/* Table rows */}
              {diagnoses.slice(0, 10).map((d, i) => {
                const total = diagnoses.reduce((acc, x) => acc + x.count, 0);
                return (
                  <View
                    key={i}
                    style={{ flexDirection: 'row', backgroundColor: i % 2 === 0 ? '#fff' : SURFACE, borderTop: `0.5pt solid ${BORDER}` }}
                  >
                    <Text style={{ width: '60%', padding: '4 8', fontSize: 7.5 }}>{d.name}</Text>
                    <Text style={{ width: '20%', padding: '4 8', fontSize: 7.5, textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>
                      {d.count}
                    </Text>
                    <Text style={{ width: '20%', padding: '4 8', fontSize: 7.5, textAlign: 'center', color: PRIMARY }}>
                      {total > 0 ? ((d.count / total) * 100).toFixed(1) : 0}%
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.footer}>
          Sistema de Historias Clínicas — Reporte General | {dateStr} | Documento Confidencial
        </Text>
      </Page>
    </Document>
  );
};
