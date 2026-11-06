import { json } from '@codemirror/lang-json';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { useAuth } from './auth/auth-context';

// ----------------------------------------------------------------------

// Defined once so CodeMirror doesn't reconfigure on every render.
// Lines wrap because the side panel is too narrow for long JSON values.
const EDITOR_EXTENSIONS = [json(), EditorView.lineWrapping];

const EDITOR_SETUP = { foldGutter: false, highlightActiveLine: false };

export function WorkspaceView() {
  const auth = useAuth();

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
        <JsonSection title="Resume" />
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
    </Box>
  );
}

// ----------------------------------------------------------------------

function JsonSection({ title }: { title: string }) {
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
          height="100%"
          style={{ height: '100%' }}
          basicSetup={EDITOR_SETUP}
          extensions={EDITOR_EXTENSIONS}
          placeholder="Paste JSON here"
          aria-label={`${title} JSON`}
        />
      </Box>

      {/* TODO: read the clipboard into the editor and generate the document. */}
      <Button fullWidth color="inherit" variant="contained" sx={{ flexShrink: 0 }}>
        Paste and generate
      </Button>
    </Box>
  );
}
