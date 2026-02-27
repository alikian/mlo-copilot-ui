import { Chip, Stack, Tooltip } from '@mui/material'
import type { RiskSeverity } from '@/types/case'

function colorForSeverity(severity: RiskSeverity): 'default' | 'warning' | 'error' {
  if (severity === 'high') return 'error'
  if (severity === 'medium') return 'warning'
  return 'default'
}

export default function RiskFlags({
  flags,
}: {
  flags: Array<{ code: string; severity: RiskSeverity; details: string }>
}) {
  if (!flags?.length) return null

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {flags.map((f) => (
        <Tooltip key={f.code} title={f.details} arrow>
          <Chip
            label={`${f.code} • ${f.severity}`}
            color={colorForSeverity(f.severity)}
            variant={f.severity === 'low' ? 'outlined' : 'filled'}
            size="small"
          />
        </Tooltip>
      ))}
    </Stack>
  )
}
