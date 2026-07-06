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
