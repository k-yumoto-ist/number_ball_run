import { Billboard, Text } from '@react-three/drei'
import { NUMBER_STYLES } from '../../config/numberConfig'
import type { StageBall, StageGap, StageObstacle } from '../../types/game'

type NumberBallProps = {
  ball: StageBall
  hidden: boolean
}

export function NumberBall({ ball, hidden }: NumberBallProps) {
  if (hidden) {
    return null
  }
  const style = NUMBER_STYLES[ball.value]

  return (
    <group position={[ball.x, 0, ball.z]}>
      <mesh position={[0, style.radius, 0]}>
        <sphereGeometry args={[style.radius, 24, 18]} />
        <meshStandardMaterial color={style.color} emissive={style.emissive} emissiveIntensity={style.glow} />
      </mesh>
      <Billboard position={[0, style.radius * 1.12, -style.radius * 0.82]}>
        <Text
          color={style.textColor}
          fontSize={style.radius * (ball.value >= 1024 ? 0.44 : 0.54)}
          fontWeight={800}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#ffffff"
        >
          {ball.value}
        </Text>
      </Billboard>
    </group>
  )
}

export function Obstacle({ obstacle }: { obstacle: StageObstacle }) {
  return (
    <group position={[obstacle.x, obstacle.height / 2, obstacle.z]}>
      <mesh>
        <boxGeometry args={[obstacle.width, obstacle.height, obstacle.depth]} />
        <meshStandardMaterial color="#30415f" emissive="#172236" emissiveIntensity={0.08} roughness={0.58} />
      </mesh>
      <mesh position={[0, obstacle.height / 2 + 0.04, 0]}>
        <boxGeometry args={[obstacle.width * 0.72, 0.08, obstacle.depth * 0.72]} />
        <meshStandardMaterial color="#ff7a59" emissive="#5a1609" emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}

export function Gap({ gap }: { gap: StageGap }) {
  return (
    <group position={[gap.x, 0.018, gap.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[gap.width, gap.depth]} />
        <meshBasicMaterial color="#16202f" />
      </mesh>
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[gap.width * 0.82, gap.depth * 0.78]} />
        <meshBasicMaterial color="#090e18" />
      </mesh>
    </group>
  )
}
