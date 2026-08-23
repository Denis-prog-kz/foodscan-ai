"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, History, User, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Главная", icon: Home, col: "col-start-1" },
  { href: "/history", label: "История", icon: History, col: "col-start-2" },
  { href: "/profile", label: "Профиль", icon: User, col: "col-start-4" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-border bg-card/95 backdrop-blur"
    >
      <div className="relative grid grid-cols-4 items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                item.col,
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          )
        })}

        {/* Приметная центральная кнопка сканирования */}
        <Link
          href="/?scan=1"
          aria-label="Сканировать еду"
          className="absolute -top-6 left-1/2 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95"
        >
          <Camera className="h-7 w-7" aria-hidden />
        </Link>
      </div>
    </nav>
  )
}
