import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'
import dayjs from 'dayjs'

import { snapshot } from '@/api/cases'
import CopyButton from '@/components/common/CopyButton'
import { useToast } from '@/components/common/ToastProvider'
import CitationsList from '@/components/case/CitationsList'
import type { CaseDetail } from '@/types/case'

function fmt(value: any): string {
  if (value === null || value === undefined) return 'Unknown'
  if (value === 'unknown') return 'Unknown'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'Unknown'
  const s = String(value)
  return s.trim() ? s : 'Unknown'
}

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

type SnapshotSection = {
  title: string
  blocks: Array<{ heading?: string; lines: string[] }>
}

function buildSnapshotSections(payload: any): {
  headerLines: string[]
  sections: SnapshotSection[]
  extras: SnapshotSection[]
} {
  const headerLines: string[] = []
  const sections: SnapshotSection[] = []
  const extras: SnapshotSection[] = []

  const s = payload?.snapshot
  if (s && typeof s === 'object') {
    headerLines.push(`Case: ${fmt(s.case_id || payload.case_id)}`)
    if (s.status) headerLines.push(`Status: ${fmt(s.status)}`)
    if (s.timestamp) headerLines.push(`Snapshot time: ${dayjs(s.timestamp).format('YYYY-MM-DD HH:mm')}`)

    const p = (s as any).payload
    if (p) {
      const borrowers = Array.isArray(p.borrowers) ? p.borrowers : []
      if (borrowers.length) {
        sections.push({
          title: 'Borrowers',
          blocks: borrowers.map((b: any, idx: number) => {
            const primary = b.is_primary ? ' (Primary)' : ''
            return {
              heading: `Borrower ${idx + 1}${primary}`,
              lines: [
                `Credit score: ${fmt(b.credit_score_mid)}`,
                `Citizenship: ${fmt(b.citizenship)}`,
                `Income type: ${fmt(b.employment?.income_type)}`,
                `Job time (months): ${fmt(b.employment?.job_time_months)}`,
                `Self-employed time (months): ${fmt(b.employment?.self_employed_time_months)}`,
              ],
            }
          }),
        })
      }

      if (p.income) {
        const lines = [`Monthly gross income: ${fmt(p.income.monthly_gross_income)}`]
        if (p.income.income_notes) lines.push(`Notes: ${String(p.income.income_notes)}`)
        if (Array.isArray(p.income.documents_seen) && p.income.documents_seen.length) {
          lines.push(`Documents: ${p.income.documents_seen.join(', ')}`)
        }
        sections.push({ title: 'Income', blocks: [{ lines }] })
      }

      if (p.assets) {
        sections.push({
          title: 'Assets',
          blocks: [
            {
              lines: [
                `Down payment: ${fmt(p.assets.down_payment_amount)}`,
                `Reserves (months): ${fmt(p.assets.reserves_months)}`,
                `Gift funds: ${fmt(p.assets.gift_funds)}`,
                `Gift amount: ${fmt(p.assets.gift_amount)}`,
              ],
            },
          ],
        })
      }

      if (p.liabilities) {
        const lines = [
          `Monthly debts total: ${fmt(p.liabilities.monthly_debts_total)}`,
          `Current housing payment: ${fmt(p.liabilities.current_housing_payment)}`,
          `Future housing payment (est): ${fmt(p.liabilities.future_housing_payment_est)}`,
        ]
        if (p.liabilities.notes) lines.push(`Notes: ${String(p.liabilities.notes)}`)
        sections.push({ title: 'Liabilities', blocks: [{ lines }] })
      }

      if (p.property) {
        sections.push({
          title: 'Property',
          blocks: [
            {
              lines: [
                `Purchase price: ${fmt(p.property.purchase_price)}`,
                `Estimated value: ${fmt(p.property.estimated_value)}`,
                `Loan amount: ${fmt(p.property.loan_amount)}`,
              ],
            },
          ],
        })
      }

      if ((p as any).future_housing_cost || p.property) {
        const fhc = (p as any).future_housing_cost || {}
        const base = (p as any).future_housing_cost ? fhc : (p as any).property || {}

        const lt = (p as any).loan_terms || {}
        const monthlyMortgagePayment = calcMonthlyMortgagePayment({
          loanAmount: (p as any).property?.loan_amount,
          ratePercent: lt.rate,
          termMonths: lt.term_months,
        })

        sections.push({
          title: 'Future Housing Cost',
          blocks: [
            {
              lines: [
                `Monthly mortgage payment: ${fmt(monthlyMortgagePayment)}`,
                `HOA dues (monthly): ${fmt(base.hoa_dues_monthly)}`,
                `Property tax (monthly): ${fmt(base.property_tax_monthly)}`,
                `Insurance (monthly): ${fmt(base.insurance_monthly)}`,
                `Mortgage insurance (monthly): ${fmt(base.mortgage_insurance_monthly)}`,
              ],
            },
          ],
        })
      }

      if (p && typeof p === 'object' && 'loan_terms' in p) {
        const lt = (p as any).loan_terms || {}
        sections.push({
          title: 'Loan',
          blocks: [
            {
              lines: [
                `Rate: ${fmt(lt.rate)}`,
                `Term (months): ${fmt(lt.term_months)}`,
                `Amortization type: ${fmt(lt.amortization_type)}`,
              ],
            },
          ],
        })
      }

      if (p.human_decision) {
        const lines = [`Selected path: ${fmt(p.human_decision.selected_path)}`]
        if (p.human_decision.notes) lines.push(`Notes: ${String(p.human_decision.notes)}`)
        sections.push({ title: 'Human Decision', blocks: [{ lines }] })
      }
    }

    if ((s as any).calculations) {
      sections.push({
        title: 'Calculations',
        blocks: [
          {
            lines: [
              `LTV: ${fmt((s as any).calculations.ltv)}`,
              `Front DTI: ${fmt((s as any).calculations.front_dti)}`,
              `Back DTI: ${fmt((s as any).calculations.back_dti)}`,
            ],
          },
        ],
      })
    }
  }

  if (Array.isArray(payload?.questions) && payload.questions.length) {
    extras.push({
      title: 'Questions',
      blocks: [{ lines: payload.questions.map((q: any) => String(q)) }],
    })
  }
  if (Array.isArray(payload?.checklist) && payload.checklist.length) {
    extras.push({
      title: 'Checklist',
      blocks: [{ lines: payload.checklist.map((c: any) => String(c)) }],
    })
  }

  return { headerLines, sections, extras }
}

