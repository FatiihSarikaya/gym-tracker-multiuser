import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gym Tracker - Spor Salonu Takip Sistemi',
  description: 'Spor salonu üye takip ve yönetim sistemi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">      
      <body className={inter.className}>
        <ToastProvider>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className=" border-t bg-gray-50 text-gray-600">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-3 text-sm">
              <span>© {new Date().getFullYear()} 3HTech. Tüm hakları saklıdır.</span>
            </div>
          </footer>
        </div>
        </ToastProvider>
      </body>
    </html>
  )
} 