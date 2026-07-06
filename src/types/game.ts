export type GamePhase = 'ready' | 'playing' | 'paused' | 'gameOver' | 'cleared'

export type BallNumber = 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048

export type TrackSegment = {
  id: string
  zStart: number
  zEnd: number
  width: number
  centerStart: number
  centerEnd: number
}

export type StageBall = {
  id: string
  value: BallNumber
  x: number
  z: number
}

export type StageObstacle = {
  id: string
  x: number
  z: number
  width: number
  depth: number
  height: number
}

export type MovingObstacle = StageObstacle & {
  moveAxis: 'x'
  moveDistance: number
  moveSpeed: number
  phase: number
}

export type StageGap = {
  id: string
  x: number
  z: number
  width: number
  depth: number
}

export type NumberWall = {
  id: string
  value: BallNumber
  x: number
  z: number
  width: number
  height: number
}

export type SpeedBoost = {
  id: string
  x: number
  z: number
  radius: number
  multiplier: number
  duration: number
}

export type StageObject = StageBall | StageObstacle | MovingObstacle | NumberWall | SpeedBoost

export type StageData = {
  id: number
  name: string
  length: number
  startZ: number
  goalZ: number
  track: TrackSegment[]
  balls: StageBall[]
  obstacles: StageObstacle[]
  movingObstacles: MovingObstacle[]
  gaps: StageGap[]
  walls: NumberWall[]
  speedBoosts: SpeedBoost[]
  bonusWalls: NumberWall[]
}

export type PlayerSnapshot = {
  value: BallNumber
  progress: number
  elapsedTime: number
  combo: number
  maxCombo: number
  score: number
  wallsDestroyed: number
  bonusWallsDestroyed: number
  isBonus: boolean
}

export type StoredSettings = {
  bestNumber: BallNumber
  bestClearTime: number | null
  hasSeenHelp: boolean
  soundEnabled: boolean
}

export type AppMode = 'home' | 'endless' | 'tutorial'

export type EndlessPhase = 'ready' | 'playing' | 'checkpoint' | 'evolving' | 'paused' | 'gameOver'

export type CourseChunkTag =
  | 'safe'
  | 'merge'
  | 'combo'
  | 'obstacle'
  | 'narrow'
  | 'wall'
  | 'speed'
  | 'recovery'
  | 'riskReward'
  | 'special'

export type CourseChunk = {
  id: string
  length: number
  difficulty: number
  minimumLevel: number
  maximumLevel?: number
  weight: number
  tags: CourseChunkTag[]
  track: (Omit<TrackSegment, 'id' | 'zStart' | 'zEnd'> & { zStart: number; zEnd: number; id?: string })[]
  balls: Omit<StageBall, 'id'>[]
  obstacles: Omit<StageObstacle, 'id'>[]
  movingObstacles: Omit<MovingObstacle, 'id'>[]
  gaps: Omit<StageGap, 'id'>[]
  walls: Omit<NumberWall, 'id'>[]
  speedBoosts: Omit<SpeedBoost, 'id'>[]
  specialEvent?: 'wallRush' | 'comboRush' | 'choiceGate'
}

export type GeneratedChunk = {
  instanceId: string
  chunkId: string
  zStart: number
  zEnd: number
  tags: CourseChunkTag[]
  difficulty: number
}

export type UpgradeCategory = 'merge' | 'combo' | 'defense' | 'speed' | 'score'
export type UpgradeRarity = 'common' | 'rare' | 'epic'

export type UpgradeId =
  | 'magnetRange'
  | 'mergeRange'
  | 'doubleUp'
  | 'comboExtend'
  | 'comboAccel'
  | 'comboShield'
  | 'shield'
  | 'numberGuard'
  | 'courseRecovery'
  | 'wallBonus'
  | 'comboBonus'
  | 'riskReward'

export type UpgradeDefinition = {
  id: UpgradeId
  name: string
  description: string
  nextDescription: string
  category: UpgradeCategory
  rarity: UpgradeRarity
  maxLevel: number
}

export type UpgradeLevels = Partial<Record<UpgradeId, number>>

export type EndlessSnapshot = {
  value: BallNumber
  distance: number
  checkpointProgress: number
  combo: number
  maxCombo: number
  score: number
  wallsDestroyed: number
  shields: number
  evolutionRank: number
  evolutionCount: number
  difficultyLevel: number
  seed: number
  generatedChunks: number
  upgrades: UpgradeLevels
  hearts?: number
  stars?: number
  merges?: number
  highestNumber?: BallNumber
  activeItems?: string[]
}

export type EndlessBestRecords = {
  version: number
  bestScore: number
  longestDistance: number
  bestStars: number
  totalStars: number
  highestRank: number
  highestNumber: BallNumber
  maxEvolutions: number
  maxCombo: number
  playCount: number
  hasSeenEndlessHelp: boolean
  vibrationEnabled: boolean
}
