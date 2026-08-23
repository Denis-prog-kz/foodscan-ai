"use client"

import { useMemo, useState } from "react"
import { Minus, Plus, Target, Flame, Utensils, TrendingUp, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useHistory, useCalorieGoal } from "@/lib/food/history"

export function ProfileView() {
  const history = useHistory()
  const [goal, setGoal] = useCalorieGoal()
  const [draftGoal, setDraftGoal] = useState<number | null>(null)

  const value = draftGoal ?? goal

  const stats = useMemo(() => {
    const total = history.length
    const totalCalories = history.reduce((s, i) => s + i.calories, 0)
    const avg = total ? Math.round(totalCalories / total) : 0
    const days = new Set(
      history.map((i) => new Date(i.createdAt).toDateString()),
    ).size
    return { total, avg, days }
  }, [history])

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Utensils} label="Сканов" value={String(stats.total)} />
        <StatCard icon={Flame} label="Ср. ккал" value={String(stats.avg)} />
        <StatCard icon={TrendingUp} label="Дней" value={String(stats.days)} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="text-base font-semibold">Дневная норма калорий</h2>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setDraftGoal(Math.max(1000, value - 100))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition active:scale-95"
              aria-label="Уменьшить норму"
            >
              <Minus className="h-5 w-5" aria-hidden />
            </button>

            <div className="text-center">
              <span className="text-3xl font-bold tabular-nums">{value}</span>
              <span className="ml-1 text-sm text-muted-foreground">ккал</span>
            </div>

            <button
              onClick={() => setDraftGoal(Math.min(6000, value + 100))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition active:scale-95"
              aria-label="Увеличить норму"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {draftGoal !== null && draftGoal !== goal && (
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setGoal(draftGoal)
                  setDraftGoal(null)
                }}
              >
                Сохранить
              </Button>
              <Button variant="ghost" onClick={() => setDraftGoal(null)}>
                Отмена
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex gap-3 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">О точности данных</p>
            <p className="mt-1">
              FoodScan AI даёт приблизительную оценку по фотографии. Реальные значения
              зависят от способа приготовления и размера порции. Используйте данные как
              ориентир, а не как точное измерение.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1.5 p-4 text-center">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
        <span className="text-xl font-bold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  )
}
