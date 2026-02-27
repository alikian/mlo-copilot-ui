import { Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { calculate } from '@/api/cases'
import { useToast } from '@/components/common/ToastProvider'
import type { CaseDetail, UnknownNumber } from '@/types/case'

function showUnknown(v: UnknownNumber): string {
  return v === 'unknown' ? 'Unknown' : String(v)
}

function extractMissingInputs(payload: any): string[] | null {
  if (!payload) return null
  if (Array.isArray(payload.missing_inputs)) return payload.missing_inputs.map(String)
  if (payload.missing_inputs && typeof payload.missing_inputs === 'object') {
    return Object.entries(payload.missing_inputs).map(([k, v]) => `${k}: ${String(v)}`)
  }
  if (Array.isArray(payload.missing)) return payload.missing.map(String)
  return null
}

export default function CalculationsTab({ tenantId, caseData }: { tenantId: string; caseData: CaseDetail }) {
  const toast = useToast()
  const qc = useQueryClient()
  const [missing, setMissing] = React.useState<string[] | null>(null)

  const mutation = useMutation({
    mutationFn: () => calculate(tenantId, caseData.case_id),
    onSuccess: (data) => {
      setMissing(extractMissingInputs(data))
      toast.showSuccess('Calculated')
      qc.invalidateQueries({ queryKey: ['case', tenantId, caseData.case_id] })
    },
    onError: (err: any) => toast.showError(err?.message || 'Calculate failed'),
  })

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Ratios
              </Typography>
              <Button
                variant="contained"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                Calculate
              </Button>
            </Stack>
            <Divider />
            <Typography variant="body2">LTV: {showUnknown(caseData.calculations.ltv)}</Typography>
            <Typography variant="body2">
              Front DTI: {showUnknown(caseData.calculations.front_dti)}
            </Typography>
            <Typography variant="body2">Back DTI: {showUnknown(caseData.calculations.back_dti)}</Typography>

            {caseData.calculations.math ? (
              <>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Math
                </Typography>
                {caseData.calculations.math.ltv ? (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {caseData.calculations.math.ltv}
                  </Typography>
                ) : null}
                {caseData.calculations.math.front_dti ? (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {caseData.calculations.math.front_dti}
                  </Typography>
                ) : null}
                {caseData.calculations.math.back_dti ? (
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {caseData.calculations.math.back_dti}
                  </Typography>
                ) : null}
              </>
            ) : null}

            {missing?.length ? (
              <>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Missing inputs
                </Typography>
                {missing.map((m) => (
                  <Typography key={m} variant="body2" color="text.secondary">
                    - {m}
                  </Typography>
                ))}
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary">
        Calculations are informational only; they do not guarantee an approval.
      </Typography>
    </Stack>
  )
}
