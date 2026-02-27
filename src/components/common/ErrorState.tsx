import { Alert, Box, Button, Stack, Typography } from '@mui/material'

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">{title}</Typography>
        <Alert severity="error">{message || 'Please try again.'}</Alert>
        {onRetry ? (
          <Box>
            <Button variant="contained" onClick={onRetry}>
              Retry
            </Button>
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}
