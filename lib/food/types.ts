import { z } from "zod"

/**
 * Единая схема результата анализа еды.
 * Используется и для мок-данных, и для реального AI-ответа.
 */
export const foodAnalysisSchema = z.object({
  name: z.string().describe("Название блюда на русском языке"),
  calories: z.number().describe("Примерная калорийность порции, ккал"),
  protein: z.number().describe("Белки, граммы"),
  fat: z.number().describe("Жиры, граммы"),
  carbs: z.number().describe("Углеводы, граммы"),
  portion: z.string().describe("Примерный размер порции, например «1 тарелка (~350 г)»"),
  description: z.string().describe("Короткое объяснение в 1-2 предложениях"),
  confidence: z.number().min(0).max(1).describe("Уверенность модели от 0 до 1"),
  recommendations: z
    .array(z.string())
    .describe("2-3 коротких совета, как сделать блюдо полезнее"),
})

export type FoodAnalysis = z.infer<typeof foodAnalysisSchema>

export interface HistoryItem extends FoodAnalysis {
  id: string
  image: string
  createdAt: number
  source: "ai" | "mock"
}

export interface AnalyzeResponse {
  analysis: FoodAnalysis
  source: "ai" | "mock"
}
