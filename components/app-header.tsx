"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Salad } from "lucide-react"

export function AppHeader({ title }: { title?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
      {title ? (
        <h1 className="text-lg font-semibold">{title}</h1>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Salad className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">
            FoodScan<span className="text-primary"> AI</span>
          </span>
        </div>
      )}

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="Переключить тему"
      >
        {mounted && theme === "dark" ? (
          <Sun className="h-5 w-5" aria-hidden />
        ) : (
          <Moon className="h-5 w-5" aria-hidden />
        )}
      </button>
    </header>
  )
}
