import * as React from 'react'
import { Alert, Snackbar } from '@mui/material'

type ToastSeverity = 'success' | 'error' | 'info' | 'warning'

type ToastState = {
  open: boolean
  message: string
  severity: ToastSeverity
}

type ToastApi = {
  showToast: (message: string, severity?: ToastSeverity) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = React.createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = React.useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  })

  const api = React.useMemo<ToastApi>(
    () => ({
      showToast: (message, severity = 'info') => setToast({ open: true, message, severity }),
      showSuccess: (message) => setToast({ open: true, message, severity: 'success' }),
      showError: (message) => setToast({ open: true, message, severity: 'error' }),
    }),
    [],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
