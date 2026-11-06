import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { getDownloadFolder, setDownloadFolder } from './resume/download-folder';

import {
  getTrigger,
  setTrigger,
  isValidTrigger,
  DEFAULT_TRIGGER,
} from './expander/trigger-storage';

// ----------------------------------------------------------------------

export function SettingsSection({ onError }: { onError: (message: string) => void }) {
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

      <DownloadFolderField onError={onError} />
    </Box>
  );
}

// ----------------------------------------------------------------------

function DownloadFolderField({ onError }: { onError: (message: string) => void }) {
  const [folder, setFolder] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    getDownloadFolder().then(setFolder, console.error);
  }, []);

  const save = async (next: FileSystemDirectoryHandle | null) => {
    await setDownloadFolder(next);
    setFolder(next);
  };

  const handleBrowse = async () => {
    try {
      await save(await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' }));
    } catch (error) {
      // AbortError is the user closing the dialog without choosing a folder.
      if ((error as DOMException).name !== 'AbortError') {
        console.error(error);
        onError('Could not use that folder. Please choose another.');
      }
    }
  };

  return (
    <Box sx={{ gap: 1, display: 'flex', alignItems: 'flex-start' }}>
      <TextField
        fullWidth
        size="small"
        label="Download location"
        value={folder ? folder.name : 'Downloads (default)'}
        slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
      />

      <Button
        color="inherit"
        variant="outlined"
        onClick={handleBrowse}
        sx={{ flexShrink: 0, height: 40 }}
      >
        Browse
      </Button>

      {folder && (
        <Button
          color="inherit"
          onClick={() => save(null).catch(console.error)}
          sx={{ flexShrink: 0, height: 40 }}
        >
          Reset
        </Button>
      )}
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
