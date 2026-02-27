import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { updateOutcome } from '@/api/cases'
import ChipsInput from '@/components/common/ChipsInput'
import { useToast } from '@/components/common/ToastProvider'
import type { CaseDetail, OutcomeAUS, OutcomeDecision } from '@/types/case'

const schema = z.object({
  aus: z.enum(['approve', 'eligible', 'refer', 'ineligible', 'unknown']),
  decision: z.enum(['approved', 'denied', 'pending', 'unknown']),
  conditions: z.array(z.string()).default([]),
  denial_reasons: z.array(z.string()).default([]),
  final_lender: z.string().optional(),
  closed_date: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const ausOptions: Array<{ label: string; value: OutcomeAUS }> = [
  { label: 'Approve', value: 'approve' },
  { label: 'Eligible', value: 'eligible' },
  { label: 'Refer', value: 'refer' },
  { label: 'Ineligible', value: 'ineligible' },
  { label: 'Unknown', value: 'unknown' },
]

const decisionOptions: Array<{ label: string; value: OutcomeDecision }> = [
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
  { label: 'Pending', value: 'pending' },
  { label: 'Unknown', value: 'unknown' },
]

export default function OutcomeTab({ tenantId, caseData }: { tenantId: string; caseData: CaseDetail }) {
  const toast = useToast()
  const qc = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      aus: caseData.outcome.aus,
      decision: caseData.outcome.decision,
      conditions: caseData.outcome.conditions || [],
      denial_reasons: caseData.outcome.denial_reasons || [],
      final_lender: caseData.outcome.final_lender === 'unknown' ? '' : caseData.outcome.final_lender,
      closed_date: caseData.outcome.closed_date ? dayjs(caseData.outcome.closed_date).format('YYYY-MM-DD') : '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: CaseDetail['outcome'] = {
        aus: values.aus,
        decision: values.decision,
        conditions: values.conditions || [],
        denial_reasons: values.denial_reasons || [],
        final_lender: values.final_lender?.trim() ? values.final_lender.trim() : 'unknown',
        closed_date: values.closed_date?.trim()
          ? dayjs(values.closed_date).startOf('day').toISOString()
          : null,
      }
      return updateOutcome(tenantId, caseData.case_id, payload)
    },
    onSuccess: () => {
      toast.showSuccess('Outcome updated')
      qc.invalidateQueries({ queryKey: ['case', tenantId, caseData.case_id] })
    },
    onError: (err: any) => toast.showError(err?.message || 'Outcome update failed'),
  })

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Outcome
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="aus"
              control={form.control}
              render={({ field }) => (
                <TextField select label="AUS" {...field} fullWidth>
                  {ausOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="decision"
              control={form.control}
              render={({ field }) => (
                <TextField select label="Decision" {...field} fullWidth>
                  {decisionOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          <Controller
            name="conditions"
            control={form.control}
            render={({ field }) => (
              <ChipsInput label="Conditions" value={field.value || []} onChange={field.onChange} />
            )}
          />

          <Controller
            name="denial_reasons"
            control={form.control}
            render={({ field }) => (
              <ChipsInput
                label="Denial Reasons"
                value={field.value || []}
                onChange={field.onChange}
              />
            )}
          />

          <Controller
            name="final_lender"
            control={form.control}
            render={({ field }) => <TextField label="Final Lender" {...field} placeholder="Unknown" />}
          />

          <Controller
            name="closed_date"
            control={form.control}
            render={({ field }) => (
              <TextField
                label="Closed Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...field}
              />
            )}
          />

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={form.handleSubmit((v) => mutation.mutate(v))}
              disabled={mutation.isPending}
            >
              Update Outcome
            </Button>
            <Typography variant="caption" color="text.secondary">
              Neutral language only; this is not a promise.
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}
