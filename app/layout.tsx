import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { BottomNav } from "@/components/bottom-nav"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "FoodScan AI — Узнай, что ты ешь",
  description:
    "Сфотографируй еду — FoodScan AI оценит калорийность, белки, жиры и углеводы, и подскажет, как питаться полезнее.",
  applicationName: "FoodScan AI",
  keywords: ["калории", "БЖУ", "питание", "анализ еды", "AI", "здоровье"],
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141a16" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning className="bg-background">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
            <main className="flex-1 pb-24">{children}</main>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
