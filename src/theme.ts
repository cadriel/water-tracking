import { extendTheme } from '@mui/material/styles';

// "Engineered Water" — blueprint precision meets liquid color.
//
// Light scheme = ink on warm cream paper. Dark scheme = deep tide-pool with
// pale cyan/teal as the contrast hue. Sharp corners, hairline borders, and
// monospaced numerals carry the engineering side; cyan/teal washes and the
// optional gradient backdrops carry the wet side.

const fraunces = '"Fraunces", "Times New Roman", Georgia, serif';
const plexSans = '"IBM Plex Sans", system-ui, -apple-system, sans-serif';
const plexMono = '"IBM Plex Mono", ui-monospace, "Menlo", monospace';

export const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#0B2545', // ink blue (lines, headings, primary buttons)
          light: '#1A3D6B',
          dark: '#061730',
          contrastText: '#F4EFE2',
        },
        secondary: {
          main: '#0F6B7E', // deep teal (utility, secondary buttons)
          light: '#2A8F9F',
          dark: '#08495A',
          contrastText: '#F4EFE2',
        },
        info: {
          main: '#13B7C9', // aqua accent
        },
        background: {
          default: '#F2EDDE', // warm cream paper
          paper: '#FBF8EE', // slightly brighter paper for cards
        },
        text: {
          primary: '#0B2545',
          secondary: '#4F6E80',
          disabled: '#8FA3B0',
        },
        divider: 'rgba(11, 37, 69, 0.14)',
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#7DD3FC', // pale cyan / aqua
          light: '#A8E2FD',
          dark: '#3FA5D6',
          contrastText: '#04101C',
        },
        secondary: {
          main: '#5EEAD4', // tide-pool teal
          light: '#8FF1E0',
          dark: '#2EB6A1',
          contrastText: '#04101C',
        },
        info: {
          main: '#67E8F9',
        },
        background: {
          default: '#04101C', // deep tide-pool
          paper: '#0B1E33', // slightly raised surface
        },
        text: {
          primary: '#E6F4F8',
          secondary: '#8AAEBE',
          disabled: '#5A7484',
        },
        divider: 'rgba(125, 211, 252, 0.16)',
      },
    },
  },

  typography: {
    fontFamily: plexSans,
    h1: { fontFamily: fraunces, fontWeight: 600, letterSpacing: '-0.025em' },
    h2: { fontFamily: fraunces, fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontFamily: fraunces, fontWeight: 600, letterSpacing: '-0.015em' },
    h4: {
      fontFamily: fraunces,
      fontWeight: 600,
      letterSpacing: '-0.01em',
      fontVariationSettings: '"opsz" 100, "SOFT" 30, "WONK" 1',
    },
    h5: {
      fontFamily: fraunces,
      fontWeight: 600,
      letterSpacing: '-0.005em',
      fontVariationSettings: '"opsz" 60, "SOFT" 30, "WONK" 1',
    },
    h6: {
      fontFamily: fraunces,
      fontWeight: 500,
      letterSpacing: '0em',
      fontVariationSettings: '"opsz" 36, "SOFT" 40, "WONK" 1',
    },
    subtitle1: { fontFamily: plexSans, fontWeight: 500 },
    subtitle2: { fontFamily: plexSans, fontWeight: 500 },
    body1: { fontFamily: plexSans, lineHeight: 1.55 },
    body2: { fontFamily: plexSans, lineHeight: 1.5 },
    button: {
      fontFamily: plexMono,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      fontWeight: 500,
      fontSize: '0.78rem',
    },
    overline: {
      fontFamily: plexMono,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      fontSize: '0.7rem',
      lineHeight: 1.4,
    },
    caption: {
      fontFamily: plexMono,
      fontSize: '0.72rem',
      letterSpacing: '0.04em',
      lineHeight: 1.4,
    },
  },

  shape: { borderRadius: 2 }, // sharp, architectural

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--app-mono': plexMono,
          '--app-display': fraunces,
        },
        body: {
          fontFeatureSettings: '"ss01", "cv11"',
        },
        '::selection': {
          backgroundColor: 'rgba(15, 107, 126, 0.25)',
        },
      },
    },
    MuiPaper: {
      defaultProps: { square: false },
      styleOverrides: {
        root: {
          backgroundImage: 'none', // kill MUI's elevation overlay
        },
        outlined: {
          borderColor: 'var(--mui-palette-divider)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          color: 'var(--mui-palette-text-primary)',
          borderBottom: '1px solid var(--mui-palette-divider)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 2,
          paddingInline: 18,
          paddingBlock: 8,
        },
        contained: {
          boxShadow: 'none',
        },
        outlined: {
          borderColor: 'var(--mui-palette-divider)',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: plexMono,
          fontSize: '0.74rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          paddingInline: 14,
          paddingBlock: 6,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontFamily: plexMono,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.66rem',
          height: 20,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'var(--mui-palette-divider)',
        },
        head: {
          fontFamily: plexMono,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontSize: '0.68rem',
          color: 'var(--mui-palette-text-secondary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          borderColor: 'var(--mui-palette-divider)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: '1px solid var(--mui-palette-divider)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: fraunces,
          fontWeight: 600,
          letterSpacing: '-0.01em',
        },
      },
    },
  },
});
