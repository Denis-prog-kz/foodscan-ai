"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, ImagePlus, X, RefreshCw, Check, Loader2, ScanLine, AlertCircle } from "lucide-react"
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

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      // нет доступа к live-камере — используем нативный выбор с камеры
      fileInputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      streamRef.current = stream
      setStage("camera")
      // ждём рендер video-элемента
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      // разрешение не выдано — предлагаем загрузить файл
      fileInputRef.current?.click()
    }
  }, [])

  // авто-запуск камеры при переходе по ?scan=1
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
    setImage(dataUrl)
    setStage("analyzing")
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Не удалось проанализировать изображение")
      }
      const data = (await res.json()) as AnalyzeResponse
      setResult(data)
      setStage("result")
    } catch (e) {
      setError((e as Error).message)
      setStage("error")
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    const size = Math.min(video.videoWidth, video.videoHeight)
    // квадратный кроп по центру, максимум 1024px
    const dim = Math.min(size, 1024)
    canvas.width = dim
    canvas.height = dim
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const sx = (video.videoWidth - size) / 2
    const sy = (video.videoHeight - size) / 2
    ctx.drawImage(video, sx, sy, size, size, 0, 0, dim, dim)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82)
    stopCamera()
    analyze(dataUrl)
  }, [analyze, stopCamera])

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (!file) return
      try {
        const dataUrl = await fileToCompressedDataUrl(file)
        analyze(dataUrl)
      } catch (err) {
        setError((err as Error).message)
        setStage("error")
      }
    },
    [analyze],
  )

  const reset = useCallback(() => {
    stopCamera()
    setImage(null)
    setResult(null)
    setError(null)
    setSaved(false)
    setStage("idle")
  }, [stopCamera])

  const save = useCallback(() => {
    if (!result || !image) return
    addHistoryItem(result.analysis, image, result.source)
    setSaved(true)
  }, [result, image])

  /* --------------------------- Рендер по стадии --------------------------- */

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      className="sr-only"
      onChange={onFileSelected}
      aria-hidden
      tabIndex={-1}
    />
  )

  if (stage === "camera") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={reset} aria-label="Закрыть камеру" className="text-white hover:bg-white/10">
            <X className="h-6 w-6" />
          </Button>
          <p className="text-sm font-medium text-white/90">Наведите камеру на еду</p>
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
            onClick={() => fileInputRef.current?.click()}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image || "/placeholder.svg"} alt="Анализируемое блюдо" className="h-56 w-full max-w-sm object-cover opacity-90" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <ScanLine className="h-12 w-12 animate-pulse text-white" aria-hidden />
          </div>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
          <span className="text-sm font-medium">Анализируем блюдо…</span>
        </div>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          Определяем продукт, калорийность и баланс белков, жиров и углеводов
        </p>
      </div>
    )
  }

  if (stage === "result" && result && image) {
    return (
      <div className="px-5 py-6">
        <AnalysisResult analysis={result.analysis} image={image} source={result.source} />
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" onClick={save} disabled={saved}>
            {saved ? (
              <>
                <Check className="h-5 w-5" /> Сохранено в историю
              </>
            ) : (
              <>
                <Check className="h-5 w-5" /> Сохранить в историю
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={reset}>
            <RefreshCw className="h-5 w-5" /> Сканировать ещё
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
          <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Что-то пошло не так</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={reset}>
          <RefreshCw className="h-5 w-5" /> Попробовать снова
        </Button>
      </div>
    )
  }

  // stage === "idle"
  return (
    <div className="flex flex-col gap-6 px-5 py-8">
      <HeroPanel onCamera={startCamera} onUpload={() => fileInputRef.current?.click()} />
      {idleExtra}
      {hiddenFileInput}
    </div>
  )
}

function HeroPanel({ onCamera, onUpload }: { onCamera: () => void; onUpload: () => void }) {
  return (
    <>
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15">
          <ScanLine className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h1 className="text-balance text-2xl font-bold leading-tight">Сфотографируй еду</h1>
          <p className="mx-auto mt-2 max-w-xs text-pretty text-sm opacity-90">
            FoodScan AI оценит калорийность, белки, жиры и углеводы за пару секунд
          </p>
        </div>
        <div className="mt-2 flex w-full flex-col gap-3">
          <Button
            size="lg"
            variant="secondary"
            onClick={onCamera}
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Camera className="h-5 w-5" /> Открыть камеру
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={onUpload}
            className="w-full text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ImagePlus className="h-5 w-5" /> Загрузить фото
          </Button>
        </div>
      </div>
    </>
  )
}
