import { Billboard, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'
import { KIDS_ENDLESS_CONFIG, LANE_X } from '../../config/kidsEndlessConfig'
import { NUMBER_STYLES, nextNumber, NUMBER_ORDER } from '../../config/numberConfig'
import type { InputControls } from '../../hooks/useInputControls'
import { useInputControls } from '../../hooks/useInputControls'
import type { BallNumber, EndlessBestRecords, EndlessPhase, EndlessSnapshot } from '../../types/game'
import { playTone, vibrate } from '../../utils/feedback'
import { saveEndlessHelpSeen, incrementEndlessPlayCount, saveEndlessResult } from '../../utils/storage'
import { SeededRandom, createRunSeed } from '../../game/SeededRandom'
import { FollowCamera } from './FollowCamera'
import { type Burst, MergeBurst } from './MergeBurst'
import { PlayerBall } from './PlayerBall'
import { EndlessHud } from '../ui/EndlessHud'
import { EndlessResultScreen } from '../ui/EndlessResultScreen'

type LaneIndex = 0 | 1 | 2
type NumberMode = 'same' | 'smaller' | 'larger'
type ItemType = 'shield' | 'magnet' | 'slow' | 'rainbow' | 'giant'
type ObstacleType = 'block' | 'movingBlock' | 'gate' | 'rotatingBar'
type EventType = 'mergeRush' | 'starRush' | 'giantRush' | 'heartChance'
type ThemeId = 'sky' | 'candy' | 'sea' | 'space'

type LaneContent =
  | { type: 'empty' }
  | { type: 'star'; count?: number }
  | { type: 'numberBall'; valueMode: NumberMode }
  | { type: 'obstacle'; obstacleType: ObstacleType }
  | { type: 'item'; itemType: ItemType }
  | { type: 'heart' }

type RowPattern = {
  id: string
  minimumDifficulty: number
  maximumDifficulty?: number
  weight: number
  tags: string[]
  lanes: [LaneContent, LaneContent, LaneContent]
}

type GeneratedRow = {
  id: string
  patternId: string
  z: number
  difficulty: number
  eventType?: EventType
  lanes: [LaneContent, LaneContent, LaneContent]
}

type PlayerRuntime = {
  x: number
  z: number
  lane: LaneIndex
  value: BallNumber
  highestNumber: BallNumber
  radius: number
  hearts: number
  stars: number
  score: number
  merges: number
  deflects: number
  obstaclesBroken: number
  evolutionCount: number
  elapsedTime: number
  currentSpeed: number
  slowTimer: number
  invincibleTimer: number
  mergePulse: number
  shake: number
  shield: boolean
  magnetTimer: number
  slowItemTimer: number
  rainbow: boolean
  giantTimer: number
  lastMergeZ: number
  lastDamageZ: number
}

const LANES = [LANE_X.left, LANE_X.center, LANE_X.right] as const
const EMPTY: LaneContent = { type: 'empty' }

const ROW_PATTERNS: RowPattern[] = [
  { id: 'simple-star-left', minimumDifficulty: 1, weight: 8, tags: ['safe', 'star'], lanes: [{ type: 'star', count: 1 }, EMPTY, { type: 'obstacle', obstacleType: 'block' }] },
  { id: 'simple-star-right', minimumDifficulty: 1, weight: 8, tags: ['safe', 'star'], lanes: [{ type: 'obstacle', obstacleType: 'block' }, EMPTY, { type: 'star', count: 1 }] },
  { id: 'center-merge-choice', minimumDifficulty: 1, weight: 7, tags: ['merge'], lanes: [{ type: 'star', count: 3 }, { type: 'numberBall', valueMode: 'same' }, EMPTY] },
  { id: 'side-merge-choice', minimumDifficulty: 1, weight: 7, tags: ['merge'], lanes: [{ type: 'numberBall', valueMode: 'same' }, { type: 'obstacle', obstacleType: 'block' }, { type: 'star', count: 3 }] },
  { id: 'small-number-free', minimumDifficulty: 1, weight: 7, tags: ['number'], lanes: [{ type: 'numberBall', valueMode: 'smaller' }, EMPTY, { type: 'star', count: 1 }] },
  { id: 'big-number-warning', minimumDifficulty: 1, weight: 5, tags: ['danger'], lanes: [{ type: 'star', count: 1 }, { type: 'numberBall', valueMode: 'larger' }, EMPTY] },
  { id: 'two-blocks-safe-left', minimumDifficulty: 2, weight: 6, tags: ['obstacle'], lanes: [EMPTY, { type: 'obstacle', obstacleType: 'block' }, { type: 'obstacle', obstacleType: 'block' }] },
  { id: 'two-blocks-safe-right', minimumDifficulty: 2, weight: 6, tags: ['obstacle'], lanes: [{ type: 'obstacle', obstacleType: 'block' }, { type: 'obstacle', obstacleType: 'block' }, EMPTY] },
  { id: 'moving-block-row', minimumDifficulty: 2, weight: 5, tags: ['moving'], lanes: [{ type: 'star', count: 1 }, { type: 'obstacle', obstacleType: 'movingBlock' }, EMPTY] },
  { id: 'item-safe', minimumDifficulty: 1, weight: 5, tags: ['item'], lanes: [EMPTY, { type: 'item', itemType: 'shield' }, { type: 'star', count: 1 }] },
  { id: 'magnet-choice', minimumDifficulty: 2, weight: 4, tags: ['item', 'star'], lanes: [{ type: 'item', itemType: 'magnet' }, { type: 'obstacle', obstacleType: 'block' }, { type: 'star', count: 3 }] },
  { id: 'slow-choice', minimumDifficulty: 2, weight: 4, tags: ['item'], lanes: [{ type: 'star', count: 1 }, { type: 'item', itemType: 'slow' }, EMPTY] },
  { id: 'rainbow-choice', minimumDifficulty: 2, weight: 3, tags: ['item', 'number'], lanes: [{ type: 'numberBall', valueMode: 'larger' }, EMPTY, { type: 'item', itemType: 'rainbow' }] },
  { id: 'giant-choice', minimumDifficulty: 3, weight: 3, tags: ['item'], lanes: [{ type: 'item', itemType: 'giant' }, { type: 'obstacle', obstacleType: 'block' }, EMPTY] },
  { id: 'heart-chance-row', minimumDifficulty: 1, weight: 2, tags: ['heart'], lanes: [{ type: 'heart' }, EMPTY, { type: 'star', count: 1 }] },
  { id: 'gate-row', minimumDifficulty: 3, weight: 4, tags: ['gate'], lanes: [{ type: 'star', count: 1 }, { type: 'obstacle', obstacleType: 'gate' }, EMPTY] },
  { id: 'rotating-row', minimumDifficulty: 4, weight: 3, tags: ['rotating'], lanes: [EMPTY, { type: 'obstacle', obstacleType: 'rotatingBar' }, { type: 'star', count: 3 }] },
]

const THEMES: { id: ThemeId; name: string; start: number; sky: string; fog: string; track: string; lane: string; ground: string; obstacle: string }[] = [
  { id: 'sky', name: '空の道', start: 0, sky: '#aee8ff', fog: '#aee8ff', track: '#80e0a1', lane: '#e9fff0', ground: '#b8efd4', obstacle: '#30415f' },
  { id: 'candy', name: 'お菓子の国', start: 500, sky: '#ffd6ec', fog: '#ffd6ec', track: '#ffc766', lane: '#fff1b5', ground: '#ffe7f3', obstacle: '#9b4f96' },
  { id: 'sea', name: '海の世界', start: 1000, sky: '#8ee7ff', fog: '#8ee7ff', track: '#54d2c7', lane: '#c7fff8', ground: '#9de7ff', obstacle: '#226a8a' },
  { id: 'space', name: '宇宙', start: 1500, sky: '#1b2555', fog: '#1b2555', track: '#5f6cff', lane: '#d7dcff', ground: '#10183d', obstacle: '#ffcf5d' },
]
const INITIAL_SNAPSHOT: EndlessSnapshot = {
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
  hearts: KIDS_ENDLESS_CONFIG.initialHearts,
  stars: 0,
  merges: 0,
  highestNumber: 2,
  activeItems: [],
}

type EndlessGameProps = {
  records: EndlessBestRecords
  soundEnabled: boolean
  onRecordsChange: (records: EndlessBestRecords) => void
  onHome: () => void
}

function getDifficulty(distance: number) {
  if (distance < 300) return 1
  if (distance < 700) return 2
  if (distance < 1200) return 3
  if (distance < 2000) return 4
  return 5 + Math.floor((distance - 2000) / 700)
}

function getTheme(distance: number) {
  const cycleDistance = distance < 2000 ? distance : 500 + ((distance - 2000) % 1500)
  return [...THEMES].reverse().find((theme) => cycleDistance >= theme.start) ?? THEMES[0]
}

function smallerNumber(value: BallNumber) {
  return NUMBER_ORDER[Math.max(NUMBER_ORDER.indexOf(value) - 1, 0)]
}

function largerNumber(value: BallNumber) {
  return NUMBER_ORDER[Math.min(NUMBER_ORDER.indexOf(value) + 1, NUMBER_ORDER.length - 1)]
}

function resolveNumber(value: BallNumber, mode: NumberMode) {
  if (mode === 'same') return value
  if (mode === 'smaller') return smallerNumber(value)
  return largerNumber(value)
}

function circleHit(a: { x: number; z: number; radius: number }, b: { x: number; z: number; radius: number }) {
  const dx = a.x - b.x
  const dz = a.z - b.z
  const radius = a.radius + b.radius
  return dx * dx + dz * dz < radius * radius
}

function activeItemLabels(player: PlayerRuntime) {
  const labels: string[] = []
  if (player.magnetTimer > 0) labels.push('磁石')
  if (player.slowItemTimer > 0) labels.push('スロー')
  if (player.rainbow) labels.push('虹')
  if (player.giantTimer > 0) labels.push('巨大')
  return labels
}

function makeSnapshot(player: PlayerRuntime, seed: number, rowCount: number): EndlessSnapshot {
  const distanceScore = Math.floor(Math.max(0, player.z) * 2)
  const evolutionBonus = 1 + player.evolutionCount * 0.2
  return {
    value: player.value,
    distance: Math.max(0, player.z),
    checkpointProgress: 0,
    combo: 0,
    maxCombo: 0,
    score: Math.floor((player.score + distanceScore) * evolutionBonus),
    wallsDestroyed: player.obstaclesBroken,
    shields: player.shield ? 1 : 0,
    evolutionRank: player.evolutionCount + 1,
    evolutionCount: player.evolutionCount,
    difficultyLevel: getDifficulty(player.z),
    seed,
    generatedChunks: rowCount,
    upgrades: {},
    hearts: player.hearts,
    stars: player.stars,
    merges: player.merges,
    highestNumber: player.highestNumber,
    activeItems: activeItemLabels(player),
  }
}

function isSafe(content: LaneContent) {
  return content.type !== 'obstacle' && !(content.type === 'numberBall' && content.valueMode === 'larger')
}

function hasSafeLane(pattern: RowPattern) {
  return pattern.lanes.some(isSafe)
}

function chooseItem(rng: SeededRandom, hearts: number, lastItem: ItemType | null): ItemType {
  const items: ItemType[] = hearts <= 1 ? ['shield', 'magnet', 'slow', 'rainbow', 'giant'] : ['shield', 'magnet', 'slow', 'rainbow', 'giant']
  const picked = rng.pick(items.filter((item) => item !== lastItem))
  return picked ?? 'shield'
}

function chooseEvent(rng: SeededRandom, player: PlayerRuntime, lastEvent: EventType | null): EventType {
  const events: EventType[] = player.hearts <= 1 ? ['heartChance', 'starRush', 'mergeRush', 'giantRush'] : ['mergeRush', 'starRush', 'giantRush', 'heartChance']
  return rng.pick(events.filter((event) => event !== lastEvent)) ?? 'starRush'
}

function buildEventRows(eventType: EventType, startZ: number, rng: SeededRandom): GeneratedRow[] {
  const rows: GeneratedRow[] = []
  const push = (index: number, lanes: [LaneContent, LaneContent, LaneContent]) => {
    rows.push({ id: `event-${eventType}-${startZ}-${index}`, patternId: eventType, z: startZ + index * KIDS_ENDLESS_CONFIG.rowSpacing, difficulty: 1, eventType, lanes })
  }
  if (eventType === 'mergeRush') {
    for (let i = 0; i < 5; i += 1) {
      const lane = rng.integer(0, 2) as LaneIndex
      const lanes: [LaneContent, LaneContent, LaneContent] = [EMPTY, EMPTY, EMPTY]
      lanes[lane] = { type: 'numberBall', valueMode: 'same' }
      push(i, lanes)
    }
    return rows
  }
  if (eventType === 'starRush') {
    for (let i = 0; i < 6; i += 1) {
      const lane = (i % 3) as LaneIndex
      const lanes: [LaneContent, LaneContent, LaneContent] = [EMPTY, EMPTY, EMPTY]
      lanes[lane] = { type: 'star', count: 3 }
      if (i === 3) lanes[(lane + 1) % 3 as LaneIndex] = { type: 'obstacle', obstacleType: 'block' }
      push(i, lanes)
    }
    return rows
  }
  if (eventType === 'giantRush') {
    push(0, [{ type: 'item', itemType: 'giant' }, EMPTY, { type: 'star', count: 1 }])
    for (let i = 1; i < 6; i += 1) {
      const safeLane = rng.integer(0, 2) as LaneIndex
      const lanes: [LaneContent, LaneContent, LaneContent] = [{ type: 'obstacle', obstacleType: 'block' }, { type: 'obstacle', obstacleType: 'block' }, { type: 'obstacle', obstacleType: 'block' }]
      lanes[safeLane] = { type: 'star', count: 1 }
      push(i, lanes)
    }
    return rows
  }
  push(0, [EMPTY, { type: 'heart' }, EMPTY])
  push(1, [{ type: 'star', count: 3 }, EMPTY, { type: 'item', itemType: 'shield' }])
  push(2, [EMPTY, { type: 'star', count: 3 }, EMPTY])
  return rows
}

function StarObject({ x, z, count, hidden }: { x: number; z: number; count: number; hidden: boolean }) {
  if (hidden) return null
  return (
    <group>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[x, 0.86, z + (index - (count - 1) / 2) * 0.95]} rotation={[0.7, 0.2, 0.4]}>
          <octahedronGeometry args={[0.34, 0]} />
          <meshBasicMaterial color="#ffd84d" />
        </mesh>
      ))}
    </group>
  )
}
function ItemObject({ type, x, z, hidden }: { type: ItemType | 'heart'; x: number; z: number; hidden: boolean }) {
  if (hidden) return null
  const color = type === 'shield' ? '#65b7ff' : type === 'magnet' ? '#ff5f7a' : type === 'slow' ? '#9c8cff' : type === 'rainbow' ? '#ffe45d' : type === 'giant' ? '#58e38b' : '#ff5f7a'
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.72, 0]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} />
      </mesh>
      {type === 'heart' && (
        <mesh position={[0, 0.72, -0.42]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.34, 0.34, 0.08]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
      {type === 'rainbow' && (
        <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.035, 6, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  )
}
function NumberObject({ value, x, z, hidden }: { value: BallNumber; x: number; z: number; hidden: boolean }) {
  if (hidden) return null
  const style = NUMBER_STYLES[value]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, GAME_CONFIG.courseSurfaceY + style.radius, 0]}>
        <sphereGeometry args={[style.radius, 18, 14]} />
        <meshStandardMaterial color={style.color} emissive={style.emissive} emissiveIntensity={style.glow} />
      </mesh>
      <Billboard follow position={[0, GAME_CONFIG.courseSurfaceY + style.radius, -(style.radius + 0.08)]} renderOrder={20}>
        <Text color={style.textColor} fontSize={style.radius * (value >= 1024 ? 0.44 : 0.54)} fontWeight={900} outlineWidth={0.03} outlineColor={style.textColor === '#ffffff' ? '#172033' : '#ffffff'} material-depthTest={false}>
          {value}
        </Text>
      </Billboard>
    </group>
  )
}

