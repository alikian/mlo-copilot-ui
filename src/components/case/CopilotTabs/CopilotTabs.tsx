import { Box, Tab, Tabs, Typography } from '@mui/material'
import * as React from 'react'
import type { CaseDetail } from '@/types/case'
import CalculationsTab from './CalculationsTab'
import GuidelinesTab from './GuidelinesTab'
import SnapshotTab from './SnapshotTab'
import OutcomeTab from './OutcomeTab'

export default function CopilotTabs({
  caseData,
  tenantId,
}: {
  caseData: CaseDetail
  tenantId: string
}) {
  const [tab, setTab] = React.useState(0)

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Decision support only — not underwriting.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Calculations" />
        <Tab label="Ask Guidelines" />
        <Tab label="Snapshot" />
        <Tab label="Outcome" />
      </Tabs>

      <Box sx={{ pt: 2 }}>
        {tab === 0 ? <CalculationsTab tenantId={tenantId} caseData={caseData} /> : null}
        {tab === 1 ? <GuidelinesTab tenantId={tenantId} caseData={caseData} /> : null}
        {tab === 2 ? <SnapshotTab tenantId={tenantId} caseData={caseData} /> : null}
        {tab === 3 ? <OutcomeTab tenantId={tenantId} caseData={caseData} /> : null}
      </Box>
    </Box>
  )
}
