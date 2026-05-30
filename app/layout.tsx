import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import BottomNav from '@/components/BottomNav'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meu Closet',
  description: 'Seu guarda-roupa digital',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#6366f1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <main className="pb-20 max-w-md mx-auto min-h-screen bg-white">
          {children}
        </main>
        <div className="max-w-md mx-auto">
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
