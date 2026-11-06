import type { TextFieldProps } from '@mui/material/TextField';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { useState } from 'react';
import { useController } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

// ----------------------------------------------------------------------

type Props<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  name: FieldPath<T>;
  control: Control<T>;
};

export function FormTextField<T extends FieldValues>({ name, control, ...other }: Props<T>) {
  const { field, fieldState } = useController({ name, control });

  return (
    <TextField
      {...field}
      {...other}
      fullWidth
      inputRef={field.ref}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
      slotProps={{ inputLabel: { shrink: true }, ...other.slotProps }}
    />
  );
}

// ----------------------------------------------------------------------

export function FormPasswordField<T extends FieldValues>(props: Props<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormTextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                edge="end"
                aria-label={visible ? 'Hide password' : 'Show password'}
                onClick={() => setVisible((current) => !current)}
              >
                <EyeIcon crossed={visible} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

// ----------------------------------------------------------------------

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}
