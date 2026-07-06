import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'
import { NUMBER_STYLES, nextNumber, previousNumber } from '../../config/numberConfig'
import type { InputControls } from '../../hooks/useInputControls'
import type { BallNumber, GamePhase, MovingObstacle, NumberWall, PlayerSnapshot, StageBall, StageData, StageGap, StageObstacle } from '../../types/game'
import { playTone, vibrate } from '../../utils/feedback'
import { clampToTrack, getTrackInfoAtZ } from '../../utils/track'
import { Course } from './Course'
import { FollowCamera } from './FollowCamera'
import { GoalGate } from './GoalGate'
import { type Burst, MergeBurst } from './MergeBurst'
import { PlayerBall } from './PlayerBall'
import { getMovingObstacleX } from '../../utils/movingObstacle'

type GameSceneProps = {
  stage: StageData
  phase: GamePhase
  controlsRef: React.RefObject<InputControls>
  soundEnabled: boolean
  onSnapshot: (snapshot: PlayerSnapshot) => void
  onGameOver: (snapshot: PlayerSnapshot) => void
  onClear: (snapshot: PlayerSnapshot) => void
}

type PlayerRuntime = {
  x: number
  z: number
  value: BallNumber
  radius: number
  elapsedTime: number
  slowTimer: number
  mergePulse: number
  shake: number
  combo: number
  comboTimer: number
  maxCombo: number
  score: number
  wallsDestroyed: number
  bonusWallsDestroyed: number
  speedBoostTimer: number
  speedMultiplier: number
  destroyPowerTimer: number
  currentSpeed: number
  isBonus: boolean
}

function intersectsCircleRect(
  x: number,
  z: number,
  radius: number,
  rect: { x: number; z: number; width: number; depth: number },
) {
  const closestX = Math.max(rect.x - rect.width / 2, Math.min(x, rect.x + rect.width / 2))
  const closestZ = Math.max(rect.z - rect.depth / 2, Math.min(z, rect.z + rect.depth / 2))
  const dx = x - closestX
  const dz = z - closestZ
  return dx * dx + dz * dz < radius * radius
}

function ballDistance(player: PlayerRuntime, ball: StageBall) {
  const radius = NUMBER_STYLES[ball.value].radius
  const dx = player.x - ball.x
  const dz = player.z - ball.z
  return Math.sqrt(dx * dx + dz * dz) - player.radius - radius
}

function getSnapshot(player: PlayerRuntime, stage: StageData): PlayerSnapshot {
  return {
    value: player.value,
    progress: Math.min(Math.max((player.z - stage.startZ) / (stage.goalZ - stage.startZ), 0), 1),
    elapsedTime: player.elapsedTime,
    combo: player.combo,
    maxCombo: player.maxCombo,
    score: player.score,
    wallsDestroyed: player.wallsDestroyed,
    bonusWallsDestroyed: player.bonusWallsDestroyed,
    isBonus: player.isBonus,
  }
}

function rectForMovingObstacle(obstacle: MovingObstacle, elapsedTime: number): StageObstacle {
  return { ...obstacle, x: getMovingObstacleX(obstacle, elapsedTime) }
}

function circleHit(x: number, z: number, radius: number, target: { x: number; z: number; radius: number }) {
  const dx = x - target.x
  const dz = z - target.z
  const hitRadius = radius + target.radius
  return dx * dx + dz * dz < hitRadius * hitRadius
}

