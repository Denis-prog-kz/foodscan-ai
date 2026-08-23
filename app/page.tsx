import { Suspense } from "react"
import { AppHeader } from "@/components/app-header"
import { Scanner } from "@/components/scanner"
import { TodaySummary } from "@/components/today-summary"
import { HowItWorks } from "@/components/how-it-works"

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <Suspense fallback={<div className="px-5 py-8 text-sm text-muted-foreground">Загрузка…</div>}>
        <Scanner
          idleExtra={
            <div className="flex flex-col gap-6">
              <TodaySummary />
              <HowItWorks />
            </div>
          }
        />
      </Suspense>
    </>
  )
}
