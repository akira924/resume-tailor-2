import { useState } from 'react';
import { json } from '@codemirror/lang-json';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import { useAuth } from './auth/auth-context';
import { ApiError, getSavedResume } from './auth/api';
import { getToken } from './auth/token-storage';
import { validateResumeJson } from './resume/validate-resume';
import { normalizeResumeSettings } from '../../vite-ts/src/sections/resume/resume-settings';

// ----------------------------------------------------------------------

// Defined once so CodeMirror doesn't reconfigure on every render.
// Lines wrap because the side panel is too narrow for long JSON values.
const EDITOR_EXTENSIONS = [json(), EditorView.lineWrapping];

const EDITOR_SETUP = { foldGutter: false, highlightActiveLine: false };

export function WorkspaceView() {
  const auth = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setErrorOpen(true);
  };

  const generateResume = async (text: string) => {
    const { resume, error } = validateResumeJson(text);

    if (error !== null) {
      showError(error);
      return;
    }

    try {
      // Fetched on every click, so a design saved on the website applies straight away.
      const saved = await getSavedResume((await getToken()) ?? '');
      const settings = normalizeResumeSettings(saved.resume?.settings ?? {});

      // Loaded on demand: the PDF renderer is by far the largest part of the extension.
      const { downloadResumePdf } = await import('./resume/download-resume-pdf');

      await downloadResumePdf(resume, settings);
    } catch (generateError) {
      console.error(generateError);

      if (generateError instanceof ApiError) {
        showError(generateError.message);

        // The session is over: this sends the user back to the sign-in page with the reason.
        if (generateError.status === 401) auth.retry();
      } else {
        showError('Could not generate the PDF. Please try again.');
      }
    }
  };

  return (
    <Box sx={{ gap: 2, minHeight: 0, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Only the sections scroll, so the sign out button stays at the bottom of the window. */}
      <Box
        sx={{
          gap: 3,
          minHeight: 0,
          flexGrow: 1,
          display: 'flex',
          overflowY: 'auto',
          flexDirection: 'column',
        }}
      >
        <JsonSection title="Resume" onGenerate={generateResume} />
        <JsonSection title="Cover Letter" />
      </Box>

      <Divider />

      <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {auth.status === 'authenticated' && auth.user.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {auth.status === 'authenticated' && auth.user.email}
          </Typography>
        </Box>

        <Button
          size="small"
          color="inherit"
          variant="outlined"
          onClick={auth.signOut}
          sx={{ flexShrink: 0 }}
        >
          Sign out
        </Button>
      </Box>

      <Snackbar
        open={errorOpen}
        autoHideDuration={3000}
        // Keeps counting down if the user has moved on to the web page next to the panel.
        disableWindowBlurListener
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={(_event, reason) => {
          if (reason !== 'clickaway') setErrorOpen(false);
        }}
      >
        <Alert severity="error" variant="filled" sx={{ width: 1 }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ----------------------------------------------------------------------

type JsonSectionProps = {
  title: string;
  /** Left out while the section's button has nothing to do yet. */
  onGenerate?: (text: string) => Promise<void>;
};

function JsonSection({ title, onGenerate }: JsonSectionProps) {
  const [text, setText] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!onGenerate) return;

    setGenerating(true);

    try {
      await onGenerate(text);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box
      component="section"
      aria-label={title}
      sx={{ gap: 1, minHeight: 220, flex: '1 1 0', display: 'flex', flexDirection: 'column' }}
    >
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>

      <Box
        sx={{
          minHeight: 0,
          flexGrow: 1,
          overflow: 'hidden',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          '&:focus-within': { borderColor: 'primary.main' },
          '& .cm-editor': { fontSize: 11 },
          '& .cm-editor.cm-focused': { outline: 'none' },
          '& .cm-scroller': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            lineHeight: 1.5,
          },
        }}
      >
        <CodeMirror
          value={text}
          onChange={setText}
          height="100%"
          style={{ height: '100%' }}
          basicSetup={EDITOR_SETUP}
          extensions={EDITOR_EXTENSIONS}
          placeholder="Paste JSON here"
          aria-label={`${title} JSON`}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        variant="contained"
        loading={generating}
        onClick={handleGenerate}
        sx={{ flexShrink: 0 }}
      >
        Generate and download
      </Button>
    </Box>
  );
}
