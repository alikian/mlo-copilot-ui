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
import * as React from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import ChipsInput from '@/components/common/ChipsInput'
import BorrowersEditor from './BorrowersEditor'

function calcMonthlyMortgagePayment(input: {
  loanAmount: unknown
  ratePercent: unknown
  termMonths: unknown
}): number | null {
  const loanAmount = typeof input.loanAmount === 'string' ? Number(input.loanAmount) : (input.loanAmount as any)
  const ratePercent = typeof input.ratePercent === 'string' ? Number(input.ratePercent) : (input.ratePercent as any)
  const termMonths = typeof input.termMonths === 'string' ? Number(input.termMonths) : (input.termMonths as any)

  if (!Number.isFinite(loanAmount) || loanAmount <= 0) return null
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) return null
  if (!Number.isFinite(termMonths) || termMonths <= 0) return null

  const r = ratePercent / 100 / 12
  const n = termMonths
  const denom = 1 - Math.pow(1 + r, -n)
  if (!Number.isFinite(denom) || denom === 0) return null
  const pmt = (loanAmount * r) / denom
  if (!Number.isFinite(pmt) || pmt <= 0) return null
  return Number(pmt.toFixed(2))
}

function parseOptionalNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function calcFutureHousingPaymentEst(input: {
  monthlyMortgagePayment: number | null
  hoaDuesMonthly: unknown
  propertyTaxMonthly: unknown
  insuranceMonthly: unknown
  mortgageInsuranceMonthly: unknown
}): number | null {
  const hoa = parseOptionalNumber(input.hoaDuesMonthly)
  const tax = parseOptionalNumber(input.propertyTaxMonthly)
  const ins = parseOptionalNumber(input.insuranceMonthly)
  const mi = parseOptionalNumber(input.mortgageInsuranceMonthly)

  const hasAny =
    input.monthlyMortgagePayment !== null || hoa !== null || tax !== null || ins !== null || mi !== null
  if (!hasAny) return null

  const total =
    (input.monthlyMortgagePayment ?? 0) + (hoa ?? 0) + (tax ?? 0) + (ins ?? 0) + (mi ?? 0)
  if (!Number.isFinite(total)) return null
  return Number(total.toFixed(2))
}

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
  const { control, watch, setValue } = useFormContext<any>()

  const loanAmount = watch('property.loan_amount')
  const loanRate = watch('loan_terms.rate')
  const loanTermMonths = watch('loan_terms.term_months')
  const hoaDuesMonthly = watch('property.hoa_dues_monthly')
  const propertyTaxMonthly = watch('property.property_tax_monthly')
  const insuranceMonthly = watch('property.insurance_monthly')
  const mortgageInsuranceMonthly = watch('property.mortgage_insurance_monthly')

  const monthlyMortgagePayment = calcMonthlyMortgagePayment({
    loanAmount,
    ratePercent: loanRate,
    termMonths: loanTermMonths,
  })

  const futureHousingPaymentEst = calcFutureHousingPaymentEst({
    monthlyMortgagePayment,
    hoaDuesMonthly,
    propertyTaxMonthly,
    insuranceMonthly,
    mortgageInsuranceMonthly,
  })

  React.useEffect(() => {
    // Keep Liabilities.future_housing_payment_est synced to the computed total.
    setValue(
      'liabilities.future_housing_payment_est',
      futureHousingPaymentEst === null ? '' : String(futureHousingPaymentEst),
      { shouldValidate: true, shouldDirty: true },
    )
  }, [futureHousingPaymentEst, setValue])

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
                <TextField
                  label="Future Housing Payment (est)"
                  {...field}
                  value={futureHousingPaymentEst === null ? '' : String(futureHousingPaymentEst)}
                  placeholder="Unknown"
                  InputProps={{ readOnly: true }}
                  helperText="Calculated from Future Housing Cost + Loan Terms"
                />
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
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Future Housing Cost</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Monthly Mortgage Payment"
              value={monthlyMortgagePayment ?? ''}
              placeholder="Calculated"
              InputProps={{ readOnly: true }}
              helperText="Calculated from Loan Amount + Loan Terms"
            />
            <Controller
              name="property.hoa_dues_monthly"
              control={control}
              render={({ field }) => <TextField label="HOA Dues (monthly)" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="property.property_tax_monthly"
              control={control}
              render={({ field }) => <TextField label="Property Tax (monthly)" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="property.insurance_monthly"
              control={control}
              render={({ field }) => <TextField label="Insurance (monthly)" {...field} placeholder="Unknown" />}
            />
            <Controller
              name="property.mortgage_insurance_monthly"
              control={control}
              render={({ field }) => (
                <TextField label="Mortgage Insurance (monthly)" {...field} placeholder="Unknown" />
              )}
            />
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography sx={{ fontWeight: 700 }}>Loan</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="loan_terms.rate"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Rate (%)"
                    {...field}
                    type="number"
                    inputProps={{ step: 0.01 }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="6.75"
                    fullWidth
                  />
                )}
              />
              <Controller
                name="loan_terms.term_months"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    label="Term (months)"
                    {...field}
                    type="number"
                    inputProps={{ step: 1 }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    placeholder="360"
                    fullWidth
                  />
                )}
              />
            </Stack>
            <Controller
              name="loan_terms.amortization_type"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Amortization Type"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  <MenuItem value="unknown">Unknown</MenuItem>
                  <MenuItem value="fixed">Fixed</MenuItem>
                  <MenuItem value="arm">ARM</MenuItem>
                </TextField>
              )}
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
