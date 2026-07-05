import type { TrackSegment } from '../types/game'

export type TrackInfo = {
  centerX: number
  width: number
  left: number
  right: number
}

export function getTrackInfoAtZ(track: TrackSegment[], z: number): TrackInfo | null {
  const segment = track.find((item) => z >= item.zStart && z <= item.zEnd)
  if (!segment) {
    return null
  }

  const span = Math.max(segment.zEnd - segment.zStart, 0.001)
  const t = (z - segment.zStart) / span
  const centerX = segment.centerStart + (segment.centerEnd - segment.centerStart) * t

  return {
    centerX,
    width: segment.width,
    left: centerX - segment.width / 2,
    right: centerX + segment.width / 2,
  }
}

export function clampToTrack(track: TrackSegment[], z: number, x: number, padding: number): number {
  const info = getTrackInfoAtZ(track, z)
  if (!info) {
    return x
  }
  return Math.min(Math.max(x, info.left + padding), info.right - padding)
}
