import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import { BlueprintFrame } from './BlueprintFrame';
import { formatDelta, formatReading } from '../lib/formatting';
import type { Reading } from '../types';
import { useWaterTrackingActions, useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface ReadingListProps {
  meterId: string;
}

interface DisplayRow {
  reading: Reading;
  delta: number | null;
  ordinal: number; // 0-based, 0 is oldest
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
      ordinal: index,
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
            Section 01 · Ledger
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
            Readings
          </Typography>
        </Stack>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openNew}
          sx={{ flexShrink: 0 }}
        >
          Add reading
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <BlueprintFrame tag="LOG/01" subTag="VOID">
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography
              sx={{
                fontFamily: 'var(--app-mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              No readings recorded. Add the first.
            </Typography>
          </Box>
        </BlueprintFrame>
      ) : (
        <BlueprintFrame tag="LOG/01" subTag={`N=${rows.length}`} padding={0}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottomStyle: 'dashed' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56, pl: 3 }}>No.</TableCell>
                  <TableCell>When</TableCell>
                  <TableCell>Reading</TableCell>
                  <TableCell>Δ since previous</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    Ops
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ reading, delta, ordinal }) => {
                  const isUtility = reading.source === 'utility';
                  const isEstimated = isUtility && reading.isEstimated === true;
                  const deltaPositive = delta !== null && delta >= 0;
                  return (
                    <TableRow
                      key={reading.id}
                      sx={{
                        '&:hover': {
                          bgcolor: theme =>
                            `color-mix(in srgb, ${theme.vars?.palette.primary.main ?? theme.palette.primary.main} 4%, transparent)`,
                        },
                        '&:last-of-type .MuiTableCell-root': { borderBottom: 'none' },
                      }}
                    >
                      <TableCell sx={{ pl: 3 }}>
                        <Typography
                          component="span"
                          sx={{
                            fontFamily: 'var(--app-mono)',
                            fontSize: '0.72rem',
                            letterSpacing: '0.1em',
                            color: 'text.secondary',
                          }}
                        >
                          {String(ordinal + 1).padStart(3, '0')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography
                            sx={{
                              fontFamily: 'var(--app-mono)',
                              fontSize: '0.86rem',
                              fontWeight: 500,
                              color: 'text.primary',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {format(new Date(reading.takenAt), 'dd MMM yyyy')}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: 'var(--app-mono)',
                              fontSize: '0.7rem',
                              color: 'text.secondary',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {format(new Date(reading.takenAt), 'HH:mm')}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <Box
                            aria-hidden
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              flexShrink: 0,
                              bgcolor: isUtility ? 'secondary.main' : 'primary.main',
                              boxShadow: theme =>
                                `0 0 0 3px color-mix(in srgb, ${
                                  isUtility
                                    ? (theme.vars?.palette.secondary.main ??
                                      theme.palette.secondary.main)
                                    : (theme.vars?.palette.primary.main ??
                                      theme.palette.primary.main)
                                } 18%, transparent)`,
                            }}
                          />
                          <Typography
                            sx={{
                              fontFamily: 'var(--app-mono)',
                              fontSize: '0.95rem',
                              fontWeight: 500,
                              fontVariantNumeric: 'tabular-nums',
                              color: 'text.primary',
                              letterSpacing: '0.01em',
                            }}
                          >
                            {formatReading(reading.reading)}
                          </Typography>
                          {isUtility && (
                            <Box
                              component="span"
                              sx={{
                                px: 0.75,
                                py: 0.25,
                                fontFamily: 'var(--app-mono)',
                                fontSize: '0.6rem',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: 'secondary.main',
                                border: '1px solid',
                                borderColor: 'secondary.main',
                                borderRadius: 0.5,
                              }}
                            >
                              Utility
                            </Box>
                          )}
                          {isEstimated && (
                            <Box
                              component="span"
                              sx={{
                                px: 0.75,
                                py: 0.25,
                                fontFamily: 'var(--app-mono)',
                                fontSize: '0.6rem',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: 'secondary.main',
                                border: '1px dashed',
                                borderColor: 'secondary.main',
                                borderRadius: 0.5,
                                opacity: 0.8,
                              }}
                            >
                              Estimated
                            </Box>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {delta === null ? (
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: 'var(--app-mono)',
                              fontSize: '0.78rem',
                              color: 'text.disabled',
                            }}
                          >
                            ——
                          </Typography>
                        ) : (
                          <Typography
                            component="span"
                            sx={{
                              fontFamily: 'var(--app-mono)',
                              fontSize: '0.8rem',
                              fontVariantNumeric: 'tabular-nums',
                              color: deltaPositive ? 'text.primary' : 'error.main',
                              letterSpacing: '0.01em',
                            }}
                          >
                            {formatDelta(delta)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <IconButton
                          size="small"
                          onClick={() => openEdit(reading)}
                          aria-label="Edit"
                        >
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </BlueprintFrame>
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
