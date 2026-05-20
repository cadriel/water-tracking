import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import type { MarkElementProps } from '@mui/x-charts/LineChart';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface UsageChartProps {
  meterId: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS_AGO = Date.now() - 30 * MS_PER_DAY;

export function UsageChart({ meterId }: UsageChartProps) {
  const readings = useWaterTrackingReadings();
  const theme = useTheme();
  const last30Days = useMemo(() => {
    const cutoff = THIRTY_DAYS_AGO;
    return readings
      .filter(r => r.meterId === meterId)
      .filter(r => new Date(r.takenAt).getTime() >= cutoff)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
  }, [readings, meterId]);

  if (last30Days.length < 2) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 3 }}>
        <Typography color="text.secondary">Add another reading to see usage over time.</Typography>
      </Paper>
    );
  }

  const xAxisDates = last30Days.map(r => new Date(r.takenAt));
  const values = last30Days.map(r => r.reading);

  function ColorCodedMark({ dataIndex, ...rest }: MarkElementProps) {
    const reading = last30Days[dataIndex];
    const fill =
      reading?.source === 'utility' ? theme.palette.secondary.main : theme.palette.primary.main;
    return (
      <circle
        cx={rest.x}
        cy={rest.y}
        r={5}
        fill={fill}
        stroke={theme.palette.background.paper}
        strokeWidth={1.5}
      />
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Usage over time (last 30 days)
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <LineChart
          height={280}
          hideLegend
          xAxis={[
            {
              data: xAxisDates,
              scaleType: 'time',
              valueFormatter: (value: Date) => value.toLocaleDateString(),
            },
          ]}
          series={[
            {
              data: values,
              label: 'Reading (m³)',
              color: theme.palette.text.secondary,
              showMark: true,
              valueFormatter: value => (value === null ? '' : `${value.toFixed(4)} m³`),
            },
          ]}
          slots={{ mark: ColorCodedMark }}
        />
      </Paper>
    </Box>
  );
}