function GameLoop({
  stage,
  phase,
  controlsRef,
  soundEnabled,
  onSnapshot,
  onGameOver,
  onClear,
}: GameSceneProps) {
  const playerRef = useRef<PlayerRuntime>({
    x: GAME_CONFIG.playerStartX,
    z: stage.startZ,
    value: 2,
    radius: NUMBER_STYLES[2].radius,
    elapsedTime: 0,
    slowTimer: 0,
    mergePulse: 0,
    shake: 0,
    combo: 0,
    comboTimer: 0,
    maxCombo: 0,
    score: 0,
    wallsDestroyed: 0,
    bonusWallsDestroyed: 0,
    speedBoostTimer: 0,
    speedMultiplier: 1,
    destroyPowerTimer: 0,
    currentSpeed: GAME_CONFIG.baseForwardSpeed,
    isBonus: false,
  })
  const playerRootRef = useRef<Group>(null)
  const playerSphereRef = useRef<Group>(null)
  const cameraPlayerRef = useRef<{ x: number; z: number }>({ x: GAME_CONFIG.playerStartX, z: stage.startZ })
  const shakeRef = useRef(0)
  const speedRef = useRef<number>(GAME_CONFIG.baseForwardSpeed)
  const [collectedIds, setCollectedIds] = useState<Set<string>>(() => new Set())
  const collectedRef = useRef<Set<string>>(new Set())
  const hiddenWallRef = useRef<Set<string>>(new Set())
  const hiddenBoostRef = useRef<Set<string>>(new Set())
  const hiddenObstacleRef = useRef<Set<string>>(new Set())
  const [hiddenWallIds, setHiddenWallIds] = useState<Set<string>>(() => new Set())
  const [hiddenBoostIds, setHiddenBoostIds] = useState<Set<string>>(() => new Set())
  const [hiddenObstacleIds, setHiddenObstacleIds] = useState<Set<string>>(() => new Set())
  const bumpedBallsRef = useRef<Set<string>>(new Set())
  const bumpedObstaclesRef = useRef<Set<string>>(new Set())
  const [bursts, setBursts] = useState<Burst[]>([])
  const lastHudRef = useRef(0)
  const finishedRef = useRef(false)
  const previousXRef = useRef<number>(GAME_CONFIG.playerStartX)

  const activeStage = useMemo(() => stage, [stage])

  const resetCombo = () => {
    const player = playerRef.current
    player.combo = 0
    player.comboTimer = 0
    player.destroyPowerTimer = 0
  }

  const applyHit = (sourceX: number, force: number) => {
    const player = playerRef.current
    const direction = player.x >= sourceX ? 1 : -1
    player.x += direction * force
    player.slowTimer = GAME_CONFIG.slowDuration
    player.shake = 1
    controlsRef.current.targetX = player.x
    resetCombo()
    playTone('hit', soundEnabled)
    vibrate(18)
  }

  const mergeBall = (ball: StageBall) => {
    const player = playerRef.current
    const mergedValue = nextNumber(player.value)
    player.combo += 1
    player.comboTimer = 2.5
    player.maxCombo = Math.max(player.maxCombo, player.combo)
    player.value = mergedValue
    player.radius = Math.min(NUMBER_STYLES[mergedValue].radius, GAME_CONFIG.maxPlayerRadius)
    player.mergePulse = 1
    player.shake = player.combo >= 2 ? 0.75 : 0.35
    player.score += mergedValue * 10 + player.combo * 50
    if (player.combo >= 4) {
      player.score += player.combo * 150
    }
    if (player.combo >= 5) {
      player.destroyPowerTimer = 2.5
    }
    collectedRef.current.add(ball.id)
    setCollectedIds(new Set(collectedRef.current))
    setBursts((current) => [...current.slice(-3), { id: performance.now(), x: ball.x, z: ball.z, color: NUMBER_STYLES[mergedValue].color }])
    window.setTimeout(() => {
      setBursts((current) => current.filter((burst) => performance.now() - burst.id < 900))
    }, 700)
    playTone('merge', soundEnabled)
    vibrate([12, 24, 12])
  }

  const checkBalls = () => {
    const player = playerRef.current
    for (const ball of activeStage.balls) {
      if (collectedRef.current.has(ball.id)) {
        continue
      }
      if (ball.z < player.z - GAME_CONFIG.collisionLookBehind || ball.z > player.z + GAME_CONFIG.collisionLookAhead) {
        continue
      }
      if (ballDistance(player, ball) > 0) {
        continue
      }
      if (ball.value === player.value) {
        mergeBall(ball)
      } else if (!bumpedBallsRef.current.has(ball.id)) {
        bumpedBallsRef.current.add(ball.id)
        applyHit(ball.x, GAME_CONFIG.wrongBallBounce)
      }
    }
  }

  const checkObstacles = () => {
    const player = playerRef.current
    for (const obstacle of activeStage.obstacles) {
      if (bumpedObstaclesRef.current.has(obstacle.id) || hiddenObstacleRef.current.has(obstacle.id)) {
        continue
      }
      if (
        obstacle.z < player.z - GAME_CONFIG.collisionLookBehind ||
        obstacle.z > player.z + GAME_CONFIG.collisionLookAhead
      ) {
        continue
      }
      if (intersectsCircleRect(player.x, player.z, player.radius, obstacle)) {
        if (player.destroyPowerTimer > 0) {
          hiddenObstacleRef.current.add(obstacle.id)
          setHiddenObstacleIds(new Set(hiddenObstacleRef.current))
          player.score += 300
          player.wallsDestroyed += 1
          player.shake = 0.8
          vibrate(20)
          continue
        }
        bumpedObstaclesRef.current.add(obstacle.id)
        applyHit(obstacle.x, GAME_CONFIG.obstacleBounce)
      }
    }

    for (const obstacle of activeStage.movingObstacles) {
      if (bumpedObstaclesRef.current.has(obstacle.id) || hiddenObstacleRef.current.has(obstacle.id)) {
        continue
      }
      const movingRect = rectForMovingObstacle(obstacle, player.elapsedTime)
      if (movingRect.z < player.z - GAME_CONFIG.collisionLookBehind || movingRect.z > player.z + GAME_CONFIG.collisionLookAhead) {
        continue
      }
      if (intersectsCircleRect(player.x, player.z, player.radius, movingRect)) {
        if (player.destroyPowerTimer > 0) {
          hiddenObstacleRef.current.add(obstacle.id)
          setHiddenObstacleIds(new Set(hiddenObstacleRef.current))
          player.score += 350
          player.wallsDestroyed += 1
          player.shake = 0.9
          vibrate(20)
          continue
        }
        bumpedObstaclesRef.current.add(obstacle.id)
        applyHit(movingRect.x, GAME_CONFIG.obstacleBounce)
      }
    }
  }

  const breakWall = (wall: NumberWall, bonus: boolean) => {
    const player = playerRef.current
    hiddenWallRef.current.add(wall.id)
    setHiddenWallIds(new Set(hiddenWallRef.current))
    player.score += wall.value * (bonus ? 60 : 35)
    if (bonus) {
      player.bonusWallsDestroyed += 1
    } else {
      player.wallsDestroyed += 1
    }
    player.shake = bonus ? 1 : 0.85
    setBursts((current) => [...current.slice(-4), { id: performance.now(), x: wall.x, z: wall.z, color: NUMBER_STYLES[wall.value].color }])
    playTone('hit', soundEnabled)
    vibrate(24)
  }

  const failWall = (wall: NumberWall) => {
    const player = playerRef.current
    player.value = previousNumber(player.value)
    player.radius = Math.min(NUMBER_STYLES[player.value].radius, GAME_CONFIG.maxPlayerRadius)
    applyHit(wall.x, GAME_CONFIG.obstacleBounce)
  }

  const checkWalls = () => {
    const player = playerRef.current
    const walls = player.isBonus ? activeStage.bonusWalls : activeStage.walls
    for (const wall of walls) {
      if (hiddenWallRef.current.has(wall.id)) {
        continue
      }
      if (wall.z < player.z - GAME_CONFIG.collisionLookBehind || wall.z > player.z + GAME_CONFIG.collisionLookAhead) {
        continue
      }
      if (!intersectsCircleRect(player.x, player.z, player.radius, { x: wall.x, z: wall.z, width: wall.width, depth: 0.7 })) {
        continue
      }
      if (player.value >= wall.value) {
        breakWall(wall, player.isBonus)
      } else if (player.isBonus) {
        finishedRef.current = true
        player.score += player.value * 100
        onClear(getSnapshot(player, activeStage))
      } else {
        failWall(wall)
      }
      return
    }
  }

  const checkSpeedBoosts = () => {
    const player = playerRef.current
    for (const boost of activeStage.speedBoosts) {
      if (hiddenBoostRef.current.has(boost.id)) {
        continue
      }
      if (boost.z < player.z - GAME_CONFIG.collisionLookBehind || boost.z > player.z + GAME_CONFIG.collisionLookAhead) {
        continue
      }
      if (circleHit(player.x, player.z, player.radius, boost)) {
        hiddenBoostRef.current.add(boost.id)
        setHiddenBoostIds(new Set(hiddenBoostRef.current))
        player.speedBoostTimer = boost.duration
        player.speedMultiplier = boost.multiplier
        player.score += 150
        player.shake = 0.35
        vibrate(10)
      }
    }
  }

  const isInGap = (gap: StageGap) => intersectsCircleRect(playerRef.current.x, playerRef.current.z, playerRef.current.radius * 0.78, gap)

  useFrame((_, delta) => {
    const player = playerRef.current
    if (finishedRef.current) {
      return
    }

    player.mergePulse = Math.max(0, player.mergePulse - delta * 2.8)
    player.shake = Math.max(0, player.shake - delta * 3.5)
    player.comboTimer = Math.max(0, player.comboTimer - delta)
    player.speedBoostTimer = Math.max(0, player.speedBoostTimer - delta)
    player.destroyPowerTimer = Math.max(0, player.destroyPowerTimer - delta)
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
      previousXRef.current = player.x
      return
    }

    player.elapsedTime += delta
    player.slowTimer = Math.max(0, player.slowTimer - delta)

    const controls = controlsRef.current
    if (player.isBonus) {
      controls.targetX = 0
    } else {
      controls.targetX += controls.keyboardAxis * GAME_CONFIG.keyboardSpeed * delta
      controls.targetX = clampToTrack(activeStage.track, player.z, controls.targetX, player.radius + GAME_CONFIG.trackEdgePadding)
    }

    const lateralT = Math.min(delta * GAME_CONFIG.lateralFollow, 1)
    player.x += (controls.targetX - player.x) * lateralT
    const comboMultiplier = player.combo >= 3 ? 1.2 : 1
    const boostMultiplier = player.speedBoostTimer > 0 ? player.speedMultiplier : 1
    const targetSpeed = player.slowTimer > 0 ? GAME_CONFIG.slowForwardSpeed : GAME_CONFIG.baseForwardSpeed * comboMultiplier * boostMultiplier
    player.currentSpeed += (targetSpeed - player.currentSpeed) * Math.min(delta * 4, 1)
    speedRef.current = player.currentSpeed
    player.z += player.currentSpeed * delta

    if (!player.isBonus && player.z >= activeStage.goalZ) {
      player.isBonus = true
      player.x = 0
      controls.targetX = 0
      player.score += player.value * 250 + Math.max(0, 90 - player.elapsedTime) * 10
      player.shake = 0.8
      playTone('clear', soundEnabled)
      vibrate([20, 35, 20])
    }

    const trackInfo = getTrackInfoAtZ(activeStage.track, player.z)
    const edgeAllowance = player.radius * 0.35
    if (!player.isBonus && (!trackInfo || player.x < trackInfo.left + edgeAllowance || player.x > trackInfo.right - edgeAllowance)) {
      finishedRef.current = true
      playTone('gameOver', soundEnabled)
      vibrate(60)
      onGameOver(getSnapshot(player, activeStage))
      return
    }

    if (!player.isBonus && activeStage.gaps.some(isInGap)) {
      finishedRef.current = true
      playTone('gameOver', soundEnabled)
      vibrate(60)
      onGameOver(getSnapshot(player, activeStage))
      return
    }

    checkBalls()
    checkObstacles()
    checkWalls()
    if (finishedRef.current) {
      return
    }
    checkSpeedBoosts()

    if (player.isBonus && activeStage.bonusWalls.every((wall) => hiddenWallRef.current.has(wall.id))) {
      finishedRef.current = true
      player.score += 2048 * 50
      onClear(getSnapshot(player, activeStage))
      return
    }

    cameraPlayerRef.current.x = player.x
    cameraPlayerRef.current.z = player.z

    if (playerRootRef.current) {
      playerRootRef.current.position.set(player.x, 0, player.z)
    }

    if (playerSphereRef.current) {
      const rollDistance = (player.slowTimer > 0 ? GAME_CONFIG.slowForwardSpeed : GAME_CONFIG.baseForwardSpeed) * delta
      const lateralDistance = player.x - previousXRef.current
      playerSphereRef.current.rotation.x -= rollDistance / Math.max(player.radius, 0.1)
      playerSphereRef.current.rotation.y += rollDistance / Math.max(player.radius * 1.8, 0.1)
      playerSphereRef.current.rotation.z -= lateralDistance / Math.max(player.radius, 0.1)
    }
    previousXRef.current = player.x

    lastHudRef.current += delta
    if (lastHudRef.current > 0.08) {
      lastHudRef.current = 0
      onSnapshot(getSnapshot(player, activeStage))
    }
  })

  return (
    <>
      <fog attach="fog" args={['#aee8ff', 42, 130]} />
      <hemisphereLight args={['#ffffff', '#9ad8b5', 1.1]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-4, 8, -3]} intensity={1.8} />
      <Course
        stage={activeStage}
        collectedIds={collectedIds}
        hiddenObstacleIds={hiddenObstacleIds}
        hiddenWallIds={hiddenWallIds}
        hiddenBoostIds={hiddenBoostIds}
      />
      <GoalGate z={activeStage.goalZ} />
      <PlayerBall
        ref={playerRootRef}
        sphereRef={playerSphereRef}
        value={playerRef.current.value}
      />
      {bursts.map((burst) => (
        <MergeBurst key={burst.id} burst={burst} />
      ))}
      <FollowCamera playerRef={cameraPlayerRef} shakeRef={shakeRef} speedRef={speedRef} />
    </>
  )
}

export function GameScene(props: GameSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor('#aee8ff', 0)
        camera.lookAt(0, 1, 6)
      }}
      camera={{ position: [0, 7, -9], fov: GAME_CONFIG.camera.portraitFov, near: 0.1, far: 150 }}
    >
      <GameLoop {...props} />
    </Canvas>
  )
}
