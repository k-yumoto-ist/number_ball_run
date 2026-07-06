import { ENDLESS_CONFIG } from '../config/endlessConfig'
import { nextNumber, previousNumber } from '../config/numberConfig'
import { COURSE_CHUNKS, SAFE_CHUNK_ID } from '../data/courseChunks'
import type { BallNumber, CourseChunk, GeneratedChunk, StageData, StageGap, StageObstacle, TrackSegment } from '../types/game'
import { SeededRandom } from './SeededRandom'

export type ChunkGeneratorState = {
  nextIndex: number
  nextZ: number
  history: string[]
  generated: GeneratedChunk[]
  stage: StageData
}

export type DirectorState = {
  currentValue: BallNumber
  difficultyLevel: number
  recentDamage: number
  recentCourseOut: boolean
  shieldCount: number
  combo: number
  evolutionJustHappened: boolean
}

const EMPTY_STAGE: StageData = {
  id: 9000,
  name: 'Endless Run',
  length: 120,
  startZ: 0,
  goalZ: 999999,
  track: [],
  balls: [],
  obstacles: [],
  movingObstacles: [],
  gaps: [],
  walls: [],
  speedBoosts: [],
  bonusWalls: [],
}

export function createInitialGeneratorState(): ChunkGeneratorState {
  return {
    nextIndex: 0,
    nextZ: -4,
    history: [],
    generated: [],
    stage: { ...EMPTY_STAGE, track: [], balls: [], obstacles: [], movingObstacles: [], gaps: [], walls: [], speedBoosts: [] },
  }
}

function rarityWeight(chunk: CourseChunk, director: DirectorState) {
  let weight = chunk.weight
  if (director.recentDamage >= 2 && (chunk.tags.includes('safe') || chunk.tags.includes('recovery'))) {
    weight *= 2.4
  }
  if (director.currentValue === 2 && chunk.tags.includes('merge')) {
    weight *= 1.8
  }
  if (director.shieldCount > 0 && chunk.tags.includes('riskReward')) {
    weight *= 1.35
  }
  if (director.combo >= 3 && chunk.tags.includes('combo')) {
    weight *= 1.45
  }
  if (director.evolutionJustHappened && (chunk.tags.includes('safe') || chunk.tags.includes('recovery'))) {
    weight *= 2.2
  }
  if (chunk.tags.includes('narrow')) {
    weight *= Math.min(1 + director.difficultyLevel * 0.06, 1.55)
  }
  if (chunk.tags.includes('riskReward')) {
    weight *= Math.min(1 + director.difficultyLevel * 0.08, 1.7)
  }
  return weight
}

function hasRepeatedTag(candidate: CourseChunk, generated: GeneratedChunk[]) {
  const lastTwo = generated.slice(-2)
  return lastTwo.length === 2 && candidate.tags.some((tag) => lastTwo.every((chunk) => chunk.tags.includes(tag)))
}

function hasTooManyHardChunks(candidate: CourseChunk, generated: GeneratedChunk[]) {
  return candidate.difficulty >= 3 && generated.slice(-2).every((chunk) => chunk.difficulty >= 3)
}

function selectChunk(rng: SeededRandom, state: ChunkGeneratorState, director: DirectorState) {
  const recentIds = new Set(state.history.slice(-ENDLESS_CONFIG.chunkReuseCooldown))
  const candidates = COURSE_CHUNKS.filter((chunk) => {
    if (chunk.minimumLevel > director.difficultyLevel) {
      return false
    }
    if (chunk.maximumLevel && chunk.maximumLevel < director.difficultyLevel) {
      return false
    }
    if (recentIds.has(chunk.id)) {
      return false
    }
    if (state.generated.at(-1)?.chunkId === chunk.id) {
      return false
    }
    if (hasRepeatedTag(chunk, state.generated)) {
      return false
    }
    if (hasTooManyHardChunks(chunk, state.generated)) {
      return false
    }
    return true
  })

  if (candidates.length === 0) {
    return COURSE_CHUNKS.find((chunk) => chunk.id === SAFE_CHUNK_ID) ?? COURSE_CHUNKS[0]
  }

  return rng.weightedPick(candidates, (chunk) => rarityWeight(chunk, director))
}

function offsetTrack(chunk: CourseChunk, instanceId: string, zOffset: number): TrackSegment[] {
  return chunk.track.map((segment, index) => ({
    id: `${instanceId}-t-${segment.id ?? index}`,
    zStart: zOffset + segment.zStart,
    zEnd: zOffset + segment.zEnd,
    width: segment.width,
    centerStart: segment.centerStart,
    centerEnd: segment.centerEnd,
  }))
}

