'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

type ToastItem = {
  id: number
  title?: string
  message: string
  variant?: ToastVariant
}

type ToastContextValue = {
  push: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const item: ToastItem = { id, ...t }
    setToasts((prev) => [...prev, item])
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <GlobalErrorToasts onPush={push} />
      <div className="fixed top-4 right-4 z-[9999] space-y-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'rounded-md border p-3 shadow-sm text-sm bg-white flex items-start gap-2 ' +
              (t.variant === 'success'
                ? 'border-green-200'
                : t.variant === 'error'
                ? 'border-red-200'
                : t.variant === 'warning'
                ? 'border-yellow-200'
                : 'border-gray-200')
            }
          >
            <div className={
              'mt-0.5 h-2 w-2 rounded-full ' +
              (t.variant === 'success'
                ? 'bg-green-500'
                : t.variant === 'error'
                ? 'bg-red-500'
                : t.variant === 'warning'
                ? 'bg-yellow-500'
                : 'bg-blue-500')
            } />
            <div>
              {t.title && <p className="font-medium text-gray-900">{t.title}</p>}
              <p className="text-gray-700">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function GlobalErrorToasts({ onPush }: { onPush: (t: { title?: string; message: string; variant?: ToastVariant }) => void }) {
  useEffect(() => {
    const onWindowError = (e: ErrorEvent) => {
      onPush({ variant: 'error', title: 'Hata', message: e.message || 'Beklenmeyen hata oluştu' })
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = (e.reason && (e.reason.message || String(e.reason))) || 'Beklenmeyen hata oluştu'
      onPush({ variant: 'error', title: 'Hata', message: msg })
    }
    const onApiError = (e: any) => {
      const detail = e?.detail
     
    }
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onRejection as any)
    window.addEventListener('api:error', onApiError as any)
    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onRejection as any)
      window.removeEventListener('api:error', onApiError as any)
    }
  }, [onPush])
  return null
}


