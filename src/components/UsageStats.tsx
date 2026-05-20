import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  averageBetweenLastUtilityReadings,
  averageDailyUsageLitres,
  averageDailyUsageLitresInLastNDays,
} from '../lib/usage';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';
import { BlueprintFrame } from './BlueprintFrame';

interface UsageStatsProps {
  meterId: string;
}

interface StatColumnProps {
  index: string;
  code: string;
  label: string;
  value: number | null;
  missingCaption?: string;
  accentColor?: 'primary' | 'secondary';
}

function StatColumn({
  index,
  code,
  label,
  value,
  missingCaption = 'Need more readings',
  accentColor = 'primary',
}: StatColumnProps) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, position: 'relative', pl: 2.5 }}>
      {/* vertical accent rule */}
      <Box
        sx={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          width: 2,
          bgcolor: accentColor === 'secondary' ? 'secondary.main' : 'primary.main',
          opacity: 0.65,
        }}
      />
      <Stack spacing={1}>
        {/* index + code (like blueprint axis labels) */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            component="span"
            sx={{
              fontFamily: 'var(--app-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.2em',
              color: 'text.secondary',
            }}
          >
            {index}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: 'var(--app-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.2em',
              color: accentColor === 'secondary' ? 'secondary.main' : 'primary.main',
              textTransform: 'uppercase',
            }}
          >
            {code}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontFamily: 'var(--app-display)',
            fontSize: '0.95rem',
            fontWeight: 500,
            fontStyle: 'italic',
            letterSpacing: '-0.005em',
            color: 'text.primary',
            fontVariationSettings: '"opsz" 36, "SOFT" 60, "WONK" 1',
          }}
        >
          {label}
        </Typography>

        {value === null ? (
          <>
            <Typography
              sx={{
                fontFamily: 'var(--app-mono)',
                fontSize: { xs: '1.8rem', md: '2.1rem' },
                fontWeight: 400,
                color: 'text.disabled',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              ——
            </Typography>
            <Typography
              sx={{
                fontFamily: 'var(--app-mono)',
                fontSize: '0.66rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              {missingCaption}
            </Typography>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
              <Typography
                component="span"
                sx={{
                  fontFamily: 'var(--app-mono)',
                  fontSize: { xs: '1.8rem', md: '2.2rem' },
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  color: 'text.primary',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value.toFixed(1)}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontFamily: 'var(--app-mono)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                }}
              >
                L/day
              </Typography>
            </Box>
          </>
        )}
      </Stack>
    </Box>
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
    <BlueprintFrame tag="STAT/02" subTag="FLOW">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        divider={
          <Box
            sx={{
              borderRight: { md: '1px dashed' },
              borderBottom: { xs: '1px dashed', md: 'none' },
              borderColor: { xs: 'divider', md: 'divider' },
              minHeight: { md: 96 },
            }}
          />
        }
        spacing={{ xs: 3, md: 4 }}
        sx={{ alignItems: 'stretch' }}
      >
        <StatColumn index="01" code="WT∞" label="All time" value={allTime} accentColor="primary" />
        <StatColumn
          index="02"
          code="30·D"
          label="Last 30 days"
          value={last30Days}
          accentColor="primary"
        />
        <StatColumn
          index="03"
          code="BC·U"
          label="Last billing cycle"
          value={lastBillingCycle}
          missingCaption="Awaiting 2 utility reads"
          accentColor="secondary"
        />
      </Stack>
    </BlueprintFrame>
  );
}
