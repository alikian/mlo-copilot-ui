import { Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'

import { snapshot } from '@/api/cases'
import CopyButton from '@/components/common/CopyButton'
import { useToast } from '@/components/common/ToastProvider'
import CitationsList from '@/components/case/CitationsList'
import type { CaseDetail } from '@/types/case'

function buildSnapshotText(payload: any): string {
  if (!payload) return ''
  const parts: string[] = []
  if (payload.snapshot) parts.push(String(payload.snapshot))
  if (Array.isArray(payload.questions)) parts.push(`\nQuestions\n${payload.questions.map((q: any) => `- ${q}`).join('\n')}`)
  if (Array.isArray(payload.checklist)) parts.push(`\nChecklist\n${payload.checklist.map((c: any) => `- ${c}`).join('\n')}`)
  return parts.join('\n\n').trim() || JSON.stringify(payload, null, 2)
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
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {payload.snapshot ? String(payload.snapshot) : snapshotText}
              </Typography>

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
