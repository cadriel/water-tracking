import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { BlueprintFrame } from './BlueprintFrame';

interface EmptyStateProps {
  onCreateMeter: () => void;
}

export function EmptyState({ onCreateMeter }: EmptyStateProps) {
  return (
    <Box sx={{ pt: { xs: 4, md: 8 }, maxWidth: 520, mx: 'auto' }}>
      <BlueprintFrame tag="LOG/00" subTag="EMPTY" padding={5}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <Typography
            sx={{
              fontFamily: 'var(--app-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'secondary.main',
            }}
          >
            No meters registered
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '2rem', md: '2.5rem' },
              lineHeight: 1.05,
              fontStyle: 'italic',
              fontVariationSettings: '"opsz" 144, "SOFT" 60, "WONK" 1',
            }}
          >
            Begin the record.
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 360, lineHeight: 1.6 }}>
            Add your first water meter to start tracking consumption — four white digits for cubic
            metres, four red for the decimal.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onCreateMeter}
            sx={{ mt: 2 }}
          >
            Register a meter
          </Button>
        </Box>
      </BlueprintFrame>
    </Box>
  );
}
