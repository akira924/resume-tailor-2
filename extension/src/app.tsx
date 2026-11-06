import { useState } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from './auth/auth-context';
import { WorkspaceView } from './workspace-view';
import { SignInView } from './auth/sign-in-view';
import { SignUpView } from './auth/sign-up-view';

// ----------------------------------------------------------------------

export function App() {
  const auth = useAuth();

  return (
    <Box
      sx={{
        p: 3,
        gap: 3,
        height: '100vh',
        display: 'flex',
        overflowY: 'auto',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ gap: 1, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <Box component="img" src="icons/icon-32.png" alt="" sx={{ width: 32, height: 32 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Resume Tailor
        </Typography>
      </Box>

      {auth.status === 'loading' && (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress aria-label="Loading" />
        </Box>
      )}

      {auth.status === 'unreachable' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={auth.retry}>
              Retry
            </Button>
          }
        >
          {auth.message}
        </Alert>
      )}

      {auth.status === 'unauthenticated' && <AuthPage />}

      {auth.status === 'authenticated' && <WorkspaceView />}
    </Box>
  );
}

// ----------------------------------------------------------------------

function AuthPage() {
  const [page, setPage] = useState<'sign-in' | 'sign-up' | 'registered'>('sign-in');

  if (page === 'sign-up') {
    return (
      <SignUpView onSignIn={() => setPage('sign-in')} onRegistered={() => setPage('registered')} />
    );
  }

  return <SignInView justRegistered={page === 'registered'} onSignUp={() => setPage('sign-up')} />;
}
