import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const image = body?.image

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Изображение не передано" },
        { status: 400 }
      )
    }

    if (image.length > 12_000_000) {
      return NextResponse.json(
        { error: "Изображение слишком большое" },
        { status: 413 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured")

      return NextResponse.json(
        { error: "API-ключ Gemini не настроен на сервере" },
        { status: 500 }
      )
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)

    if (!match) {
      return NextResponse.json(
        { error: "Неверный формат изображения" },
        { status: 400 }
      )
    }

    const mimeType = match[1]
    const base64Data = match[2]

    const prompt = `
Ты — AI-анализатор еды для приложения FoodScan AI.

Проанализируй фотографию еды.

Определи:
1. Название блюда или продукта.
2. Примерный вес порции в граммах, если вес можно определить по фотографии.
3. Примерную калорийность.
4. Белки в граммах.
5. Жиры в граммах.
6. Углеводы в граммах.
7. Уверенность распознавания от 0 до 100.

ВАЖНО:
- Не придумывай конкретные ингредиенты, если их невозможно определить.
- Если на фотографии видны весы, используй показание весов.
- Учитывай размер порции.
- Если точный вес неизвестен, сделай разумную оценку.
- Ответ должен быть только JSON без markdown.

Формат ответа:

{
  "name": "Название блюда",
  "portion": "примерно 244 г",
  "calories": 450,
  "protein": 15,
  "fat": 12,
  "carbs": 65,
  "confidence": 85
}
`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()

      console.error("Gemini API error:", errorText)

      return NextResponse.json(
        { error: "Ошибка Gemini API", details: errorText },
        { status: 500 }
      )
    }

    const data = await response.json()

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json(
        { error: "Gemini не вернул результат" },
        { status: 500 }
      )
    }

    let result

    try {
      result = JSON.parse(text)
    } catch {
      console.error("Invalid Gemini JSON:", text)

      return NextResponse.json(
        { error: "Gemini вернул некорректный результат" },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Analyze error:", error)

    return NextResponse.json(
      { error: "Не удалось проанализировать изображение" },
      { status: 500 }
    )
  }
