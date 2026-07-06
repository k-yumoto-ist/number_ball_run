import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'
import { NUMBER_STYLES } from '../../config/numberConfig'
import type { MovingObstacle, NumberWall, SpeedBoost, StageBall, StageGap, StageObstacle } from '../../types/game'
import { getMovingObstacleX } from '../../utils/movingObstacle'

type NumberBallProps = {
  ball: StageBall
  hidden: boolean
}

export function NumberBall({ ball, hidden }: NumberBallProps) {
  if (hidden) {
    return null
  }
  const style = NUMBER_STYLES[ball.value]
  const labelY = GAME_CONFIG.courseSurfaceY + style.radius
  const labelZ = -(style.radius + 0.06)
  const outlineColor = style.textColor === '#ffffff' ? '#172033' : '#ffffff'

  return (
    <group position={[ball.x, 0, ball.z]}>
      <mesh position={[0, GAME_CONFIG.courseSurfaceY + style.radius, 0]}>
        <sphereGeometry args={[style.radius, 24, 18]} />
        <meshStandardMaterial color={style.color} emissive={style.emissive} emissiveIntensity={style.glow} />
      </mesh>
      <Billboard follow position={[0, labelY, labelZ]} renderOrder={20}>
        <Text
          color={style.textColor}
          fontSize={style.radius * (ball.value >= 1024 ? 0.44 : 0.54)}
          fontWeight={800}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor={outlineColor}
          depthOffset={-10}
          material-depthTest={false}
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

export function MovingObstacleBlock({ obstacle }: { obstacle: MovingObstacle }) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.x = getMovingObstacleX(obstacle, clock.elapsedTime)
    }
  })

  return (
    <group ref={groupRef} position={[obstacle.x, 0, obstacle.z]}>
      <Obstacle obstacle={{ ...obstacle, x: 0, z: 0 }} />
    </group>
  )
}

export function NumberWall({ wall, hidden }: { wall: NumberWall; hidden: boolean }) {
  if (hidden) {
    return null
  }
  const style = NUMBER_STYLES[wall.value]
  return (
    <group position={[wall.x, wall.height / 2, wall.z]}>
      <mesh>
        <boxGeometry args={[wall.width, wall.height, 0.36]} />
        <meshStandardMaterial color="#2c3f66" emissive={style.emissive} emissiveIntensity={0.22} roughness={0.5} />
      </mesh>
      <Billboard follow position={[0, 0.12, -0.24]} renderOrder={18}>
        <Text
          color="#ffffff"
          fontSize={wall.value >= 1024 ? 0.5 : 0.68}
          fontWeight={900}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.035}
          outlineColor="#172033"
          depthOffset={-8}
          material-depthTest={false}
        >
          {wall.value}
        </Text>
      </Billboard>
    </group>
  )
}

export function SpeedBoostPad({ boost, hidden }: { boost: SpeedBoost; hidden: boolean }) {
  if (hidden) {
    return null
  }
  return (
    <group position={[boost.x, GAME_CONFIG.courseSurfaceY + 0.025, boost.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[boost.radius * 0.45, boost.radius, 32]} />
        <meshBasicMaterial color="#2de2ff" transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[boost.radius * 0.42, 24]} />
        <meshBasicMaterial color="#fff36d" transparent opacity={0.72} />
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
