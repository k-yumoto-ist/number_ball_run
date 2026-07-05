export type FeedbackType = 'merge' | 'hit' | 'gameOver' | 'clear'

const FREQUENCIES: Record<FeedbackType, number> = {
  merge: 660,
  hit: 150,
  gameOver: 92,
  clear: 880,
}

export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function playTone(type: FeedbackType, enabled: boolean): void {
  if (!enabled) {
    return
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    return
  }

  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime
  oscillator.frequency.value = FREQUENCIES[type]
  oscillator.type = type === 'hit' ? 'square' : 'sine'
  gain.gain.setValueAtTime(type === 'hit' ? 0.045 : 0.06, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.18)
  window.setTimeout(() => void context.close(), 260)
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}
