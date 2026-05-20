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
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppHeader onManageMeters={() => setManagerOpen(true)} />
            <Container maxWidth="md" sx={{ py: 4 }}>
                {noMeters ? (
                    <EmptyState onCreateMeter={() => setManagerOpen(true)} />
                ) : meterToShow ? (
                    <>
                        <UsageStats meterId={meterToShow} />
                        <ReadingList meterId={meterToShow} />
                        <UsageChart meterId={meterToShow} />
                    </>
                ) : null}
            </Container>
            <MeterManagerDialog open={managerOpen} onClose={() => setManagerOpen(false)} />
        </Box>
    );
}

export default App;
