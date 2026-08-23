"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Trash2, Flame, ChevronRight, ScanLine } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useHistory, clearHistory, removeHistoryItem } from "@/lib/food/history"
import type { HistoryItem } from "@/lib/food/types"

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function HistoryList() {
  const history = useHistory()
  const [confirmClear, setConfirmClear] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, HistoryItem[]>()
    for (const item of history) {
      const key = formatDate(item.createdAt)
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [history])

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
          <ScanLine className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold">История пуста</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Отсканируйте первое блюдо, и оно появится здесь
          </p>
        </div>
        <Link href="/?scan=1" className={buttonVariants()}>
          Сканировать еду
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Всего записей: {history.length}</p>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" onClick={() => { clearHistory(); setConfirmClear(false) }}>
              Очистить всё
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
              Отмена
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-sm font-medium text-muted-foreground hover:text-destructive"
          >
            Очистить
          </button>
        )}
      </div>

      {groups.map(([date, items]) => (
        <section key={date} className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">{date}</h2>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <Link href={`/history/${item.id}`} className="flex flex-1 items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Flame className="h-3.5 w-3.5 text-primary" aria-hidden />
                        {item.calories} ккал · {formatTime(item.createdAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Б {item.protein} · Ж {item.fat} · У {item.carbs}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                  <button
                    onClick={() => removeHistoryItem(item.id)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Удалить ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
