import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'
import { Providers } from '@/components/Providers'

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
        <Providers>
          <ToastProvider>
            <div className="min-h-screen flex flex-col relative">
              {/* App Background */}
              <div className="fixed inset-0 z-0">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=2400&q=80')`
                  }}
                ></div>
                <div className="absolute inset-0 bg-white/60"></div>
              </div>
              
              <div className="flex-1 relative z-10">
                {children}
              </div>
              <footer className="border-t bg-white/90 backdrop-blur-sm text-gray-600 relative z-10">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center gap-3 text-sm">
                  <span>© {new Date().getFullYear()} 3HTech. Tüm hakları saklıdır.</span>
                </div>
              </footer>
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  )
} 