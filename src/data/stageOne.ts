import type { StageData } from '../types/game'

export const STAGE_ONE: StageData = {
  id: 1,
  name: 'Sunny Merge Run',
  length: 118,
  startZ: 0,
  goalZ: 112,
  track: [
    { id: 'start', zStart: -4, zEnd: 28, width: 6.2, centerStart: 0, centerEnd: 0 },
    { id: 'curve-right', zStart: 28, zEnd: 50, width: 6, centerStart: 0, centerEnd: 1.35 },
    { id: 'gap-zone', zStart: 50, zEnd: 58, width: 5.8, centerStart: 1.35, centerEnd: 0.75 },
    { id: 'after-gap', zStart: 58, zEnd: 72, width: 5.6, centerStart: 0.75, centerEnd: -0.9 },
    { id: 'narrow', zStart: 72, zEnd: 89, width: 5, centerStart: -0.55, centerEnd: -0.25 },
    { id: 'finish', zStart: 89, zEnd: 116, width: 6, centerStart: -0.45, centerEnd: 0 },
  ],
  balls: [
    { id: 'b-2-a', value: 2, x: -1.35, z: 12 },
    { id: 'b-4-a', value: 4, x: 1.45, z: 20 },
    { id: 'b-8-decoy', value: 16, x: -1.4, z: 27 },
    { id: 'b-8-a', value: 8, x: 1.2, z: 34 },
    { id: 'b-16-a', value: 16, x: 2.25, z: 43 },
    { id: 'b-4-decoy', value: 4, x: -1.1, z: 47 },
    { id: 'b-32-a', value: 32, x: 0.85, z: 64 },
    { id: 'b-64-decoy', value: 16, x: -2.1, z: 67 },
    { id: 'b-64-a', value: 64, x: -0.45, z: 80 },
    { id: 'b-128-a', value: 128, x: 1.3, z: 96 },
    { id: 'b-256-decoy', value: 256, x: -1.7, z: 103 },
  ],
  obstacles: [
    { id: 'o-1', x: 1.5, z: 16, width: 0.95, depth: 1.15, height: 1.2 },
    { id: 'o-2', x: -1.75, z: 31, width: 1.05, depth: 1.2, height: 1.35 },
    { id: 'o-3', x: -0.15, z: 60, width: 0.9, depth: 1.1, height: 1.25 },
    { id: 'o-4', x: 1.05, z: 76, width: 0.95, depth: 1.15, height: 1.3 },
    { id: 'o-5', x: -1.35, z: 91, width: 1.05, depth: 1.2, height: 1.35 },
  ],
  gaps: [{ id: 'g-1', x: -2.05, z: 55, width: 1.45, depth: 3.8 }],
}
