import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'

const citizenshipOptions = [
  { label: 'US Citizen', value: 'us_citizen' },
  { label: 'Permanent Resident', value: 'permanent_resident' },
  { label: 'Non-permanent Resident', value: 'non_permanent_resident' },
  { label: 'Unknown', value: 'unknown' },
] as const

const incomeTypeOptions = [
  { label: 'W2', value: 'w2' },
  { label: '1099', value: '1099' },
  { label: 'Self-employed', value: 'self_employed' },
  { label: 'Retired', value: 'retired' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Unknown', value: 'unknown' },
] as const

export default function BorrowersEditor({ name = 'borrowers' }: { name?: string }) {
  const { control, getValues, setValue } = useFormContext<any>()
  const { fields, append, remove } = useFieldArray({ control, name })

  function ensureOnePrimary(primaryIndex: number) {
    const borrowers = getValues(name) as Array<any>
    borrowers.forEach((_, idx) => {
      setValue(`${name}.${idx}.is_primary`, idx === primaryIndex)
    })
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Borrowers
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            append({
              borrower_id: crypto.randomUUID(),
              is_primary: fields.length === 0,
              credit_score_mid: '',
              citizenship: 'unknown',
              employment: {
                income_type: 'unknown',
                job_time_months: '',
                self_employed_time_months: '',
              },
            })
          }
        >
          Add borrower
        </Button>
      </Stack>

      {fields.map((f, idx) => (
        <Card key={f.id} variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Borrower {idx + 1}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Primary
                </Typography>
                <Controller
                  name={`${name}.${idx}.is_primary`}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={!!field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked)
                        if (e.target.checked) ensureOnePrimary(idx)
                      }}
                    />
                  )}
                />
                <IconButton
                  aria-label="Remove borrower"
                  onClick={() => {
                    const borrowers = getValues(name) as Array<any>
                    if (borrowers.length <= 1) return
                    const wasPrimary = borrowers[idx]?.is_primary
                    remove(idx)
                    const next = (getValues(name) as Array<any>) || []
                    if (wasPrimary && next.length) {
                      setValue(`${name}.0.is_primary`, true)
                      for (let i = 1; i < next.length; i++) {
                        setValue(`${name}.${i}.is_primary`, false)
                      }
                    }
                  }}
                  disabled={(getValues(name) as Array<any>)?.length <= 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name={`${name}.${idx}.credit_score_mid`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Credit Score (mid)"
                      {...field}
                      placeholder="Unknown"
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name={`${name}.${idx}.citizenship`}
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Citizenship" {...field} fullWidth>
                      {citizenshipOptions.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name={`${name}.${idx}.employment.income_type`}
                  control={control}
                  render={({ field }) => (
                    <TextField select label="Income Type" {...field} fullWidth>
                      {incomeTypeOptions.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name={`${name}.${idx}.employment.job_time_months`}
                  control={control}
                  render={({ field }) => (
                    <TextField label="Job Time (months)" {...field} placeholder="Unknown" fullWidth />
                  )}
                />
                <Controller
                  name={`${name}.${idx}.employment.self_employed_time_months`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      label="Self-employed Time (months)"
                      {...field}
                      placeholder="Unknown"
                      fullWidth
                    />
                  )}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
