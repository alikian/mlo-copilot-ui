import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { Button } from '@mui/material'
import { useToast } from './ToastProvider'

export default function CopyButton({
  text,
  label = 'Copy',
  size = 'small',
}: {
  text: string
  label?: string
  size?: 'small' | 'medium'
}) {
  const toast = useToast()

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.showSuccess('Copied to clipboard')
    } catch {
      toast.showError('Copy failed')
    }
  }

  return (
    <Button size={size} variant="outlined" startIcon={<ContentCopyIcon />} onClick={onCopy}>
      {label}
    </Button>
  )
}
