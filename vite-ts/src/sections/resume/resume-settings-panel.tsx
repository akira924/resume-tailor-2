import type { ResumeSettings, ResumeSectionId, ResumeNumericField } from './resume-settings';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Iconify } from 'src/components/iconify';

import {
  COLOR_THEMES,
  FONT_FAMILIES,
  MARGIN_RANGES,
  SECTION_LABELS,
  FONT_SIZE_RANGES,
} from './resume-settings';

// ----------------------------------------------------------------------

const HEADER_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

const SECTION_TITLE_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
] as const;

/** `rows` is a miniature of the entry: each row holds a left and an optional right text. */
const COMPANY_ENTRY_OPTIONS = [
  {
    value: 'titleFirst',
    rows: [
      ['Job Title', 'Period'],
      ['Company', 'Location'],
    ],
  },
  {
    value: 'companyFirst',
    rows: [
      ['Company', 'Location'],
      ['Job Title', 'Period'],
    ],
  },
  { value: 'stacked', rows: [['Company - Job Title'], ['Period | Location']] },
  { value: 'singleRow', rows: [['Company - Job Title', 'Period | Location']] },
] as const;

const formatPoints = (value: number) => `${value} pt`;
const formatInches = (value: number) => `${(value / 72).toFixed(2)} in`;

// ----------------------------------------------------------------------

type Props = {
  settings: ResumeSettings;
  canReset: boolean;
  onChange: (update: Partial<ResumeSettings>) => void;
  onReset: () => void;
  sx?: React.ComponentProps<typeof Card>['sx'];
};

