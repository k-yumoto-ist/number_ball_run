import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { Group } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'
import { NUMBER_STYLES, nextNumber } from '../../config/numberConfig'
import type { InputControls } from '../../hooks/useInputControls'
import type { BallNumber, GamePhase, PlayerSnapshot, StageBall, StageData, StageGap } from '../../types/game'
import { playTone, vibrate } from '../../utils/feedback'
import { clampToTrack, getTrackInfoAtZ } from '../../utils/track'
import { Course } from './Course'
import { FollowCamera } from './FollowCamera'
import { GoalGate } from './GoalGate'
import { type Burst, MergeBurst } from './MergeBurst'
import { PlayerBall } from './PlayerBall'

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
  }
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
  })
  const playerRootRef = useRef<Group>(null)
  const playerSphereRef = useRef<Group>(null)
  const cameraPlayerRef = useRef<{ x: number; z: number }>({ x: GAME_CONFIG.playerStartX, z: stage.startZ })
  const shakeRef = useRef(0)
  const [collectedIds, setCollectedIds] = useState<Set<string>>(() => new Set())
  const collectedRef = useRef<Set<string>>(new Set())
  const bumpedBallsRef = useRef<Set<string>>(new Set())
  const bumpedObstaclesRef = useRef<Set<string>>(new Set())
  const [bursts, setBursts] = useState<Burst[]>([])
  const lastHudRef = useRef(0)
  const finishedRef = useRef(false)
  const previousXRef = useRef<number>(GAME_CONFIG.playerStartX)

  const activeStage = useMemo(() => stage, [stage])

  const applyHit = (sourceX: number, force: number) => {
    const player = playerRef.current
    const direction = player.x >= sourceX ? 1 : -1
    player.x += direction * force
    player.slowTimer = GAME_CONFIG.slowDuration
    player.shake = 1
    controlsRef.current.targetX = player.x
    playTone('hit', soundEnabled)
    vibrate(18)
  }

  const mergeBall = (ball: StageBall) => {
    const player = playerRef.current
    const mergedValue = nextNumber(player.value)
    player.value = mergedValue
    player.radius = Math.min(NUMBER_STYLES[mergedValue].radius, GAME_CONFIG.maxPlayerRadius)
    player.mergePulse = 1
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
      if (bumpedObstaclesRef.current.has(obstacle.id)) {
        continue
      }
      if (
        obstacle.z < player.z - GAME_CONFIG.collisionLookBehind ||
        obstacle.z > player.z + GAME_CONFIG.collisionLookAhead
      ) {
        continue
      }
      if (intersectsCircleRect(player.x, player.z, player.radius, obstacle)) {
        bumpedObstaclesRef.current.add(obstacle.id)
        applyHit(obstacle.x, GAME_CONFIG.obstacleBounce)
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
    controls.targetX += controls.keyboardAxis * GAME_CONFIG.keyboardSpeed * delta
    controls.targetX = clampToTrack(activeStage.track, player.z, controls.targetX, player.radius + GAME_CONFIG.trackEdgePadding)

    const lateralT = Math.min(delta * GAME_CONFIG.lateralFollow, 1)
    player.x += (controls.targetX - player.x) * lateralT
    player.z += (player.slowTimer > 0 ? GAME_CONFIG.slowForwardSpeed : GAME_CONFIG.baseForwardSpeed) * delta

    const trackInfo = getTrackInfoAtZ(activeStage.track, player.z)
    const edgeAllowance = player.radius * 0.35
    if (!trackInfo || player.x < trackInfo.left + edgeAllowance || player.x > trackInfo.right - edgeAllowance) {
      finishedRef.current = true
      playTone('gameOver', soundEnabled)
      vibrate(60)
      onGameOver(getSnapshot(player, activeStage))
      return
    }

    if (activeStage.gaps.some(isInGap)) {
      finishedRef.current = true
      playTone('gameOver', soundEnabled)
      vibrate(60)
      onGameOver(getSnapshot(player, activeStage))
      return
    }

    checkBalls()
    checkObstacles()

    if (player.z >= activeStage.goalZ) {
      finishedRef.current = true
      playTone('clear', soundEnabled)
      vibrate([20, 35, 20])
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
      <fog attach="fog" args={['#aee8ff', 28, 95]} />
      <hemisphereLight args={['#ffffff', '#9ad8b5', 1.1]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[-4, 8, -3]} intensity={1.8} />
      <Course stage={activeStage} collectedIds={collectedIds} />
      <GoalGate z={activeStage.goalZ} />
      <PlayerBall
        ref={playerRootRef}
        sphereRef={playerSphereRef}
        value={playerRef.current.value}
      />
      {bursts.map((burst) => (
        <MergeBurst key={burst.id} burst={burst} />
      ))}
      <FollowCamera playerRef={cameraPlayerRef} shakeRef={shakeRef} />
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
