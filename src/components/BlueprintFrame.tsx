import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

interface BlueprintFrameProps {
  /** Tiny mono label that sits on the top-left register stripe (e.g. "STAT/03"). */
  tag?: string;
  /** Optional sub-tag rendered after the main tag, separated by a slash. */
  subTag?: string;
  /** Children render inside the framed area. */
  children: ReactNode;
  /** Override padding inside the frame. */
  padding?: number | string;
  /** Sx passthrough on the outer Paper. */
  sx?: object;
}

/**
 * "Engineered Water" surface: a hairline-bordered paper with L-shaped corner
 * ticks, an optional register stripe carrying a monospaced tag, and a faint
 * watery gradient backdrop that fades from a teal/cyan wash to transparent.
 */
export function BlueprintFrame({ tag, subTag, children, padding = 3, sx }: BlueprintFrameProps) {
  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          p: padding,
          overflow: 'hidden',
          backgroundImage: theme => `
            radial-gradient(circle at 100% 0%,
              color-mix(in srgb, ${theme.vars?.palette.secondary.main ?? theme.palette.secondary.main} 8%, transparent),
              transparent 55%),
            radial-gradient(circle at 0% 100%,
              color-mix(in srgb, ${theme.vars?.palette.info.main ?? theme.palette.info?.main ?? theme.palette.primary.main} 5%, transparent),
              transparent 60%)
          `,
        }}
      >
        {children}
      </Paper>
      <CornerTicks />
      {tag && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: 14,
            px: 0.75,
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontFamily: 'var(--app-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            {tag}
          </Typography>
          {subTag && (
            <>
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'secondary.main',
                  display: 'inline-block',
                }}
              />
              <Typography
                component="span"
                sx={{
                  fontFamily: 'var(--app-mono)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'secondary.main',
                }}
              >
                {subTag}
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

const TICK_SIZE = 10;

function CornerTicks() {
  const base = {
    position: 'absolute' as const,
    width: TICK_SIZE,
    height: TICK_SIZE,
    pointerEvents: 'none' as const,
    borderColor: 'primary.main',
    borderStyle: 'solid',
    borderWidth: 0,
  };
  return (
    <>
      <Box sx={{ ...base, top: -1, left: -1, borderTopWidth: 1.5, borderLeftWidth: 1.5 }} />
      <Box sx={{ ...base, top: -1, right: -1, borderTopWidth: 1.5, borderRightWidth: 1.5 }} />
      <Box sx={{ ...base, bottom: -1, left: -1, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }} />
      <Box sx={{ ...base, bottom: -1, right: -1, borderBottomWidth: 1.5, borderRightWidth: 1.5 }} />
    </>
  );
}
