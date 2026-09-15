import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LOGO_MINAGUAS, LOGO_HIDROVEN } from '@/assets/logos';
import type { Patient, ClinicalHistory } from '@/types';
import { formatPatientAge, safeFormat } from '@/lib/utils';

const styles = StyleSheet.create({
    page: {
        paddingTop: 25,
        paddingBottom: 40,
        paddingHorizontal: 30,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica',
        fontSize: 8.5,
        color: '#1e293b',
    },
    // Header institucional
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
        fontSize: 7,
        fontWeight: 'bold',
        color: '#475569',
        textAlign: 'center',
    },
    institutionTitle: {
        fontSize: 8.5,
        fontWeight: 'bold',
        color: '#002060',
        textAlign: 'center',
        marginTop: 1,
    },
    serviceTitle: {
        fontSize: 7.5,
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
        paddingHorizontal: 12,
        alignSelf: 'center',
        marginBottom: 10,
    },
    docTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#166534',
        textAlign: 'center',
    },

    // Resumen del Paciente
    patientCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        padding: 10,
        marginBottom: 12,
    },
    patientHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 6,
        marginBottom: 6,
    },
    patientName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#002060',
    },
    typeBadge: {
        backgroundColor: '#e0f2fe',
        borderWidth: 1,
        borderColor: '#bae6fd',
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    typeBadgeText: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#0369a1',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    infoCol: {
        flex: 1,
    },
    infoColWide: {
        flex: 2,
    },
    label: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 1,
    },
    val: {
        fontSize: 8.5,
        color: '#0f172a',
    },

    // Sección de Consultas
    sectionDivider: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#002060',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 3,
        marginBottom: 10,
    },
    sectionDividerTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionDividerMeta: {
        fontSize: 7.5,
        color: '#93c5fd',
    },

    // Tarjeta de Historia Clínica individual
    historyCard: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 4,
        marginBottom: 14,
        overflow: 'hidden',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: '#cbd5e1',
        paddingVertical: 5,
        paddingHorizontal: 8,
    },
    historyTitle: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: '#002060',
    },
    historyDate: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#475569',
    },
    historyBody: {
        padding: 8,
    },

    // Sub-bloques clínicos
    clinicalBlock: {
        marginBottom: 7,
    },
    blockTitle: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#002060',
        textTransform: 'uppercase',
        marginBottom: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 1,
    },
    textContent: {
        fontSize: 8,
        lineHeight: 1.35,
        color: '#334155',
    },

    // Grid de signos vitales
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: '#e2e8f0',
        borderRadius: 3,
        padding: 5,
        marginBottom: 5,
    },
    vitalItem: {
        width: '25%',
        marginBottom: 3,
        paddingRight: 4,
    },
    vitalLabel: {
        fontSize: 6.5,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    vitalValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#0f172a',
    },

    // Diagnósticos Badges
    badgeWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 2,
    },
    diagBadge: {
        backgroundColor: '#eff6ff',
        borderWidth: 0.5,
        borderColor: '#bfdbfe',
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    diagText: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#1d4ed8',
    },

    // Plan de Manejo
    planItem: {
        marginBottom: 4,
    },
    planLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#002060',
        textTransform: 'uppercase',
    },
    planValue: {
        fontSize: 8,
        color: '#334155',
        lineHeight: 1.3,
    },

    // Notas de Evolución
    noteItem: {
        backgroundColor: '#f8fafc',
        borderLeftWidth: 2,
        borderLeftColor: '#0284c7',
        padding: 5,
        marginBottom: 4,
        borderRadius: 2,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    noteDate: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#0284c7',
    },
    noteDoctor: {
        fontSize: 7,
        color: '#64748b',
    },
    noteContent: {
        fontSize: 7.5,
        color: '#334155',
        lineHeight: 1.3,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 15,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 6.5,
        color: '#94a3b8',
    },
    pageNumber: {
        fontSize: 6.5,
        color: '#94a3b8',
    },
});

