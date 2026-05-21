import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { FlowLineChart } from './charts/FlowLineChart';
import { RecentBars } from './charts/RecentBars';
import { YearlyUtilityBars } from './charts/YearlyUtilityBars';

interface UsageChartProps {
  meterId: string;
}

type ChartView = 'year' | 'recent' | 'line';

const VIEW_TITLES: Record<ChartView, string> = {
  year: 'Monthly billing',
  recent: 'Recent reads',
  line: 'Flow over time',
};

export function UsageChart({ meterId }: UsageChartProps) {
  const [view, setView] = useState<ChartView>('recent');

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}
      >
        <Stack spacing={0.5}>
          <Typography
            sx={{
              fontFamily: 'var(--app-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'secondary.main',
            }}
          >
            Section 03 · Hydrograph
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.7rem', md: '2.1rem' },
              fontStyle: 'italic',
              letterSpacing: '-0.015em',
              fontVariationSettings: '"opsz" 96, "SOFT" 80, "WONK" 1',
            }}
          >
            {VIEW_TITLES[view]}
          </Typography>
        </Stack>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, next: ChartView | null) => {
            if (next) setView(next);
          }}
          size="small"
          sx={{
            mb: 0.5,
            '& .MuiToggleButton-root': {
              fontFamily: 'var(--app-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              px: 1.25,
              py: 0.5,
              color: 'text.secondary',
              borderColor: 'divider',
              '&.Mui-selected': {
                color: 'secondary.main',
                borderColor: 'secondary.main',
                bgcolor: 'transparent',
              },
            },
          }}
        >
          <ToggleButton value="year">12 MO</ToggleButton>
          <ToggleButton value="recent">30 D</ToggleButton>
          <ToggleButton value="line">TREND</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {view === 'year' && <YearlyUtilityBars meterId={meterId} />}
      {view === 'recent' && <RecentBars meterId={meterId} />}
      {view === 'line' && <FlowLineChart meterId={meterId} />}
    </Box>
  );
}
