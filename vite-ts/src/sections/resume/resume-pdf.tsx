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
  // Spacing between items uses rowGap on the parent, not marginBottom on the item: react-pdf
  // moves a whole View to the next page when it fits but its marginBottom does not.
  skills: { rowGap: 2 },
  // experience
  // Jobs must stay direct children of the section, with no wrapper View: if a wrapper's first
  // job can't start on the page, react-pdf puts the whole job on that page and cuts off its text.
  nextJob: { marginTop: 8 },
  roleDescription: { color: COLORS.secondary, marginTop: 2 },
  bullets: { rowGap: 1.5 },
  bullet: { flexDirection: 'row' },
  bulletDot: { width: 10 },
  bulletText: { flex: 1 },
  // education
  educations: { rowGap: 4 },
});

// Page-break rules: each of these stays together on one page (wrap={false}).
//  - Section title and its border line
//  - Company entry: job title, period, company, location
//  - Role description
//  - Each bullet, with the "Key Contributions" label on the first bullet
//    and "Technologies" on the last bullet
//  - Education entry
//  - Certification entry
// Anything else (summary, skills) may break between any two lines.

// By default react-pdf keeps at least 2 lines together, which pushes short groups of
// lines to the next page. This lets a break fall between any two lines of a text.
const BREAK_ANY_LINE = { orphans: 1, widows: 1 };

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
      <Text style={styles.sectionTitle} wrap={false}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function ResumePdfDocument({ resume }: Props) {
  const { personal_info, online_presence } = resume;

  // Personal details on one line, online presence on the next.
  const contact = [
    [personal_info.email, personal_info.phone, personal_info.location],
    [online_presence.linkedin, online_presence.github, online_presence.website],
  ]
    .map((items) => items.filter(Boolean).join('  |  '))
    .filter(Boolean)
    .join('\n');

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.name}>{personal_info.name}</Text>
      {!!resume.headline && <Text style={styles.headline}>{resume.headline}</Text>}
      {!!contact && <Text style={styles.contact}>{contact}</Text>}
    </View>
  );

  const renderSummary = () =>
    !!resume.summary && (
      <Section title="Professional Summary">
        <Text {...BREAK_ANY_LINE}>{resume.summary}</Text>
      </Section>
    );

  const renderSkills = () =>
    !!resume.skillsets.length && (
      <Section title="Technical Skills">
        <View style={styles.skills}>
          {resume.skillsets.map((set, index) => (
            <Text key={index} {...BREAK_ANY_LINE}>
              <Text style={styles.bold}>{set.category}: </Text>
              {set.skills.join(', ')}
            </Text>
          ))}
        </View>
      </Section>
    );

  const renderExperience = () =>
    !!resume.experience.length && (
      <Section title="Work Experience">
        {resume.experience.map((job, index) => {
          const technologies = !!job.used_skills?.length && (
            <Text wrap={false}>
              <Text style={styles.bold}>Technologies: </Text>
              {job.used_skills.join(', ')}
            </Text>
          );

          return (
            <View key={index} style={index > 0 ? styles.nextJob : undefined}>
              <View wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{job.title}</Text>
                  <Text style={styles.muted}>{job.period}</Text>
                </View>
                <View style={styles.row}>
                  <Text>{job.company}</Text>
                  <Text style={styles.muted}>{job.location}</Text>
                </View>
              </View>

              {!!job.role_description && (
                <Text style={styles.roleDescription} wrap={false}>
                  {job.role_description}
                </Text>
              )}

              <View style={styles.bullets}>
                {job.sentences.map((sentence, i) => (
                  <View key={i} wrap={false}>
                    {i === 0 && <Text style={styles.bold}>Key Contributions</Text>}
                    <View style={styles.bullet}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{sentence}</Text>
                    </View>
                    {i === job.sentences.length - 1 && technologies}
                  </View>
                ))}
              </View>

              {!job.sentences.length && technologies}
            </View>
          );
        })}
      </Section>
    );

  const renderEducation = () =>
    !!resume.education.length && (
      <Section title="Education">
        <View style={styles.educations}>
          {resume.education.map((edu, index) => (
            <View key={index} wrap={false}>
              <View style={styles.row}>
                <Text style={styles.bold}>{edu.institution}</Text>
                <Text style={styles.muted}>{edu.period}</Text>
              </View>
              <Text>{[edu.degree, edu.major].filter(Boolean).join(', ')}</Text>
            </View>
          ))}
        </View>
      </Section>
    );

  const renderCertifications = () =>
    !!resume.certification.length && (
      <Section title="Certifications">
        {resume.certification.map((cert, index) => (
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
