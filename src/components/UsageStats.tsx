import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  averageDailyUsageLitres,
  averageDailyUsageLitresInLastNDays,
  averageBetweenLastUtilityReadings,
} from '../lib/usage';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';
import { Box } from '@mui/material';

interface UsageStatsProps {
  meterId: string;
}

function formatLitresPerDay(value: number): string {
  return `${value.toFixed(1)} L/day`;
}

interface StatColumnProps {
  label: string;
  value: number | null;
  missingCaption?: string;
}

function StatColumn({ label, value, missingCaption = 'Need more readings' }: StatColumnProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {value === null ? (
        <>
          <Typography variant="h5" component="div">
            —
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {missingCaption}
          </Typography>
        </>
      ) : (
        <Typography variant="h5" component="div" sx={{ fontFamily: 'monospace' }}>
          {formatLitresPerDay(value)}
        </Typography>
      )}
    </Stack>
  );
}

export function UsageStats({ meterId }: UsageStatsProps) {
  const readings = useWaterTrackingReadings();

  const meterReadings = useMemo(
    () => readings.filter(r => r.meterId === meterId),
    [readings, meterId],
  );

  const allTime = useMemo(() => averageDailyUsageLitres(meterReadings), [meterReadings]);
  const last30Days = useMemo(
    () => averageDailyUsageLitresInLastNDays(meterReadings, 30),
    [meterReadings],
  );
  const lastBillingCycle = useMemo(
    () => averageBetweenLastUtilityReadings(meterReadings),
    [meterReadings],
  );

  if (meterReadings.length < 2) return null;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Average daily usage
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
          <StatColumn label="All time" value={allTime} />
          <StatColumn label="Last 30 days" value={last30Days} />
          <StatColumn
            label="Last billing cycle"
            value={lastBillingCycle}
            missingCaption="Need 2 utility readings"
          />
        </Stack>
      </Paper>
    </Box>
  );
}