function ObstacleObject({ type, x, z, hidden, theme }: { type: ObstacleType; x: number; z: number; hidden: boolean; theme: (typeof THEMES)[number] }) {
  if (hidden) return null
  if (type === 'gate') {
    return (
      <group position={[x, 0, z]}>
        <mesh position={[-0.36, 0.8, 0]}>
          <boxGeometry args={[0.28, 1.6, 0.45]} />
          <meshStandardMaterial color={theme.obstacle} />
        </mesh>
        <mesh position={[0.36, 0.8, 0]}>
          <boxGeometry args={[0.28, 1.6, 0.45]} />
          <meshStandardMaterial color={theme.obstacle} />
        </mesh>
      </group>
    )
  }
  if (type === 'rotatingBar') {
    return (
      <group position={[x, 0.65, z]} rotation={[0, 0, Math.PI / 9]}>
        <mesh>
          <boxGeometry args={[1.65, 0.24, 0.42]} />
          <meshStandardMaterial color={theme.obstacle} />
        </mesh>
      </group>
    )
  }
  return (
    <mesh position={[x, 0.65, z]}>
      <boxGeometry args={[1.15, 1.3, 1.05]} />
      <meshStandardMaterial color={theme.obstacle} roughness={0.55} />
    </mesh>
  )
}

