import { zodResolver } from '@hookform/resolvers/zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import * as React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

import { getCase, patchCase } from '@/api/cases'
import { getTenantId } from '@/api/client'
import ErrorState from '@/components/common/ErrorState'
import Loading from '@/components/common/Loading'
import { useToast } from '@/components/common/ToastProvider'
import IntakeAccordion from '@/components/case/IntakeAccordion'
import RiskFlags from '@/components/case/RiskFlags'
import CopilotTabs from '@/components/case/CopilotTabs/CopilotTabs'
import type { CaseDetail, UnknownNumber } from '@/types/case'

function unknownNumberToString(v: UnknownNumber): string {
  return v === 'unknown' ? '' : String(v)
}

function unknownNumberToStringSafe(v: UnknownNumber | undefined | null): string {
  if (v === undefined || v === null) return ''
  return unknownNumberToString(v)
}

function stringToUnknownNumber(v: unknown): UnknownNumber {
  if (v === null || v === undefined) return 'unknown'
  if (typeof v === 'number') return Number.isFinite(v) ? v : 'unknown'
  const s = String(v).trim()
  if (!s) return 'unknown'
  const n = Number(s)
  return Number.isFinite(n) ? n : 'unknown'
}

type IntakeFormValues = {
  deal: {
    purpose: CaseDetail['deal']['purpose']
    occupancy: CaseDetail['deal']['occupancy']
    property_type: CaseDetail['deal']['property_type']
    state: string
    target_close_days: string
  }
  borrowers: Array<{
    borrower_id: string
    is_primary: boolean
    credit_score_mid: string
    citizenship: CaseDetail['borrowers'][number]['citizenship']
    employment: {
      income_type: CaseDetail['borrowers'][number]['employment']['income_type']
      job_time_months: string
      self_employed_time_months: string
    }
  }>
  income: {
    monthly_gross_income: string
    income_notes: string
    documents_seen: string[]
  }
  assets: {
    down_payment_amount: string
    reserves_months: string
    gift_funds: 'true' | 'false' | 'unknown'
    gift_amount: string
  }
  liabilities: {
    monthly_debts_total: string
    current_housing_payment: string
    future_housing_payment_est: string
    notes: string
  }
  property: {
    purchase_price: string
    estimated_value: string
    loan_amount: string
    hoa_dues_monthly: string
  }
  human_decision: {
    selected_path: string
    notes: string
  }
}

const intakeSchema = z
  .object({
    deal: z.object({
      purpose: z.enum(['purchase', 'refi', 'cash_out']),
      occupancy: z.enum(['primary', 'second', 'investment']),
      property_type: z.enum(['sfr', 'condo', 'townhome', '2-4_unit', 'manufactured', 'other']),
      state: z
        .string()
        .min(2, 'State is required')
        .max(2, 'Use 2-letter code')
        .transform((s) => s.toUpperCase()),
      target_close_days: z
        .string()
        .min(1, 'Target close days is required')
        .refine((v) => Number(v) > 0 && Number.isFinite(Number(v)), 'Enter a valid number'),
    }),
    borrowers: z
      .array(
        z.object({
          borrower_id: z.string().min(1),
          is_primary: z.boolean(),
          credit_score_mid: z.string().default(''),
          citizenship: z.enum([
            'us_citizen',
            'permanent_resident',
            'non_permanent_resident',
            'unknown',
          ]),
          employment: z.object({
            income_type: z.enum(['w2', '1099', 'self_employed', 'retired', 'mixed', 'unknown']),
            job_time_months: z.string().default(''),
            self_employed_time_months: z.string().default(''),
          }),
        }),
      )
      .min(1, 'At least one borrower is required')
      .refine((arr) => arr.some((b) => b.is_primary), 'At least one primary borrower is required'),
    income: z.object({
      monthly_gross_income: z.string().optional().default(''),
      income_notes: z.string().default(''),
      documents_seen: z.array(z.string()).default([]),
    }),
    assets: z.object({
      down_payment_amount: z.string().optional().default(''),
      reserves_months: z.string().optional().default(''),
      gift_funds: z.enum(['true', 'false', 'unknown']).default('unknown'),
      gift_amount: z.string().optional().default(''),
    }),
    liabilities: z.object({
      monthly_debts_total: z.string().optional().default(''),
      current_housing_payment: z.string().optional().default(''),
      future_housing_payment_est: z.string().optional().default(''),
      notes: z.string().default(''),
    }),
    property: z.object({
      purchase_price: z.string().optional().default(''),
      estimated_value: z.string().optional().default(''),
      loan_amount: z.string().optional().default(''),
      hoa_dues_monthly: z.string().optional().default(''),
    }),
    human_decision: z.object({
      selected_path: z.string().default(''),
      notes: z.string().default(''),
    }),
  })

