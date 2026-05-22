import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type ImportMode = 'merge' | 'replace';

interface ImportReadingsDialogProps {
  open: boolean;
  count: number;
  sourceMeterName: string;
  exportedAt: string;
  onCancel: () => void;
  onConfirm: (mode: ImportMode) => void;
}

export function ImportReadingsDialog({
  open,
  count,
  sourceMeterName,
  exportedAt,
  onCancel,
  onConfirm,
}: ImportReadingsDialogProps) {
  const [mode, setMode] = useState<ImportMode>('merge');

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>
        Import {count} reading{count === 1 ? '' : 's'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <Stack spacing={0.25}>
            <Typography variant="body2" color="text.secondary">
              From meter “{sourceMeterName}”
            </Typography>
            {exportedAt && (
              <Typography variant="caption" color="text.secondary">
                Exported {formatExportedAt(exportedAt)}
              </Typography>
            )}
          </Stack>
          <FormControl>
            <RadioGroup
              value={mode}
              onChange={e => setMode(e.target.value as ImportMode)}
              aria-label="Import mode"
            >
              <FormControlLabel
                value="merge"
                control={<Radio />}
                label="Merge, skip duplicates"
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label="Replace all readings on this meter"
              />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={() => onConfirm(mode)}>
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function formatExportedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}
