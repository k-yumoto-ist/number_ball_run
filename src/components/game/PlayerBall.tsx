import { Billboard, Text } from '@react-three/drei'
import { forwardRef } from 'react'
import type { Group } from 'three'
import { NUMBER_STYLES } from '../../config/numberConfig'
import type { BallNumber } from '../../types/game'

type PlayerBallProps = {
  value: BallNumber
  pulse: number
}

export const PlayerBall = forwardRef<Group, PlayerBallProps>(({ value, pulse }, ref) => {
  const style = NUMBER_STYLES[value]
  const scale = 1 + pulse * 0.16
  const isSpecial = value === 2048

  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, style.radius, 0]}>
        <sphereGeometry args={[style.radius, 32, 24]} />
        <meshStandardMaterial
          color={style.color}
          emissive={style.emissive}
          emissiveIntensity={style.glow + (isSpecial ? 0.28 : 0)}
          roughness={0.42}
          metalness={isSpecial ? 0.18 : 0.04}
        />
      </mesh>
      <Billboard position={[0, style.radius * 1.1, -style.radius * 0.82]}>
        <Text
          color={style.textColor}
          fontSize={style.radius * (value >= 1024 ? 0.48 : 0.56)}
          fontWeight={800}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.035}
          outlineColor="#ffffff"
        >
          {value}
        </Text>
      </Billboard>
      {isSpecial ? (
        <mesh position={[0, style.radius, 0]}>
          <sphereGeometry args={[style.radius * 1.12, 32, 16]} />
          <meshBasicMaterial color="#fff0a6" transparent opacity={0.18} />
        </mesh>
      ) : null}
    </group>
  )
})

PlayerBall.displayName = 'PlayerBall'
