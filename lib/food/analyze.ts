import "server-only"

import { generateObject } from "ai"
import { foodAnalysisSchema, type FoodAnalysis } from "./types"

const AI_MODEL =
  process.env.FOODSCAN_AI_MODEL || "openai/gpt-4o-mini"

const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY

function isAiConfigured(): boolean {
  return Boolean(AI_GATEWAY_API_KEY)
}

export async function analyzeFood(
  imageDataUrl: string,
): Promise<{ analysis: FoodAnalysis; source: "ai" }> {
  if (!isAiConfigured()) {
    throw new Error(
      "AI Gateway не настроен: отсутствует AI_GATEWAY_API_KEY",
    )
  }

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    throw new Error("Не передано изображение для анализа")
  }

  try {
    const { object } = await generateObject({
      model: AI_MODEL,
      schema: foodAnalysisSchema,

      messages: [
        {
          role: "system",
          content: `
Ты — AI-анализатор фотографий еды для приложения FoodScan AI.

Твоя задача — максимально точно определить еду, которая НАХОДИТСЯ НА ФОТОГРАФИИ.

Правила:

1. Анализируй именно изображение, а не угадывай заранее известное блюдо.
2. Не используй вымышленные или заранее заданные блюда.
3. Определи продукты и ингредиенты, которые действительно видны на фотографии.
4. Если на фотографии несколько ингредиентов, учитывай каждый из них.
5. Если на фотографии есть весы и виден вес, обязательно используй этот вес.
6. Если вес определить невозможно, оцени примерный вес и снизь уверенность.
7. Калории, белки, жиры и углеводы рассчитывай именно для обнаруженной еды и указанной порции.
8. Не придумывай ингредиенты, которые невозможно определить по фотографии.
9. Если определить блюдо сложно, выбери наиболее вероятный вариант и снизь confidence.
10. Особенно внимательно различай:
   - макароны;
   - рис;
   - киноа;
   - картофель;
   - мясо;
   - курицу;
   - рыбу;
   - овощи;
   - хлеб;
   - соусы.
11. Все текстовые поля заполняй на русском языке.
12. Не утверждай с высокой уверенностью то, чего на фотографии не видно.
13. Если виден только один продукт, не придумывай дополнительные продукты.
14. Если видны несколько продуктов, анализируй весь приём пищи.

Ответ должен строго соответствовать переданной схеме.
          `.trim(),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Проанализируй эту фотографию еды. Определи, что находится на фото, ингредиенты, примерный вес и пищевую ценность.",
            },
            {
              type: "image",
              image: imageDataUrl,
            },
          ],
        },
      ],
    })

    return {
      analysis: object,
      source: "ai",
    }
  } catch (error) {
    console.error("[FoodScan AI] Ошибка анализа изображения:", error)

    throw new Error(
      error instanceof Error
        ? `Ошибка AI: ${error.message}`
        : "Ошибка AI при анализе изображения",
    )
  }
}
