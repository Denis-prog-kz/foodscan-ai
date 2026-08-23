import "server-only"
import { generateObject } from "ai"
import { foodAnalysisSchema, type FoodAnalysis } from "./types"
import { getMockAnalysis } from "./mock"

/**
 * Абстракция анализа еды.
 *
 * Если сконфигурирован AI (переменная окружения AI_GATEWAY_API_KEY либо
 * зеро-конфиг провайдер в среде Vercel), используется реальная vision-модель.
 * В противном случае — реалистичные мок-данные, чтобы приложение всегда работало.
 *
 * Ключи API используются только на сервере и никогда не попадают в клиент.
 */

const AI_MODEL = process.env.FOODSCAN_AI_MODEL || "openai/gpt-4o-mini"

function isAiConfigured(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY)
}

export async function analyzeFood(
  imageDataUrl: string,
): Promise<{ analysis: FoodAnalysis; source: "ai" | "mock" }> {
  // Детерминированный seed на основе длины data-url, чтобы мок был стабильным для фото.
  const seed = imageDataUrl.length

  if (!isAiConfigured()) {
    return { analysis: getMockAnalysis(seed), source: "mock" }
  }

  try {
    const { object } = await generateObject({
      model: AI_MODEL,
      schema: foodAnalysisSchema,
      messages: [
        {
          role: "system",
          content:
            "Ты — эксперт по питанию. Проанализируй фото еды и оцени её состав. " +
            "Все текстовые поля заполняй на русском языке. Давай реалистичные оценки. " +
            "Если на фото нет еды, всё равно верни максимально правдоподобную оценку самого заметного объекта.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Что это за еда? Оцени калории и БЖУ порции." },
            { type: "image", image: imageDataUrl },
          ],
        },
      ],
    })

    return { analysis: object, source: "ai" }
  } catch (error) {
    console.log("[v0] AI analysis failed, falling back to mock:", (error as Error).message)
    return { analysis: getMockAnalysis(seed), source: "mock" }
  }
}
