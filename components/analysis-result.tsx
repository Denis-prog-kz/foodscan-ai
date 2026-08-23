import { Flame, Lightbulb, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { FoodAnalysis } from "@/lib/food/types"
import { cn } from "@/lib/utils"

interface Props {
  analysis: FoodAnalysis
  image: string
  source?: "ai" | "mock"
  className?: string
}

const MACROS = [
  { key: "protein", label: "Белки", color: "bg-primary" },
  { key: "fat", label: "Жиры", color: "bg-accent" },
  { key: "carbs", label: "Углеводы", color: "bg-secondary-foreground/70" },
] as const

export function AnalysisResult({ analysis, image, source, className }: Props) {
  const total = analysis.protein + analysis.fat + analysis.carbs || 1
  const confidencePct = Math.round(analysis.confidence * 100)

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image || "/placeholder.svg"}
          alt={analysis.name}
          className="h-56 w-full object-cover"
        />
        {source === "mock" && (
          <span className="absolute right-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            демо-данные
          </span>
        )}
      </div>

      <div>
        <h1 className="text-balance text-2xl font-bold leading-tight">{analysis.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{analysis.portion}</p>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/15">
              <Flame className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <p className="text-sm/none opacity-80">Калорийность</p>
              <p className="text-2xl font-bold">≈ {analysis.calories} ккал</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-80">уверенность</p>
            <p className="text-lg font-semibold">{confidencePct}%</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <MacroCard label="Белки" value={analysis.protein} accent="text-primary" />
        <MacroCard label="Жиры" value={analysis.fat} accent="text-accent-foreground" />
        <MacroCard label="Углеводы" value={analysis.carbs} accent="text-foreground" />
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="mb-3 text-sm font-medium text-muted-foreground">Соотношение БЖУ</p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {MACROS.map((m) => (
              <div
                key={m.key}
                className={m.color}
                style={{ width: `${(analysis[m.key] / total) * 100}%` }}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            {MACROS.map((m) => (
              <span key={m.key} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", m.color)} aria-hidden />
                {m.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex gap-3 p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent-foreground" aria-hidden />
            <h2 className="text-base font-semibold">Что можно улучшить?</h2>
          </div>
          <ul className="flex flex-col gap-3">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-muted-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function MacroCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        <span className={cn("text-2xl font-bold", accent)}>{value}</span>
        <span className="text-xs text-muted-foreground">{label}, г</span>
      </CardContent>
    </Card>
  )
}
