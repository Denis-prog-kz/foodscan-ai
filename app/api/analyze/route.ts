import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    console.log("=== ANALYZE START ===")

    const body = await req.json()
    const image = body?.image

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Изображение не передано" },
        { status: 400 }
      )
    }

    console.log("Image size:", image.length)

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing")

      return NextResponse.json(
        {
          error: "GEMINI_API_KEY не настроен на сервере",
        },
        { status: 500 }
      )
    }

    const match = image.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
    )

    if (!match) {
      return NextResponse.json(
        {
          error: "Неверный формат изображения",
        },
        { status: 400 }
      )
    }

    const mimeType = match[1]
    const base64Data = match[2]

    console.log("MIME:", mimeType)
    console.log("Base64 size:", base64Data.length)

    const prompt = `
Ты — AI-анализатор еды для приложения FoodScan AI.

Проанализируй фотографию еды.

Определи:

1. Название блюда или продукта.
2. Примерный вес порции в граммах.
3. Примерную калорийность.
4. Белки в граммах.
5. Жиры в граммах.
6. Углеводы в граммах.
7. Уверенность распознавания от 0 до 100.

Правила:

- Не придумывай конкретные ингредиенты, если их невозможно определить.
- Если на фотографии видны весы, используй показание весов.
- Учитывай размер порции.
- Если точный вес неизвестен, сделай разумную оценку.
- Ответ должен быть только JSON.
- Не используй markdown.
- Все числовые значения calories, protein, fat, carbs и confidence должны быть числами.

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

    console.log("Sending request to Gemini 3.6 Flash...")

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    )

    console.log("Gemini status:", response.status)

    const responseText = await response.text()

    console.log("Gemini raw response:", responseText)

    if (!response.ok) {
      console.error("Gemini API error:", responseText)

      return NextResponse.json(
        {
          error: `Gemini API error ${response.status}`,
          details: responseText,
        },
        { status: 500 }
      )
    }

    let data: any

    try {
      data = JSON.parse(responseText)
    } catch {
      console.error(
        "Invalid Gemini HTTP response:",
        responseText
      )

      return NextResponse.json(
        {
          error: "Gemini вернул некорректный ответ",
          details: responseText,
        },
        { status: 500 }
      )
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error(
        "No text in Gemini response:",
        data
      )

      return NextResponse.json(
        {
          error: "Gemini не вернул результат",
          details: JSON.stringify(data),
        },
        { status: 500 }
      )
    }

    console.log("Gemini result text:", text)

    let result: any

    try {
      result = JSON.parse(text)
    } catch {
      console.error(
        "Invalid Gemini JSON:",
        text
      )

      return NextResponse.json(
        {
          error: "Gemini вернул некорректный JSON",
          details: text,
        },
        { status: 500 }
      )
    }

    console.log("=== ANALYZE SUCCESS ===")

    return NextResponse.json({
      analysis: result,
      source: "gemini",
    })
  } catch (error) {
    console.error(
      "=== ANALYZE EXCEPTION ==="
    )

    console.error(error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось проанализировать изображение",
      },
      { status: 500 }
    )
  }
}