function safeWallValue(currentValue: BallNumber, index: number) {
  if (index === 0) {
    return previousNumber(currentValue)
  }
  return index === 1 ? currentValue : nextNumber(currentValue)
}

function appendChunkObjects(
  stage: StageData,
  chunk: CourseChunk,
  instanceId: string,
  zOffset: number,
  currentValue: BallNumber,
  difficultyLevel: number,
) {
  const valueForMerge = currentValue
  stage.track.push(...offsetTrack(chunk, instanceId, zOffset))
  stage.balls.push(
    ...chunk.balls.map((ball, index) => ({
      id: `${instanceId}-b-${index}`,
      value: chunk.tags.includes('merge') || chunk.tags.includes('combo') || chunk.tags.includes('recovery') ? valueForMerge : ball.value,
      x: ball.x,
      z: zOffset + ball.z,
    })),
  )
  stage.obstacles.push(...chunk.obstacles.map((obstacle, index) => ({ id: `${instanceId}-o-${index}`, ...obstacle, z: zOffset + obstacle.z })))
  stage.movingObstacles.push(
    ...chunk.movingObstacles.map((obstacle, index) => ({
      id: `${instanceId}-m-${index}`,
      ...obstacle,
      moveSpeed: obstacle.moveSpeed + Math.min(difficultyLevel * 0.05, 0.45),
      z: zOffset + obstacle.z,
    })),
  )
  stage.gaps.push(...chunk.gaps.map((gap, index) => ({ id: `${instanceId}-g-${index}`, ...gap, z: zOffset + gap.z })))
  stage.walls.push(
    ...chunk.walls.map((wall, index) => ({
      id: `${instanceId}-w-${index}`,
      ...wall,
      value: safeWallValue(currentValue, index),
      z: zOffset + wall.z,
    })),
  )
  stage.speedBoosts.push(...chunk.speedBoosts.map((boost, index) => ({ id: `${instanceId}-s-${index}`, ...boost, z: zOffset + boost.z })))
}

function pruneStage(stage: StageData, keepFromZ: number) {
  const keepTrack = (segment: TrackSegment) => segment.zEnd >= keepFromZ
  const keepObject = (object: { z: number }) => object.z >= keepFromZ
  stage.track = stage.track.filter(keepTrack)
  stage.balls = stage.balls.filter(keepObject)
  stage.obstacles = stage.obstacles.filter(keepObject)
  stage.movingObstacles = stage.movingObstacles.filter(keepObject)
  stage.gaps = stage.gaps.filter(keepObject)
  stage.walls = stage.walls.filter(keepObject)
  stage.speedBoosts = stage.speedBoosts.filter(keepObject)
}

export function generateAhead(
  state: ChunkGeneratorState,
  rng: SeededRandom,
  director: DirectorState,
  playerZ: number,
) {
  while (state.generated.length < ENDLESS_CONFIG.generatedChunksAhead || state.nextZ < playerZ + 260) {
    const chunk = selectChunk(rng, state, director)
    const instanceId = `c${state.nextIndex}-${chunk.id}`
    appendChunkObjects(state.stage, chunk, instanceId, state.nextZ, director.currentValue, director.difficultyLevel)
    state.generated.push({
      instanceId,
      chunkId: chunk.id,
      zStart: state.nextZ,
      zEnd: state.nextZ + chunk.length,
      tags: chunk.tags,
      difficulty: chunk.difficulty,
    })
    state.history.push(chunk.id)
    state.nextZ += chunk.length
    state.nextIndex += 1
  }
  state.stage.length = Math.max(state.nextZ + 80, 120)
}

export function pruneBehind(state: ChunkGeneratorState, playerZ: number) {
  const keepFromZ = Math.max(-4, playerZ - 120)
  state.generated = state.generated.filter((chunk) => chunk.zEnd >= keepFromZ)
  pruneStage(state.stage, keepFromZ)
  state.stage.length = Math.max(state.nextZ + 80, 120)
}

export function validateGeneratedStage(stage: StageData) {
  const hasTrack = stage.track.length > 0
  const blockingObstacles = [...stage.obstacles, ...stage.movingObstacles].filter((obstacle: StageObstacle) => obstacle.width > 4.8)
  const blockingGaps = stage.gaps.filter((gap: StageGap) => gap.width > 4.8)
  return hasTrack && blockingObstacles.length === 0 && blockingGaps.length === 0
}
