import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import { getDifficultyConfig } from '../../config/difficultyConfig'
import { ENDLESS_CONFIG } from '../../config/endlessConfig'
import { SCORE_CONFIG } from '../../config/scoreConfig'
import { GAME_CONFIG } from '../../config/gameConfig'
import { NUMBER_STYLES, nextNumber, previousNumber } from '../../config/numberConfig'
import type { InputControls } from '../../hooks/useInputControls'
import { useInputControls } from '../../hooks/useInputControls'
import type { BallNumber, EndlessBestRecords, EndlessPhase, EndlessSnapshot, StageBall, StageData, StageObstacle, UpgradeDefinition, UpgradeLevels } from '../../types/game'
import { playTone, vibrate } from '../../utils/feedback'
import { getMovingObstacleX } from '../../utils/movingObstacle'
import { clampToTrack, getTrackInfoAtZ } from '../../utils/track'
import { generateAhead, createInitialGeneratorState, pruneBehind, validateGeneratedStage, type DirectorState } from '../../game/ChunkGenerator'
import { SeededRandom, createRunSeed } from '../../game/SeededRandom'
import { applyUpgrade, chooseUpgradeOptions, getUpgradeEffects } from '../../game/UpgradeManager'
import { clearEndlessCheckpoint, incrementEndlessPlayCount, saveEndlessCheckpoint, saveEndlessHelpSeen, saveEndlessResult } from '../../utils/storage'
import { Course } from './Course'
import { FollowCamera } from './FollowCamera'
import { type Burst, MergeBurst } from './MergeBurst'
import { PlayerBall } from './PlayerBall'
import { EndlessHud } from '../ui/EndlessHud'
import { CheckpointScreen } from '../ui/CheckpointScreen'
import { EndlessResultScreen } from '../ui/EndlessResultScreen'

type EndlessGameProps = {
  records: EndlessBestRecords
  soundEnabled: boolean
  onRecordsChange: (records: EndlessBestRecords) => void
  onHome: () => void
}

type PlayerRuntime = {
  x: number
  z: number
  value: BallNumber
  radius: number
  elapsedTime: number
  combo: number
  comboTimer: number
  maxCombo: number
  score: number
  wallsDestroyed: number
  speedBoostTimer: number
  speedMultiplier: number
  currentSpeed: number
  slowTimer: number
  mergePulse: number
  shake: number
  invincibleTimer: number
  shields: number
  evolutionRank: number
  evolutionCount: number
  difficultyLevel: number
  checkpointIndex: number
  nextCheckpointChunk: number
  recoveryCharges: number
  comboShieldCooldown: number
  recentDamage: number
  evolutionJustHappenedTimer: number
}

const INITIAL_ENDLESS_SNAPSHOT: EndlessSnapshot = {
  value: 2,
  distance: 0,
  checkpointProgress: 0,
  combo: 0,
  maxCombo: 0,
  score: 0,
  wallsDestroyed: 0,
  shields: 0,
  evolutionRank: 1,
  evolutionCount: 0,
  difficultyLevel: 1,
  seed: 1,
  generatedChunks: 0,
  upgrades: {},
}

function cloneStage(stage: StageData): StageData {
  return {
    ...stage,
    track: [...stage.track],
    balls: [...stage.balls],
    obstacles: [...stage.obstacles],
    movingObstacles: [...stage.movingObstacles],
    gaps: [...stage.gaps],
    walls: [...stage.walls],
    speedBoosts: [...stage.speedBoosts],
    bonusWalls: [],
  }
}

function intersectsCircleRect(x: number, z: number, radius: number, rect: { x: number; z: number; width: number; depth: number }) {
  const closestX = Math.max(rect.x - rect.width / 2, Math.min(x, rect.x + rect.width / 2))
  const closestZ = Math.max(rect.z - rect.depth / 2, Math.min(z, rect.z + rect.depth / 2))
  const dx = x - closestX
  const dz = z - closestZ
  return dx * dx + dz * dz < radius * radius
}

