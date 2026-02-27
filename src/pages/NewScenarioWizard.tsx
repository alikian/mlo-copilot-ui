import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { createCase } from '@/api/cases'
import { getTenantId, getUserId } from '@/api/client'
import ChipsInput from '@/components/common/ChipsInput'
import { useToast } from '@/components/common/ToastProvider'
import type {
  CaseDetail,
  Citizenship,
  DealPurpose,
  IncomeType,
  Occupancy,
  PropertyType,
} from '@/types/case'

const steps = ['Deal', 'Primary Borrower', 'Income', 'Assets', 'Liabilities', 'Property'] as const

type StepKey = (typeof steps)[number]

function numberOrUnknown(v: unknown): number | 'unknown' {
  if (v === null || v === undefined) return 'unknown'
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t) return 'unknown'
    const n = Number(t)
    return Number.isFinite(n) ? n : 'unknown'
  }
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : 'unknown'
  }
  return 'unknown'
}

const schema = z.object({
  deal: z.object({
    purpose: z.enum(['purchase', 'refi', 'cash_out']),
    occupancy: z.enum(['primary', 'second', 'investment']),
    property_type: z.enum(['sfr', 'condo', 'townhome', '2-4_unit', 'manufactured', 'other']),
    state: z
      .string()
      .min(2, 'State is required')
      .max(2, 'Use 2-letter code')
      .transform((s) => s.toUpperCase()),
    target_close_days: z.preprocess(
      (v) => (typeof v === 'string' ? Number(v) : v),
      z.number().int().min(1, 'Must be at least 1 day').max(365),
    ),
  }),
  primaryBorrower: z.object({
    credit_score_mid: z.string().optional(),
    citizenship: z.enum([
      'us_citizen',
      'permanent_resident',
      'non_permanent_resident',
      'unknown',
    ]),
    employment: z.object({
      income_type: z.enum(['w2', '1099', 'self_employed', 'retired', 'mixed', 'unknown']),
      job_time_months: z.string().optional(),
      self_employed_time_months: z.string().optional(),
    }),
  }),
  income: z.object({
    monthly_gross_income: z.string().optional(),
    income_notes: z.string().default(''),
    documents_seen: z.array(z.string()).default([]),
  }),
  assets: z.object({
    down_payment_amount: z.string().optional(),
    reserves_months: z.string().optional(),
    gift_funds: z.enum(['true', 'false', 'unknown']).default('unknown'),
    gift_amount: z.string().optional(),
  }),
  liabilities: z.object({
    monthly_debts_total: z.string().optional(),
    current_housing_payment: z.string().optional(),
    future_housing_payment_est: z.string().optional(),
    notes: z.string().default(''),
  }),
  property: z.object({
    purchase_price: z.string().optional(),
    estimated_value: z.string().optional(),
    loan_amount: z.string().optional(),
    hoa_dues_monthly: z.string().optional(),
  }),
})

type FormValues = z.infer<typeof schema>

const dealPurposeOptions: Array<{ label: string; value: DealPurpose }> = [
  { label: 'Purchase', value: 'purchase' },
  { label: 'Refi', value: 'refi' },
  { label: 'Cash Out', value: 'cash_out' },
]
const occupancyOptions: Array<{ label: string; value: Occupancy }> = [
  { label: 'Primary', value: 'primary' },
  { label: 'Second', value: 'second' },
  { label: 'Investment', value: 'investment' },
]
const propertyTypeOptions: Array<{ label: string; value: PropertyType }> = [
  { label: 'SFR', value: 'sfr' },
  { label: 'Condo', value: 'condo' },
  { label: 'Townhome', value: 'townhome' },
  { label: '2-4 Unit', value: '2-4_unit' },
  { label: 'Manufactured', value: 'manufactured' },
  { label: 'Other', value: 'other' },
]
const citizenshipOptions: Array<{ label: string; value: Citizenship }> = [
  { label: 'US Citizen', value: 'us_citizen' },
  { label: 'Permanent Resident', value: 'permanent_resident' },
  { label: 'Non-permanent Resident', value: 'non_permanent_resident' },
  { label: 'Unknown', value: 'unknown' },
]
const incomeTypeOptions: Array<{ label: string; value: IncomeType }> = [
  { label: 'W2', value: 'w2' },
  { label: '1099', value: '1099' },
  { label: 'Self-employed', value: 'self_employed' },
  { label: 'Retired', value: 'retired' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'Unknown', value: 'unknown' },
]

