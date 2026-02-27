import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'
import ChipsInput from '@/components/common/ChipsInput'
import BorrowersEditor from './BorrowersEditor'

const purposeOptions = [
  { label: 'Purchase', value: 'purchase' },
  { label: 'Refi', value: 'refi' },
  { label: 'Cash Out', value: 'cash_out' },
] as const

const occupancyOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Second', value: 'second' },
  { label: 'Investment', value: 'investment' },
] as const

const propertyTypeOptions = [
  { label: 'SFR', value: 'sfr' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhome', value: 'townhome' },
  { label: '2-4 Unit', value: '2-4_unit' },
  { label: 'Manufactured', value: 'manufactured' },
  { label: 'Other', value: 'other' },
] as const

export default function IntakeAccordion() {
  const { control } = useFormContext<any>()

  return (
    <Stack spacing={2}>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Deal</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="deal.purpose"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Purpose"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {purposeOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="deal.occupancy"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Occupancy"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {occupancyOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="deal.property_type"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Property Type"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {propertyTypeOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="deal.state"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="State"
                    {...field}
                    inputProps={{ maxLength: 2 }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="deal.target_close_days"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Target Close (days)"
                    {...field}
                    type="number"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Borrowers</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <BorrowersEditor />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Income</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="income.monthly_gross_income"
              control={control}
              render={({ field }) => (
                <TextField label="Monthly Gross Income" {...field} placeholder="Unknown" />
              )}
            />
            <Controller
              name="income.income_notes"
              control={control}
              render={({ field }) => (
                <TextField label="Income Notes" {...field} multiline minRows={3} />
              )}
            />
            <Controller
              name="income.documents_seen"
              control={control}
              render={({ field }) => (
                <ChipsInput label="Documents Seen" value={field.value || []} onChange={field.onChange} />
              )}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Assets</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="assets.down_payment_amount"
              control={control}
              render={({ field }) => (
                <TextField label="Down Payment Amount" {...field} placeholder="Unknown" />
              )}
            />
            <Controller
              name="assets.reserves_months"
              control={control}
              render={({ field }) => (
                <TextField label="Reserves (months)" {...field} placeholder="Unknown" />
              )}
            />
            <Controller
              name="assets.gift_funds"
              control={control}
              render={({ field }) => (
                <TextField select label="Gift Funds" {...field}>
                  <MenuItem value="unknown">Unknown</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="assets.gift_amount"
              control={control}
              render={({ field }) => <TextField label="Gift Amount" {...field} placeholder="Unknown" />}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Liabilities</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="liabilities.monthly_debts_total"
              control={control}
              render={({ field }) => <TextField label="Monthly Debts Total" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="liabilities.current_housing_payment"
              control={control}
              render={({ field }) => (
                <TextField label="Current Housing Payment" {...field} placeholder="Unknown" />
              )}
            />
            <Controller
              name="liabilities.future_housing_payment_est"
              control={control}
              render={({ field }) => (
                <TextField label="Future Housing Payment (est)" {...field} placeholder="Unknown" />
              )}
            />
            <Controller
              name="liabilities.notes"
              control={control}
              render={({ field }) => <TextField label="Notes" {...field} multiline minRows={3} />}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Property</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="property.purchase_price"
              control={control}
              render={({ field }) => <TextField label="Purchase Price" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="property.estimated_value"
              control={control}
              render={({ field }) => <TextField label="Estimated Value" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="property.loan_amount"
              control={control}
              render={({ field }) => <TextField label="Loan Amount" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="property.hoa_dues_monthly"
              control={control}
              render={({ field }) => <TextField label="HOA Dues (monthly)" {...field} placeholder="Unknown" />}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Human Decision</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="human_decision.selected_path"
              control={control}
              render={({ field }) => <TextField label="Selected Path" {...field} />}
            />
            <Controller
              name="human_decision.notes"
              control={control}
              render={({ field }) => <TextField label="Notes" {...field} multiline minRows={3} />}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}
