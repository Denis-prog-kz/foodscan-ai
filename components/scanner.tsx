"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Camera,
  ImagePlus,
  X,
  RefreshCw,
  Check,
  Loader2,
  ScanLine,
  AlertCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { AnalysisResult } from "@/components/analysis-result"
import { fileToCompressedDataUrl } from "@/lib/food/image"
import { addHistoryItem } from "@/lib/food/history"
import type { AnalyzeResponse } from "@/lib/food/types"

type Stage = "idle" | "camera" | "analyzing" | "result" | "error"

export function Scanner({ idleExtra }: { idleExtra?: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [stage, setStage] = useState<Stage>("idle")
  const [image, setImage] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Диагностика
  const [debug, setDebug] = useState<string>("Готово")
  const [debugSize, setDebugSize] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    setDebug("Запускаем камеру...")

    if (!navigator.mediaDevices?.getUserMedia) {
      setDebug("Live-камера недоступна → открываем камеру телефона")
      cameraInputRef.current?.click()
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      })

      streamRef.current = stream
      setStage("camera")
      setDebug("Камера запущена")

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream

          videoRef.current.play().catch(() => {
            setDebug("Камера подключена, но video.play() не сработал")
          })
        }
      })
    } catch (err) {
      console.error(err)

      setDebug("Нет доступа к live-камере → открываем камеру телефона")
      cameraInputRef.current?.click()
    }
  }, [])

  useEffect(() => {
    if (searchParams.get("scan") === "1" && stage === "idle") {
      startCamera()
      router.replace("/")
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const analyze = useCallback(async (dataUrl: string) => {
    console.log("🔥 ANALYZE CALLED", dataUrl.length)

    setDebug("Фото обработано. Отправляем на /api/analyze...")
    setDebugSize(dataUrl.length)

    setImage(dataUrl)
    setStage("analyzing")
    setError(null)
    setSaved(false)

    try {
      setDebug("Шаг 1/3: отправляем фото на сервер...")

      const controller = new AbortController()

      // Таймаут 45 секунд
      const timeout = setTimeout(() => {
        controller.abort()
      }, 45_000)

      let res: Response

      try {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: dataUrl,
          }),
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timeout)
      }

      setDebug(`Шаг 2/3: сервер ответил HTTP ${res.status}`)

      const responseText = await res.text()

      console.log("🔥 API RESPONSE STATUS:", res.status)
      console.log("🔥 API RESPONSE:", responseText)

      let data: any = null

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(
          `Сервер вернул не JSON. HTTP ${res.status}. Ответ: ${responseText.slice(
            0,
            300
          )}`
        )
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Ошибка сервера HTTP ${res.status}`
        )
      }

      if (!data?.analysis) {
        console.log("🔥 НЕОЖИДАННЫЙ ФОРМАТ:", data)

        throw new Error(
          "Сервер ответил, но в ответе отсутствует поле analysis"
        )
      }

      setDebug("Шаг 3/3: результат получен!")

      setResult(data as AnalyzeResponse)
      setStage("result")
    } catch (e) {
      console.error("🔥 ANALYZE ERROR:", e)

      let message = "Не удалось проанализировать изображение"

      if (e instanceof DOMException && e.name === "AbortError") {
        message =
          "Сервер не ответил за 45 секунд. Проверь API и логи Vercel."
      } else if (e instanceof Error) {
        message = e.message
      }

      setDebug(`ОШИБКА: ${message}`)
      setError(message)
      setStage("error")
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current

    if (!video) {
      setDebug("ОШИБКА: video элемент не найден")
      return
    }

    if (!video.videoWidth || !video.videoHeight) {
      setDebug("ОШИБКА: камера ещё не передала изображение")
      return
    }

    setDebug("Делаем снимок...")

    const canvas = document.createElement("canvas")

    const size = Math.min(
      video.videoWidth,
      video.videoHeight
    )

    const dim = Math.min(size, 1024)

    canvas.width = dim
    canvas.height = dim

    const ctx = canvas.getContext("2d")

    if (!ctx) {
      setDebug("ОШИБКА: не удалось создать canvas")
      return
    }

    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2

    ctx.drawImage(
      video,
      sx,
      sy,
      size,
      size,
      0,
      0,
      dim,
      dim
    )

    const dataUrl = canvas.toDataURL(
      "image/jpeg",
      0.82
    )

    console.log(
      "🔥 CAPTURED IMAGE SIZE:",
      dataUrl.length
    )

    stopCamera()

    analyze(dataUrl)
  }, [analyze, stopCamera])

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      e.target.value = ""

      if (!file) {
        setDebug("Файл не выбран")
        return
      }

      try {
        setDebug(
          `Файл выбран: ${Math.round(
            file.size / 1024
          )} KB. Сжимаем...`
        )

        const dataUrl =
          await fileToCompressedDataUrl(file)

        setDebug(
          `Фото сжато: ${Math.round(
            dataUrl.length / 1024
          )} KB. Передаём на анализ...`
        )

        setDebugSize(dataUrl.length)

        await analyze(dataUrl)
      } catch (err) {
        console.error("🔥 FILE ERROR:", err)

        const message =
          err instanceof Error
            ? err.message
            : "Не удалось обработать фотографию"

        setDebug(`ОШИБКА ФАЙЛА: ${message}`)
        setError(message)
        setStage("error")
      }
    },
    [analyze]
  )

  const reset = useCallback(() => {
    stopCamera()

    setImage(null)
    setResult(null)
    setError(null)
    setSaved(false)

    setDebug("Готово")
    setDebugSize(null)

    setStage("idle")
  }, [stopCamera])

  const save = useCallback(() => {
    if (!result || !image) return

    addHistoryItem(
      result.analysis,
      image,
      result.source
    )

    setSaved(true)
    setDebug("Результат сохранён в историю")
  }, [result, image])

  const hiddenFileInput = (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={onFileSelected}
        aria-hidden
        tabIndex={-1}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onFileSelected}
        aria-hidden
        tabIndex={-1}
      />
    </>
  )

  /*
   * ДИАГНОСТИЧНАЯ ПАНЕЛЬ
   */
  const DebugPanel = () => (
    <div className="mx-5 mt-4 rounded-xl border border-yellow-400/40 bg-yellow-50 p-3 text-left text-xs text-black dark:bg-yellow-950 dark:text-white">
      <div className="font-bold">
        🔧 Диагностика
      </div>

      <div className="mt-1 break-words">
        {debug}
      </div>

      {debugSize !== null && (
        <div className="mt-1">
          Размер изображения:{" "}
          {Math.round(debugSize / 1024)} KB
        </div>
      )}
    </div>
  )

  if (stage === "camera") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            aria-label="Закрыть камеру"
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>

          <p className="text-sm font-medium text-white/90">
            Наведите камеру на еду
          </p>

          <div className="w-11" />
        </div>

        <div className="relative flex-1 overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-3xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 p-8 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <button
            onClick={() =>
              galleryInputRef.current?.click()
            }
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95"
            aria-label="Загрузить из галереи"
          >
            <ImagePlus className="h-6 w-6" />
          </button>

          <button
            onClick={capturePhoto}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white ring-4 ring-white/40 transition active:scale-95"
            aria-label="Сделать снимок"
          >
            <span className="h-16 w-16 rounded-full bg-primary" />
          </button>

          <div className="w-12" />
        </div>

        {hiddenFileInput}
      </div>
    )
  }

  if (stage === "analyzing") {
    return (
      <div className="flex flex-col items-center gap-6 px-5 py-16">
        <div className="relative overflow-hidden rounded-2xl">
          {image && (
            <img
              src={image}
              alt="Анализируемое блюдо"
              className="h-56 w-full max-w-sm object-cover opacity-90"
            />
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <ScanLine
              className="h-12 w-12 animate-pulse text-white"
              aria-hidden
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2
            className="h-5 w-5 animate-spin text-primary"
            aria-hidden
          />

          <span className="text-sm font-medium">
            Анализируем блюдо…
          </span>
        </div>

        <DebugPanel />

        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Определяем продукт, калорийность и баланс
          белков, жиров и углеводов
        </p>
      </div>
    )
  }

  if (stage === "result" && result && image) {
    return (
      <div className="px-5 py-6">
        <AnalysisResult
          analysis={result.analysis}
          image={image}
          source={result.source}
        />

        <DebugPanel />

        <div className="mt-6 flex flex-col gap-3">
          <Button
            size="lg"
            onClick={save}
            disabled={saved}
          >
            {saved ? (
              <>
                <Check className="h-5 w-5" />
                Сохранено в историю
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Сохранить в историю
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={reset}
          >
            <RefreshCw className="h-5 w-5" />
            Сканировать ещё
          </Button>

          {saved && (
            <button
              onClick={() => router.push("/history")}
              className="text-center text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Перейти в историю
            </button>
          )}
        </div>
      </div>
    )
  }

  if (stage === "error") {
    return (
      <div className="flex flex-col items-center gap-5 px-5 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold">
            Что-то пошло не так
          </h2>

          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {error}
          </p>
        </div>

        <DebugPanel />

        <Button onClick={reset}>
          <RefreshCw className="h-5 w-5" />
          Попробовать снова
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-8">
      <HeroPanel
        onCamera={startCamera}
        onUpload={() =>
          galleryInputRef.current?.click()
        }
      />

      <DebugPanel />

      {idleExtra}
      {hiddenFileInput}
    </div>
  )
}

function HeroPanel({
  onCamera,
  onUpload,
}: {
  onCamera: () => void
  onUpload: () => void
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <ScanLine className="h-8 w-8" aria-hidden />
        </div>

        <div>
          <h1 className="text-balance text-2xl font-bold leading-tight">
            Сфотографируй еду
          </h1>

          <p className="mx-auto mt-2 max-w-xs text-pretty text-sm opacity-90">
            FoodScan AI оценит калорийность, белки,
            жиры и углеводы за пару секунд
          </p>
        </div>

        <div className="mt-2 flex w-full flex-col gap-3">
          <Button
            size="lg"
            variant="secondary"
            onClick={onCamera}
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Camera className="h-5 w-5" />
            Открыть камеру
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={onUpload}
            className="w-full text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ImagePlus className="h-5 w-5" />
            Загрузить фото
          </Button>
        </div>
      </div>
    </>
  )
}
