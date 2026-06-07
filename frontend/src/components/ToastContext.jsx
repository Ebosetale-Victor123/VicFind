import { createContext, useContext, useState, useCallback } from 'react'
import { useTheme } from './ThemeContext'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts }) {
  const { dark } = useTheme()
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(toast => (
        <div key={toast.id} className="animate-fade-up" style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '0.75rem',
          fontFamily: 'Inter',
          fontSize: '0.875rem',
          fontWeight: 500,
          maxWidth: 320,
          boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 28px rgba(108,99,255,0.18)',
          border: '1px solid',
          backgroundColor: dark ? '#13131f' : '#ffffff',
          borderColor: toast.type === 'success' ? 'rgba(0,212,170,0.4)' : toast.type === 'error' ? 'rgba(255,77,109,0.4)' : 'rgba(108,99,255,0.3)',
          color: toast.type === 'success' ? '#00d4aa' : toast.type === 'error' ? '#ff4d6d' : '#6c63ff',
        }}>
          {toast.type === 'success' ? '✅ ' : toast.type === 'error' ? '❌ ' : 'ℹ️ '}
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export const useToast = () => useContext(ToastContext)
