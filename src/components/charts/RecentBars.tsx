import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, type Theme } from '@mui/material/styles';
import { BarChart } from '@mui/x-charts/BarChart';
import type { BarProps } from '@mui/x-charts/BarChart';
import { format } from 'date-fns';
import { BlueprintFrame } from '../BlueprintFrame';
import { useWaterTrackingReadings } from '../../store/useWaterTrackingStore';
import { computeRecentBars, type BarInterval } from '../../lib/chartIntervals';

interface RecentBarsProps {
  meterId: string;
}

export function RecentBars({ meterId }: RecentBarsProps) {
  const readings = useWaterTrackingReadings();
  const theme = useTheme();

  const { intervals, mode } = useMemo(() => {
    const filtered = readings.filter(r => r.meterId === meterId);
    return computeRecentBars(filtered);
  }, [readings, meterId]);

  const modeLabel = mode === 'last30days' ? 'Window · 30 days' : 'Last 12 reads';

  return (
    <Stack spacing={1.5}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Typography
          sx={{
            fontFamily: 'var(--app-mono)',
            fontSize: '0.66rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          {modeLabel}
        </Typography>
      </Box>
      {intervals.length === 0 ? (
        <BlueprintFrame tag="HYD/03" subTag="VOID">
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'var(--app-mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Awaiting a second reading.
            </Typography>
          </Box>
        </BlueprintFrame>
      ) : (
        <BlueprintFrame tag="HYD/03" subTag={`BARS=${intervals.length}`} padding={1.5}>
          <BarChart
            height={300}
            hideLegend
            margin={{ top: 16, right: 24, bottom: 32, left: 56 }}
            xAxis={[
              {
                data: intervals.map(i => format(new Date(i.end.takenAt), 'd MMM')),
                scaleType: 'band',
                tickLabelStyle: {
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  fill: theme.palette.text.secondary,
                },
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: {
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  fill: theme.palette.text.secondary,
                },
              },
            ]}
            series={[
              {
                data: intervals.map(i => i.consumption * 1000),
                label: 'Consumption (L)',
                valueFormatter: value => (value === null ? '' : `${value.toFixed(1)} L`),
              },
            ]}
            grid={{ horizontal: true }}
            sx={{
              '& .MuiChartsAxis-line': { stroke: theme.palette.divider },
              '& .MuiChartsAxis-tick': { stroke: theme.palette.divider },
              '& .MuiChartsGrid-line': {
                stroke: theme.palette.divider,
                strokeDasharray: '2 4',
              },
            }}
            slots={{
              bar: createIntervalBar(intervals, theme),
            }}
          />
        </BlueprintFrame>
      )}
    </Stack>
  );
}

function createIntervalBar(intervals: BarInterval[], theme: Theme) {
  return function IntervalBar(props: BarProps) {
    const { dataIndex, x, y, width, height, style, onClick, className } = props;
    const interval = intervals[dataIndex];
    const fill = theme.palette.secondary.main;
    const isEstimated = interval?.isEstimated ?? false;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={style}
        onClick={onClick}
        className={className}
        cursor={onClick ? 'pointer' : undefined}
        fill={fill}
        fillOpacity={isEstimated ? 0.4 : 0.92}
        stroke={fill}
        strokeWidth={isEstimated ? 1.5 : 0}
        strokeDasharray={isEstimated ? '4 3' : undefined}
      />
    );
  };
}
