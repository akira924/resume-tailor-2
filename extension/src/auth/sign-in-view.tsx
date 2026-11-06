import * as z from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useAuth } from './auth-context';
import { FormTextField, FormPasswordField } from './form-text-field';

// ----------------------------------------------------------------------

const SignInSchema = z.object({
  email: z.email({ error: 'Email must be a valid email address!' }),
  password: z.string().min(1, { error: 'Password is required!' }),
});

type Props = {
  justRegistered: boolean;
  onSignUp: () => void;
};

export function SignInView({ justRegistered, onSignUp }: Props) {
  const auth = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setErrorMessage(null);

    try {
      await auth.signIn(email, password);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  });

  const sessionEndedMessage = auth.status === 'unauthenticated' ? auth.message : null;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={onSubmit}
      sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Sign in to your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`Don't have an account? `}
          <Link component="button" type="button" variant="subtitle2" onClick={onSignUp}>
            Get started
          </Link>
        </Typography>
      </Box>

      {justRegistered && (
        <Alert severity="success">
          Account created. You can sign in once an admin has approved it.
        </Alert>
      )}

      {!!sessionEndedMessage && !errorMessage && (
        <Alert severity="warning">{sessionEndedMessage}</Alert>
      )}

      {!!errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <FormTextField
        name="email"
        label="Email address"
        type="email"
        autoComplete="email"
        control={control}
      />

      <FormPasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        control={control}
      />

      <Button
        fullWidth
        type="submit"
        size="large"
        color="inherit"
        variant="contained"
        loading={isSubmitting}
      >
        Sign in
      </Button>
    </Box>
  );
}
