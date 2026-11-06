import type { IResume } from 'src/types/resume';
import type { SavedResume } from 'src/actions/resume';
import type { ResumeSettings } from '../resume-settings';

import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';
import { useDebounce } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import { useColorScheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { _resume } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetResume, updateResume } from 'src/actions/resume';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { UnsavedChangesDialog } from 'src/components/unsaved-changes-dialog';

import { ResumePDFViewer } from '../resume-pdf';
import { parseResumeJson } from '../resume-utils';
import { ResumeSettingsPanel } from '../resume-settings-panel';
import { normalizeResumeSettings, DEFAULT_RESUME_SETTINGS } from '../resume-settings';

// ----------------------------------------------------------------------

const INITIAL_JSON = JSON.stringify(_resume, null, 2);

/** Panels are stacked: a compact editor on top, a full-height PDF preview below. */
const EDITOR_HEIGHT = '480px';
const PREVIEW_HEIGHT = { xs: 640, md: 'max(720px, calc(100vh - 160px))' };

// Defined once so CodeMirror doesn't reconfigure on every render.
const EDITOR_EXTENSIONS = [json()];

const DEFAULT_SETTINGS_JSON = JSON.stringify(DEFAULT_RESUME_SETTINGS);

/**
 * Keeps the save button and control panel on screen, beside the editor and preview, while the page
 * scrolls. Never taller than the preview, or it would slide under the header at the end of the page.
 */
const SETTINGS_COLUMN_SX = {
  position: { lg: 'sticky' },
  top: { lg: 'calc(var(--layout-header-desktop-height) + 16px)' },
  maxHeight: { lg: 'calc(100vh - 160px)' },
};

/** Lets the panel, rather than the save button, give up height when the column is capped. */
const SETTINGS_PANEL_SX = { flex: '1 1 auto', minHeight: 0 };