function makeSnapshot(player: PlayerRuntime, seed: number, upgrades: UpgradeLevels, generatedChunks: number): EndlessSnapshot {
  const checkpointStart = Math.max(0, (player.nextCheckpointChunk - ENDLESS_CONFIG.chunksPerCheckpoint) * 50)
  const checkpointEnd = Math.max(checkpointStart + 1, player.nextCheckpointChunk * 50)
  return {
    value: player.value,
    distance: Math.max(0, player.z),
    checkpointProgress: Math.min(Math.max((player.z - checkpointStart) / (checkpointEnd - checkpointStart), 0), 1),
    combo: player.combo,
    maxCombo: player.maxCombo,
    score: Math.floor(player.score + Math.max(0, player.z) * SCORE_CONFIG.distancePoint),
    wallsDestroyed: player.wallsDestroyed,
    shields: player.shields,
    evolutionRank: player.evolutionRank,
    evolutionCount: player.evolutionCount,
    difficultyLevel: player.difficultyLevel,
    seed,
    generatedChunks,
    upgrades,
  }
}

function EndlessLoop({
  phase,
  controlsRef,
  soundEnabled,
  seed,
  upgrades,
  setStage,
  onSnapshot,
  onCheckpoint,
  onGameOver,
}: {
  phase: EndlessPhase
  controlsRef: React.RefObject<InputControls>
  soundEnabled: boolean
  seed: number
  upgrades: UpgradeLevels
  setStage: (stage: StageData) => void
  onSnapshot: (snapshot: EndlessSnapshot) => void
  onCheckpoint: (snapshot: EndlessSnapshot) => void
  onGameOver: (snapshot: EndlessSnapshot) => void
}) {
  const rngRef = useRef(new SeededRandom(seed))
  const generatorRef = useRef(createInitialGeneratorState())
  const playerRef = useRef<PlayerRuntime>({
    x: 0,
    z: 0,
    value: 2,
    radius: NUMBER_STYLES[2].radius,
    elapsedTime: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    score: 0,
    wallsDestroyed: 0,
    speedBoostTimer: 0,
    speedMultiplier: 1,
    currentSpeed: ENDLESS_CONFIG.initialSpeed,
    slowTimer: 0,
    mergePulse: 0,
    shake: 0,
    invincibleTimer: 0,
    shields: 0,
    evolutionRank: 1,
    evolutionCount: 0,
    difficultyLevel: 1,
    checkpointIndex: 0,
    nextCheckpointChunk: ENDLESS_CONFIG.chunksPerCheckpoint,
    recoveryCharges: 0,
    comboShieldCooldown: 0,
    recentDamage: 0,
    evolutionJustHappenedTimer: 0,
  })
  const playerRootRef = useRef<Group>(null)
  const playerSphereRef = useRef<Group>(null)
  const cameraPlayerRef = useRef({ x: 0, z: 0 })
  const shakeRef = useRef(0)
  const speedRef = useRef<number>(ENDLESS_CONFIG.initialSpeed)
  const collectedRef = useRef(new Set<string>())
  const hitRef = useRef(new Set<string>())
  const hiddenWallRef = useRef(new Set<string>())
  const hiddenObstacleRef = useRef(new Set<string>())
  const hiddenBoostRef = useRef(new Set<string>())
  const [collectedIds, setCollectedIds] = useState<Set<string>>(() => new Set())
  const [hiddenWallIds, setHiddenWallIds] = useState<Set<string>>(() => new Set())
  const [hiddenObstacleIds] = useState<Set<string>>(() => new Set())
  const [hiddenBoostIds, setHiddenBoostIds] = useState<Set<string>>(() => new Set())
  const [playerValue, setPlayerValue] = useState<BallNumber>(2)
  const [bursts, setBursts] = useState<Burst[]>([])
  const lastHudRef = useRef(0)
  const previousXRef = useRef(0)
  const finishedRef = useRef(false)
  const initializedRef = useRef(false)
  const upgradesRef = useRef(upgrades)
  const appliedUpgradeLevelsRef = useRef<UpgradeLevels>({})
  upgradesRef.current = upgrades

  const director = useCallback((): DirectorState => {
    const player = playerRef.current
    return {
      currentValue: player.value,
      difficultyLevel: player.difficultyLevel,
      recentDamage: player.recentDamage,
      recentCourseOut: false,
      shieldCount: player.shields,
      combo: player.combo,
      evolutionJustHappened: player.evolutionJustHappenedTimer > 0,
    }
  }, [])

  const refreshStage = useCallback(() => {
    const generator = generatorRef.current
    if (!validateGeneratedStage(generator.stage)) {
      return
    }
    setStage(cloneStage(generator.stage))
  }, [setStage])

  const initialize = useCallback(() => {
    if (initializedRef.current) {
      return
    }
    initializedRef.current = true
    generateAhead(generatorRef.current, rngRef.current, director(), playerRef.current.z)
    refreshStage()
  }, [director, refreshStage])

  useEffect(() => {
    initialize()
  }, [initialize])

  const resetCombo = () => {
    const player = playerRef.current
    player.combo = 0
    player.comboTimer = 0
  }

  const applyDamage = (sourceX: number) => {
    const player = playerRef.current
    const effects = getUpgradeEffects(upgradesRef.current)
    if (player.invincibleTimer > 0) {
      return
    }
    if (player.shields > 0) {
      player.shields -= 1
    } else if (rngRef.current.next() >= effects.numberGuardChance) {
      if (player.value === 2) {
        finishedRef.current = true
        playTone('gameOver', soundEnabled)
        vibrate(60)
        onGameOver(makeSnapshot(player, seed, upgradesRef.current, generatorRef.current.nextIndex))
        return
      }
      player.value = previousNumber(player.value)
      player.radius = Math.min(NUMBER_STYLES[player.value].radius, GAME_CONFIG.maxPlayerRadius)
      setPlayerValue(player.value)
    }
    player.x += (player.x >= sourceX ? 1 : -1) * GAME_CONFIG.obstacleBounce
    controlsRef.current.targetX = player.x
    player.slowTimer = GAME_CONFIG.slowDuration
    player.invincibleTimer = ENDLESS_CONFIG.damageInvincibleSeconds
    player.shake = 0.85
    player.recentDamage += 1
    resetCombo()
    playTone('hit', soundEnabled)
    vibrate(22)
  }

  const evolve = () => {
    const player = playerRef.current
    player.evolutionCount += 1
    player.evolutionRank += 1
    player.value = 2
    player.radius = NUMBER_STYLES[2].radius
    setPlayerValue(player.value)
    player.invincibleTimer = ENDLESS_CONFIG.evolutionInvincibleSeconds
    player.evolutionJustHappenedTimer = ENDLESS_CONFIG.evolutionInvincibleSeconds
    player.score += SCORE_CONFIG.evolution * (1 + player.evolutionCount * SCORE_CONFIG.rankMultiplierStep)
    player.shake = 1
    playTone('clear', soundEnabled)
    vibrate([18, 30, 18])
  }

  const mergeBall = (ball: StageBall) => {
    const player = playerRef.current
    const effects = getUpgradeEffects(upgradesRef.current)
    let merged = nextNumber(player.value)
    if (rngRef.current.next() < effects.doubleUpChance) {
      merged = nextNumber(merged)
    }
    player.combo += 1
    player.comboTimer = effects.comboTimeout
    player.maxCombo = Math.max(player.maxCombo, player.combo)
    player.value = merged
    player.radius = Math.min(NUMBER_STYLES[merged].radius, GAME_CONFIG.maxPlayerRadius)
    setPlayerValue(player.value)
    player.mergePulse = 1
    player.shake = player.combo >= 2 ? 0.75 : 0.35
    player.score += (SCORE_CONFIG.mergeBase + merged * 8 + player.combo * SCORE_CONFIG.comboStep) * effects.comboScoreMultiplier
    if (effects.comboShieldLevel > 0 && player.combo >= 5 && player.comboShieldCooldown <= 0) {
      player.shields = Math.min(player.shields + 1, ENDLESS_CONFIG.maxShieldCount)
      player.comboShieldCooldown = Math.max(4.5 - effects.comboShieldLevel, 2)
    }
    collectedRef.current.add(ball.id)
    setCollectedIds(new Set(collectedRef.current))
    setBursts((current) => [...current.slice(-ENDLESS_CONFIG.maxVisibleBursts), { id: performance.now(), x: ball.x, z: ball.z, color: NUMBER_STYLES[merged].color }])
    if (merged === 2048) {
      evolve()
    }
    playTone('merge', soundEnabled)
    vibrate([12, 24, 12])
  }

  const checkBalls = (stage: StageData) => {
    const player = playerRef.current
    const effects = getUpgradeEffects(upgradesRef.current)
    for (const ball of stage.balls) {
      if (collectedRef.current.has(ball.id) || ball.z < player.z - 2.5 || ball.z > player.z + 2.8) {
        continue
      }
      const dx = player.x - ball.x
      const dz = player.z - ball.z
      const ballRadius = NUMBER_STYLES[ball.value].radius
      if (ball.value === player.value && Math.sqrt(dx * dx + dz * dz) < player.radius + ballRadius + effects.magnetRange) {
        ball.x += Math.sign(dx) * 0.018
      }
      const hitRadius = player.radius + ballRadius + effects.mergeRange
      if (dx * dx + dz * dz < hitRadius * hitRadius) {
        if (ball.value === player.value) {
          mergeBall(ball)
        } else if (!hitRef.current.has(ball.id)) {
          hitRef.current.add(ball.id)
          applyDamage(ball.x)
        }
      }
    }
  }

  const checkObstacles = (stage: StageData) => {
    const player = playerRef.current
    const obstacles: StageObstacle[] = [
      ...stage.obstacles,
      ...stage.movingObstacles.map((obstacle) => ({ ...obstacle, x: getMovingObstacleX(obstacle, player.elapsedTime) })),
    ]
    for (const obstacle of obstacles) {
      if (hitRef.current.has(obstacle.id) || hiddenObstacleRef.current.has(obstacle.id) || obstacle.z < player.z - 2.5 || obstacle.z > player.z + 2.8) {
        continue
      }
      if (intersectsCircleRect(player.x, player.z, player.radius, obstacle)) {
        hitRef.current.add(obstacle.id)
        applyDamage(obstacle.x)
        return
      }
    }
  }

  const checkWalls = (stage: StageData) => {
    const player = playerRef.current
    const effects = getUpgradeEffects(upgradesRef.current)
    for (const wall of stage.walls) {
      if (hiddenWallRef.current.has(wall.id) || wall.z < player.z - 2.5 || wall.z > player.z + 3) {
        continue
      }
      if (!intersectsCircleRect(player.x, player.z, player.radius, { x: wall.x, z: wall.z, width: wall.width, depth: 0.7 })) {
        continue
      }
      if (player.value >= wall.value) {
        hiddenWallRef.current.add(wall.id)
        setHiddenWallIds(new Set(hiddenWallRef.current))
        player.wallsDestroyed += 1
        player.score += SCORE_CONFIG.wallBase * effects.wallScoreMultiplier * wall.value
        player.shake = 0.9
        setBursts((current) => [...current.slice(-ENDLESS_CONFIG.maxVisibleBursts), { id: performance.now(), x: wall.x, z: wall.z, color: NUMBER_STYLES[wall.value].color }])
        vibrate(24)
      } else {
        applyDamage(wall.x)
      }
      return
    }
  }

  const checkBoosts = (stage: StageData) => {
    const player = playerRef.current
    for (const boost of stage.speedBoosts) {
      if (hiddenBoostRef.current.has(boost.id) || boost.z < player.z - 2.5 || boost.z > player.z + 2.8) {
        continue
      }
      const dx = player.x - boost.x
      const dz = player.z - boost.z
      const hitRadius = player.radius + boost.radius
      if (dx * dx + dz * dz < hitRadius * hitRadius) {
        hiddenBoostRef.current.add(boost.id)
        setHiddenBoostIds(new Set(hiddenBoostRef.current))
        player.speedBoostTimer = boost.duration
        player.speedMultiplier = boost.multiplier
        player.score += SCORE_CONFIG.riskyRoute * getUpgradeEffects(upgradesRef.current).riskRewardMultiplier
        player.shake = 0.35
      }
    }
  }

  useFrame((_, delta) => {
    const player = playerRef.current
    const generator = generatorRef.current
    const stage = generator.stage
    const effects = getUpgradeEffects(upgradesRef.current)
    const previousLevels = appliedUpgradeLevelsRef.current
    const shieldDiff = (upgradesRef.current.shield ?? 0) - (previousLevels.shield ?? 0)
    const recoveryDiff = (upgradesRef.current.courseRecovery ?? 0) - (previousLevels.courseRecovery ?? 0)
    if (shieldDiff > 0) {
      player.shields = Math.min(player.shields + shieldDiff, ENDLESS_CONFIG.maxShieldCount)
    }
    if (recoveryDiff > 0) {
      player.recoveryCharges = Math.min(player.recoveryCharges + recoveryDiff, 1)
    }
    appliedUpgradeLevelsRef.current = { ...upgradesRef.current }
    if (finishedRef.current) {
      return
    }

    player.mergePulse = Math.max(0, player.mergePulse - delta * 2.8)
    player.shake = Math.max(0, player.shake - delta * 3.5)
    player.comboTimer = Math.max(0, player.comboTimer - delta)
    player.speedBoostTimer = Math.max(0, player.speedBoostTimer - delta)
    player.slowTimer = Math.max(0, player.slowTimer - delta)
    player.invincibleTimer = Math.max(0, player.invincibleTimer - delta)
    player.comboShieldCooldown = Math.max(0, player.comboShieldCooldown - delta)
    player.evolutionJustHappenedTimer = Math.max(0, player.evolutionJustHappenedTimer - delta)
    if (player.combo > 0 && player.comboTimer === 0) {
      resetCombo()
    }
    shakeRef.current = player.shake

    const visualScale = 1 + player.mergePulse * 0.16
    if (playerSphereRef.current) {
      playerSphereRef.current.position.y = GAME_CONFIG.courseSurfaceY + player.radius * visualScale
      playerSphereRef.current.scale.setScalar(visualScale)
    }

    if (phase !== 'playing') {
      if (playerRootRef.current) {
        playerRootRef.current.position.set(player.x, 0, player.z)
      }
      return
    }

    player.elapsedTime += delta
    const controls = controlsRef.current
    controls.targetX += controls.keyboardAxis * GAME_CONFIG.keyboardSpeed * delta
    controls.targetX = clampToTrack(stage.track, player.z, controls.targetX, player.radius + GAME_CONFIG.trackEdgePadding)
    player.x += (controls.targetX - player.x) * Math.min(delta * GAME_CONFIG.lateralFollow, 1)

    const difficulty = getDifficultyConfig(player.difficultyLevel)
    const comboMultiplier = player.combo >= 3 ? 1 + effects.comboSpeedBonus : 1
    const boostMultiplier = player.speedBoostTimer > 0 ? player.speedMultiplier : 1
    const rankMultiplier = 1 + (player.evolutionRank - 1) * 0.04
    const targetSpeed = player.slowTimer > 0 ? GAME_CONFIG.slowForwardSpeed : Math.min(difficulty.baseSpeed * comboMultiplier * boostMultiplier * rankMultiplier, difficulty.maxSpeed)
    player.currentSpeed += (targetSpeed - player.currentSpeed) * Math.min(delta * 3.5, 1)
    speedRef.current = player.currentSpeed
    player.z += player.currentSpeed * delta

    const trackInfo = getTrackInfoAtZ(stage.track, player.z)
    const edgeAllowance = player.radius * 0.35
    if (!trackInfo || player.x < trackInfo.left + edgeAllowance || player.x > trackInfo.right - edgeAllowance) {
      if (effects.hasCourseRecovery && player.recoveryCharges > 0) {
        player.recoveryCharges -= 1
        player.x = trackInfo?.centerX ?? 0
        controls.targetX = player.x
        player.invincibleTimer = effects.recoveryInvincible
      } else {
        finishedRef.current = true
        playTone('gameOver', soundEnabled)
        onGameOver(makeSnapshot(player, seed, upgradesRef.current, generator.nextIndex))
        return
      }
    }

    if (stage.gaps.some((gap) => intersectsCircleRect(player.x, player.z, player.radius * 0.78, gap))) {
      if (effects.hasCourseRecovery && player.recoveryCharges > 0) {
        player.recoveryCharges -= 1
        player.x = trackInfo?.centerX ?? 0
        controls.targetX = player.x
        player.invincibleTimer = effects.recoveryInvincible
      } else {
        finishedRef.current = true
        playTone('gameOver', soundEnabled)
        onGameOver(makeSnapshot(player, seed, upgradesRef.current, generator.nextIndex))
        return
      }
    }

    checkBalls(stage)
    checkObstacles(stage)
    checkWalls(stage)
    checkBoosts(stage)

    const oldGenerated = generator.nextIndex
    generateAhead(generator, rngRef.current, director(), player.z)
    pruneBehind(generator, player.z)
    if (generator.nextIndex !== oldGenerated) {
      refreshStage()
    }

    if (generator.generated.length > 0 && player.z > player.nextCheckpointChunk * 50) {
      player.checkpointIndex += 1
      player.difficultyLevel += 1
      player.nextCheckpointChunk += ENDLESS_CONFIG.chunksPerCheckpoint
      player.score += SCORE_CONFIG.checkpoint
      player.recentDamage = 0
      const snapshot = makeSnapshot(player, seed, upgradesRef.current, generator.nextIndex)
      saveEndlessCheckpoint(snapshot)
      onCheckpoint(snapshot)
      return
    }

    cameraPlayerRef.current.x = player.x
    cameraPlayerRef.current.z = player.z
    if (playerRootRef.current) {
      playerRootRef.current.position.set(player.x, 0, player.z)
    }
    if (playerSphereRef.current) {
      const rollDistance = player.currentSpeed * delta
      const lateralDistance = player.x - previousXRef.current
      playerSphereRef.current.rotation.x -= rollDistance / Math.max(player.radius, 0.1)
      playerSphereRef.current.rotation.y += rollDistance / Math.max(player.radius * 1.8, 0.1)
      playerSphereRef.current.rotation.z -= lateralDistance / Math.max(player.radius, 0.1)
    }
    previousXRef.current = player.x

    lastHudRef.current += delta
    if (lastHudRef.current > ENDLESS_CONFIG.hudUpdateSeconds) {
      lastHudRef.current = 0
      onSnapshot(makeSnapshot(player, seed, upgradesRef.current, generator.nextIndex))
    }
  })

  return (
    <>
      <fog attach="fog" args={['#aee8ff', 60, 170]} />
      <hemisphereLight args={['#ffffff', '#9ad8b5', 1.1]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-4, 8, -3]} intensity={1.8} />
      <Course stage={generatorRef.current.stage} collectedIds={collectedIds} hiddenObstacleIds={hiddenObstacleIds} hiddenWallIds={hiddenWallIds} hiddenBoostIds={hiddenBoostIds} />
      <PlayerBall ref={playerRootRef} sphereRef={playerSphereRef} value={playerValue} />
      {bursts.map((burst) => <MergeBurst key={burst.id} burst={burst} />)}
      <FollowCamera playerRef={cameraPlayerRef} shakeRef={shakeRef} speedRef={speedRef} />
    </>
  )
}

