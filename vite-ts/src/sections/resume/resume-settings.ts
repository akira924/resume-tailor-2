// ----------------------------------------------------------------------

export type ResumeSectionId = 'skills' | 'experience' | 'education' | 'certification';
export type ResumeHeaderLayout = 'left' | 'center' | 'hybrid';
export type ResumeSectionTitleAlign = 'left' | 'center';
export type ResumeCompanyEntry = 'titleFirst' | 'companyFirst' | 'stacked' | 'singleRow';

/** Kept flat so a stored copy can be shallow-merged over the defaults. */
export type ResumeSettings = {
  /** Margins and font sizes are in points (72pt = 1in). */
  marginVertical: number;
  marginHorizontal: number;
  sectionOrder: ResumeSectionId[];
  fontSizeName: number;
  fontSizeHeadline: number;
  fontSizeSectionTitle: number;
  fontSizeBody: number;
  fontFamily: string;
  headerLayout: ResumeHeaderLayout;
  sectionTitleAlign: ResumeSectionTitleAlign;
  sectionTitleBorder: boolean;
  companyEntry: ResumeCompanyEntry;
  colorTheme: string;
};

export type ResumeNumericField =
  | 'marginVertical'
  | 'marginHorizontal'
  | 'fontSizeName'
  | 'fontSizeHeadline'
  | 'fontSizeSectionTitle'
  | 'fontSizeBody';

type NumericRange = { label: string; min: number; max: number; step: number };

export const MARGIN_RANGES = {
  marginVertical: { label: 'Top & bottom', min: 18, max: 72, step: 3 },
  marginHorizontal: { label: 'Left & right', min: 18, max: 72, step: 3 },
} satisfies Record<string, NumericRange>;

export const FONT_SIZE_RANGES = {
  fontSizeName: { label: 'Full name', min: 8, max: 32, step: 0.5 },
  fontSizeHeadline: { label: 'Headline', min: 8, max: 32, step: 0.5 },
  fontSizeSectionTitle: { label: 'Section titles', min: 8, max: 32, step: 0.5 },
  fontSizeBody: { label: 'Other text', min: 8, max: 32, step: 0.5 },
} satisfies Record<string, NumericRange>;

const NUMERIC_RANGES: Record<ResumeNumericField, NumericRange> = {
  ...MARGIN_RANGES,
  ...FONT_SIZE_RANGES,
};

export const SECTION_LABELS: Record<ResumeSectionId, string> = {
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  certification: 'Certification',
};

const SECTION_IDS = Object.keys(SECTION_LABELS) as ResumeSectionId[];

/** `value` is the family registered with react-pdf; its files are /fonts/<value>-*.ttf (no spaces). */
export const FONT_FAMILIES = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Arimo', label: 'Arimo (like Arial)' },
  { value: 'Carlito', label: 'Carlito (like Calibri)' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Tinos', label: 'Tinos (like Times New Roman)' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Lora', label: 'Lora' },
];

/** `accent` colors the name and section titles, `divider` the section title borders. */
export const COLOR_THEMES = [
  { value: 'classic', label: 'Classic', accent: '#1C252E', divider: '#C4CDD5' },
  { value: 'navy', label: 'Navy', accent: '#1F3A68', divider: '#B4C2DA' },
  { value: 'teal', label: 'Teal', accent: '#0F6470', divider: '#A9D0D5' },
  { value: 'forest', label: 'Forest', accent: '#1E5B43', divider: '#AFD0C2' },
  { value: 'burgundy', label: 'Burgundy', accent: '#7A1F3D', divider: '#DDB7C4' },
  { value: 'plum', label: 'Plum', accent: '#5B2A86', divider: '#CBB9DE' },
  { value: 'rust', label: 'Rust', accent: '#A23B12', divider: '#E6C0AF' },
];

export const DEFAULT_RESUME_SETTINGS: ResumeSettings = {
  marginVertical: 36,
  marginHorizontal: 42,
  sectionOrder: SECTION_IDS,
  fontSizeName: 20,
  fontSizeHeadline: 11,
  fontSizeSectionTitle: 10.5,
  fontSizeBody: 9.5,
  fontFamily: 'Roboto',
  headerLayout: 'center',
  sectionTitleAlign: 'left',
  sectionTitleBorder: true,
  companyEntry: 'titleFirst',
  colorTheme: 'classic',
};

const oneOf = <T>(value: unknown, allowed: readonly T[], fallback: T) =>
  allowed.includes(value as T) ? (value as T) : fallback;

/**
 * Stored settings may be stale or hand-edited, and an unknown font family makes react-pdf throw,
 * so anything invalid falls back to its default. Every section always appears exactly once.
 */
export function normalizeResumeSettings(stored: Partial<ResumeSettings>): ResumeSettings {
  const defaults = DEFAULT_RESUME_SETTINGS;

  const numeric = (field: ResumeNumericField) => {
    const value = stored[field];
    const { min, max } = NUMERIC_RANGES[field];

    return typeof value === 'number' && value >= min && value <= max ? value : defaults[field];
  };

  const storedOrder = Array.isArray(stored.sectionOrder) ? stored.sectionOrder : [];

  return {
    marginVertical: numeric('marginVertical'),
    marginHorizontal: numeric('marginHorizontal'),
    sectionOrder: [...new Set([...storedOrder, ...SECTION_IDS])].filter((id) =>
      SECTION_IDS.includes(id)
    ),
    fontSizeName: numeric('fontSizeName'),
    fontSizeHeadline: numeric('fontSizeHeadline'),
    fontSizeSectionTitle: numeric('fontSizeSectionTitle'),
    fontSizeBody: numeric('fontSizeBody'),
    fontFamily: oneOf(
      stored.fontFamily,
      FONT_FAMILIES.map((font) => font.value),
      defaults.fontFamily
    ),
    headerLayout: oneOf(
      stored.headerLayout,
      ['left', 'center', 'hybrid'] as const,
      defaults.headerLayout
    ),
    sectionTitleAlign: oneOf(
      stored.sectionTitleAlign,
      ['left', 'center'] as const,
      defaults.sectionTitleAlign
    ),
    sectionTitleBorder:
      typeof stored.sectionTitleBorder === 'boolean'
        ? stored.sectionTitleBorder
        : defaults.sectionTitleBorder,
    companyEntry: oneOf(
      stored.companyEntry,
      ['titleFirst', 'companyFirst', 'stacked', 'singleRow'] as const,
      defaults.companyEntry
    ),
    colorTheme: oneOf(
      stored.colorTheme,
      COLOR_THEMES.map((theme) => theme.value),
      defaults.colorTheme
    ),
  };
}
