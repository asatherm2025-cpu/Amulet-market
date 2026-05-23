import type { Metadata } from 'next'
import './globals.css'
import { LangProvider } from '@/context/LangContext'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'SIAM COIN — ตลาดเหรียญพระเครื่องไทย',
  description: 'Thai Amulet Coin Marketplace | ตลาดเหรียญพระเครื่องไทย | 泰国佛牌钱币市场',
  keywords: ['thai amulet', 'เหรียญพระ', 'พระเครื่อง', '泰国佛牌', 'coin', 'collector'],
  openGraph: {
    title: 'SIAM COIN',
    description: 'Authentic Thai Amulet Coins — Certified & Shipped Worldwide',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FDF8EE]">
        <AuthProvider>
          <LangProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
