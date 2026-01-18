import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toast'
import { LayoutWrapper } from '@/components/layout/LayoutWrapper'
import { WalletProvider } from '@/contexts/WalletContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Wallet App',
  description: 'Simple wallet management application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </WalletProvider>
        <Toaster />
      </body>
    </html>
  )
}
