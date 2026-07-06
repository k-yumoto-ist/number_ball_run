export type DifficultyConfig = {
  level: number
  baseSpeed: number
  maxSpeed: number
  obstacleDensity: number
  movingObstacleRate: number
  narrowChunkRate: number
  riskRewardRate: number
  wallLevelOffset: number
}

export function getDifficultyConfig(level: number): DifficultyConfig {
  const clamped = Math.max(1, level)
  return {
    level: clamped,
    baseSpeed: Math.min(8.4 + (clamped - 1) * 0.32, 11.4),
    maxSpeed: Math.min(10.2 + (clamped - 1) * 0.4, 14.8),
    obstacleDensity: Math.min(0.18 + clamped * 0.035, 0.58),
    movingObstacleRate: Math.min(0.1 + clamped * 0.035, 0.5),
    narrowChunkRate: Math.min(0.08 + clamped * 0.03, 0.42),
    riskRewardRate: Math.min(0.1 + clamped * 0.035, 0.48),
    wallLevelOffset: Math.min(Math.floor(clamped / 3), 5),
  }
}
