import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  getTrigger,
  setTrigger,
  isValidTrigger,
  DEFAULT_TRIGGER,
} from './expander/trigger-storage';

// ----------------------------------------------------------------------

export function SettingsSection() {
  return (
    <Box
      component="section"
      aria-label="Settings"
      sx={{ gap: 2, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
    >
      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
        Settings
      </Typography>

      <PromptTriggerField />
    </Box>
  );
}

// ----------------------------------------------------------------------

function PromptTriggerField() {
  const [saved, setSaved] = useState(DEFAULT_TRIGGER);
  const [value, setValue] = useState(DEFAULT_TRIGGER);

  useEffect(() => {
    getTrigger().then((trigger) => {
      setSaved(trigger);
      setValue(trigger);
    });
  }, []);

  const valid = isValidTrigger(value);

  return (
    <TextField
      fullWidth
      size="small"
      label="AI prompt shortcut"
      value={value}
      error={!valid}
      helperText={
        valid
          ? 'Type this in a text field on any website to insert your AI prompt.'
          : 'Use 2 to 20 characters, without spaces.'
      }
      slotProps={{ inputLabel: { shrink: true } }}
      onChange={({ target }) => {
        setValue(target.value);

        if (isValidTrigger(target.value)) {
          setSaved(target.value);
          setTrigger(target.value);
        }
      }}
      // An invalid value was never saved, so going back to what's in use is all that's left to do.
      onBlur={() => setValue(saved)}
    />
  );
}
