import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { getTenantId } from '@/api/client'
import { listCases } from '@/api/cases'
import type { CaseDetail, CaseStatus } from '@/types/case'
import Loading from '@/components/common/Loading'
import ErrorState from '@/components/common/ErrorState'

const statusOptions: Array<{ label: string; value: CaseStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Intake', value: 'intake' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
  { label: 'Withdrawn', value: 'withdrawn' },
  { label: 'Stalled', value: 'stalled' },
]

export default function CasesList() {
  const tenantId = getTenantId()
  const navigate = useNavigate()

  const [status, setStatus] = useState<CaseStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const query = useQuery({
    queryKey: ['cases', tenantId, status],
    queryFn: () => listCases(tenantId, status === 'all' ? undefined : status),
  })

  const rows = useMemo(() => {
    const data = (Array.isArray(query.data) ? query.data : []).slice()
    data.sort((a, b) => (dayjs(b.updated_at).valueOf() || 0) - (dayjs(a.updated_at).valueOf() || 0))

    const q = search.trim().toLowerCase()
    if (!q) return data
    return data.filter((c) => c.case_id.toLowerCase().includes(q))
  }, [query.data, search])

  const columns: GridColDef<CaseDetail>[] = [
    { field: 'case_id', headerName: 'Case ID', flex: 1.4, minWidth: 180 },
    { field: 'status', headerName: 'Status', flex: 0.8, minWidth: 120 },
    {
      field: 'deal.purpose',
      headerName: 'Purpose',
      flex: 0.7,
      minWidth: 110,
      valueGetter: (_, row) => row.deal.purpose,
    },
    {
      field: 'deal.occupancy',
      headerName: 'Occupancy',
      flex: 0.9,
      minWidth: 130,
      valueGetter: (_, row) => row.deal.occupancy,
    },
    {
      field: 'deal.property_type',
      headerName: 'Property Type',
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.deal.property_type,
    },
    {
      field: 'deal.state',
      headerName: 'State',
      flex: 0.5,
      minWidth: 90,
      valueGetter: (_, row) => row.deal.state,
    },
    {
      field: 'updated_at',
      headerName: 'Updated',
      flex: 0.9,
      minWidth: 160,
      renderCell: (params) =>
        params.row.updated_at ? dayjs(params.row.updated_at).format('YYYY-MM-DD HH:mm') : '',
    },
  ]

  if (query.isLoading) return <Loading variant="table" />
  if (query.isError) {
    const err = query.error as any
    return (
      <ErrorState
        title="Couldn’t load cases"
        message={err?.message || 'Please check the API URL and try again.'}
        onRetry={() => query.refetch()}
      />
    )
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Cases
      </Typography>

      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Search by Case ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            <TextField
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              select
              sx={{ minWidth: 200 }}
            >
              {statusOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box sx={{ height: 520, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(r) => r.case_id}
              disableRowSelectionOnClick
              initialState={{
                sorting: { sortModel: [{ field: 'updated_at', sort: 'desc' }] },
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50]}
              onRowClick={(p) => navigate(`/cases/${p.row.case_id}`)}
            />
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
