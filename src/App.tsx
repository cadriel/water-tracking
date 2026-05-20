import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function App() {
    return (
        <Container maxWidth="md">
            <Box sx={{ py: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Water Tracking
                </Typography>
                <Typography color="text.secondary">
                    No meters yet.
                </Typography>
            </Box>
        </Container>
    );
}

export default App;