function LaneCourse({ rows, theme }: { rows: GeneratedRow[]; theme: (typeof THEMES)[number] }) {
  const startZ = Math.max(-20, (rows[0]?.z ?? 0) - 20)
  const endZ = rows.at(-1)?.z ?? 160
  const length = endZ - startZ + 80
  return (
    <>
      <mesh position={[0, -0.08, startZ + length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[90, length + 50]} />
        <meshStandardMaterial color={theme.ground} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, startZ + length / 2]}>
        <boxGeometry args={[6.6, 0.18, length]} />
        <meshStandardMaterial color={theme.track} roughness={0.74} />
      </mesh>
      {LANES.map((x) => (
        <mesh key={x} position={[x, 0.105, startZ + length / 2]}>
          <boxGeometry args={[0.06, 0.025, length]} />
          <meshBasicMaterial color={theme.lane} transparent opacity={0.58} />
        </mesh>
      ))}
    </>
  )
}

function RowObjects({ rows, hiddenIds, playerValue, theme }: { rows: GeneratedRow[]; hiddenIds: Set<string>; playerValue: BallNumber; theme: (typeof THEMES)[number] }) {
  return (
    <>
      {rows.map((row) => row.lanes.map((content, laneIndex) => {
        const x = LANES[laneIndex]
        const id = `${row.id}-${laneIndex}`
        if (content.type === 'star') return <StarObject key={id} x={x} z={row.z} count={content.count ?? 1} hidden={hiddenIds.has(id)} />
        if (content.type === 'item') return <ItemObject key={id} type={content.itemType} x={x} z={row.z} hidden={hiddenIds.has(id)} />
        if (content.type === 'heart') return <ItemObject key={id} type="heart" x={x} z={row.z} hidden={hiddenIds.has(id)} />
        if (content.type === 'numberBall') return <NumberObject key={id} value={resolveNumber(playerValue, content.valueMode)} x={x} z={row.z} hidden={hiddenIds.has(id)} />
        if (content.type === 'obstacle') return <ObstacleObject key={id} type={content.obstacleType} x={x} z={row.z} hidden={hiddenIds.has(id)} theme={theme} />
        return null
      }))}
    </>
  )
}

