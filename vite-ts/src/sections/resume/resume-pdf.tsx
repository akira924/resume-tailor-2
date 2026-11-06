import type { IResume } from 'src/types/resume';
import type { ResumeSettings, ResumeSectionId } from './resume-settings';

import { useMemo, Fragment } from 'react';
import { Page, Text, View, Font, Document, PDFViewer, StyleSheet } from '@react-pdf/renderer';

import { COLOR_THEMES, FONT_FAMILIES } from './resume-settings';

// ----------------------------------------------------------------------

// react-pdf only downloads the files of a family once a document uses it.
FONT_FAMILIES.forEach(({ value: family }) => {
  const file = family.replace(/\s/g, '');

  Font.register({
    family,
    // fonts from public folder
    fonts: [
      { src: `/fonts/${file}-Regular.ttf` },
      { src: `/fonts/${file}-Bold.ttf`, fontWeight: 700 },
    ],
  });
});

// Disable hyphenation so long tech terms (e.g. "ASP.NET") never get split.
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  text: '#1C252E',
  secondary: '#637381',
};

const createStyles = (settings: ResumeSettings) => {
  const theme = COLOR_THEMES.find(({ value }) => value === settings.colorTheme) ?? COLOR_THEMES[0];
  const headerAlign = settings.headerLayout === 'center' ? 'center' : 'left';

  return StyleSheet.create({
    page: {
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSizeBody,
      lineHeight: 1.45,
      color: COLORS.text,
      backgroundColor: '#FFFFFF',
      paddingVertical: settings.marginVertical,
      paddingHorizontal: settings.marginHorizontal,
    },
    // header
    header: { alignItems: headerAlign === 'center' ? 'center' : 'flex-start', marginBottom: 10 },
    hybridHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    hybridIdentity: { flex: 1, paddingRight: 16 },
    hybridContact: { maxWidth: '50%', color: COLORS.secondary, textAlign: 'right' },
    name: {
      fontSize: settings.fontSizeName,
      fontWeight: 700,
      lineHeight: 1.2,
      color: theme.accent,
    },
    headline: { fontSize: settings.fontSizeHeadline, color: COLORS.secondary, marginTop: 2 },
    contact: { color: COLORS.secondary, marginTop: 4, textAlign: headerAlign },
    // section
    section: { marginTop: 10 },
    sectionTitle: {
      fontSize: settings.fontSizeSectionTitle,
      fontWeight: 700,
      color: theme.accent,
      textAlign: settings.sectionTitleAlign,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingBottom: 2,
      marginBottom: 5,
      borderBottomWidth: settings.sectionTitleBorder ? 1 : 0,
      borderBottomColor: theme.divider,
      borderStyle: 'solid',
    },
    // rows
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    // A long left text wraps instead of pushing the right text off the page.
    rowStart: { flex: 1, paddingRight: 12 },
    rowEnd: { flexShrink: 0 },
    bold: { fontWeight: 700 },
    muted: { color: COLORS.secondary },
    // Spacing between items uses rowGap on the parent, not marginBottom on the item: react-pdf
    // moves a whole View to the next page when it fits but its marginBottom does not.
    skills: { rowGap: 2 },
    // experience
    // Jobs must stay direct children of the section, with no wrapper View: if a wrapper's first
    // job can't start on the page, react-pdf puts the whole job on that page and cuts off its text.
    // For the same reason, the first company entry is rendered with the section title, not in its job.
    nextJob: { marginTop: 8 },
    entryHighlight: { fontWeight: 700, color: theme.accent },
    roleDescription: { color: COLORS.secondary, marginTop: 2 },
    bullets: { rowGap: 1.5 },
    bullet: { flexDirection: 'row' },
    bulletDot: { width: 10 },
    bulletText: { flex: 1 },
    // education
    educations: { rowGap: 4 },
  });
};

type ResumeStyles = ReturnType<typeof createStyles>;

// Page-break rules: each of these stays together on one page (wrap={false}).
//  - Section title and its border line, together with the first entry of Work Experience,
//    Education and Certifications
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
  settings: ResumeSettings;
};

export function ResumePDFViewer({ resume, settings }: Props) {
  // PDFViewer regenerates the PDF whenever its children reference changes, so keep the
  // element stable across parent re-renders (e.g. every keystroke in the JSON editor).
  const pdfDocument = useMemo(
    () => <ResumePdfDocument resume={resume} settings={settings} />,
    [resume, settings]
  );

  return (
    <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
      {pdfDocument}
    </PDFViewer>
  );
}

// ----------------------------------------------------------------------

type SectionProps = {
  title: string;
  styles: ResumeStyles;
  /** Kept on the same page as the title. */
  firstEntry?: React.ReactNode;
  style?: ResumeStyles[keyof ResumeStyles];
  children?: React.ReactNode;
};

function Section({ title, styles, firstEntry, style, children }: SectionProps) {
  return (
    <View style={style ? [styles.section, style] : styles.section}>
      {/* Must be a direct child of the section. See the note on jobs in createStyles. */}
      <View wrap={false}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {firstEntry}
      </View>
      {children}
    </View>
  );
}