function caseToFormValues(c: CaseDetail): IntakeFormValues {
  const borrowersRaw = Array.isArray((c as any).borrowers) ? ((c as any).borrowers as any[]) : []
  const borrowersNormalized = borrowersRaw.length
    ? borrowersRaw
    : [
        {
          borrower_id: crypto.randomUUID(),
          is_primary: true,
          credit_score_mid: 'unknown',
          citizenship: 'unknown',
          employment: {
            income_type: 'unknown',
            job_time_months: 'unknown',
            self_employed_time_months: 'unknown',
          },
        },
      ]

  const hasPrimary = borrowersNormalized.some((b) => !!b?.is_primary)
  if (!hasPrimary) borrowersNormalized[0].is_primary = true

  return {
    deal: {
      purpose: (c as any).deal?.purpose ?? 'purchase',
      occupancy: (c as any).deal?.occupancy ?? 'primary',
      property_type: (c as any).deal?.property_type ?? 'sfr',
      state: (c as any).deal?.state ?? 'CA',
      target_close_days: String((c as any).deal?.target_close_days ?? 30),
    },
    borrowers: borrowersNormalized.map((b) => ({
      borrower_id: b.borrower_id || crypto.randomUUID(),
      is_primary: !!b.is_primary,
      credit_score_mid: unknownNumberToStringSafe(b.credit_score_mid),
      citizenship: b.citizenship ?? 'unknown',
      employment: {
        income_type: b.employment?.income_type ?? 'unknown',
        job_time_months: unknownNumberToStringSafe(b.employment?.job_time_months),
        self_employed_time_months: unknownNumberToStringSafe(b.employment?.self_employed_time_months),
      },
    })),
    income: {
      monthly_gross_income: unknownNumberToStringSafe((c as any).income?.monthly_gross_income),
      income_notes: (c as any).income?.income_notes ?? '',
      documents_seen: (c as any).income?.documents_seen || [],
    },
    assets: {
      down_payment_amount: unknownNumberToStringSafe((c as any).assets?.down_payment_amount),
      reserves_months: unknownNumberToStringSafe((c as any).assets?.reserves_months),
      gift_funds:
        (c as any).assets?.gift_funds === 'unknown'
          ? 'unknown'
          : (c as any).assets?.gift_funds === true
            ? 'true'
            : (c as any).assets?.gift_funds === false
              ? 'false'
              : 'unknown',
      gift_amount: unknownNumberToStringSafe((c as any).assets?.gift_amount),
    },
    liabilities: {
      monthly_debts_total: unknownNumberToStringSafe((c as any).liabilities?.monthly_debts_total),
      current_housing_payment: unknownNumberToStringSafe((c as any).liabilities?.current_housing_payment),
      future_housing_payment_est: unknownNumberToStringSafe((c as any).liabilities?.future_housing_payment_est),
      notes: (c as any).liabilities?.notes ?? '',
    },
    property: {
      purchase_price: unknownNumberToStringSafe((c as any).property?.purchase_price),
      estimated_value: unknownNumberToStringSafe((c as any).property?.estimated_value),
      loan_amount: unknownNumberToStringSafe((c as any).property?.loan_amount),
      hoa_dues_monthly: unknownNumberToStringSafe((c as any).property?.hoa_dues_monthly),
    },
    human_decision: {
      selected_path: (c as any).human_decision?.selected_path ?? '',
      notes: (c as any).human_decision?.notes ?? '',
    },
  }
}

