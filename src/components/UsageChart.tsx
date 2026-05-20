import { useMemo } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { LineChart } from '@mui/x-charts/LineChart';
import { useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface UsageChartProps {
    meterId: string;
}

export function UsageChart({ meterId }: UsageChartProps) {
    const readings = useWaterTrackingReadings();

    const series = useMemo(() => {
        const sorted = readings
            .filter(r => r.meterId === meterId)
            .slice()
            .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
        const xAxis = sorted.map(r => new Date(r.takenAt));
        const values = sorted.map(r => r.reading);
        return { xAxis, values };
    }, [readings, meterId]);

    if (series.values.length < 2) {
        return (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mt: 3 }}>
                <Typography color="text.secondary">
                    Add another reading to see usage over time.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Usage over time
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <LineChart
                    height={280}
                    xAxis={[
                        {
                            data: series.xAxis,
                            scaleType: 'time',
                            valueFormatter: (value: Date) =>
                                value.toLocaleDateString(),
                        },
                    ]}
                    series={[
                        {
                            data: series.values,
                            label: 'Reading (m³)',
                            valueFormatter: value =>
                                value === null ? '' : `${value.toFixed(4)} m³`,
                        },
                    ]}
                />
            </Paper>
        </Box>
    );
}
