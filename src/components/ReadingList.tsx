import { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format } from 'date-fns';
import { ReadingFormDialog } from './ReadingFormDialog';
import { BlueprintFrame } from './BlueprintFrame';
import { ImportReadingsDialog, type ImportMode } from './ImportReadingsDialog';
import { formatDelta, formatReading } from '../lib/formatting';
import {
  ImportError,
  buildExport,
  dedupeAgainst,
  exportFileName,
  parseImport,
  type ParsedImport,
} from '../lib/readingsImportExport';
import { READINGS_PAGE_SIZE } from '../constants';
import type { Reading } from '../types';
import {
  useWaterTrackingActions,
  useWaterTrackingMeters,
  useWaterTrackingReadings,
} from '../store/useWaterTrackingStore';

interface ReadingListProps {
  meterId: string;
}

interface DisplayRow {
  reading: Reading;
  delta: number | null;
}

interface SnackbarState {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
}

export function ReadingList({ meterId }: ReadingListProps) {
  const readings = useWaterTrackingReadings();
  const meters = useWaterTrackingMeters();
  const { addReading, deleteReading } = useWaterTrackingActions();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reading | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pendingImport, setPendingImport] = useState<ParsedImport | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    severity: 'success',
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meter = meters.find(m => m.id === meterId) ?? null;
  const meterReadings = useMemo(
    () => readings.filter(r => r.meterId === meterId),
    [readings, meterId],
  );

  const sortedRows = useMemo<DisplayRow[]>(() => {
    const sortedAsc = readings
      .filter(r => r.meterId === meterId)
      .slice()
      .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));

    const withDeltas: DisplayRow[] = sortedAsc.map((reading, index) => ({
      reading,
      delta: index === 0 ? null : reading.reading - sortedAsc[index - 1].reading,
    }));

    return sortDir === 'desc' ? withDeltas.reverse() : withDeltas;
  }, [readings, meterId, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / READINGS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * READINGS_PAGE_SIZE;
  const visibleRows = sortedRows.slice(pageStart, pageStart + READINGS_PAGE_SIZE);
  const showingFrom = sortedRows.length === 0 ? 0 : pageStart + 1;
  const showingTo = pageStart + visibleRows.length;
  const paginationDisabled = sortedRows.length <= READINGS_PAGE_SIZE;

  function toggleSort() {
    setSortDir(prev => (prev === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  }

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

  function showSnackbar(severity: 'success' | 'error', message: string) {
    setSnackbar({ open: true, severity, message });
  }

  function handleExport() {
    if (!meter || meterReadings.length === 0) return;
    const json = buildExport(meter, meterReadings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exportFileName(meter.name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showSnackbar('success', `Exported ${meterReadings.length} readings.`);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file later
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImport(text);
      setPendingImport(parsed);
    } catch (err) {
      const message = err instanceof ImportError ? err.message : 'Failed to read the file.';
      showSnackbar('error', message);
    }
  }

  function handleImportConfirm(mode: ImportMode) {
    if (!pendingImport || !meter) {
      setPendingImport(null);
      return;
    }

    if (mode === 'replace') {
      for (const existing of meterReadings) {
        deleteReading(existing.id);
      }
      for (const r of pendingImport.readings) {
        addReading({
          meterId: meter.id,
          reading: r.reading,
          takenAt: r.takenAt,
          source: r.source,
          ...(r.isEstimated !== undefined ? { isEstimated: r.isEstimated } : {}),
        });
      }
      showSnackbar(
        'success',
        `Replaced with ${pendingImport.readings.length} reading${pendingImport.readings.length === 1 ? '' : 's'}.`,
      );
    } else {
      const { toAdd, skipped } = dedupeAgainst(meterReadings, pendingImport.readings);
      for (const r of toAdd) {
        addReading({
          meterId: meter.id,
          reading: r.reading,
          takenAt: r.takenAt,
          source: r.source,
          ...(r.isEstimated !== undefined ? { isEstimated: r.isEstimated } : {}),
        });
      }
      showSnackbar(
        'success',
        `Imported ${toAdd.length} reading${toAdd.length === 1 ? '' : 's'} (skipped ${skipped.length} duplicate${skipped.length === 1 ? '' : 's'}).`,
      );
    }

    setPendingImport(null);
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
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileUploadIcon />}
            onClick={handleImportClick}
            disabled={!meter}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            disabled={!meter || meterReadings.length === 0}
          >
            Export
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openNew}
          >
            Add reading
          </Button>
        </Stack>
      </Stack>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChosen}
        hidden
        data-testid="readings-import-input"
      />

      {sortedRows.length === 0 ? (
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
        <BlueprintFrame tag="LOG/01" subTag={`N=${sortedRows.length}`} padding={0}>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottomStyle: 'dashed' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortDir} sx={{ pl: 3 }}>
                    <TableSortLabel
                      active
                      direction={sortDir}
                      onClick={toggleSort}
                      aria-label="Toggle sort by date"
                    >
                      When
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Reading</TableCell>
                  <TableCell>Δ since previous</TableCell>
                  <TableCell align="right" sx={{ pr: 3 }}>
                    Ops
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRows.map(({ reading, delta }) => {
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
                            {format(new Date(reading.takenAt), 'h:mm a')}
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
          <Stack
            direction="row"
            sx={{
              px: 3,
              py: 1.5,
              borderTop: '1px dashed',
              borderColor: 'divider',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'var(--app-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              Showing {showingFrom}–{showingTo} of {sortedRows.length}
            </Typography>
            <Pagination
              count={totalPages}
              page={safePage}
              onChange={(_, value) => setPage(value)}
              disabled={paginationDisabled}
              size="small"
              shape="rounded"
              siblingCount={1}
            />
          </Stack>
        </BlueprintFrame>
      )}

      <ReadingFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        meterId={meterId}
        editingReading={editing}
      />

      <ImportReadingsDialog
        open={pendingImport !== null}
        count={pendingImport?.readings.length ?? 0}
        sourceMeterName={pendingImport?.meter.name ?? ''}
        exportedAt={pendingImport?.exportedAt ?? ''}
        onCancel={() => setPendingImport(null)}
        onConfirm={handleImportConfirm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
