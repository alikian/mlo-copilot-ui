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
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { guidelinesQuery } from '@/api/cases'
import CopyButton from '@/components/common/CopyButton'
import { useToast } from '@/components/common/ToastProvider'
import CitationsList from '@/components/case/CitationsList'
import type { CaseDetail } from '@/types/case'

const schema = z.object({
  question: z.string().min(3, 'Enter a question'),
  backend: z.enum(['auto', 'pinecone', 'opensearch']).default('auto'),
})

type FormValues = z.infer<typeof schema>

function extractAnswer(payload: any): string {
  if (!payload) return ''
  return (
    payload.answer ||
    payload.response ||
    payload.result ||
    payload.text ||
    payload.message ||
    JSON.stringify(payload, null, 2)
  )
}

function extractCitations(payload: any): any[] {
  if (!payload) return []
  return payload.citations || payload.guideline_citations || payload.sources || []
}

export default function GuidelinesTab({ tenantId, caseData }: { tenantId: string; caseData: CaseDetail }) {
  const toast = useToast()
  const [answer, setAnswer] = React.useState<string>('')
  const [citations, setCitations] = React.useState<any[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { backend: 'auto', question: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return guidelinesQuery(tenantId, caseData.case_id, {
        question: values.question,
        backend: values.backend,
      })
    },
    onSuccess: (data) => {
      setAnswer(extractAnswer(data))
      setCitations(extractCitations(data))
      toast.showSuccess('Answer ready')
    },
    onError: (err: any) => toast.showError(err?.message || 'Guidelines query failed'),
  })

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Controller
              name="question"
              control={form.control}
              render={({ field, fieldState }) => (
                <TextField
                  label="Question"
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  multiline
                  minRows={2}
                />
              )}
            />

            <Controller
              name="backend"
              control={form.control}
              render={({ field }) => (
                <TextField select label="Backend" {...field}>
                  <MenuItem value="auto">Auto</MenuItem>
                  <MenuItem value="pinecone">Pinecone</MenuItem>
                  <MenuItem value="opensearch">OpenSearch</MenuItem>
                </TextField>
              )}
            />

            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                onClick={form.handleSubmit((v) => mutation.mutate(v))}
                disabled={mutation.isPending}
              >
                Ask
              </Button>
              <Typography variant="caption" color="text.secondary">
                Use as decision support; not a promise of approval.
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {answer ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Answer
                </Typography>
                <CopyButton text={answer} label="Copy answer" />
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {answer}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Citations
          </Typography>
          <CitationsList citations={citations as any} />
        </CardContent>
      </Card>
    </Stack>
  )
}
