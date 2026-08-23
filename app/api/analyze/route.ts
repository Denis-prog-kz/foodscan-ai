import { type NextRequest, NextResponse } from "next/server"
import { analyzeFood } from "@/lib/food/analyze"

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  let body: { image?: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 })
  }

  const image = body?.image

  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Не удалось прочитать изображение. Попробуйте другое фото." },
      { status: 400 },
    )
  }

  // Ограничение размера (~8 МБ в base64) для защиты сервера.
  if (image.length > 8_000_000) {
    return NextResponse.json(
      { error: "Изображение слишком большое. Выберите фото поменьше." },
      { status: 413 },
    )
  }

  try {
    const result = await analyzeFood(image)
    return NextResponse.json(result)
  } catch (error) {
    console.log("[v0] /api/analyze error:", (error as Error).message)
    return NextResponse.json(
      { error: "Не удалось проанализировать изображение. Попробуйте ещё раз." },
      { status: 500 },
    )
  }
}