function buildSnapshotText(payload: any): string {
  if (!payload) return ''
  const s = payload.snapshot

  const lines: string[] = []

  if (s && typeof s === 'object') {
    lines.push(`Case: ${fmt(s.case_id || payload.case_id)}`)
    if (s.status) lines.push(`Status: ${fmt(s.status)}`)
    if (s.timestamp) lines.push(`Snapshot time: ${dayjs(s.timestamp).format('YYYY-MM-DD HH:mm')}`)
    lines.push('')

    const p = (s as any).payload
    if (p) {
      const borrowers = Array.isArray(p.borrowers) ? p.borrowers : []
      if (borrowers.length) {
        lines.push('Borrowers')
        for (const b of borrowers) {
          const primary = b.is_primary ? ' (Primary)' : ''
          lines.push(`- ${fmt(b.borrower_id)}${primary}`)
          lines.push(`  Credit score: ${fmt(b.credit_score_mid)}`)
          lines.push(`  Citizenship: ${fmt(b.citizenship)}`)
          lines.push(`  Income type: ${fmt(b.employment?.income_type)}`)
          lines.push(`  Job time (mo): ${fmt(b.employment?.job_time_months)}`)
          lines.push(`  Self-employed time (mo): ${fmt(b.employment?.self_employed_time_months)}`)
        }
        lines.push('')
      }

      if (p.income) {
        lines.push('Income')
        lines.push(`- Monthly gross income: ${fmt(p.income.monthly_gross_income)}`)
        if (p.income.income_notes) lines.push(`- Notes: ${String(p.income.income_notes)}`)
        if (Array.isArray(p.income.documents_seen) && p.income.documents_seen.length) {
          lines.push(`- Documents: ${p.income.documents_seen.join(', ')}`)
        }
        lines.push('')
      }

      if (p.assets) {
        lines.push('Assets')
        lines.push(`- Down payment: ${fmt(p.assets.down_payment_amount)}`)
        lines.push(`- Reserves (months): ${fmt(p.assets.reserves_months)}`)
        lines.push(`- Gift funds: ${fmt(p.assets.gift_funds)}`)
        lines.push(`- Gift amount: ${fmt(p.assets.gift_amount)}`)
        lines.push('')
      }

      if (p.liabilities) {
        lines.push('Liabilities')
        lines.push(`- Monthly debts total: ${fmt(p.liabilities.monthly_debts_total)}`)
        lines.push(`- Current housing payment: ${fmt(p.liabilities.current_housing_payment)}`)
        lines.push(`- Future housing payment (est): ${fmt(p.liabilities.future_housing_payment_est)}`)
        if (p.liabilities.notes) lines.push(`- Notes: ${String(p.liabilities.notes)}`)
        lines.push('')
      }

      if (p.property) {
        lines.push('Property')
        lines.push(`- Purchase price: ${fmt(p.property.purchase_price)}`)
        lines.push(`- Estimated value: ${fmt(p.property.estimated_value)}`)
        lines.push(`- Loan amount: ${fmt(p.property.loan_amount)}`)
        lines.push('')
      }

      if ((p as any).future_housing_cost || p.property) {
        const fhc = (p as any).future_housing_cost || {}
        const base = (p as any).future_housing_cost ? fhc : (p as any).property || {}

        const lt = (p as any).loan_terms || {}
        const monthlyMortgagePayment = calcMonthlyMortgagePayment({
          loanAmount: (p as any).property?.loan_amount,
          ratePercent: lt.rate,
          termMonths: lt.term_months,
        })

        lines.push('Future Housing Cost')
        lines.push(`- Monthly mortgage payment: ${fmt(monthlyMortgagePayment)}`)
        lines.push(`- HOA dues (monthly): ${fmt(base.hoa_dues_monthly)}`)
        lines.push(`- Property tax (monthly): ${fmt(base.property_tax_monthly)}`)
        lines.push(`- Insurance (monthly): ${fmt(base.insurance_monthly)}`)
        lines.push(`- Mortgage insurance (monthly): ${fmt(base.mortgage_insurance_monthly)}`)
        lines.push('')
      }

      if (p && typeof p === 'object' && 'loan_terms' in p) {
        const lt = (p as any).loan_terms || {}
        lines.push('Loan')
        lines.push(`- Rate: ${fmt(lt.rate)}`)
        lines.push(`- Term (months): ${fmt(lt.term_months)}`)
        lines.push(`- Amortization type: ${fmt(lt.amortization_type)}`)
        lines.push('')
      }

      if (p.human_decision) {
        lines.push('Human Decision')
        lines.push(`- Selected path: ${fmt(p.human_decision.selected_path)}`)
        if (p.human_decision.notes) lines.push(`- Notes: ${String(p.human_decision.notes)}`)
        lines.push('')
      }
    }

    if ((s as any).calculations) {
      lines.push('Calculations')
      lines.push(`- LTV: ${fmt((s as any).calculations.ltv)}`)
      lines.push(`- Front DTI: ${fmt((s as any).calculations.front_dti)}`)
      lines.push(`- Back DTI: ${fmt((s as any).calculations.back_dti)}`)
      lines.push('')
    }
  } else if (typeof s === 'string') {
    lines.push(s)
  }

  if (Array.isArray(payload.questions) && payload.questions.length) {
    lines.push('Questions')
    for (const q of payload.questions) lines.push(`- ${String(q)}`)
    lines.push('')
  }
  if (Array.isArray(payload.checklist) && payload.checklist.length) {
    lines.push('Checklist')
    for (const c of payload.checklist) lines.push(`- ${String(c)}`)
    lines.push('')
  }

  return lines.join('\n').trim() || 'Snapshot generated.'
}