function formValuesToPatch(values: IntakeFormValues): Partial<CaseDetail> {
  return {
    deal: {
      ...values.deal,
      target_close_days: Number(values.deal.target_close_days),
      state: values.deal.state.toUpperCase(),
    },
    borrowers: values.borrowers.map((b) => ({
      borrower_id: b.borrower_id,
      is_primary: b.is_primary,
      credit_score_mid: stringToUnknownNumber(b.credit_score_mid),
      citizenship: b.citizenship,
      employment: {
        income_type: b.employment.income_type,
        job_time_months: stringToUnknownNumber(b.employment.job_time_months),
        self_employed_time_months: stringToUnknownNumber(b.employment.self_employed_time_months),
      },
    })),
    income: {
      monthly_gross_income: stringToUnknownNumber(values.income.monthly_gross_income),
      income_notes: values.income.income_notes,
      documents_seen: values.income.documents_seen || [],
    },
    assets: {
      down_payment_amount: stringToUnknownNumber(values.assets.down_payment_amount),
      reserves_months: stringToUnknownNumber(values.assets.reserves_months),
      gift_funds:
        values.assets.gift_funds === 'unknown' ? 'unknown' : values.assets.gift_funds === 'true',
      gift_amount: stringToUnknownNumber(values.assets.gift_amount),
    },
    liabilities: {
      monthly_debts_total: stringToUnknownNumber(values.liabilities.monthly_debts_total),
      current_housing_payment: stringToUnknownNumber(values.liabilities.current_housing_payment),
      future_housing_payment_est: stringToUnknownNumber(values.liabilities.future_housing_payment_est),
      notes: values.liabilities.notes,
    },
    property: {
      purchase_price: stringToUnknownNumber(values.property.purchase_price),
      estimated_value: stringToUnknownNumber(values.property.estimated_value),
      loan_amount: stringToUnknownNumber(values.property.loan_amount),
      hoa_dues_monthly: stringToUnknownNumber(values.property.hoa_dues_monthly),
    },
    human_decision: {
      selected_path: values.human_decision.selected_path,
      notes: values.human_decision.notes,
    },
  }
}

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>()
  const tenantId = getTenantId()
  const toast = useToast()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['case', tenantId, caseId],
    enabled: !!caseId,
    queryFn: () => getCase(tenantId, caseId!),
  })

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: query.data ? caseToFormValues(query.data) : undefined,
    mode: 'onBlur',
  })

  React.useEffect(() => {
    if (query.data) {
      form.reset(caseToFormValues(query.data))
    }
  }, [query.data])

  const mutation = useMutation({
    mutationFn: async (values: IntakeFormValues) => patchCase(tenantId, caseId!, formValuesToPatch(values)),
    onSuccess: () => {
      toast.showSuccess('Saved')
      qc.invalidateQueries({ queryKey: ['case', tenantId, caseId] })
      qc.invalidateQueries({ queryKey: ['cases', tenantId] })
    },
    onError: (err: any) => toast.showError(err?.message || 'Save failed'),
  })

  if (query.isLoading) return <Loading />
  if (query.isError) {
    const err = query.error as any
    return (
      <ErrorState
        title="Couldn’t load case"
        message={err?.message || 'Please check the API URL and try again.'}
        onRetry={() => query.refetch()}
      />
    )
  }

  const c = query.data!

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Case {c.case_id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Updated {dayjs(c.updated_at).format('YYYY-MM-DD HH:mm')} • Created{' '}
            {dayjs(c.created_at).format('YYYY-MM-DD HH:mm')}
          </Typography>
        </Box>
        <Chip label={c.status} variant="outlined" />
      </Stack>

      <RiskFlags flags={c.risk_flags || []} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
                  <Stack spacing={2}>
                    <IntakeAccordion />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button type="submit" variant="contained" disabled={mutation.isPending}>
                        Save
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Unknown values show as blank; leave blank to keep as Unknown.
                      </Typography>
                    </Stack>
                  </Stack>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent>
              <CopilotTabs caseData={c} tenantId={tenantId} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
