import type { IResume } from 'src/types/resume';

import { useDebounce } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import CardHeader from '@mui/material/CardHeader';

import { paths } from 'src/routes/paths';

import { _resume } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ResumePDFViewer } from '../resume-pdf';
import { parseResumeJson } from '../resume-utils';

// ----------------------------------------------------------------------

const INITIAL_JSON = JSON.stringify(_resume, null, 2);

/** Both panels share this height so the editor and the PDF line up. */
const PANEL_HEIGHT = { xs: 640, md: 'calc(100vh - 220px)' };

export function ResumeView() {
  const [jsonText, setJsonText] = useState(INITIAL_JSON);
  const [resume, setResume] = useState<IResume>(_resume);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Re-rendering the PDF is expensive, so wait for a pause in typing.
  const debouncedText = useDebounce(jsonText, 500);

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

  const handleReset = useCallback(() => setJsonText(INITIAL_JSON), []);

  const handleFormat = useCallback(() => {
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
    } catch {
      // Invalid JSON: the error alert already explains why.
    }
  }, [jsonText]);

  const renderJsonPanel = () => (
    <Card sx={{ height: PANEL_HEIGHT, display: 'flex', flexDirection: 'column' }}>
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

      <InputBase
        multiline
        fullWidth
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
        inputProps={{ spellCheck: false, 'aria-label': 'Resume JSON' }}
        sx={(theme) => ({
          flex: '1 1 auto',
          minHeight: 0,
          alignItems: 'flex-start',
          overflow: 'auto',
          px: 3,
          py: 2,
          borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          bgcolor: theme.vars.palette.background.neutral,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          '& textarea': { whiteSpace: 'pre', overflowX: 'auto !important' },
        })}
      />
    </Card>
  );

  const renderPreviewPanel = () => (
    <Card sx={{ height: PANEL_HEIGHT, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Resume preview"
        subheader={resume.company_target ? `Tailored for ${resume.company_target}` : 'Rendered PDF'}
        sx={{ mb: 2 }}
      />

      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <ResumePDFViewer resume={resume} />
      </div>
    </Card>
  );

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Resume"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Resume' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>{renderJsonPanel()}</Grid>
        <Grid size={{ xs: 12, md: 7 }}>{renderPreviewPanel()}</Grid>
      </Grid>
    </DashboardContent>
  );
}