function SectionBox({ section }: { section: SnapshotSection }) {
  return (
    <Box
      component="fieldset"
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'action.hover',
        px: 2,
        pb: 2,
        pt: 1.5,
        m: 0,
        minWidth: 0,
      }}
    >
      <Box
        component="legend"
        sx={{
          px: 1,
          backgroundColor: 'action.hover',
          borderRadius: 1,
          fontSize: (t) => t.typography.subtitle2.fontSize,
          fontWeight: 700,
          color: 'text.primary',
        }}
      >
        {section.title}
      </Box>
      <Stack spacing={1.5}>
        {section.blocks.map((b, idx) => (
          <Box key={idx}>
            {b.heading ? (
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                {b.heading}
              </Typography>
            ) : null}
            <Stack spacing={0.25}>
              {b.lines.map((line, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default function SnapshotTab({ tenantId, caseData }: { tenantId: string; caseData: CaseDetail }) {
  const toast = useToast()
  const [payload, setPayload] = React.useState<any | null>(null)

  const mutation = useMutation({
    mutationFn: () => snapshot(tenantId, caseData.case_id),
    onSuccess: (data) => {
      setPayload(data)
      toast.showSuccess('Snapshot generated')
    },
    onError: (err: any) => toast.showError(err?.message || 'Snapshot failed'),
  })

  const snapshotText = buildSnapshotText(payload)
  const citations = (payload?.citations || payload?.guideline_citations || payload?.copilot?.guideline_citations || []) as any[]
  const view = buildSnapshotSections(payload)

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              Snapshot
            </Button>
            {snapshotText ? <CopyButton text={snapshotText} label="Copy snapshot" /> : null}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Summaries are for decision support; not underwriting.
          </Typography>
        </CardContent>
      </Card>

      {payload ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Snapshot
              </Typography>

              {view.headerLines.length ? (
                <Box>
                  {view.headerLines.map((l) => (
                    <Typography key={l} variant="body2" color="text.secondary">
                      {l}
                    </Typography>
                  ))}
                </Box>
              ) : null}

              <Stack spacing={2}>
                {view.sections.length ? (
                  view.sections.map((s, idx) => <SectionBox key={`${s.title}-${idx}`} section={s} />)
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {snapshotText}
                  </Typography>
                )}

                {view.extras.map((s, idx) => (
                  <SectionBox key={`${s.title}-${idx}`} section={s} />
                ))}
              </Stack>

              {Array.isArray(payload.questions) && payload.questions.length ? (
                <>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Questions
                  </Typography>
                  {payload.questions.map((q: any, idx: number) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      - {String(q)}
                    </Typography>
                  ))}
                </>
              ) : null}

              {Array.isArray(payload.checklist) && payload.checklist.length ? (
                <>
                  <Divider />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Checklist
                  </Typography>
                  {payload.checklist.map((c: any, idx: number) => (
                    <Typography key={idx} variant="body2" color="text.secondary">
                      - {String(c)}
                    </Typography>
                  ))}
                </>
              ) : null}

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Citations
              </Typography>
              <CitationsList citations={citations as any} />
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  )
}