function KidsLoop({
  phase,
  controlsRef,
  seed,
  soundEnabled,
  onSnapshot,
  onGameOver,
}: {
  phase: EndlessPhase
  controlsRef: React.RefObject<InputControls>
  seed: number
  soundEnabled: boolean
  onSnapshot: (snapshot: EndlessSnapshot) => void
  onGameOver: (snapshot: EndlessSnapshot) => void
}) {
  const rngRef = useRef(new SeededRandom(seed))
  const playerRef = useRef<PlayerRuntime>({
    x: 0,
    z: 0,
    lane: 1,
    value: 2,
    highestNumber: 2,
    radius: NUMBER_STYLES[2].radius,
    hearts: KIDS_ENDLESS_CONFIG.initialHearts,
    stars: 0,
    score: 0,
    merges: 0,
    deflects: 0,
    obstaclesBroken: 0,
    evolutionCount: 0,
    elapsedTime: 0,
    currentSpeed: KIDS_ENDLESS_CONFIG.initialSpeed,
    slowTimer: 0,
    invincibleTimer: 0,
    mergePulse: 0,
    shake: 0,
    shield: false,
    magnetTimer: 0,
    slowItemTimer: 0,
    rainbow: false,
    giantTimer: 0,
    lastMergeZ: -999,
    lastDamageZ: -999,
  })
  const rowsRef = useRef<GeneratedRow[]>([])
  const rowIndexRef = useRef(0)
  const lastPatternRef = useRef<string[]>([])
  const lastMergeRowRef = useRef(-99)
  const nextMergeGapRef = useRef(3)
  const lastItemRowRef = useRef(-99)
  const lastItemRef = useRef<ItemType | null>(null)
  const lastEventRef = useRef<EventType | null>(null)
  const nextEventRowRef = useRef(999)
  const hiddenRef = useRef(new Set<string>())
  const hitRef = useRef(new Set<string>())
  const playerRootRef = useRef<Group>(null)
  const playerSphereRef = useRef<Group>(null)
  const cameraPlayerRef = useRef({ x: 0, z: 0 })
  const shakeRef = useRef(0)
  const speedRef = useRef<number>(KIDS_ENDLESS_CONFIG.initialSpeed)
  const previousXRef = useRef(0)
  const lastHudRef = useRef(0)
  const switchCooldownRef = useRef(0)
  const themeMessageTimerRef = useRef(0)
  const eventMessageTimerRef = useRef(0)
  const currentThemeIdRef = useRef<ThemeId>('sky')
  const finishedRef = useRef(false)
  const [rows, setRows] = useState<GeneratedRow[]>([])
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set())
  const [playerValue, setPlayerValue] = useState<BallNumber>(2)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [theme, setTheme] = useState(() => THEMES[0])
  const [themeMessage, setThemeMessage] = useState('')
  const [eventMessage, setEventMessage] = useState('')

  const addHidden = (id: string) => {
    hiddenRef.current.add(id)
    setHiddenIds(new Set(hiddenRef.current))
  }

  const addStars = (count: number) => {
    const player = playerRef.current
    player.stars += count
    player.score += count * 120
  }

  const applyDamage = (sourceX: number) => {
    const player = playerRef.current
    if (player.invincibleTimer > 0 || player.giantTimer > 0) return
    if (player.shield) {
      player.shield = false
      player.invincibleTimer = 0.8
      player.shake = 0.45
      vibrate(12)
      return
    }
    player.hearts -= 1
    player.lastDamageZ = player.z
    player.invincibleTimer = KIDS_ENDLESS_CONFIG.damageInvincibleSeconds
    player.slowTimer = KIDS_ENDLESS_CONFIG.damageSlowSeconds
    player.x += (player.x >= sourceX ? 1 : -1) * 0.6
    player.shake = 0.9
    playTone('hit', soundEnabled)
    vibrate(30)
    if (player.hearts <= 0) {
      finishedRef.current = true
      onGameOver(makeSnapshot(player, seed, rowIndexRef.current))
    }
  }

  const recoverFromFall = () => {
    const player = playerRef.current
    if (player.invincibleTimer > 0) return
    player.hearts -= 1
    player.lane = 1
    player.x = 0
    controlsRef.current.targetX = 0
    player.invincibleTimer = KIDS_ENDLESS_CONFIG.fallInvincibleSeconds
    player.shake = 0.8
    if (player.hearts <= 0) {
      finishedRef.current = true
      onGameOver(makeSnapshot(player, seed, rowIndexRef.current))
    }
  }

  const mergeNumber = (id: string, x: number, z: number) => {
    const player = playerRef.current
    const next = nextNumber(player.value)
    player.value = next
    player.highestNumber = Math.max(player.highestNumber, next) as BallNumber
    player.radius = Math.min(NUMBER_STYLES[next].radius, GAME_CONFIG.maxPlayerRadius)
    player.merges += 1
    player.score += 500 + next * 8
    player.mergePulse = 1
    player.shake = 0.45
    player.lastMergeZ = player.z
    setPlayerValue(next)
    addHidden(id)
    setBursts((current) => [...current.slice(-4), { id: performance.now(), x, z, color: NUMBER_STYLES[next].color }])
    if (next === 2048) {
      player.evolutionCount += 1
      player.value = 2
      player.radius = NUMBER_STYLES[2].radius
      player.invincibleTimer = 2
      setPlayerValue(2)
      player.score += 4000
      setThemeMessage('進化！')
      themeMessageTimerRef.current = 1.1
    }
    playTone('merge', soundEnabled)
    vibrate([12, 24, 12])
  }

  const collectItem = (content: LaneContent, id: string) => {
    const player = playerRef.current
    if (content.type === 'heart') {
      if (player.hearts < KIDS_ENDLESS_CONFIG.maximumHearts) player.hearts += 1
      else addStars(5)
      addHidden(id)
      return
    }
    if (content.type !== 'item') return
    if (content.itemType === 'shield') {
      if (player.shield) addStars(4)
      player.shield = true
    } else if (content.itemType === 'magnet') {
      player.magnetTimer = KIDS_ENDLESS_CONFIG.magnetDurationSeconds
    } else if (content.itemType === 'slow') {
      player.slowItemTimer = KIDS_ENDLESS_CONFIG.slowDurationSeconds
    } else if (content.itemType === 'rainbow') {
      player.rainbow = true
    } else {
      player.giantTimer = KIDS_ENDLESS_CONFIG.giantDurationSeconds
    }
    player.score += 180
    addHidden(id)
    vibrate(10)
  }

  const generateRow = () => {
    const player = playerRef.current
    const index = rowIndexRef.current
    const z = index * KIDS_ENDLESS_CONFIG.rowSpacing + 18
    const difficulty = getDifficulty(z)
    if (index === 0) {
      rowIndexRef.current += 1
      return { id: `row-${index}`, patternId: 'start-star', z, difficulty, lanes: [EMPTY, { type: 'star', count: 3 }, EMPTY] as [LaneContent, LaneContent, LaneContent] }
    }

    if (index >= nextEventRowRef.current && z > KIDS_ENDLESS_CONFIG.eventMinimumDistance) {
      const eventType = chooseEvent(rngRef.current, player, lastEventRef.current)
      const eventRows = buildEventRows(eventType, z, rngRef.current)
      lastEventRef.current = eventType
      nextEventRowRef.current = index + rngRef.current.integer(KIDS_ENDLESS_CONFIG.eventMinimumGapRows, KIDS_ENDLESS_CONFIG.eventMaximumGapRows)
      rowIndexRef.current += eventRows.length
      setEventMessage(eventType === 'mergeRush' ? '合体ラッシュ' : eventType === 'starRush' ? 'スターラッシュ' : eventType === 'giantRush' ? '巨大化ラッシュ' : 'ハートチャンス')
      eventMessageTimerRef.current = 1.2
      return eventRows
    }

    const recent = new Set(lastPatternRef.current.slice(-4))
    const shouldMerge = index - lastMergeRowRef.current >= nextMergeGapRef.current && index - Math.floor(player.lastMergeZ / KIDS_ENDLESS_CONFIG.rowSpacing) > KIDS_ENDLESS_CONFIG.mergeCooldownRows
    const candidates = ROW_PATTERNS.filter((pattern) => {
      if (pattern.minimumDifficulty > difficulty) return false
      if (pattern.maximumDifficulty && pattern.maximumDifficulty < difficulty) return false
      if (!hasSafeLane(pattern)) return false
      if (recent.has(pattern.id)) return false
      const hasMerge = pattern.lanes.some((lane) => lane.type === 'numberBall' && lane.valueMode === 'same')
      if (hasMerge && !shouldMerge) return false
      if (!hasMerge && shouldMerge && pattern.tags.includes('merge')) return true
      const hasItem = pattern.lanes.some((lane) => lane.type === 'item')
      if (hasItem && index - lastItemRowRef.current < KIDS_ENDLESS_CONFIG.itemMinimumGapRows) return false
      return true
    })
    const fallback = shouldMerge ? ROW_PATTERNS.find((pattern) => pattern.id === 'center-merge-choice')! : ROW_PATTERNS[0]
    const pattern = candidates.length > 0 ? rngRef.current.weightedPick(candidates, (item) => {
      let weight = item.weight
      if (player.hearts <= 1 && item.tags.includes('heart')) weight *= 4
      if (player.value === 2 && item.tags.includes('merge')) weight *= 1.6
      return weight
    }) : fallback
    let lanes = pattern.lanes.map((lane) => ({ ...lane })) as [LaneContent, LaneContent, LaneContent]
    lanes = lanes.map((lane) => lane.type === 'item' ? { type: 'item', itemType: chooseItem(rngRef.current, player.hearts, lastItemRef.current) } : lane) as [LaneContent, LaneContent, LaneContent]
    if (lanes.some((lane) => lane.type === 'numberBall' && lane.valueMode === 'same')) {
      lastMergeRowRef.current = index
      nextMergeGapRef.current = rngRef.current.integer(KIDS_ENDLESS_CONFIG.minimumMergeRowGap, KIDS_ENDLESS_CONFIG.maximumMergeRowGap)
    }
    const itemLane = lanes.find((lane): lane is { type: 'item'; itemType: ItemType } => lane.type === 'item')
    if (itemLane) {
      lastItemRowRef.current = index
      lastItemRef.current = itemLane.itemType
    }
    lastPatternRef.current.push(pattern.id)
    rowIndexRef.current += 1
    return { id: `row-${index}`, patternId: pattern.id, z, difficulty, lanes }
  }

  const ensureRows = () => {
    const playerZ = playerRef.current.z
    let changed = false
    while (rowsRef.current.length === 0 || (rowsRef.current.at(-1)?.z ?? 0) < playerZ + KIDS_ENDLESS_CONFIG.rowsAhead * KIDS_ENDLESS_CONFIG.rowSpacing) {
      const next = generateRow()
      rowsRef.current.push(...(Array.isArray(next) ? next : [next]))
      changed = true
    }
    const keepFrom = playerZ - KIDS_ENDLESS_CONFIG.rowsBehind * KIDS_ENDLESS_CONFIG.rowSpacing - KIDS_ENDLESS_CONFIG.pruneBehindDistance
    const before = rowsRef.current.length
    rowsRef.current = rowsRef.current.filter((row) => row.z > keepFrom)
    if (before !== rowsRef.current.length) {
      const activeRowIds = new Set(rowsRef.current.map((row) => row.id))
      hiddenRef.current = new Set([...hiddenRef.current].filter((id) => activeRowIds.has(id.slice(0, id.lastIndexOf('-')))))
      hitRef.current = new Set([...hitRef.current].filter((id) => activeRowIds.has(id.slice(0, id.lastIndexOf('-')))))
      setHiddenIds(new Set(hiddenRef.current))
      changed = true
    }
    if (changed) setRows([...rowsRef.current])
  }

  useEffect(() => {
    ensureRows()
  }, [])

  useFrame((_, delta) => {
    const player = playerRef.current
    if (finishedRef.current) return
    player.mergePulse = Math.max(0, player.mergePulse - delta * 2.8)
    player.shake = Math.max(0, player.shake - delta * 3.5)
    player.invincibleTimer = Math.max(0, player.invincibleTimer - delta)
    player.slowTimer = Math.max(0, player.slowTimer - delta)
    player.magnetTimer = Math.max(0, player.magnetTimer - delta)
    player.slowItemTimer = Math.max(0, player.slowItemTimer - delta)
    player.giantTimer = Math.max(0, player.giantTimer - delta)
    switchCooldownRef.current = Math.max(0, switchCooldownRef.current - delta)
    themeMessageTimerRef.current = Math.max(0, themeMessageTimerRef.current - delta)
    eventMessageTimerRef.current = Math.max(0, eventMessageTimerRef.current - delta)
    if (themeMessageTimerRef.current === 0 && themeMessage) setThemeMessage('進化！')
    if (eventMessageTimerRef.current === 0 && eventMessage) setEventMessage('')
    shakeRef.current = player.shake

    const visualScale = (1 + player.mergePulse * 0.16) * (player.giantTimer > 0 ? 1.28 : 1)
    if (playerSphereRef.current) {
      playerSphereRef.current.position.y = GAME_CONFIG.courseSurfaceY + player.radius * visualScale
      playerSphereRef.current.scale.setScalar(visualScale)
    }

    if (phase !== 'playing') {
      if (playerRootRef.current) playerRootRef.current.position.set(player.x, 0, player.z)
      return
    }

    player.elapsedTime += delta
    const controls = controlsRef.current
    if (switchCooldownRef.current === 0) {
      if (controls.targetX > KIDS_ENDLESS_CONFIG.laneSwitchThreshold || controls.keyboardAxis > 0) {
        player.lane = Math.max(0, player.lane - 1) as LaneIndex
        controls.targetX = 0
        switchCooldownRef.current = 0.16
      } else if (controls.targetX < -KIDS_ENDLESS_CONFIG.laneSwitchThreshold || controls.keyboardAxis < 0) {
        player.lane = Math.min(2, player.lane + 1) as LaneIndex
        controls.targetX = 0
        switchCooldownRef.current = 0.16
      }
    }
    player.x += (LANES[player.lane] - player.x) * Math.min(delta * KIDS_ENDLESS_CONFIG.laneFollow, 1)

    const difficulty = getDifficulty(player.z)
    const speedMultiplier = Math.min(1 + (difficulty - 1) * 0.11, KIDS_ENDLESS_CONFIG.maximumSpeedMultiplier)
    const targetSpeed = KIDS_ENDLESS_CONFIG.initialSpeed * speedMultiplier * (player.slowTimer > 0 ? KIDS_ENDLESS_CONFIG.damageSpeedMultiplier : 1) * (player.slowItemTimer > 0 ? 0.72 : 1)
    player.currentSpeed += (targetSpeed - player.currentSpeed) * Math.min(delta * 3.2, 1)
    speedRef.current = player.currentSpeed
    player.z += player.currentSpeed * delta

    if (Math.abs(player.x) > 3.35) recoverFromFall()

    ensureRows()
    const nextTheme = getTheme(player.z)
    if (nextTheme.id !== currentThemeIdRef.current) {
      currentThemeIdRef.current = nextTheme.id
      setTheme(nextTheme)
      setThemeMessage(nextTheme.name)
      themeMessageTimerRef.current = 1.2
    }

    for (const row of rowsRef.current) {
      if (row.z < player.z - 2.4 || row.z > player.z + 2.8) continue
      for (let laneIndex = 0; laneIndex < 3; laneIndex += 1) {
        const content = row.lanes[laneIndex]
        const id = `${row.id}-${laneIndex}`
        if (hiddenRef.current.has(id) || hitRef.current.has(id)) continue
        const x = LANES[laneIndex]
        const baseHit = { x, z: row.z, radius: content.type === 'star' ? (player.magnetTimer > 0 ? 2.3 : 0.55) : 0.78 }
        if (!circleHit({ x: player.x, z: player.z, radius: player.radius * (player.giantTimer > 0 ? 1.2 : 0.86) }, baseHit)) continue
        if (content.type === 'star') {
          addStars(content.count ?? 1)
          addHidden(id)
        } else if (content.type === 'heart' || content.type === 'item') {
          collectItem(content, id)
        } else if (content.type === 'numberBall') {
          const value = resolveNumber(player.value, content.valueMode)
          if (player.giantTimer > 0) {
            player.deflects += 1
            player.score += 150
            addHidden(id)
          } else if (player.rainbow || value === player.value) {
            player.rainbow = false
            mergeNumber(id, x, row.z)
          } else if (value < player.value) {
            player.deflects += 1
            player.score += 180
            addHidden(id)
            setBursts((current) => [...current.slice(-4), { id: performance.now(), x, z: row.z, color: NUMBER_STYLES[value].color }])
          } else {
            hitRef.current.add(id)
            applyDamage(x)
          }
        } else if (content.type === 'obstacle') {
          if (player.giantTimer > 0) {
            player.obstaclesBroken += 1
            player.score += 250
            addHidden(id)
            setBursts((current) => [...current.slice(-4), { id: performance.now(), x, z: row.z, color: theme.obstacle }])
          } else {
            hitRef.current.add(id)
            applyDamage(x)
          }
        }
      }
    }

    cameraPlayerRef.current.x = player.x
    cameraPlayerRef.current.z = player.z
    if (playerRootRef.current) playerRootRef.current.position.set(player.x, 0, player.z)
    if (playerSphereRef.current) {
      const rollDistance = player.currentSpeed * delta
      const lateralDistance = player.x - previousXRef.current
      playerSphereRef.current.rotation.x -= rollDistance / Math.max(player.radius, 0.1)
      playerSphereRef.current.rotation.z -= lateralDistance / Math.max(player.radius, 0.1)
    }
    previousXRef.current = player.x

    lastHudRef.current += delta
    if (lastHudRef.current > KIDS_ENDLESS_CONFIG.hudUpdateSeconds) {
      lastHudRef.current = 0
      onSnapshot(makeSnapshot(player, seed, rowIndexRef.current))
    }
  })

  return (
    <>
      <fog attach="fog" args={[theme.fog, 68, 175]} />
      <hemisphereLight args={['#ffffff', theme.ground, 1.12]} />
      <ambientLight intensity={0.88} />
      <directionalLight position={[-4, 8, -3]} intensity={1.7} />
      <LaneCourse rows={rows} theme={theme} />
      <RowObjects rows={rows} hiddenIds={hiddenIds} playerValue={playerValue} theme={theme} />
      <PlayerBall ref={playerRootRef} sphereRef={playerSphereRef} value={playerValue} />
      {playerRef.current.shield && (
        <mesh position={[playerRef.current.x, GAME_CONFIG.courseSurfaceY + playerRef.current.radius, playerRef.current.z]}>
          <sphereGeometry args={[playerRef.current.radius * 1.32, 24, 14]} />
          <meshBasicMaterial color="#65b7ff" transparent opacity={0.22} />
        </mesh>
      )}
      {playerRef.current.rainbow && (
        <mesh position={[playerRef.current.x, GAME_CONFIG.courseSurfaceY + playerRef.current.radius, playerRef.current.z]}>
          <torusGeometry args={[playerRef.current.radius * 1.15, 0.045, 8, 48]} />
          <meshBasicMaterial color="#ffe45d" transparent opacity={0.78} />
        </mesh>
      )}
      {bursts.map((burst) => <MergeBurst key={burst.id} burst={burst} />)}
      <FollowCamera playerRef={cameraPlayerRef} shakeRef={shakeRef} speedRef={speedRef} />
      {(themeMessage || eventMessage) && (
        <Billboard follow position={[0, 4.2, playerRef.current.z + 13]} renderOrder={30}>
          <Text color="#ffffff" fontSize={0.9} fontWeight={900} outlineWidth={0.045} outlineColor="#172033" material-depthTest={false}>
            {eventMessage || themeMessage}
          </Text>
        </Billboard>
      )}
    </>
  )
}

