"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useHistory, useCalorieGoal } from "@/lib/food/history"

function isToday(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function TodaySummary() {
  const history = useHistory()
  const [goal] = useCalorieGoal()

  const { calories, protein, fat, carbs, count } = useMemo(() => {
    const today = history.filter((i) => isToday(i.createdAt))
    return {
      count: today.length,
      calories: today.reduce((s, i) => s + i.calories, 0),
      protein: today.reduce((s, i) => s + i.protein, 0),
      fat: today.reduce((s, i) => s + i.fat, 0),
      carbs: today.reduce((s, i) => s + i.carbs, 0),
    }
  }, [history])

  const pct = Math.min(100, Math.round((calories / goal) * 100))
  const remaining = Math.max(0, goal - calories)
  const circumference = 2 * Math.PI * 52

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Сегодня</h2>
          <span className="text-xs text-muted-foreground">
            {count > 0 ? `${count} приём(ов) пищи` : "пока пусто"}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (pct / 100) * circumference}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold leading-none">{calories}</span>
              <span className="mt-1 text-xs text-muted-foreground">из {goal} ккал</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <MacroRow label="Осталось" value={`${remaining} ккал`} strong />
            <MacroRow label="Белки" value={`${protein} г`} />
            <MacroRow label="Жиры" value={`${fat} г`} />
            <MacroRow label="Углеводы" value={`${carbs} г`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MacroRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-bold text-primary" : "font-medium"}>{value}</span>
    </div>
  )
}
