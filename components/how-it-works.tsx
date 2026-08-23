import { Camera, Cpu, ListChecks } from "lucide-react"

const steps = [
  { icon: Camera, title: "Сфотографируй", text: "Наведи камеру на блюдо или загрузи фото из галереи" },
  { icon: Cpu, title: "AI анализирует", text: "Система определяет продукт и его пищевую ценность" },
  { icon: ListChecks, title: "Получи результат", text: "Калории, БЖУ и советы, как питаться полезнее" },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-title" className="flex flex-col gap-4">
      <h2 id="how-it-works-title" className="px-1 text-base font-semibold">
        Как это работает
      </h2>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={i} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
