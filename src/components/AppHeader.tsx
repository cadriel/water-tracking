import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SettingsIcon from '@mui/icons-material/Settings';
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
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Water Tracking
        </Typography>
        {meters.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="meter-select-label">Meter</InputLabel>
            <Select
              labelId="meter-select-label"
              label="Meter"
              value={selectedMeterId ?? ''}
              onChange={e => selectMeter(e.target.value || null)}
            >
              {meters.map(meter => (
                <MenuItem key={meter.id} value={meter.id}>
                  {meter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Button color="inherit" startIcon={<SettingsIcon />} onClick={onManageMeters}>
          Meters
        </Button>
      </Toolbar>
    </AppBar>
  );
}
