import type { DatePickerProps } from '@mui/x-date-pickers/DatePicker';

// ----------------------------------------------------------------------

/** Mirrors CAREER_LEVELS in server/src/models/profile.ts. */
export const CAREER_LEVELS = [
  'Junior',
  'Mid',
  'Mid-Senior',
  'Senior',
  'Senior/Staff',
  'Staff',
  'Lead',
  'Principal',
] as const;

/** Resumes show month and year only, e.g. "Jan 2024". */
export const MONTH_PICKER_PROPS = {
  views: ['year', 'month'],
  openTo: 'year',
  format: 'MMM YYYY',
  slotProps: { field: { clearable: true } },
} satisfies Partial<DatePickerProps>;
