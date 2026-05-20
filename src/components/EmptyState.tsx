import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';

interface EmptyStateProps {
  onCreateMeter: () => void;
}

export function EmptyState({ onCreateMeter }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        py: 8,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5">No meters yet</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
        Add your first water meter to start recording readings.
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreateMeter}>
        Create your first meter
      </Button>
    </Box>
  );
}
