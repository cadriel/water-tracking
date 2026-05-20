import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import {
  useWaterTrackingMeters,
  useWaterTrackingSelectedMeterId,
  useWaterTrackingActions,
} from '../store/useWaterTrackingStore';

interface AppHeaderProps {
  onManageMeters: () => void;
}

export function AppHeader({ onManageMeters }: AppHeaderProps) {
  const meters = useWaterTrackingMeters();
  const selectedMeterId = useWaterTrackingSelectedMeterId();
  const { selectMeter } = useWaterTrackingActions();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{
          gap: { xs: 1.5, md: 3 },
          minHeight: { xs: 68, md: 80 },
          alignItems: 'center',
        }}
      >
        <Mark />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <Typography
            component="h1"
            sx={{
              fontFamily: 'var(--app-display)',
              fontWeight: 600,
              fontSize: { xs: '1.45rem', md: '1.7rem' },
              letterSpacing: '-0.015em',
              lineHeight: 1.05,
              color: 'text.primary',
              fontVariationSettings: '"opsz" 96, "SOFT" 60, "WONK" 1',
            }}
          >
            Water Tracking
          </Typography>
          <Typography
            component="span"
            sx={{
              fontFamily: 'var(--app-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'secondary.main',
              mt: 0.5,
            }}
          >
            Calibrated · Cubic Metres
          </Typography>
        </Box>

        {meters.length > 0 && (
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 140, md: 220 },
              '& .MuiInputLabel-root': {
                fontFamily: 'var(--app-mono)',
                fontSize: '0.72rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              },
              '& .MuiOutlinedInput-root': {
                fontFamily: 'var(--app-mono)',
                fontSize: '0.84rem',
                letterSpacing: '0.04em',
              },
            }}
          >
            <InputLabel id="meter-select-label">Meter</InputLabel>
            <Select
              labelId="meter-select-label"
              label="Meter"
              value={selectedMeterId ?? ''}
              onChange={e => selectMeter(e.target.value || null)}
            >
              {meters.map(meter => (
                <MenuItem key={meter.id} value={meter.id} sx={{ fontFamily: 'var(--app-mono)' }}>
                  {meter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Button
          variant="outlined"
          color="primary"
          onClick={onManageMeters}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'transparent' },
          }}
        >
          Meters
        </Button>
      </Toolbar>
    </AppBar>
  );
}

function Mark() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        width: 44,
        height: 44,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 0.5,
        bgcolor: 'background.paper',
        // tiny corner ticks on the mark itself
        '&::before, &::after': {
          content: '""',
          position: 'absolute',
          width: 6,
          height: 6,
          borderColor: 'secondary.main',
          borderStyle: 'solid',
          borderWidth: 0,
        },
        '&::before': { top: -1, left: -1, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
        '&::after': { bottom: -1, right: -1, borderBottomWidth: 1.5, borderRightWidth: 1.5 },
      }}
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        {/* droplet outline */}
        <path
          d="M13 3.5 C 8 9, 5.5 13, 5.5 16.5 a 7.5 7.5 0 0 0 15 0 C 20.5 13, 18 9, 13 3.5 Z"
          stroke="currentColor"
          strokeWidth="1.25"
          fill="none"
          style={{ color: 'var(--mui-palette-primary-main)' }}
        />
        {/* horizon line through droplet — the "calibration" reference */}
        <line
          x1="2"
          y1="18.5"
          x2="24"
          y2="18.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          style={{ color: 'var(--mui-palette-secondary-main)' }}
        />
        {/* small fill cell inside droplet */}
        <path
          d="M13 11 C 10.5 13.5, 9 15, 9 16.5 a 4 4 0 0 0 8 0 C 17 15, 15.5 13.5, 13 11 Z"
          fill="currentColor"
          opacity="0.18"
          style={{ color: 'var(--mui-palette-info-main)' }}
        />
      </svg>
    </Box>
  );
}