export function EndlessGame({ records, soundEnabled, onRecordsChange, onHome }: EndlessGameProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<EndlessPhase>('ready')
  const [seed, setSeed] = useState(() => createRunSeed())
  const [runId, setRunId] = useState(0)
  const [snapshot, setSnapshot] = useState<EndlessSnapshot>({ ...INITIAL_ENDLESS_SNAPSHOT, seed })
  const [stage, setStage] = useState<StageData>(() => createInitialGeneratorState().stage)
  const [upgrades, setUpgrades] = useState<UpgradeLevels>({})
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeDefinition[]>([])
  const [isNewBest, setIsNewBest] = useState(false)
  const optionsRngRef = useRef(new SeededRandom(seed ^ 0x9e3779b9))

  const markStart = useCallback(() => {
    if (!records.hasSeenEndlessHelp) {
      onRecordsChange(saveEndlessHelpSeen())
    }
    setPhase((current) => (current === 'ready' ? 'playing' : current))
  }, [onRecordsChange, records.hasSeenEndlessHelp])

  const controlsRef = useInputControls(hostRef, phase, markStart)

  const handleCheckpoint = useCallback(
    (nextSnapshot: EndlessSnapshot) => {
      setSnapshot(nextSnapshot)
      setUpgradeOptions(chooseUpgradeOptions(optionsRngRef.current, upgrades, nextSnapshot.shields))
      setPhase('checkpoint')
    },
    [upgrades],
  )

  const handleUpgrade = useCallback(
    (upgrade: UpgradeDefinition) => {
      const next = applyUpgrade(upgrades, upgrade)
      setUpgrades(next)
      setSnapshot((current) => ({ ...current, upgrades: next, difficultyLevel: current.difficultyLevel + 1 }))
      setPhase('playing')
    },
    [upgrades],
  )

  const handleGameOver = useCallback(
    (finalSnapshot: EndlessSnapshot) => {
      const withUpgrades = { ...finalSnapshot, upgrades }
      setSnapshot(withUpgrades)
      const result = saveEndlessResult(withUpgrades)
      onRecordsChange(result.records)
      setIsNewBest(result.isNewBest)
      clearEndlessCheckpoint()
      setPhase('gameOver')
    },
    [onRecordsChange, upgrades],
  )

  const retry = useCallback(() => {
    const nextSeed = createRunSeed()
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setSeed(nextSeed)
    setRunId((current) => current + 1)
    setSnapshot({ ...INITIAL_ENDLESS_SNAPSHOT, seed: nextSeed })
    setStage(createInitialGeneratorState().stage)
    setUpgrades({})
    setUpgradeOptions([])
    setIsNewBest(false)
    optionsRngRef.current = new SeededRandom(nextSeed ^ 0x9e3779b9)
    onRecordsChange(incrementEndlessPlayCount())
    setPhase('ready')
  }, [controlsRef, onRecordsChange])

  const scene = (
    <Canvas
      key={`${runId}-${seed}`}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor('#aee8ff', 0)
        camera.lookAt(0, 1, 8)
      }}
      camera={{ position: [0, 6.4, -8.2], fov: GAME_CONFIG.camera.portraitFov, near: 0.1, far: 180 }}
    >
      <EndlessLoop
        phase={phase}
        controlsRef={controlsRef}
        soundEnabled={soundEnabled}
        seed={seed}
        upgrades={upgrades}
        setStage={setStage}
        onSnapshot={setSnapshot}
        onCheckpoint={handleCheckpoint}
        onGameOver={handleGameOver}
      />
    </Canvas>
  )

  return (
    <section ref={hostRef} className="endless-root" aria-label="エンドレスモード">
      {scene}
      <EndlessHud phase={phase} snapshot={snapshot} onPause={() => setPhase('paused')} onResume={() => setPhase('playing')} />
      {phase === 'checkpoint' && (
        <CheckpointScreen checkpointNumber={snapshot.difficultyLevel} snapshot={snapshot} options={upgradeOptions} onSelect={handleUpgrade} />
      )}
      {phase === 'gameOver' && (
        <EndlessResultScreen snapshot={snapshot} records={records} isNewBest={isNewBest} onRetry={retry} onHome={onHome} />
      )}
      <span className="seed-label">seed {seed}</span>
      <span className="sr-only">{stage.name}</span>
    </section>
  )
}
