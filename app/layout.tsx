import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import ThemeToggle from "@/components/theme-toggle"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Power Outage Reporter",
  description: "Report and track power outages in your area",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={`${inter.variable} flex flex-col lg:h-screen lg:overflow-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="border-b border-border py-2 flex-shrink-0">
            <div className="container mx-auto px-4 flex items-center justify-between">
              <h1 className="text-xl font-bold">Power Outage Reporter</h1>
              <nav className="flex items-center space-x-4">
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main className="flex-grow overflow-hidden">
            {children}
          </main>
          <Toaster position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}

