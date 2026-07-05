import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'

export type Burst = {
  id: number
  x: number
  z: number
  color: string
}

export function MergeBurst({ burst }: { burst: Burst }) {
  const groupRef = useRef<Group>(null)
  const startRef = useRef<number | null>(null)
  const dots = useMemo(
    () =>
      Array.from({ length: GAME_CONFIG.particles.mergeCount }, (_, index) => {
        const angle = (index / GAME_CONFIG.particles.mergeCount) * Math.PI * 2
        const speed = 0.7 + (index % 4) * 0.12
        return { x: Math.cos(angle) * speed, z: Math.sin(angle) * speed, y: 0.35 + (index % 3) * 0.16 }
      }),
    [],
  )

  useFrame(({ clock }) => {
    if (startRef.current === null) {
      startRef.current = clock.elapsedTime
    }
    const age = clock.elapsedTime - startRef.current
    const progress = Math.min(age / GAME_CONFIG.particles.lifetime, 1)
    if (groupRef.current) {
      groupRef.current.scale.setScalar(1 + progress * 1.2)
      groupRef.current.children.forEach((child) => {
        child.visible = progress < 0.98
      })
    }
  })

  return (
    <group ref={groupRef} position={[burst.x, 0.85, burst.z]}>
      {dots.map((dot, index) => (
        <mesh key={index} position={[dot.x, dot.y, dot.z]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshBasicMaterial color={burst.color} />
        </mesh>
      ))}
    </group>
  )
}
