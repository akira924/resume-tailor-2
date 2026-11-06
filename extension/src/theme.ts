import { createTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

// The website's palette and font, from vite-ts/src/theme/theme-config.ts.
export const theme = createTheme({
  palette: {
    primary: { main: '#00A76F', contrastText: '#FFFFFF' },
    text: { primary: '#1C252E', secondary: '#637381' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Public Sans Variable", sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        // The website's dark call-to-action button.
        containedInherit: {
          color: '#FFFFFF',
          backgroundColor: '#1C252E',
          '&:hover': { backgroundColor: '#454F5B' },
        },
      },
    },
  },
});
