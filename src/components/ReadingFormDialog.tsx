import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import FormHelperText from '@mui/material/FormHelperText';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { MeterDigitInput, type DigitValue } from './MeterDigitInput';
import type { Reading } from '../types';
import { useWaterTrackingActions, useWaterTrackingReadings } from '../store/useWaterTrackingStore';

interface ReadingFormDialogProps {
  open: boolean;
  onClose: () => void;
  meterId: string;
  editingReading: Reading | null;
}

function readingToDigits(reading: number): DigitValue {
  const total = Math.round(reading * 10000);
  const whole = Math.floor(total / 10000);
  const fraction = total - whole * 10000;
  return {
    white: String(whole).padStart(4, '0'),
    red: String(fraction).padStart(4, '0'),
  };
}

function digitsToReading(value: DigitValue): number | null {
  if (value.white.length !== 4 || value.red.length !== 4) return null;
  return Number(value.white) + Number(value.red) / 10000;
}

export function ReadingFormDialog({
  open,
  onClose,
  meterId,
  editingReading,
}: ReadingFormDialogProps) {
  const { addReading, updateReading } = useWaterTrackingActions();
  const readings = useWaterTrackingReadings();

  const [digits, setDigits] = useState<DigitValue>({ white: '', red: '' });
  const [takenAt, setTakenAt] = useState<Date | null>(new Date());
  const [acknowledgeDecrease, setAcknowledgeDecrease] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingReading) {
      setDigits(readingToDigits(editingReading.reading));
      setTakenAt(new Date(editingReading.takenAt));
    } else {
      setDigits({ white: '', red: '' });
      setTakenAt(new Date());
    }
    setAcknowledgeDecrease(false);
  }, [open, editingReading]);

  const numericReading = digitsToReading(digits);

  const previousReading = useMemo(() => {
    if (!takenAt) return null;
    const takenAtIso = takenAt.toISOString();
    const prior = readings
      .filter(r => r.meterId === meterId && r.id !== editingReading?.id)
      .filter(r => r.takenAt < takenAtIso)
      .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
    return prior[0] ?? null;
  }, [readings, meterId, takenAt, editingReading]);

  const isFuture = takenAt ? takenAt.getTime() > Date.now() : false;
  const decreased =
    numericReading !== null && previousReading !== null && numericReading < previousReading.reading;

  const canSubmit =
    numericReading !== null && takenAt !== null && !isFuture && (!decreased || acknowledgeDecrease);

  function handleSubmit() {
    if (!canSubmit || numericReading === null || !takenAt) return;
    const payload = {
      meterId,
      reading: numericReading,
      takenAt: takenAt.toISOString(),
    };
    if (editingReading) {
      updateReading(editingReading.id, payload);
    } else {
      addReading(payload);
    }
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editingReading ? 'Edit reading' : 'New reading'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <div>
            <MeterDigitInput value={digits} onChange={setDigits} />
            <FormHelperText>4 white digits (m³), then 4 red digits (decimal)</FormHelperText>
          </div>
          <DateTimePicker
            label="Date and time"
            value={takenAt}
            onChange={setTakenAt}
            disableFuture
          />
          {isFuture && <Alert severity="error">Date cannot be in the future.</Alert>}
          {decreased && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setAcknowledgeDecrease(true)}
                  disabled={acknowledgeDecrease}
                >
                  {acknowledgeDecrease ? 'Acknowledged' : 'Save anyway'}
                </Button>
              }
            >
              This reading is lower than the previous one ({previousReading?.reading.toFixed(4)}{' '}
              m³). Water meters usually only go up.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {editingReading ? 'Save changes' : 'Add reading'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
