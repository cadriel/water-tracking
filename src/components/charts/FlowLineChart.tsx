import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme, type Theme } from '@mui/material/styles';
import { LineChart } from '@mui/x-charts/LineChart';
import type { MarkElementProps } from '@mui/x-charts/LineChart';
import { ChartsTooltipContainer, useAxesTooltip } from '@mui/x-charts/ChartsTooltip';
import { format } from 'date-fns';
import { BlueprintFrame } from '../BlueprintFrame';
import { useWaterTrackingReadings } from '../../store/useWaterTrackingStore';

interface AxisTooltipContentProps {
  readings: { takenAt: string; reading: number; source: string; isEstimated?: boolean }[];
}

function AxisTooltipContent({ readings }: AxisTooltipContentProps) {
  const theme = useTheme();
  const tooltipData = useAxesTooltip();
  if (!tooltipData || tooltipData.length === 0) return null;

  const { axisValue, dataIndex } = tooltipData[0];
  const reading = readings[dataIndex];
  if (!reading) return null;

  const date = axisValue instanceof Date ? axisValue : new Date(reading.takenAt);
  const isUtility = reading.source === 'utility';
  const isEstimated = isUtility && reading.isEstimated === true;
  const dotColor = isUtility ? theme.palette.secondary.main : theme.palette.primary.main;
  const sourceLabel = isUtility ? (isEstimated ? 'Utility · Est.' : 'Utility') : 'Homeowner';

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1.75,
        py: 1.25,
        minWidth: 220,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        bgcolor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          sx={{
            fontFamily: 'var(--app-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          Reading
        </Typography>
        <Typography
          sx={{
            fontFamily: 'var(--app-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: dotColor,
          }}
        >
          {sourceLabel}
        </Typography>
      </Stack>
      <Typography
        sx={{
          fontFamily: 'var(--app-mono)',
          fontSize: '0.72rem',
          color: 'text.secondary',
          letterSpacing: '0.04em',
        }}
      >
        {format(date, 'd MMM yyyy · HH:mm')}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
            alignSelf: 'center',
          }}
        />
        <Typography
          sx={{
            fontFamily: 'var(--app-mono)',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'text.primary',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {(reading.reading * 1000).toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'var(--app-mono)',
            fontSize: '0.72rem',
            color: 'text.secondary',
            letterSpacing: '0.08em',
          }}
        >
          L
        </Typography>
      </Stack>
    </Paper>
  );
}

function makeAxisTooltip(
  readings: { takenAt: string; reading: number; source: string; isEstimated?: boolean }[],
) {
  return function AxisTooltip() {
    return (
      <ChartsTooltipContainer trigger="axis">
        <AxisTooltipContent readings={readings} />
      </ChartsTooltipContainer>
    );
  };
}

interface FlowLineChartProps {
  meterId: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ONE_YEAR_AGO = Date.now() - 365 * MS_PER_DAY;

export function FlowLineChart({ meterId }: FlowLineChartProps) {
  const readings = useWaterTrackingReadings();
  const theme = useTheme();

  const last12Months = useMemo(() => {
    return readings
      .filter(r => r.meterId === meterId)
      .filter(r => new Date(r.takenAt).getTime() >= ONE_YEAR_AGO)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
  }, [readings, meterId]);

  const AxisTooltip = useMemo(() => makeAxisTooltip(last12Months), [last12Months]);

  if (last12Months.length < 2) {
    return (
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
    );
  }

  return (
    <BlueprintFrame tag="HYD/03" subTag={`N=${last12Months.length}`} padding={1.5}>
      <LineChart
        height={300}
        hideLegend
        margin={{ top: 16, right: 24, bottom: 32, left: 56 }}
        xAxis={[
          {
            data: last12Months.map(r => new Date(r.takenAt)),
            scaleType: 'time',
            valueFormatter: (value: Date) => value.toLocaleDateString(),
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
            data: last12Months.map(r => r.reading),
            label: 'Reading (m³)',
            color: theme.palette.text.secondary,
            showMark: true,
            curve: 'linear',
            valueFormatter: value => (value === null ? '' : `${value.toFixed(4)} m³`),
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
          '& .MuiLineElement-root': {
            strokeWidth: 1.25,
            strokeDasharray: '0',
          },
        }}
        slots={{
          mark: createColorCodedMark(last12Months, theme),
          tooltip: AxisTooltip,
        }}
      />
    </BlueprintFrame>
  );
}

type ChartReading = { source: string; isEstimated?: boolean };

function createColorCodedMark(readings: ChartReading[], theme: Theme) {
  return function ColorCodedMark({ dataIndex, ...rest }: MarkElementProps) {
    const reading = readings[dataIndex];
    const isUtility = reading?.source === 'utility';
    const isEstimated = isUtility && reading?.isEstimated === true;
    const color = isUtility ? theme.palette.secondary.main : theme.palette.primary.main;
    return (
      <>
        <circle
          cx={rest.x}
          cy={rest.y}
          r={9}
          fill={color}
          opacity={0.16}
          style={{ pointerEvents: 'none' }}
        />
        <circle
          cx={rest.x}
          cy={rest.y}
          r={4.5}
          fill={isEstimated ? theme.palette.background.paper : color}
          stroke={isEstimated ? color : theme.palette.background.paper}
          strokeWidth={1.5}
        />
      </>
    );
  };
}
