import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useWaterTrackingMeters, useWaterTrackingActions } from '../store/useWaterTrackingStore';

interface MeterManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MeterManagerDialog({ open, onClose }: MeterManagerDialogProps) {
  const meters = useWaterTrackingMeters();
  const { addMeter, renameMeter, deleteMeter } = useWaterTrackingActions();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditingName(currentName);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  function commitEditing() {
    if (editingId && editingName.trim()) {
      renameMeter(editingId, editingName.trim());
    }
    cancelEditing();
  }

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addMeter(trimmed);
    setNewName('');
  }

  function handleDelete(id: string, meterName: string) {
    if (window.confirm(`Delete meter "${meterName}" and all its readings?`)) {
      deleteMeter(id);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage meters</DialogTitle>
      <DialogContent dividers>
        <List dense disablePadding>
          {meters.map(meter => (
            <ListItem
              key={meter.id}
              secondaryAction={
                editingId === meter.id ? (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton edge="end" onClick={commitEditing} aria-label="Save name">
                      <CheckIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={cancelEditing} aria-label="Cancel">
                      <CloseIcon />
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      edge="end"
                      onClick={() => startEditing(meter.id, meter.name)}
                      aria-label="Rename"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(meter.id, meter.name)}
                      aria-label="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                )
              }
            >
              {editingId === meter.id ? (
                <TextField
                  size="small"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEditing();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  autoFocus
                  fullWidth
                />
              ) : (
                <ListItemText primary={meter.name} />
              )}
            </ListItem>
          ))}
        </List>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField
            size="small"
            label="New meter name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd();
            }}
            fullWidth
          />
          <Button variant="contained" onClick={handleAdd} disabled={!newName.trim()}>
            Add
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
