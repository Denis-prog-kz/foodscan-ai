"use client"

import { useCallback, useSyncExternalStore } from "react"
import type { FoodAnalysis, HistoryItem } from "./types"

const STORAGE_KEY = "foodscan:history"
const GOAL_KEY = "foodscan:calorie-goal"

/* ------------------------------------------------------------------ */
/* Простое хранилище на localStorage с подпиской для useSyncExternalStore */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === GOAL_KEY) emit()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HistoryItem[]) : []
  } catch {
    return []
  }
}

let cache: HistoryItem[] = []
let cacheRaw: string | null = null

function getSnapshot(): HistoryItem[] {
  if (typeof window === "undefined") return cache
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw !== cacheRaw) {
    cacheRaw = raw
    cache = raw ? safeParse(raw) : []
  }
  return cache
}

function safeParse(raw: string): HistoryItem[] {
  try {
    return JSON.parse(raw) as HistoryItem[]
  } catch {
    return []
  }
}

export function addHistoryItem(
  analysis: FoodAnalysis,
  image: string,
  source: "ai" | "mock",
): HistoryItem {
  const item: HistoryItem = {
    ...analysis,
    id: crypto.randomUUID(),
    image,
    source,
    createdAt: Date.now(),
  }
  const next = [item, ...readHistory()].slice(0, 100)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  emit()
  return item
}

export function removeHistoryItem(id: string) {
  const next = readHistory().filter((i) => i.id !== id)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  emit()
}

export function clearHistory() {
  window.localStorage.removeItem(STORAGE_KEY)
  emit()
}

export function getHistoryItem(id: string): HistoryItem | undefined {
  return readHistory().find((i) => i.id === id)
}

export function useHistory(): HistoryItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => cache)
}

/* ------------------------------- Goal ------------------------------ */

const DEFAULT_GOAL = 2000

export function setCalorieGoal(goal: number) {
  window.localStorage.setItem(GOAL_KEY, String(goal))
  emit()
}

function getGoalSnapshot(): number {
  if (typeof window === "undefined") return DEFAULT_GOAL
  const raw = window.localStorage.getItem(GOAL_KEY)
  const n = raw ? Number(raw) : DEFAULT_GOAL
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_GOAL
}

export function useCalorieGoal(): [number, (g: number) => void] {
  const goal = useSyncExternalStore(subscribe, getGoalSnapshot, () => DEFAULT_GOAL)
  const set = useCallback((g: number) => setCalorieGoal(g), [])
  return [goal, set]
}