export function EndlessGame({ records, soundEnabled, onRecordsChange, onHome }: EndlessGameProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<EndlessPhase>('ready')
  const [seed, setSeed] = useState(() => createRunSeed())
  const [runId, setRunId] = useState(0)
  const [snapshot, setSnapshot] = useState<EndlessSnapshot>({ ...INITIAL_SNAPSHOT, seed })
  const [isNewBest, setIsNewBest] = useState(false)

  const markStart = useCallback(() => {
    if (!records.hasSeenEndlessHelp) onRecordsChange(saveEndlessHelpSeen())
    setPhase((current) => (current === 'ready' ? 'playing' : current))
  }, [onRecordsChange, records.hasSeenEndlessHelp])

  const controlsRef = useInputControls(hostRef, phase, markStart)

  const handleGameOver = useCallback((finalSnapshot: EndlessSnapshot) => {
    setSnapshot(finalSnapshot)
    const result = saveEndlessResult(finalSnapshot)
    onRecordsChange(result.records)
    setIsNewBest(result.isNewBest)
    setPhase('gameOver')
  }, [onRecordsChange])

  const retry = useCallback(() => {
    const nextSeed = createRunSeed()
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setSeed(nextSeed)
    setRunId((current) => current + 1)
    setSnapshot({ ...INITIAL_SNAPSHOT, seed: nextSeed })
    setIsNewBest(false)
    onRecordsChange(incrementEndlessPlayCount())
    setPhase('ready')
  }, [controlsRef, onRecordsChange])

  return (
    <section ref={hostRef} className="endless-root" aria-label="エンドレスモード">
      <Canvas
        key={`${runId}-${seed}`}
        dpr={[1, 1.25]}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#aee8ff', 0)
          camera.lookAt(0, 1, 8)
        }}
        camera={{ position: [0, 6.4, -8.2], fov: GAME_CONFIG.camera.portraitFov, near: 0.1, far: 180 }}
      >
        <KidsLoop phase={phase} controlsRef={controlsRef} seed={seed} soundEnabled={soundEnabled} onSnapshot={setSnapshot} onGameOver={handleGameOver} />
      </Canvas>
      <EndlessHud phase={phase} snapshot={snapshot} onPause={() => setPhase('paused')} onResume={() => setPhase('playing')} />
      {phase === 'gameOver' && <EndlessResultScreen snapshot={snapshot} records={records} isNewBest={isNewBest} onRetry={retry} onHome={onHome} />}
    </section>
  )
}
