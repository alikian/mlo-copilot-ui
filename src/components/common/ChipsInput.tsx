import CloseIcon from '@mui/icons-material/Close'
import { Box, Chip, IconButton, Stack, TextField } from '@mui/material'
import * as React from 'react'

export default function ChipsInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = React.useState('')

  function addFromDraft() {
    const trimmed = draft.trim()
    if (!trimmed) return
    const parts = trimmed
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)

    const next = [...value]
    for (const part of parts) {
      if (!next.includes(part)) next.push(part)
    }
    onChange(next)
    setDraft('')
  }

  return (
    <Stack spacing={1}>
      <TextField
        label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder || 'Type and press Enter'}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addFromDraft()
          }
        }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {value.map((item) => (
          <Chip
            key={item}
            label={item}
            onDelete={() => onChange(value.filter((v) => v !== item))}
            deleteIcon={
              <IconButton size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            variant="outlined"
          />
        ))}
      </Box>
    </Stack>
  )
}
