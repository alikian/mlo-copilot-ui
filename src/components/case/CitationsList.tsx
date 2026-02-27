import { Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import type { CaseDetail } from '@/types/case'

type Citation = CaseDetail['copilot']['guideline_citations'][number]

function fmtConfidence(v: number | undefined) {
  if (v === null || v === undefined) return '—'
  const pct = Math.round(v * 100)
  return `${pct}%`
}

export default function CitationsList({ citations }: { citations: Citation[] }) {
  if (!citations?.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No citations.
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      {citations.map((c, idx) => (
        <Card key={`${c.doc_id}:${c.section}:${idx}`} variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {c.doc_id} — {c.section}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                “{c.quote}”
              </Typography>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                Confidence: {fmtConfidence(c.retrieval_confidence)}
                {c.retriever_backend ? ` • Backend: ${c.retriever_backend}` : ''}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}
