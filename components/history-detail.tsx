"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { AnalysisResult } from "@/components/analysis-result"
import { getHistoryItem, removeHistoryItem } from "@/lib/food/history"
import type { HistoryItem } from "@/lib/food/types"

export function HistoryDetail({ id }: { id: string }) {
  const router = useRouter()
  const [item, setItem] = useState<HistoryItem | null | undefined>(undefined)

  useEffect(() => {
    setItem(getHistoryItem(id) ?? null)
  }, [id])

  if (item === undefined) {
    return <div className="px-5 py-16 text-center text-sm text-muted-foreground">Загрузка…</div>
  }

  if (item === null) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 py-20 text-center">
        <h1 className="text-lg font-semibold">Запись не найдена</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Возможно, она была удалена из истории.
        </p>
        <Link href="/history" className={buttonVariants()}>
          К истории
        </Link>
      </div>
    )
  }

  const time = new Date(item.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="px-5 py-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
        <span className="text-sm text-muted-foreground">{time}</span>
        <button
          onClick={() => {
            removeHistoryItem(item.id)
            router.push("/history")
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          aria-label="Удалить запись"
        >
          <Trash2 className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <AnalysisResult analysis={item} image={item.image} source={item.source} />

      <div className="mt-6">
        <Button variant="outline" size="lg" className="w-full" onClick={() => router.push("/?scan=1")}>
          Сканировать ещё
        </Button>
      </div>
    </div>
  )
}
