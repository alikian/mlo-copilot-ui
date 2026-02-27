import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import * as React from 'react'
import { ensureAuthDefaults, getTenantId, getUserId } from '@/api/client'
import { useToast } from '@/components/common/ToastProvider'

export default function Settings() {
  const toast = useToast()
  const [tenantId, setTenantId] = React.useState('')
  const [userId, setUserId] = React.useState('')

  React.useEffect(() => {
    ensureAuthDefaults()
    setTenantId(getTenantId())
    setUserId(getUserId())
  }, [])

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Stack spacing={2}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Temporary auth is stored in localStorage and sent as headers on every request.
        </Typography>

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <TextField
                label="tenantId"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                helperText='Default: "demo-tenant"'
              />
              <TextField
                label="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                helperText='Default: "demo-user"'
              />
              <Box>
                <Button
                  variant="contained"
                  onClick={() => {
                    localStorage.setItem('tenantId', tenantId || 'demo-tenant')
                    localStorage.setItem('userId', userId || 'demo-user')
                    toast.showSuccess('Saved')
                  }}
                >
                  Save
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
