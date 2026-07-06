import { STORAGE_KEYS } from '../config/gameConfig'
import { ENDLESS_STORAGE_VERSION } from '../config/endlessConfig'
import type { BallNumber, EndlessBestRecords, EndlessSnapshot, StoredSettings } from '../types/game'

const DEFAULT_SETTINGS: StoredSettings = {
  bestNumber: 2,
  bestClearTime: null,
  hasSeenHelp: false,
  soundEnabled: true,
}

function readString(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeString(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in private modes. The game continues without persistence.
  }
}

export function loadSettings(): StoredSettings {
  const bestNumber = Number(readString(STORAGE_KEYS.bestNumber))
  const bestClearTimeValue = Number(readString(STORAGE_KEYS.bestClearTime))

  return {
    bestNumber: bestNumber > 0 ? (bestNumber as BallNumber) : DEFAULT_SETTINGS.bestNumber,
    bestClearTime: bestClearTimeValue > 0 ? bestClearTimeValue : DEFAULT_SETTINGS.bestClearTime,
    hasSeenHelp: readString(STORAGE_KEYS.hasSeenHelp) === 'true',
    soundEnabled: readString(STORAGE_KEYS.soundEnabled) !== 'false',
  }
}

export function saveBestNumber(value: BallNumber): void {
  const current = Number(readString(STORAGE_KEYS.bestNumber))
  if (!current || value > current) {
    writeString(STORAGE_KEYS.bestNumber, String(value))
  }
}

export function saveBestClearTime(time: number): void {
  const current = Number(readString(STORAGE_KEYS.bestClearTime))
  if (!current || time < current) {
    writeString(STORAGE_KEYS.bestClearTime, String(time))
  }
}

export function saveHasSeenHelp(): void {
  writeString(STORAGE_KEYS.hasSeenHelp, 'true')
}

export function saveSoundEnabled(enabled: boolean): void {
  writeString(STORAGE_KEYS.soundEnabled, String(enabled))
}

const DEFAULT_ENDLESS_RECORDS: EndlessBestRecords = {
  version: ENDLESS_STORAGE_VERSION,
  bestScore: 0,
  longestDistance: 0,
  bestStars: 0,
  totalStars: 0,
  highestRank: 1,
  highestNumber: 2,
  maxEvolutions: 0,
  maxCombo: 0,
  playCount: 0,
  hasSeenEndlessHelp: false,
  vibrationEnabled: true,
}

export function loadEndlessRecords(): EndlessBestRecords {
  const raw = readString(STORAGE_KEYS.endlessRecords)
  if (!raw) {
    return DEFAULT_ENDLESS_RECORDS
  }
  try {
    const parsed = JSON.parse(raw) as Partial<EndlessBestRecords>
    if (parsed.version !== ENDLESS_STORAGE_VERSION) {
      return DEFAULT_ENDLESS_RECORDS
    }
    return { ...DEFAULT_ENDLESS_RECORDS, ...parsed }
  } catch {
    return DEFAULT_ENDLESS_RECORDS
  }
}

export function saveEndlessHelpSeen(): EndlessBestRecords {
  const next = { ...loadEndlessRecords(), hasSeenEndlessHelp: true }
  writeString(STORAGE_KEYS.endlessRecords, JSON.stringify(next))
  return next
}

export function incrementEndlessPlayCount(): EndlessBestRecords {
  const current = loadEndlessRecords()
  const next = { ...current, playCount: current.playCount + 1 }
  writeString(STORAGE_KEYS.endlessRecords, JSON.stringify(next))
  return next
}

export function saveEndlessResult(snapshot: EndlessSnapshot): { records: EndlessBestRecords; isNewBest: boolean } {
  const current = loadEndlessRecords()
  const isNewBest = snapshot.score > current.bestScore
  const next: EndlessBestRecords = {
    ...current,
    bestScore: Math.max(current.bestScore, snapshot.score),
    longestDistance: Math.max(current.longestDistance, snapshot.distance),
    bestStars: Math.max(current.bestStars, snapshot.stars ?? 0),
    totalStars: current.totalStars + (snapshot.stars ?? 0),
    highestRank: Math.max(current.highestRank, snapshot.evolutionRank),
    highestNumber: Math.max(current.highestNumber, snapshot.highestNumber ?? snapshot.value) as BallNumber,
    maxEvolutions: Math.max(current.maxEvolutions, snapshot.evolutionCount),
    maxCombo: Math.max(current.maxCombo, snapshot.maxCombo),
  }
  writeString(STORAGE_KEYS.endlessRecords, JSON.stringify(next))
  return { records: next, isNewBest }
}

export function saveEndlessCheckpoint(snapshot: EndlessSnapshot): void {
  writeString(STORAGE_KEYS.endlessCheckpoint, JSON.stringify({ version: ENDLESS_STORAGE_VERSION, savedAt: Date.now(), snapshot }))
}

export function clearEndlessCheckpoint(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.endlessCheckpoint)
  } catch {
    // Ignore storage errors.
  }
}
