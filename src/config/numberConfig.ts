import type { BallNumber } from '../types/game'

export type NumberStyle = {
  color: string
  emissive: string
  textColor: string
  radius: number
  glow: number
}

export const NUMBER_ORDER: BallNumber[] = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048]

export const NUMBER_STYLES: Record<BallNumber, NumberStyle> = {
  2: { color: '#33c7ff', emissive: '#0a5b73', textColor: '#062236', radius: 0.72, glow: 0.05 },
  4: { color: '#50df87', emissive: '#0d6b38', textColor: '#062915', radius: 0.78, glow: 0.07 },
  8: { color: '#ffe45d', emissive: '#856b00', textColor: '#352600', radius: 0.84, glow: 0.08 },
  16: { color: '#ffac4d', emissive: '#8a3d00', textColor: '#3a1700', radius: 0.91, glow: 0.1 },
  32: { color: '#ff6b7f', emissive: '#7d1427', textColor: '#3b0710', radius: 0.98, glow: 0.12 },
  64: { color: '#d577ff', emissive: '#5d1681', textColor: '#250832', radius: 1.05, glow: 0.14 },
  128: { color: '#7b8cff', emissive: '#1d2b8c', textColor: '#090f38', radius: 1.12, glow: 0.16 },
  256: { color: '#42d7cb', emissive: '#006b63', textColor: '#032d2a', radius: 1.18, glow: 0.18 },
  512: { color: '#f26dcb', emissive: '#7a0d57', textColor: '#300522', radius: 1.24, glow: 0.2 },
  1024: { color: '#f7f0a1', emissive: '#9b8700', textColor: '#3f3200', radius: 1.31, glow: 0.24 },
  2048: { color: '#ffffff', emissive: '#ffcf33', textColor: '#111827', radius: 1.38, glow: 0.42 },
}

export function nextNumber(value: BallNumber): BallNumber {
  const index = NUMBER_ORDER.indexOf(value)
  return NUMBER_ORDER[Math.min(index + 1, NUMBER_ORDER.length - 1)]
}
