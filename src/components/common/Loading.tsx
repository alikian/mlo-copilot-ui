import { Box, CircularProgress, Skeleton, Stack } from '@mui/material'

export default function Loading({ variant = 'page' }: { variant?: 'page' | 'table' }) {
  if (variant === 'table') {
    return (
      <Stack spacing={1} sx={{ p: 2 }}>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={360} />
      </Stack>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 6 }}>
      <CircularProgress />
    </Box>
  )
}
