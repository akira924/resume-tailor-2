import { useEffect } from 'react';
import { useBlocker } from 'react-router';

import Button from '@mui/material/Button';

import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';
import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

/** False once the session has ended, so sign-out redirects are never held up. */
const hasSession = () => !!sessionStorage.getItem(JWT_STORAGE_KEY);

type Props = {
  when: boolean;
};

/**
 * Asks before leaving while there are unsaved changes: a dialog for links inside
 * the app, and the browser's own prompt for refresh, closing the tab or external links.
 */
export function UnsavedChangesDialog({ when }: Props) {
  const { authenticated } = useAuthContext();

  const active = when && authenticated;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active && hasSession() && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!active) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasSession()) return;

      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [active]);

  return (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      title="Leave without saving?"
      content="You have unsaved changes. If you leave now, they will be lost."
      action={
        <Button variant="contained" color="error" onClick={() => blocker.proceed?.()}>
          Leave
        </Button>
      }
    />
  );
}
