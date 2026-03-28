import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ToastMessage {
  id: number
  text: string
  type: 'error' | 'success' | 'info'
}

interface ToastContextType {
  showToast: (text: string, type?: ToastMessage['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string, type: ToastMessage['type'] = 'error') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, text, type }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDone={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDone }: { toast: ToastMessage; onDone: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDone(toast.id), 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onDone])

  const bgColor = {
    error: 'bg-red-500/90',
    success: 'bg-green-500/90',
    info: 'bg-primary-blue/90',
  }[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${bgColor} text-white px-4 py-3 rounded-xl text-sm font-semibold text-center backdrop-blur-sm pointer-events-auto`}
    >
      {toast.text}
    </motion.div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
