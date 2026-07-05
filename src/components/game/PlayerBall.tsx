import { Billboard, Text } from '@react-three/drei'
import { forwardRef, type RefObject } from 'react'
import type { Group } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'
import { NUMBER_STYLES } from '../../config/numberConfig'
import type { BallNumber } from '../../types/game'

type PlayerBallProps = {
  value: BallNumber
  sphereRef: RefObject<Group | null>
}

export const PlayerBall = forwardRef<Group, PlayerBallProps>(({ value, sphereRef }, ref) => {
  const style = NUMBER_STYLES[value]
  const isSpecial = value === 2048
  const labelY = GAME_CONFIG.courseSurfaceY + style.radius
  const labelZ = -(isSpecial ? style.radius * 1.2 : style.radius + 0.06)
  const outlineColor = style.textColor === '#ffffff' ? '#172033' : '#ffffff'

  return (
    <group ref={ref}>
      <group ref={sphereRef} position={[0, GAME_CONFIG.courseSurfaceY + style.radius, 0]}>
        <mesh>
          <sphereGeometry args={[style.radius, 32, 24]} />
          <meshStandardMaterial
            color={style.color}
            emissive={style.emissive}
            emissiveIntensity={style.glow + (isSpecial ? 0.28 : 0)}
            roughness={0.42}
            metalness={isSpecial ? 0.18 : 0.04}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[style.radius * 0.72, style.radius * 0.025, 8, 48]} />
          <meshBasicMaterial color={outlineColor} transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, Math.PI / 5]}>
          <torusGeometry args={[style.radius * 0.58, style.radius * 0.022, 8, 42]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.42} />
        </mesh>
        <mesh position={[style.radius * 0.36, style.radius * 0.45, -style.radius * 0.72]}>
          <sphereGeometry args={[style.radius * 0.075, 10, 8]} />
          <meshBasicMaterial color={outlineColor} />
        </mesh>
      </group>
      <Billboard follow position={[0, labelY, labelZ]} renderOrder={20}>
        <Text
          color={style.textColor}
          fontSize={style.radius * (value >= 1024 ? 0.48 : 0.56)}
          fontWeight={800}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.035}
          outlineColor={outlineColor}
          depthOffset={-10}
          material-depthTest={false}
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