export function ResumeView() {
  const { resume, resumeLoading, resumeError } = useGetResume();

  const renderContent = () => {
    if (resumeLoading) {
      return <LoadingScreen />;
    }

    if (resumeError) {
      return (
        <EmptyContent
          filled
          title="Couldn't load your resume"
          description={resumeError.message}
          sx={{ py: 10 }}
        />
      );
    }

    return <ResumeEditor savedResume={resume} />;
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Resume"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Resume' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {renderContent()}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

type ResumeEditorProps = {
  /** Null until the first save: the editor then starts from the mock resume and default design. */
  savedResume: SavedResume | null;
};

function ResumeEditor({ savedResume }: ResumeEditorProps) {
  const { mode, systemMode } = useColorScheme();
  const editorTheme = (mode === 'system' ? systemMode : mode) === 'dark' ? 'dark' : 'light';

  // What the database holds, for spotting unsaved changes.
  const [baseline, setBaseline] = useState(() => ({
    jsonText: savedResume ? JSON.stringify(savedResume.data, null, 2) : INITIAL_JSON,
    settingsJson: JSON.stringify(normalizeResumeSettings(savedResume?.settings ?? {})),
  }));

  const [jsonText, setJsonText] = useState(baseline.jsonText);
  const [resume, setResume] = useState<IResume>(() => parseResumeJson(jsonText).resume ?? _resume);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Read up front, so the first PDF generated already uses the saved design.
  const [settings, setSettings] = useState<ResumeSettings>(() => JSON.parse(baseline.settingsJson));
  const settingsJson = JSON.stringify(settings);

  const [saving, setSaving] = useState(false);

  const isDirty = jsonText !== baseline.jsonText || settingsJson !== baseline.settingsJson;

  // Re-rendering the PDF is expensive, so wait for a pause in typing or slider dragging.
  const debouncedText = useDebounce(jsonText, 500);
  const debouncedSettingsJson = useDebounce(settingsJson, 300);
  const previewSettings: ResumeSettings = useMemo(
    () => JSON.parse(debouncedSettingsJson),
    [debouncedSettingsJson]
  );

  const handleChangeSettings = useCallback(
    (update: Partial<ResumeSettings>) => setSettings((prev) => ({ ...prev, ...update })),
    []
  );

  const handleResetSettings = useCallback(() => setSettings(DEFAULT_RESUME_SETTINGS), []);

  useEffect(() => {
    const result = parseResumeJson(debouncedText);

    if (!result.resume) {
      // Keep showing the last valid resume while the JSON is broken.
      setJsonError(result.error);
      return;
    }

    setJsonError(null);
    setResume(result.resume);
  }, [debouncedText]);

  const handleSave = useCallback(async () => {
    // `jsonError` lags behind typing, so check the text being saved. Broken JSON is never saved.
    const { error } = parseResumeJson(jsonText);

    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);

    try {
      await updateResume({ data: JSON.parse(jsonText), settings });
      // The values sent, not the latest: edits made during the save are still unsaved.
      setBaseline({ jsonText, settingsJson });
      toast.success('Resume saved!');
    } catch (saveError) {
      console.error(saveError);
      toast.error(saveError instanceof Error ? saveError.message : 'Something went wrong!');
    } finally {
      setSaving(false);
    }
  }, [jsonText, settings, settingsJson]);

  const handleReset = useCallback(() => setJsonText(INITIAL_JSON), []);

  const handleFormat = useCallback(() => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
    } catch {
      // Invalid JSON: the error alert already explains why.
    }
  }, [jsonText]);

  const renderJsonPanel = () => (
    <Card>
      <CardHeader
        title="Resume data"
        subheader="Edit the JSON — the preview updates automatically"
        action={
          <>
            <Button
              size="small"
              color="inherit"
              disabled={!!jsonError}
              onClick={handleFormat}
              title="Re-indent the JSON with 2 spaces"
              startIcon={<Iconify icon="solar:pen-bold" />}
              sx={{ mr: 1 }}
            >
              Format
            </Button>
            <Button
              size="small"
              color="inherit"
              disabled={jsonText === INITIAL_JSON}
              onClick={handleReset}
              title="Discard edits and restore the original resume data"
              startIcon={<Iconify icon="solar:restart-bold" />}
            >
              Reset
            </Button>
          </>
        }
        sx={{ mb: 2 }}
      />

      {jsonError && (
        <Alert severity="error" sx={{ mx: 3, mb: 2 }}>
          {jsonError}
        </Alert>
      )}

      <Box
        sx={(theme) => ({
          borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          '& .cm-editor': { fontSize: 13 },
          '& .cm-editor.cm-focused': { outline: 'none' },
          '& .cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            lineHeight: 1.6,
          },
        })}
      >
        <CodeMirror
          value={jsonText}
          height={EDITOR_HEIGHT}
          theme={editorTheme}
          extensions={EDITOR_EXTENSIONS}
          onChange={setJsonText}
          aria-label="Resume JSON"
        />
      </Box>
    </Card>
  );

  const renderPreviewPanel = () => (
    <Card sx={{ height: PREVIEW_HEIGHT, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Resume preview"
        subheader={resume.company_target ? `Tailored for ${resume.company_target}` : 'Rendered PDF'}
        sx={{ mb: 2 }}
      />

      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <ResumePDFViewer resume={resume} settings={previewSettings} />
      </div>
    </Card>
  );

  return (
    <Box
      sx={{
        gap: 3,
        display: 'grid',
        alignItems: 'start',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 340px' },
      }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        {renderJsonPanel()}
        {renderPreviewPanel()}
      </Stack>

      <Stack spacing={2} sx={SETTINGS_COLUMN_SX}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          loading={saving}
          // Before the first save, the untouched mock can still be saved.
          disabled={!!jsonError || (!isDirty && !!savedResume)}
          onClick={handleSave}
        >
          Save resume
        </Button>

        <ResumeSettingsPanel
          settings={settings}
          canReset={settingsJson !== DEFAULT_SETTINGS_JSON}
          onChange={handleChangeSettings}
          onReset={handleResetSettings}
          sx={SETTINGS_PANEL_SX}
        />
      </Stack>

      <UnsavedChangesDialog when={isDirty && !saving} />
    </Box>
  );
}
