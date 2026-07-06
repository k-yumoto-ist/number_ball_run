import type { MovingObstacle } from '../types/game'

export function getMovingObstacleX(obstacle: MovingObstacle, elapsedTime: number) {
  return obstacle.x + Math.sin(elapsedTime * obstacle.moveSpeed + obstacle.phase) * obstacle.moveDistance
}
