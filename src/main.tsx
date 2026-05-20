import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Experimental_CssVarsProvider as CssVarsProvider,
    getInitColorSchemeScript,
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import App from './App';
import { theme } from './theme';

// Note: getInitColorSchemeScript output is injected before hydration to
// avoid the "wrong theme on first paint" flash.
const initScript = getInitColorSchemeScript({ defaultMode: 'system' });
if (initScript) {
    const script = document.createElement('script');
    script.textContent = String(initScript.props.children);
    document.head.insertBefore(script, document.head.firstChild);
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CssVarsProvider theme={theme} defaultMode="system">
            <CssBaseline />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <App />
            </LocalizationProvider>
        </CssVarsProvider>
    </StrictMode>
);
