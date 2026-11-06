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

// Same limits as signUpSchema in server/src/routes/auth.ts.
const SignUpSchema = z.object({
  firstName: z.string().trim().min(1, { error: 'First name is required!' }).max(50),
  lastName: z.string().trim().min(1, { error: 'Last name is required!' }).max(50),
  email: z.email({ error: 'Email must be a valid email address!' }),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters!' })
    .max(72, { error: 'Password must be at most 72 characters!' }),
});

type Props = {
  onSignIn: () => void;
  onRegistered: () => void;
};

export function SignUpView({ onSignIn, onRegistered }: Props) {
  const auth = useAuth();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);

    try {
      await auth.signUp(data);
      onRegistered();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  });

  return (
    <Box
      component="form"
      noValidate
      onSubmit={onSubmit}
      sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}
    >
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`Already have an account? `}
          <Link component="button" type="button" variant="subtitle2" onClick={onSignIn}>
            Sign in
          </Link>
        </Typography>
      </Box>

      {!!errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      <FormTextField
        name="firstName"
        label="First name"
        autoComplete="given-name"
        control={control}
      />

      <FormTextField
        name="lastName"
        label="Last name"
        autoComplete="family-name"
        control={control}
      />

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
        placeholder="8+ characters"
        autoComplete="new-password"
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
        Create account
      </Button>
    </Box>
  );
}
