import { Billboard, Text } from '@react-three/drei'
import { forwardRef, type RefObject } from 'react'
import type { Group, Mesh } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'
import { NUMBER_STYLES } from '../../config/numberConfig'
import type { BallNumber } from '../../types/game'

type PlayerBallProps = {
  value: BallNumber
  sphereRef: RefObject<Mesh | null>
}

export const PlayerBall = forwardRef<Group, PlayerBallProps>(({ value, sphereRef }, ref) => {
  const style = NUMBER_STYLES[value]
  const isSpecial = value === 2048
  const labelY = GAME_CONFIG.courseSurfaceY + style.radius * 1.08
  const labelZ = -style.radius * 0.9
  const outlineColor = style.textColor === '#ffffff' ? '#172033' : '#ffffff'

  return (
    <group ref={ref}>
      <mesh ref={sphereRef} position={[0, GAME_CONFIG.courseSurfaceY + style.radius, 0]}>
        <sphereGeometry args={[style.radius, 32, 24]} />
        <meshStandardMaterial
          color={style.color}
          emissive={style.emissive}
          emissiveIntensity={style.glow + (isSpecial ? 0.28 : 0)}
          roughness={0.42}
          metalness={isSpecial ? 0.18 : 0.04}
        />
      </mesh>
      <Billboard follow position={[0, labelY, labelZ]}>
        <Text
          color={style.textColor}
          fontSize={style.radius * (value >= 1024 ? 0.48 : 0.56)}
          fontWeight={800}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.035}
          outlineColor={outlineColor}
        >
          {value}
        </Text>
      </Billboard>
      {isSpecial ? (
        <mesh position={[0, GAME_CONFIG.courseSurfaceY + style.radius, 0]}>
          <sphereGeometry args={[style.radius * 1.12, 32, 16]} />
          <meshBasicMaterial color="#fff0a6" transparent opacity={0.18} />
        </mesh>
      ) : null}
    </group>
  )
})

PlayerBall.displayName = 'PlayerBall'
