export const GAME_CONFIG = {
  playerStartX: 0,
  courseSurfaceY: 0.1,
  baseForwardSpeed: 8.2,
  slowForwardSpeed: 5.1,
  slowDuration: 0.55,
  lateralFollow: 14,
  keyboardSpeed: 6.8,
  inputSensitivity: 8.5,
  trackEdgePadding: 0.34,
  collisionLookBehind: 2.2,
  collisionLookAhead: 2.4,
  obstacleBounce: 1.15,
  wrongBallBounce: 0.95,
  maxPlayerRadius: 1.38,
  camera: {
    portraitFov: 56,
    landscapeFov: 48,
    height: 6.5,
    distance: 8.2,
    lookAhead: 7.8,
    lateralInfluence: 0.18,
    followLerp: 0.085,
  },
  particles: {
    mergeCount: 18,
    lifetime: 0.42,
  },
} as const

export const STORAGE_KEYS = {
  bestNumber: 'numberBallRun.bestNumber',
  bestClearTime: 'numberBallRun.bestClearTime',
  hasSeenHelp: 'numberBallRun.hasSeenHelp',
  soundEnabled: 'numberBallRun.soundEnabled',
} as const