export function ResumeSettingsPanel({ settings, canReset, onChange, onReset, sx }: Props) {
  const moveSection = (index: number, offset: number) => {
    const sectionOrder = [...settings.sectionOrder];
    const [section] = sectionOrder.splice(index, 1);

    sectionOrder.splice(index + offset, 0, section);
    onChange({ sectionOrder });
  };

  const renderNumericSlider = (
    field: ResumeNumericField,
    range: { label: string; min: number; max: number; step: number },
    format: (value: number) => string
  ) => (
    <Box key={field}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">{range.label}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {format(settings[field])}
        </Typography>
      </Box>
      <Slider
        size="small"
        value={settings[field]}
        min={range.min}
        max={range.max}
        step={range.step}
        onChange={(_, value) => onChange({ [field]: value as number })}
        slotProps={{ input: { 'aria-label': range.label } }}
      />
    </Box>
  );

  const renderSectionRow = (section: ResumeSectionId, index: number) => {
    const label = SECTION_LABELS[section];

    return (
      <Box
        key={section}
        sx={(theme) => ({
          pl: 1.5,
          pr: 0.5,
          py: 0.25,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 1,
          border: `solid 1px ${theme.vars.palette.divider}`,
        })}
      >
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        <IconButton
          size="small"
          disabled={index === 0}
          aria-label={`Move ${label} up`}
          onClick={() => moveSection(index, -1)}
        >
          <Iconify width={16} icon="eva:arrow-ios-upward-fill" />
        </IconButton>
        <IconButton
          size="small"
          disabled={index === settings.sectionOrder.length - 1}
          aria-label={`Move ${label} down`}
          onClick={() => moveSection(index, 1)}
        >
          <Iconify width={16} icon="eva:arrow-ios-downward-fill" />
        </IconButton>
      </Box>
    );
  };

  return (
    <Card sx={[{ display: 'flex', flexDirection: 'column' }, ...toArray(sx)]}>
      <CardHeader
        title="Customize"
        action={
          <Button
            size="small"
            color="inherit"
            disabled={!canReset}
            onClick={onReset}
            title="Restore the default resume design"
            startIcon={<Iconify icon="solar:restart-bold" />}
          >
            Reset
          </Button>
        }
        sx={{ pb: 2 }}
      />

      <Stack
        spacing={2.5}
        divider={<Divider sx={{ borderStyle: 'dashed' }} />}
        sx={{ px: 3, pb: 3, flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}
      >
        <PanelGroup title="Page">
          <TextField size="small" label="Size" value="US Letter" disabled fullWidth />
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Margin
            </Typography>
            {renderNumericSlider('marginVertical', MARGIN_RANGES.marginVertical, formatInches)}
            {renderNumericSlider('marginHorizontal', MARGIN_RANGES.marginHorizontal, formatInches)}
          </Box>
        </PanelGroup>

        <PanelGroup title="Layout">
          <Stack spacing={0.75}>{settings.sectionOrder.map(renderSectionRow)}</Stack>
        </PanelGroup>

        <PanelGroup title="Font">
          <TextField
            select
            fullWidth
            size="small"
            label="Font family"
            value={settings.fontFamily}
            onChange={(event) => onChange({ fontFamily: event.target.value })}
          >
            {FONT_FAMILIES.map((font) => (
              <MenuItem key={font.value} value={font.value}>
                {font.label}
              </MenuItem>
            ))}
          </TextField>
          <Box>
            {renderNumericSlider('fontSizeName', FONT_SIZE_RANGES.fontSizeName, formatPoints)}
            {renderNumericSlider(
              'fontSizeHeadline',
              FONT_SIZE_RANGES.fontSizeHeadline,
              formatPoints
            )}
            {renderNumericSlider(
              'fontSizeSectionTitle',
              FONT_SIZE_RANGES.fontSizeSectionTitle,
              formatPoints
            )}
            {renderNumericSlider('fontSizeBody', FONT_SIZE_RANGES.fontSizeBody, formatPoints)}
          </Box>
        </PanelGroup>

        <PanelGroup title="Header">
          <SegmentedControl
            label="Header layout"
            value={settings.headerLayout}
            options={HEADER_OPTIONS}
            onChange={(headerLayout) => onChange({ headerLayout })}
          />
        </PanelGroup>

        <PanelGroup title="Section title">
          <SegmentedControl
            label="Section title alignment"
            value={settings.sectionTitleAlign}
            options={SECTION_TITLE_OPTIONS}
            onChange={(sectionTitleAlign) => onChange({ sectionTitleAlign })}
          />
          <FormControlLabel
            label="Borders"
            labelPlacement="start"
            control={
              <Switch
                size="small"
                checked={settings.sectionTitleBorder}
                onChange={(event) => onChange({ sectionTitleBorder: event.target.checked })}
              />
            }
            sx={{ mx: 0, justifyContent: 'space-between' }}
          />
        </PanelGroup>

        <PanelGroup title="Company entry">
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            orientation="vertical"
            aria-label="Company entry layout"
            value={settings.companyEntry}
            onChange={(_, companyEntry) => companyEntry && onChange({ companyEntry })}
          >
            {COMPANY_ENTRY_OPTIONS.map((option, index) => (
              <ToggleButton
                key={option.value}
                value={option.value}
                aria-label={`Option ${index + 1}: ${option.rows.map((row) => row.join(', ')).join('; ')}`}
                sx={{ display: 'block', textTransform: 'none', fontWeight: 400 }}
              >
                {option.rows.map((row) => (
                  <Box
                    key={row[0]}
                    sx={{
                      display: 'flex',
                      fontSize: 11,
                      lineHeight: 1.5,
                      justifyContent: 'space-between',
                    }}
                  >
                    {row.map((text) => (
                      <span key={text}>{text}</span>
                    ))}
                  </Box>
                ))}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </PanelGroup>

        <PanelGroup title="Color theme">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {COLOR_THEMES.map((theme) => (
              <Tooltip key={theme.value} title={theme.label}>
                <ButtonBase
                  aria-label={`${theme.label} color theme`}
                  aria-pressed={settings.colorTheme === theme.value}
                  onClick={() => onChange({ colorTheme: theme.value })}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: theme.accent,
                    outlineOffset: 2,
                    outline:
                      settings.colorTheme === theme.value ? `solid 2px ${theme.accent}` : 'none',
                  }}
                />
              </Tooltip>
            ))}
          </Box>
        </PanelGroup>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

const toArray = <T,>(value: T) => (Array.isArray(value) ? value : [value]);

function PanelGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{title}</Typography>
      {children}
    </Stack>
  );
}

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
};

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      aria-label={label}
      value={value}
      // MUI reports null when the selected button is clicked again; keep the current value.
      onChange={(_, next: T | null) => next && onChange(next)}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} sx={{ textTransform: 'none' }}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
