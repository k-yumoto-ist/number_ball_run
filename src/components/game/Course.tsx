import type { StageData, TrackSegment } from '../../types/game'
import { Gap, Obstacle, NumberBall } from './StageObjects'

function TrackPiece({ segment }: { segment: TrackSegment }) {
  const dz = segment.zEnd - segment.zStart
  const dx = segment.centerEnd - segment.centerStart
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dx, dz)
  const centerX = (segment.centerStart + segment.centerEnd) / 2
  const centerZ = (segment.zStart + segment.zEnd) / 2

  return (
    <group position={[centerX, 0, centerZ]} rotation={[0, angle, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[segment.width, 0.18, length]} />
        <meshStandardMaterial color="#78df9b" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.095, 0]}>
        <boxGeometry args={[Math.max(segment.width - 0.3, 0.5), 0.025, length]} />
        <meshStandardMaterial color="#9ff0b6" roughness={0.9} />
      </mesh>
    </group>
  )
}

export function Course({ stage, collectedIds }: { stage: StageData; collectedIds: Set<string> }) {
  return (
    <>
      <mesh position={[0, -0.08, stage.length / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, stage.length + 40]} />
        <meshStandardMaterial color="#b8efd4" roughness={0.9} />
      </mesh>
      {stage.track.map((segment) => (
        <TrackPiece key={segment.id} segment={segment} />
      ))}
      {stage.gaps.map((gap) => (
        <Gap key={gap.id} gap={gap} />
      ))}
      {stage.balls.map((ball) => (
        <NumberBall key={ball.id} ball={ball} hidden={collectedIds.has(ball.id)} />
      ))}
      {stage.obstacles.map((obstacle) => (
        <Obstacle key={obstacle.id} obstacle={obstacle} />
      ))}
    </>
  )
}
