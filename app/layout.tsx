import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Button } from '@/components/ui/button'

import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'DevRoadmap',
  description:
    'DevRoadmap is an application for sharing and tracking your progress in learning development skills with others.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex h-svh flex-col font-sans">
        <header className="shrink-0 border-b bg-background">
          <div className="flex h-14 w-full items-center justify-between px-4">
            <span className="font-heading text-lg font-bold">DevRoadmap</span>
            <Button type="button">Log in</Button>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
