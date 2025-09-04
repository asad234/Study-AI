import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProviderWrapper } from "@/components/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StudyAI - AI-Powered Exam Preparation",
  description: "Transform your study materials into interactive learning experiences with AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