// Función para limpiar tags HTML de campos enriquecidos (CKEditor/TipTap)
function stripHtml(input: any): string {
    if (!input) return '';
    if (typeof input !== 'string') {
        if (typeof input === 'object') {
            if (input.descripcion) return stripHtml(input.descripcion);
            return Object.entries(input)
                .filter(([_, v]) => v !== null && v !== undefined && v !== '')
                .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${stripHtml(v)}`)
                .join('\n');
        }
        return String(input);
    }
    return input
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\n\s*\n/g, '\n')
        .trim();
}

const labelsMap: Record<string, string> = {
    // Constantes vitales estándar
    presionArterial: 'Presión Arterial',
    frecuenciaCardiaca: 'Frecuencia Cardíaca',
    frecuenciaRespiratoria: 'Frecuencia Respiratoria',
    saturacionOxigeno: 'Saturación O2',
    temperatura: 'Temperatura',
    peso: 'Peso',
    altura: 'Talla/Altura',
    imc: 'IMC',
    otros: 'Hallazgos Adicionales',
    examenes: 'Exámenes Complementarios',
    medicacion: 'Medicación / Tratamiento',
    medication: 'Medicación / Tratamiento',

    // Plantillas (Odontología, Fisioterapia, etc.)
    tiempo_inicio_curso: 'Tiempo, Inicio y Curso',
    signos_sintomas_principales: 'Signos y Síntomas Principales',
    funciones_biologicas: 'Funciones Biológicas',
    riesgos: 'Riesgos',
    ant_personales: 'Antecedentes Personales (Generales y Fisiológicos)',
    ant_patologicos: 'Antecedentes Patológicos',
    ant_estomatologicos: 'Antecedentes Estomatológicos',
    ant_familiares: 'Antecedentes Familiares',
    rasa: 'R.A.S.A. (Sistemas y Aparatos)',
    presion_arterial: 'Presión Arterial',
    frec_cardiaca: 'Frec. Cardíaca',
    frec_respiratoria: 'Frec. Respiratoria',
    sat_o2: 'Sat. O2',
    temp: 'Temperatura',
    examen_general: 'Examen Clínico General',
    examen_extraoral: 'Examen Estomatológico Extraoral',
    examen_intraoral: 'Examen Estomatológico Intraoral',
    saliva_lesiones: 'Saliva y Mapeo de Lesiones',
    plan_trabajo: 'Plan de Trabajo y Exámenes Auxiliares',
    diagnostico_definitivo: 'Diagnóstico Definitivo',
    plan_tratamiento: 'Plan de Tratamiento',
    control_evolucion: 'Control y Evolución',

    // Fisioterapia
    motivo_consulta: 'Motivo de Consulta',
    tratamientos_previos: 'Tratamientos Previos',
    talla: 'Talla/Altura',
    escala_dolor: 'Escala de Dolor (EVA)',
    antecedentes_patologicos: 'Antecedentes Patológicos',
    habitos_salud: 'Hábitos de Salud',
    marcha_deambulacion_traslados: 'Marcha, Deambulación y Traslados',
    observaciones_generales: 'Observaciones Generales',
    fuerza_muscular: 'Valoración de la Fuerza Muscular',
    goniometria_miembros_superiores: 'Goniometría Miembros Superiores',
    goniometria_miembros_inferiores: 'Goniometría Miembros Inferiores',
    evaluacion_postural: 'Evaluación Postural',
    diagnostico_medico: 'Diagnóstico Médico',
    diagnostico_fisioterapeutico: 'Diagnóstico Fisioterapéutico',
    examenes_auxiliares: 'Exámenes Auxiliares',
    agentes_electrofisicos: 'Agentes Electrofísicos e Indicaciones',
    contraindicaciones: 'Contraindicaciones',
    seguimiento_sesiones: 'Seguimiento de Sesiones',
};

const formatLabel = (key: string) => {
    if (labelsMap[key]) return labelsMap[key];
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim();
};

// Convierte diagnósticos en array limpio
function parseDiagnosticos(diag: any): string[] {
    if (!diag) return [];
    if (Array.isArray(diag)) return diag.map(d => String(d).trim()).filter(Boolean);
    if (typeof diag === 'string') {
        return diag.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [String(diag).trim()];
}

interface PatientFullHistoryPDFProps {
    patient: Patient;
    histories: ClinicalHistory[];
    templates?: any[];
}

export const PatientFullHistoryPDF = ({ patient, histories, templates }: PatientFullHistoryPDFProps) => {
    const today = new Date();
    const formattedDate = format(today, "dd 'de' MMMM, yyyy • HH:mm", { locale: es });

    // Filtrar solo historias activas y deduplicar
    const activeHistories = (histories || []).filter(h => h && h.isActive !== false);

    return (
        <Document title={`Expediente Médico - ${patient.lastName} ${patient.firstName}`}>
            <Page size="A4" style={styles.page}>
                {/* Membrete Institucional */}
                <View style={styles.headerContainer}>
                    <Image src={LOGO_MINAGUAS} style={styles.logoMinAguas} />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.countryTitle}>REPÚBLICA BOLIVARIANA DE VENEZUELA</Text>
                        <Text style={styles.institutionTitle}>C.A. HIDROLÓGICA VENEZOLANA (HIDROVEN - FALCÓN)</Text>
                        <Text style={styles.serviceTitle}>GERENCIA DE TALENTO HUMANO • UNIDAD DE BIENESTAR SOCIAL Y SALUD</Text>
                    </View>
                    <Image src={LOGO_HIDROVEN} style={styles.logoHidroven} />
                </View>

                {/* Badge de Título */}
                <View style={styles.docTitleBadge}>
                    <Text style={styles.docTitle}>EXPEDIENTE MÉDICO COMPLETO CONSOLIDADO</Text>
                </View>

                {/* Ficha Resumen del Paciente */}
                <View style={styles.patientCard}>
                    <View style={styles.patientHeaderRow}>
                        <Text style={styles.patientName}>
                            {patient.firstName} {patient.lastName}
                        </Text>
                        <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>
                                {patient.patientType === 'TITULAR' ? 'TRABAJADOR TITULAR' : 'BENEFICIARIO'}
                            </Text>
                        </View>
                    </View>

                    {/* Fila 1: Cédula, Edad, Fecha Nacimiento, Género */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>C.I. / Documento:</Text>
                            <Text style={styles.val}>{patient.identificationNumber || 'S/D'}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Edad:</Text>
                            <Text style={styles.val}>{formatPatientAge(patient.birthDate)}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Fecha Nacimiento:</Text>
                            <Text style={styles.val}>{safeFormat(patient.birthDate, 'dd/MM/yyyy', 'S/F')}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Género:</Text>
                            <Text style={styles.val}>
                                {patient.gender === 'FEMALE' ? 'Femenino' : patient.gender === 'MALE' ? 'Masculino' : (patient.gender || 'S/D')}
                            </Text>
                        </View>
                    </View>

                    {/* Fila 2: Teléfono, Gerencia/Cargo */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCol}>
                            <Text style={styles.label}>Teléfono:</Text>
                            <Text style={styles.val}>{patient.phone || 'No registrado'}</Text>
                        </View>
                        <View style={styles.infoColWide}>
                            <Text style={styles.label}>Gerencia / Cargo:</Text>
                            <Text style={styles.val}>
                                {patient.gerencia ? `${patient.gerencia}${patient.cargo ? ` • ${patient.cargo}` : ''}` : 'No registrado'}
                            </Text>
                        </View>
                    </View>

                    {/* Fila 3: Dirección */}
                    <View style={styles.infoRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Dirección de Habitación:</Text>
                            <Text style={styles.val}>{patient.address || 'No registrada'}</Text>
                        </View>
                    </View>
                </View>

                {/* Encabezado de Consultas Registradas */}
                <View style={styles.sectionDivider}>
                    <Text style={styles.sectionDividerTitle}>
                        Historial de Consultas Médicas ({activeHistories.length})
                    </Text>
                    <Text style={styles.sectionDividerMeta}>
                        Generado el {formattedDate}
                    </Text>
                </View>

                {/* Lista de Historias Clínicas */}
                {activeHistories.length > 0 ? (
                    activeHistories.map((h, idx) => {
                        const diagList = parseDiagnosticos(h.diagnosticos);
                        const medResponsable = h.doctor?.user?.name
                            ? `Dr(a). ${h.doctor.user.name}`
                            : h.doctor?.specialty
                            ? `Especialista en ${h.doctor.specialty}`
                            : 'Médico Tratante';

                        // Buscar plantilla coincidente por templateId o por especialidad
                        const matchingTemplate = templates?.find((t: any) =>
                            (h.templateId && t.id === h.templateId) ||
                            (t.specialty && h.specialty && t.specialty.toUpperCase() === h.specialty.toUpperCase())
                        )?.estructura || null;

                        // Signos vitales estándar
                        const ef = h.examenFisico || {};
                        const vitals = [
                            { label: 'Presión Art.', val: ef.presionArterial ? `${ef.presionArterial} mmHg` : (h.datosEspecificos?.presion_arterial ? `${h.datosEspecificos.presion_arterial}` : null) },
                            { label: 'Frec. Cardíaca', val: ef.frecuenciaCardiaca ? `${ef.frecuenciaCardiaca}` : (h.datosEspecificos?.frec_cardiaca ? `${h.datosEspecificos.frec_cardiaca}` : null) },
                            { label: 'Frec. Respiratoria', val: ef.frecuenciaRespiratoria ? `${ef.frecuenciaRespiratoria}` : (h.datosEspecificos?.frec_respiratoria ? `${h.datosEspecificos.frec_respiratoria}` : null) },
                            { label: 'Saturación O2', val: ef.saturacionOxigeno ? `${ef.saturacionOxigeno}%` : (h.datosEspecificos?.sat_o2 ? `${h.datosEspecificos.sat_o2}%` : null) },
                            { label: 'Temperatura', val: ef.temperatura ? `${ef.temperatura} °C` : (h.datosEspecificos?.temp ? `${h.datosEspecificos.temp} °C` : null) },
                            { label: 'Peso', val: ef.peso ? `${ef.peso} kg` : (h.datosEspecificos?.peso ? `${h.datosEspecificos.peso} kg` : null) },
                            { label: 'Talla', val: ef.altura ? `${ef.altura} cm` : (h.datosEspecificos?.altura || h.datosEspecificos?.talla ? `${h.datosEspecificos.altura || h.datosEspecificos.talla} cm` : null) },
                            { label: 'IMC', val: ef.imc || h.datosEspecificos?.imc || null },
                        ].filter(v => v.val);

                        const otrosHallazgos = stripHtml(ef.otros);
                        const antPersonalesText = stripHtml(h.antecedentesPersonales);
                        const antFamiliaresText = stripHtml(h.antecedentesFamiliares);
                        const habitosText = stripHtml(h.habitos);

                        return (
                            <View key={h.id || idx} style={styles.historyCard}>
                                {/* Header de la consulta */}
                                <View style={styles.historyHeader}>
                                    <Text style={styles.historyTitle}>
                                        {idx + 1}. Consulta de {h.specialty || 'Medicina General'}
                                    </Text>
                                    <Text style={styles.historyDate}>
                                        {safeFormat(h.fecha || h.createdAt, 'dd/MM/yyyy', 'S/F')}
                                    </Text>
                                </View>

                                <View style={styles.historyBody}>
                                    {/* Médico */}
                                    <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                                        <Text style={styles.label}>Médico Responsable: </Text>
                                        <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#0f172a' }}>{medResponsable}</Text>
                                    </View>

                                    {/* MODO A: Si coincide con una plantilla dinámica (Fisioterapia, Odontología, etc.) */}
                                    {matchingTemplate && Array.isArray(matchingTemplate.secciones) ? (
                                        <>
                                            {matchingTemplate.secciones.map((sec: any) => {
                                                const filledFields = (sec.campos || []).filter((campo: any) => {
                                                    const val = h.datosEspecificos?.[campo.id] ?? (h as any)[campo.id];
                                                    return val !== undefined && val !== null && val !== '' && String(val).trim() !== '<p></p>';
                                                });
                                                if (filledFields.length === 0) return null;

                                                return (
                                                    <View key={sec.id || sec.titulo} style={styles.clinicalBlock} wrap={false}>
                                                        <Text style={styles.blockTitle}>{sec.titulo}</Text>
                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                            {filledFields.map((campo: any) => {
                                                                const val = h.datosEspecificos?.[campo.id] ?? (h as any)[campo.id];
                                                                const width = campo.layout === 'full' ? '100%' : campo.layout === 'half' ? '50%' : '33.3%';
                                                                const textVal = campo.tipo === 'rich-text' ? stripHtml(val) : String(val);

                                                                return (
                                                                    <View key={campo.id} style={{ width, marginBottom: 5, paddingRight: 6 }}>
                                                                        <Text style={styles.label}>{campo.label}:</Text>
                                                                        <Text style={styles.textContent}>{textVal}</Text>
                                                                    </View>
                                                                );
                                                            })}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        /* MODO B: Historia Clínica Estándar / Medicina General */
                                        <>
                                            {/* Motivo de Consulta */}
                                            {h.motivoConsulta && (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Motivo de Consulta</Text>
                                                    <Text style={styles.textContent}>{h.motivoConsulta}</Text>
                                                </View>
                                            )}

                                            {/* Enfermedad Actual */}
                                            {h.enfermedadActual && (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Enfermedad Actual</Text>
                                                    <Text style={styles.textContent}>{h.enfermedadActual}</Text>
                                                </View>
                                            )}

                                            {/* Antecedentes Personales */}
                                            {antPersonalesText ? (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Antecedentes Personales</Text>
                                                    <Text style={styles.textContent}>{antPersonalesText}</Text>
                                                </View>
                                            ) : null}

                                            {/* Antecedentes Familiares */}
                                            {antFamiliaresText ? (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Antecedentes Familiares</Text>
                                                    <Text style={styles.textContent}>{antFamiliaresText}</Text>
                                                </View>
                                            ) : null}

                                            {/* Hábitos Psicobiológicos */}
                                            {habitosText ? (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Hábitos Psicobiológicos</Text>
                                                    <Text style={styles.textContent}>{habitosText}</Text>
                                                </View>
                                            ) : null}

                                            {/* Examen Físico / Signos Vitales */}
                                            {(vitals.length > 0 || otrosHallazgos) && (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Examen Físico</Text>
                                                    {vitals.length > 0 && (
                                                        <View style={styles.vitalsGrid}>
                                                            {vitals.map((v, i) => (
                                                                <View key={i} style={styles.vitalItem}>
                                                                    <Text style={styles.vitalLabel}>{v.label}:</Text>
                                                                    <Text style={styles.vitalValue}>{v.val}</Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                    {otrosHallazgos ? (
                                                        <View style={{ marginTop: 2 }}>
                                                            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#64748b' }}>HALLAZGOS CLÍNICOS:</Text>
                                                            <Text style={styles.textContent}>{otrosHallazgos}</Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            )}

                                            {/* Campos en datosEspecificos (por si tiene datos específicos sin plantilla registrada) */}
                                            {h.datosEspecificos && Object.keys(h.datosEspecificos).length > 0 && (
                                                <View style={styles.clinicalBlock} wrap={false}>
                                                    <Text style={styles.blockTitle}>Datos Específicos de Especialidad</Text>
                                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                                        {Object.entries(h.datosEspecificos).map(([k, v]) => {
                                                            const text = stripHtml(v);
                                                            if (!text || text === '<p></p>') return null;
                                                            return (
                                                                <View key={k} style={{ width: '50%', marginBottom: 5, paddingRight: 6 }}>
                                                                    <Text style={styles.label}>{formatLabel(k)}:</Text>
                                                                    <Text style={styles.textContent}>{text}</Text>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )}
                                        </>
                                    )}

                                    {/* Diagnósticos (Común para todas las plantillas y especialidades) */}
                                    {diagList.length > 0 && (
                                        <View style={styles.clinicalBlock} wrap={false}>
                                            <Text style={styles.blockTitle}>Diagnósticos</Text>
                                            <View style={styles.badgeWrap}>
                                                {diagList.map((d, i) => (
                                                    <View key={i} style={styles.diagBadge}>
                                                        <Text style={styles.diagText}>• {d}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {/* Plan de Manejo (Común si está presente) */}
                                    {h.planManejo && (
                                        <View style={styles.clinicalBlock} wrap={false}>
                                            <Text style={styles.blockTitle}>Plan de Manejo y Tratamiento</Text>
                                            {typeof h.planManejo === 'string' ? (
                                                <Text style={styles.textContent}>{stripHtml(h.planManejo)}</Text>
                                            ) : (
                                                Object.entries(h.planManejo).map(([k, v]) => {
                                                    const cleanV = stripHtml(v);
                                                    if (!cleanV) return null;
                                                    return (
                                                        <View key={k} style={styles.planItem}>
                                                            <Text style={styles.planLabel}>{formatLabel(k)}:</Text>
                                                            <Text style={styles.planValue}>{cleanV}</Text>
                                                        </View>
                                                    );
                                                })
                                            )}
                                        </View>
                                    )}

                                    {/* Notas de Evolución */}
                                    {h.notes && h.notes.length > 0 && (
                                        <View style={[styles.clinicalBlock, { marginTop: 4 }]} wrap={false}>
                                            <Text style={[styles.blockTitle, { color: '#0284c7' }]}>
                                                Notas de Evolución ({h.notes.filter((n: any) => n && n.isActive !== false).length})
                                            </Text>
                                            {h.notes
                                                .filter((n: any) => n && n.isActive !== false)
                                                .map((note: any) => (
                                                    <View key={note.id} style={styles.noteItem}>
                                                        <View style={styles.noteHeader}>
                                                            <Text style={styles.noteDate}>
                                                                {safeFormat(note.fecha || note.createdAt, 'dd/MM/yyyy • HH:mm', 'S/F')}
                                                            </Text>
                                                            <Text style={styles.noteDoctor}>
                                                                Dr(a). {note.doctor?.user?.name || 'Médico'}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.noteContent}>
                                                            {stripHtml(note.estadoSubjetivo) || 'Sin detalle subjetivo registrado.'}
                                                        </Text>
                                                    </View>
                                                ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={{ padding: 30, textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 4 }}>
                        <Text style={{ color: '#64748b', fontSize: 9 }}>
                            No se registran historias clínicas activas para este paciente.
                        </Text>
                    </View>
                )}

                {/* Footer Fijo */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        Portal Clínico de Historias • Hidroven-Falcón • Documento de uso confidencial y oficial.
                    </Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                    />
                </View>
            </Page>
        </Document>
    );
};