export default function NewScenarioWizard() {
  const toast = useToast()
  const navigate = useNavigate()
  const tenantId = getTenantId()
  const userId = getUserId()

  const [activeStep, setActiveStep] = React.useState(0)

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deal: {
        purpose: 'purchase',
        occupancy: 'primary',
        property_type: 'sfr',
        state: 'CA',
        target_close_days: 30 as any,
      },
      primaryBorrower: {
        credit_score_mid: '',
        citizenship: 'unknown',
        employment: {
          income_type: 'unknown',
          job_time_months: '',
          self_employed_time_months: '',
        },
      },
      income: {
        monthly_gross_income: '',
        income_notes: '',
        documents_seen: [],
      },
      assets: {
        down_payment_amount: '',
        reserves_months: '',
        gift_funds: 'unknown',
        gift_amount: '',
      },
      liabilities: {
        monthly_debts_total: '',
        current_housing_payment: '',
        future_housing_payment_est: '',
        notes: '',
      },
      property: {
        purchase_price: '',
        estimated_value: '',
        loan_amount: '',
        hoa_dues_monthly: '',
      },
    },
    mode: 'onBlur',
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: Partial<CaseDetail> = {
        status: 'intake',
        created_by: { user_id: userId, role: 'broker' },
        deal: values.deal,
        borrowers: [
          {
            borrower_id: crypto.randomUUID(),
            is_primary: true,
            credit_score_mid: numberOrUnknown(values.primaryBorrower.credit_score_mid),
            citizenship: values.primaryBorrower.citizenship,
            employment: {
              income_type: values.primaryBorrower.employment.income_type,
              job_time_months: numberOrUnknown(values.primaryBorrower.employment.job_time_months),
              self_employed_time_months: numberOrUnknown(
                values.primaryBorrower.employment.self_employed_time_months,
              ),
            },
          },
        ],
        income: {
          monthly_gross_income: numberOrUnknown(values.income.monthly_gross_income),
          income_notes: values.income.income_notes || '',
          documents_seen: values.income.documents_seen || [],
        },
        assets: {
          down_payment_amount: numberOrUnknown(values.assets.down_payment_amount),
          reserves_months: numberOrUnknown(values.assets.reserves_months),
          gift_funds:
            values.assets.gift_funds === 'unknown'
              ? 'unknown'
              : values.assets.gift_funds === 'true',
          gift_amount: numberOrUnknown(values.assets.gift_amount),
        },
        liabilities: {
          monthly_debts_total: numberOrUnknown(values.liabilities.monthly_debts_total),
          current_housing_payment: numberOrUnknown(values.liabilities.current_housing_payment),
          future_housing_payment_est: numberOrUnknown(values.liabilities.future_housing_payment_est),
          notes: values.liabilities.notes || '',
        },
        property: {
          purchase_price: numberOrUnknown(values.property.purchase_price),
          estimated_value: numberOrUnknown(values.property.estimated_value),
          loan_amount: numberOrUnknown(values.property.loan_amount),
          hoa_dues_monthly: numberOrUnknown(values.property.hoa_dues_monthly),
        },
        calculations: {
          ltv: 'unknown',
          front_dti: 'unknown',
          back_dti: 'unknown',
        },
        risk_flags: [],
        copilot: {
          suggested_directions: [],
          questions_to_ask_next: [],
          doc_checklist: [],
          guideline_citations: [],
        },
        human_decision: {
          selected_path: '',
          notes: '',
        },
        outcome: {
          aus: 'unknown',
          decision: 'unknown',
          conditions: [],
          denial_reasons: [],
          final_lender: 'unknown',
          closed_date: null,
        },
      }

      return createCase(tenantId, payload)
    },
    onSuccess: (created) => {
      toast.showSuccess('Scenario created')
      navigate(`/cases/${created.case_id}`)
    },
    onError: (err: any) => {
      toast.showError(err?.message || 'Create failed')
    },
  })

  const stepKey: StepKey = steps[activeStep]

  async function onNext() {
    const isValid = await methods.trigger(
      stepKey === 'Deal'
        ? ['deal']
        : stepKey === 'Primary Borrower'
          ? ['primaryBorrower']
          : stepKey === 'Income'
            ? ['income']
            : stepKey === 'Assets'
              ? ['assets']
              : stepKey === 'Liabilities'
                ? ['liabilities']
                : ['property'],
    )
    if (!isValid) return
    setActiveStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function onBack() {
    setActiveStep((s) => Math.max(s - 1, 0))
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 980 }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        New Scenario
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3 }}>
            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit((v) => mutation.mutate(v))}
                noValidate
              >
                <Stack spacing={2}>
                  {stepKey === 'Deal' ? (
                    <Stack spacing={2}>
                      <Controller
                        name="deal.purpose"
                        control={methods.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            select
                            label="Purpose"
                            {...field}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          >
                            {dealPurposeOptions.map((o) => (
                              <MenuItem key={o.value} value={o.value}>
                                {o.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                      <Controller
                        name="deal.occupancy"
                        control={methods.control}
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
                        control={methods.control}
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

                      <Controller
                        name="deal.state"
                        control={methods.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            label="State (2-letter)"
                            {...field}
                            inputProps={{ maxLength: 2 }}
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />

                      <Controller
                        name="deal.target_close_days"
                        control={methods.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            label="Target Close (days)"
                            {...field}
                            type="number"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Stack>
                  ) : null}

                  {stepKey === 'Primary Borrower' ? (
                    <Stack spacing={2}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Primary Borrower
                      </Typography>
                      <Controller
                        name="primaryBorrower.credit_score_mid"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Credit Score (mid)"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="numeric"
                          />
                        )}
                      />
                      <Controller
                        name="primaryBorrower.citizenship"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField select label="Citizenship" {...field}>
                            {citizenshipOptions.map((o) => (
                              <MenuItem key={o.value} value={o.value}>
                                {o.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                      <Controller
                        name="primaryBorrower.employment.income_type"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField select label="Income Type" {...field}>
                            {incomeTypeOptions.map((o) => (
                              <MenuItem key={o.value} value={o.value}>
                                {o.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Controller
                          name="primaryBorrower.employment.job_time_months"
                          control={methods.control}
                          render={({ field }) => (
                            <TextField
                              label="Job Time (months)"
                              {...field}
                              placeholder="Leave blank for Unknown"
                              fullWidth
                            />
                          )}
                        />
                        <Controller
                          name="primaryBorrower.employment.self_employed_time_months"
                          control={methods.control}
                          render={({ field }) => (
                            <TextField
                              label="Self-employed Time (months)"
                              {...field}
                              placeholder="Leave blank for Unknown"
                              fullWidth
                            />
                          )}
                        />
                      </Stack>
                    </Stack>
                  ) : null}

                  {stepKey === 'Income' ? (
                    <Stack spacing={2}>
                      <Controller
                        name="income.monthly_gross_income"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Monthly Gross Income"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Controller
                        name="income.income_notes"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField label="Income Notes" {...field} multiline minRows={3} />
                        )}
                      />
                      <Controller
                        name="income.documents_seen"
                        control={methods.control}
                        render={({ field }) => (
                          <ChipsInput
                            label="Documents Seen"
                            value={field.value || []}
                            onChange={field.onChange}
                            placeholder="e.g., Paystubs, W2s"
                          />
                        )}
                      />
                    </Stack>
                  ) : null}

                  {stepKey === 'Assets' ? (
                    <Stack spacing={2}>
                      <Controller
                        name="assets.down_payment_amount"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Down Payment Amount"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Controller
                        name="assets.reserves_months"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Reserves (months)"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Controller
                        name="assets.gift_funds"
                        control={methods.control}
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
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Gift Amount"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                    </Stack>
                  ) : null}

                  {stepKey === 'Liabilities' ? (
                    <Stack spacing={2}>
                      <Controller
                        name="liabilities.monthly_debts_total"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Monthly Debts Total"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Controller
                          name="liabilities.current_housing_payment"
                          control={methods.control}
                          render={({ field }) => (
                            <TextField
                              label="Current Housing Payment"
                              {...field}
                              placeholder="Leave blank for Unknown"
                              fullWidth
                            />
                          )}
                        />
                        <Controller
                          name="liabilities.future_housing_payment_est"
                          control={methods.control}
                          render={({ field }) => (
                            <TextField
                              label="Future Housing Payment (est)"
                              {...field}
                              placeholder="Leave blank for Unknown"
                              fullWidth
                            />
                          )}
                        />
                      </Stack>
                      <Controller
                        name="liabilities.notes"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField label="Notes" {...field} multiline minRows={3} />
                        )}
                      />
                    </Stack>
                  ) : null}

                  {stepKey === 'Property' ? (
                    <Stack spacing={2}>
                      <Controller
                        name="property.purchase_price"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Purchase Price"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Controller
                        name="property.estimated_value"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Estimated Value"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Controller
                        name="property.loan_amount"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="Loan Amount"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                      <Controller
                        name="property.hoa_dues_monthly"
                        control={methods.control}
                        render={({ field }) => (
                          <TextField
                            label="HOA Dues (monthly)"
                            {...field}
                            placeholder="Leave blank for Unknown"
                            inputMode="decimal"
                          />
                        )}
                      />
                    </Stack>
                  ) : null}

                  <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                    <Button disabled={activeStep === 0 || mutation.isPending} onClick={onBack}>
                      Back
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    {activeStep < steps.length - 1 ? (
                      <Button variant="contained" onClick={onNext} disabled={mutation.isPending}>
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={mutation.isPending}
                      >
                        Create Scenario
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </form>
            </FormProvider>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
