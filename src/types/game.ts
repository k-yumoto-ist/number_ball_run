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

export type StageGap = {
  id: string
  x: number
  z: number
  width: number
  depth: number
}

export type StageData = {
  id: number
  name: string
  length: number
  startZ: number
  goalZ: number
  track: TrackSegment[]
  balls: StageBall[]
  obstacles: StageObstacle[]
  gaps: StageGap[]
}

export type PlayerSnapshot = {
  value: BallNumber
  progress: number
  elapsedTime: number
}

export type StoredSettings = {
  bestNumber: BallNumber
  bestClearTime: number | null
  hasSeenHelp: boolean
  soundEnabled: boolean
}