export function ResumePdfDocument({ resume, settings }: Props) {
  const { personal_info, online_presence } = resume;

  const styles = createStyles(settings);

  const contactGroups = [
    [personal_info.email, personal_info.phone, personal_info.location],
    [online_presence.linkedin, online_presence.github, online_presence.website],
  ].map((items) => items.filter(Boolean));

  // Personal details on one line, online presence on the next.
  const contact = contactGroups
    .map((items) => items.join('  |  '))
    .filter(Boolean)
    .join('\n');

  const renderIdentity = () => (
    <>
      <Text style={styles.name}>{personal_info.name}</Text>
      {!!resume.headline && <Text style={styles.headline}>{resume.headline}</Text>}
    </>
  );

  const renderHeader = () =>
    settings.headerLayout === 'hybrid' ? (
      <View style={styles.hybridHeader}>
        <View style={styles.hybridIdentity}>{renderIdentity()}</View>
        {!!contact && <Text style={styles.hybridContact}>{contactGroups.flat().join('\n')}</Text>}
      </View>
    ) : (
      <View style={styles.header}>
        {renderIdentity()}
        {!!contact && <Text style={styles.contact}>{contact}</Text>}
      </View>
    );

  // Each layout highlights whichever of company and job title comes first.
  const renderCompanyEntry = (job: IResume['experience'][number]) => {
    const [lead, ...others] = [job.company, job.title].filter(Boolean);
    const companyAndTitle = (
      <>
        <Text style={styles.entryHighlight}>{lead}</Text>
        {others.map((text) => ` - ${text}`).join('')}
      </>
    );
    const periodAndLocation = [job.period, job.location].filter(Boolean).join(' | ');

    switch (settings.companyEntry) {
      case 'companyFirst':
        return (
          <>
            <View style={styles.row}>
              <Text style={[styles.entryHighlight, styles.rowStart]}>{job.company}</Text>
              <Text style={[styles.muted, styles.rowEnd]}>{job.location}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowStart}>{job.title}</Text>
              <Text style={[styles.muted, styles.rowEnd]}>{job.period}</Text>
            </View>
          </>
        );
      case 'stacked':
        return (
          <>
            <Text style={styles.bold}>{companyAndTitle}</Text>
            <Text style={styles.muted}>{periodAndLocation}</Text>
          </>
        );
      case 'singleRow':
        return (
          <View style={styles.row}>
            <Text style={[styles.bold, styles.rowStart]}>{companyAndTitle}</Text>
            <Text style={[styles.muted, styles.rowEnd]}>{periodAndLocation}</Text>
          </View>
        );
      default:
        return (
          <>
            <View style={styles.row}>
              <Text style={[styles.entryHighlight, styles.rowStart]}>{job.title}</Text>
              <Text style={[styles.muted, styles.rowEnd]}>{job.period}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowStart}>{job.company}</Text>
              <Text style={[styles.muted, styles.rowEnd]}>{job.location}</Text>
            </View>
          </>
        );
    }
  };

  const renderSummary = () =>
    !!resume.summary && (
      <Section title="Professional Summary" styles={styles}>
        <Text {...BREAK_ANY_LINE}>{resume.summary}</Text>
      </Section>
    );

  const renderSkills = () =>
    !!resume.skillsets.length && (
      <Section title="Technical Skills" styles={styles}>
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
      <Section
        title="Work Experience"
        styles={styles}
        firstEntry={renderCompanyEntry(resume.experience[0])}
      >
        {resume.experience.map((job, index) => {
          const technologies = !!job.used_skills?.length && (
            <Text wrap={false}>
              <Text style={styles.bold}>Technologies: </Text>
              {job.used_skills.join(', ')}
            </Text>
          );

          return (
            <View key={index} style={index > 0 ? styles.nextJob : undefined}>
              {index > 0 && <View wrap={false}>{renderCompanyEntry(job)}</View>}

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

  const renderEducationEntry = (edu: IResume['education'][number]) => (
    <>
      <View style={styles.row}>
        <Text style={styles.bold}>{edu.institution}</Text>
        <Text style={styles.muted}>{edu.period}</Text>
      </View>
      <Text>{[edu.degree, edu.major].filter(Boolean).join(', ')}</Text>
    </>
  );

  const renderEducation = () =>
    !!resume.education.length && (
      <Section
        title="Education"
        styles={styles}
        style={styles.educations}
        firstEntry={renderEducationEntry(resume.education[0])}
      >
        {resume.education.slice(1).map((edu, index) => (
          <View key={index} wrap={false}>
            {renderEducationEntry(edu)}
          </View>
        ))}
      </Section>
    );

  const renderCertificationEntry = (cert: IResume['certification'][number]) => (
    <View style={styles.row}>
      <Text>
        <Text style={styles.bold}>{cert.name}</Text>
        {cert.institution ? `, ${cert.institution}` : ''}
      </Text>
      <Text style={styles.muted}>{cert.date}</Text>
    </View>
  );

  const renderCertifications = () =>
    !!resume.certification.length && (
      <Section
        title="Certifications"
        styles={styles}
        firstEntry={renderCertificationEntry(resume.certification[0])}
      >
        {resume.certification.slice(1).map((cert, index) => (
          <View key={index} wrap={false}>
            {renderCertificationEntry(cert)}
          </View>
        ))}
      </Section>
    );

  const SECTION_RENDERERS: Record<ResumeSectionId, () => React.ReactNode> = {
    skills: renderSkills,
    experience: renderExperience,
    education: renderEducation,
    certification: renderCertifications,
  };

  return (
    <Document title={personal_info.name ? `${personal_info.name} - Resume` : 'Resume'}>
      {/* react-pdf's reconciler doesn't support moving keyed children (a moved section would end
          up in the PDF twice), so reordering rebuilds the page instead. */}
      <Page key={settings.sectionOrder.join()} size="LETTER" style={styles.page}>
        {renderHeader()}
        {renderSummary()}
        {settings.sectionOrder.map((id) => (
          <Fragment key={id}>{SECTION_RENDERERS[id]()}</Fragment>
        ))}
      </Page>
    </Document>
  );
}
