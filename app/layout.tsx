import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'
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
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-svh flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="shrink-0 border-b bg-background">
            <div className="flex h-14 w-full items-center justify-between px-4">
              <span className="font-heading text-lg font-bold">DevRoadmap</span>

              <div className="flex items-center space-x-2">
                <ModeToggle />
                <Button type="button">Log in</Button>
              </div>
            </div>
          </header>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
