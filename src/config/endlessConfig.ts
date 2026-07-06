export const ENDLESS_CONFIG = {
  chunksPerCheckpoint: 6,
  generatedChunksAhead: 5,
  retainedChunksBehind: 2,
  comboTimeoutSeconds: 2.5,
  damageInvincibleSeconds: 1.5,
  evolutionInvincibleSeconds: 2,
  initialSpeed: 8.4,
  maximumSpeedMultiplier: 1.8,
  checkpointStopDistance: 10,
  scoreMultiplierPerEvolution: 0.25,
  specialEventIntervalMin: 3,
  specialEventIntervalMax: 5,
  chunkReuseCooldown: 5,
  highDifficultyLimit: 2,
  maxShieldCount: 3,
  courseRecoveryInvincibleSeconds: 2,
  hudUpdateSeconds: 0.1,
  maxVisibleBursts: 6,
} as const

export const ENDLESS_STORAGE_VERSION = 1
