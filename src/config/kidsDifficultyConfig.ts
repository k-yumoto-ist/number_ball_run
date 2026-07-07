export type DifficultySettings = {
  level: number
  minimumDistance: number
  speedMultiplier: number
  rowSpacing: number
  obstacleRate: number
  movingObstacleRate: number
  movingObstacleSpeedMultiplier: number
  largeNumberBallRate: number
  itemRate: number
  heartRate: number
  minimumSafeLanes: number
  maximumHardRowsInSequence: number
  restRowRate: number
  hardPatternBias: number
}

export const DEBUG_DIFFICULTY = {
  enabled: import.meta.env.DEV,
  debugStartDifficultyLevel: 0,
} as const

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getDifficultyLevel(distance: number) {
  return Math.floor(Math.max(0, distance) / 250) + 1
}

export function getDifficultySettings(distance: number): DifficultySettings {
  const level = DEBUG_DIFFICULTY.debugStartDifficultyLevel > 0
    ? DEBUG_DIFFICULTY.debugStartDifficultyLevel
    : getDifficultyLevel(distance)
  const levelStep = Math.max(0, level - 1)

  return {
    level,
    minimumDistance: (level - 1) * 250,
    speedMultiplier: 1 + Math.min(levelStep, 11) * 0.065,
    rowSpacing: clamp(8 - levelStep * 0.22, 5.7, 8),
    obstacleRate: clamp(0.16 + levelStep * 0.04, 0.16, 0.64),
    movingObstacleRate: clamp(level <= 2 ? 0 : 0.12 + (level - 3) * 0.07, 0, 0.72),
    movingObstacleSpeedMultiplier: clamp(1 + levelStep * 0.055, 1, 1.65),
    largeNumberBallRate: clamp(0.06 + levelStep * 0.032, 0.06, 0.4),
    itemRate: clamp(0.34 - levelStep * 0.022, 0.08, 0.34),
    heartRate: clamp(0.13 - levelStep * 0.013, 0.018, 0.13),
    minimumSafeLanes: level <= 2 ? 2 : level <= 4 ? 1 : 1,
    maximumHardRowsInSequence: level <= 2 ? 1 : level <= 4 ? 2 : level <= 7 ? 3 : level <= 10 ? 4 : 5,
    restRowRate: clamp(0.34 - levelStep * 0.018, 0.12, 0.34),
    hardPatternBias: clamp(levelStep * 0.12, 0, 1.7),
  }
}
