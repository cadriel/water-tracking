import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { ReadingFormDialog } from './ReadingFormDialog';
import { formatDelta, formatReading } from '../lib/formatting';
import type { Reading } from '../types';
import { useWaterTrackingActions, useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface ReadingListProps {
  meterId: string;
}

interface DisplayRow {
  reading: Reading;
  delta: number | null;
}

export function ReadingList({ meterId }: ReadingListProps) {
  const readings = useWaterTrackingReadings();
  const { deleteReading } = useWaterTrackingActions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reading | null>(null);

  const rows = useMemo<DisplayRow[]>(() => {
    const sortedAsc = readings
      .filter(r => r.meterId === meterId)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));

    const withDeltas: DisplayRow[] = sortedAsc.map((reading, index) => ({
      reading,
      delta: index === 0 ? null : reading.reading - sortedAsc[index - 1].reading,
    }));

    return withDeltas.reverse(); // newest first
  }, [readings, meterId]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(reading: Reading) {
    setEditing(reading);
    setFormOpen(true);
  }

  function handleDelete(reading: Reading) {
    if (window.confirm('Delete this reading?')) {
      deleteReading(reading.id);
    }
  }

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Readings</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
          Add reading
        </Button>
      </Stack>
      {rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No readings yet. Add your first reading.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date / time</TableCell>
                <TableCell>Reading</TableCell>
                <TableCell>Usage since previous</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ reading, delta }) => (
                <TableRow key={reading.id}>
                  <TableCell>{format(new Date(reading.takenAt), 'dd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {formatReading(reading.reading)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {delta === null ? '—' : formatDelta(delta)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(reading)} aria-label="Edit">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(reading)}
                      aria-label="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <ReadingFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        meterId={meterId}
        editingReading={editing}
      />
    </Box>
  );
}
