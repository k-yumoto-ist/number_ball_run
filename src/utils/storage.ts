import { STORAGE_KEYS } from '../config/gameConfig'
import type { BallNumber, StoredSettings } from '../types/game'

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
