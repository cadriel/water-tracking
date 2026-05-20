import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { AppHeader } from './components/AppHeader';
import { EmptyState } from './components/EmptyState';
import { MeterManagerDialog } from './components/MeterManagerDialog';
import { ReadingList } from './components/ReadingList';
import { UsageChart } from './components/UsageChart';
import { UsageStats } from './components/UsageStats';
import {
  useWaterTrackingMeters,
  useWaterTrackingSelectedMeterId,
} from './store/useWaterTrackingStore';

function App() {
  const meters = useWaterTrackingMeters();
  const selectedMeterId = useWaterTrackingSelectedMeterId();
  const [managerOpen, setManagerOpen] = useState(false);

  const noMeters = meters.length === 0;
  const meterToShow = selectedMeterId ?? meters[0]?.id ?? null;

  return (
    <Box
      sx={theme => ({
        position: 'relative',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        overflowX: 'hidden',
        // Fine blueprint grid (light) over the cream paper / tide-pool.
        backgroundImage: `
          linear-gradient(${theme.vars?.palette.divider ?? theme.palette.divider} 1px, transparent 1px),
          linear-gradient(90deg, ${theme.vars?.palette.divider ?? theme.palette.divider} 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px, 48px 48px',
        backgroundAttachment: 'fixed',
        backgroundPosition: '0 0, 0 0',
        // Soft watery washes layered above the grid.
        '&::before': {
          content: '""',
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `
            radial-gradient(circle at 88% -10%, color-mix(in srgb, ${theme.vars?.palette.info.main ?? theme.palette.info?.main ?? theme.palette.primary.main} 18%, transparent), transparent 55%),
            radial-gradient(circle at -10% 110%, color-mix(in srgb, ${theme.vars?.palette.secondary.main ?? theme.palette.secondary.main} 22%, transparent), transparent 60%)
          `,
          zIndex: 0,
        },
        // Subtle noise — gives the wash a paper-like grain.
        '&::after': {
          content: '""',
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.035,
          mixBlendMode: 'multiply',
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"160\\" height=\\"160\\"><filter id=\\"n\\"><feTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.9\\" numOctaves=\\"2\\" stitchTiles=\\"stitch\\"/></filter><rect width=\\"100%\\" height=\\"100%\\" filter=\\"url(%23n)\\"/></svg>")',
          zIndex: 0,
        },
      })}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <AppHeader onManageMeters={() => setManagerOpen(true)} />
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
          {noMeters ? (
            <EmptyState onCreateMeter={() => setManagerOpen(true)} />
          ) : meterToShow ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <ReadingList meterId={meterToShow} />
              <UsageStats meterId={meterToShow} />
              <UsageChart meterId={meterToShow} />
            </Box>
          ) : null}
        </Container>
      </Box>
      <MeterManagerDialog open={managerOpen} onClose={() => setManagerOpen(false)} />
    </Box>
  );
}

export default App;
