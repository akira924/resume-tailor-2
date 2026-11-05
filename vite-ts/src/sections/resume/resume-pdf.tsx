import type { IResume } from 'src/types/resume';

import { useMemo } from 'react';
import { Page, Text, View, Font, Document, PDFViewer, StyleSheet } from '@react-pdf/renderer';

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  // fonts from public folder
  fonts: [{ src: '/fonts/Roboto-Regular.ttf' }, { src: '/fonts/Roboto-Bold.ttf', fontWeight: 700 }],
});

// Disable hyphenation so long tech terms (e.g. "ASP.NET") never get split.
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  text: '#1C252E',
  secondary: '#637381',
  divider: '#C4CDD5',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9.5,
    lineHeight: 1.45,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
    paddingVertical: 36,
    paddingHorizontal: 42,
  },
  // header
  header: { alignItems: 'center', marginBottom: 10 },
  name: { fontSize: 20, fontWeight: 700, lineHeight: 1.2 },
  headline: { fontSize: 11, color: COLORS.secondary, marginTop: 2 },
  contact: { fontSize: 9, color: COLORS.secondary, marginTop: 4, textAlign: 'center' },
  // section
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingBottom: 2,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    borderStyle: 'solid',
  },
  // rows
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  bold: { fontWeight: 700 },
  muted: { color: COLORS.secondary },
  skillRow: { flexDirection: 'row', marginBottom: 2 },
  skillCategory: { width: 150, fontWeight: 700 },
  skillList: { flex: 1 },
  // experience
  job: { marginBottom: 8 },
  roleDescription: { color: COLORS.secondary, marginTop: 2 },
  bullet: { flexDirection: 'row', marginBottom: 1.5 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
});

// ----------------------------------------------------------------------

type Props = {
  resume: IResume;
};

export function ResumePDFViewer({ resume }: Props) {
  // PDFViewer regenerates the PDF whenever its children reference changes, so keep the
  // element stable across parent re-renders (e.g. every keystroke in the JSON editor).
  const pdfDocument = useMemo(() => <ResumePdfDocument resume={resume} />, [resume]);

  return (
    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
      {pdfDocument}
    </PDFViewer>
  );
}

// ----------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ResumePdfDocument({ resume }: Props) {
  const { personal_info, online_presence } = resume;

  const contact = [
    personal_info.email,
    personal_info.phone,
    personal_info.location,
    online_presence.linkedin,
    online_presence.github,
    online_presence.website,
  ].filter(Boolean);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.name}>{personal_info.name}</Text>
      {!!resume.headline && <Text style={styles.headline}>{resume.headline}</Text>}
      {!!contact.length && <Text style={styles.contact}>{contact.join('  |  ')}</Text>}
    </View>
  );

  const renderSummary = () =>
    !!resume.summary && (
      <Section title="Summary">
        <Text>{resume.summary}</Text>
      </Section>
    );

  const renderSkills = () =>
    !!resume.skillsets.length && (
      <Section title="Skills">
        {resume.skillsets.map((set, index) => (
          <View key={index} style={styles.skillRow} wrap={false}>
            <Text style={styles.skillCategory}>{set.category}</Text>
            <Text style={styles.skillList}>{set.skills.join(', ')}</Text>
          </View>
        ))}
      </Section>
    );

  const renderExperience = () =>
    !!resume.experience.length && (
      <Section title="Experience">
        {resume.experience.map((job, index) => (
          <View key={index} style={styles.job}>
            {/* Keep the job heading with its first lines instead of orphaning it at a page bottom */}
            <View wrap={false}>
              <View style={styles.row}>
                <Text style={styles.bold}>{job.title}</Text>
                <Text style={styles.muted}>{job.period}</Text>
              </View>
              <View style={styles.row}>
                <Text>{job.company}</Text>
                <Text style={styles.muted}>{job.location}</Text>
              </View>
              {!!job.role_description && (
                <Text style={styles.roleDescription}>{job.role_description}</Text>
              )}
              {!!job.sentences.length && <Text style={styles.bold}>Key Contributions</Text>}
            </View>

            {job.sentences.map((sentence, i) => (
              <View
                key={i}
                style={[styles.bullet, i === job.sentences.length - 1 ? { marginBottom: 0 } : {}]}
                wrap={false}
              >
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{sentence}</Text>
              </View>
            ))}

            {!!job.used_skills?.length && (
              <Text>
                <Text style={styles.bold}>Technologies: </Text>
                {job.used_skills.join(', ')}
              </Text>
            )}
          </View>
        ))}
      </Section>
    );

  const renderEducation = () =>
    !!resume.education.length && (
      <Section title="Education">
        {resume.education.map((edu, index) => (
          <View key={index} style={{ marginBottom: 4 }} wrap={false}>
            <View style={styles.row}>
              <Text style={styles.bold}>{edu.institution}</Text>
              <Text style={styles.muted}>{edu.period}</Text>
            </View>
            <Text>{[edu.degree, edu.major].filter(Boolean).join(', ')}</Text>
          </View>
        ))}
      </Section>
    );

  const renderCertifications = () =>
    !!resume.cetification.length && (
      <Section title="Certifications">
        {resume.cetification.map((cert, index) => (
          <View key={index} style={styles.row} wrap={false}>
            <Text>
              <Text style={styles.bold}>{cert.name}</Text>
              {cert.institution ? `, ${cert.institution}` : ''}
            </Text>
            <Text style={styles.muted}>{cert.date}</Text>
          </View>
        ))}
      </Section>
    );

  return (
    <Document title={personal_info.name ? `${personal_info.name} - Resume` : 'Resume'}>
      <Page size="LETTER" style={styles.page}>
        {renderHeader()}
        {renderSummary()}
        {renderSkills()}
        {renderExperience()}
        {renderEducation()}
        {renderCertifications()}
      </Page>
    </Document>
  );
}
