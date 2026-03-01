import toast, { Toaster } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          fontSize: '13px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }
      }}
    />
  )
}

export function showSuccess(message: string) {
  toast(message, {
    icon: <CheckCircle size={18} style={{ color: 'var(--success)' }} />,
    style: { borderColor: 'var(--success)' }
  })
}

export function showError(message: string) {
  toast(message, {
    icon: <XCircle size={18} style={{ color: 'var(--error)' }} />,
    style: { borderColor: 'var(--error)' },
    duration: 6000
  })
}

export function showWarning(message: string) {
  toast(message, {
    icon: <AlertCircle size={18} style={{ color: 'var(--warning)' }} />,
    style: { borderColor: 'var(--warning)' }
  })
}
