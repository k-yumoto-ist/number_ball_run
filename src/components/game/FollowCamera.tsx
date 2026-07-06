import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import { GAME_CONFIG } from '../../config/gameConfig'

type FollowCameraProps = {
  playerRef: React.RefObject<{ x: number; z: number }>
  shakeRef: React.RefObject<number>
  speedRef: React.RefObject<number>
}

const cameraTarget = new Vector3()
const lookTarget = new Vector3()

export function FollowCamera({ playerRef, shakeRef, speedRef }: FollowCameraProps) {
  const { camera, size } = useThree()

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = size.width < size.height ? GAME_CONFIG.camera.portraitFov : GAME_CONFIG.camera.landscapeFov
      camera.updateProjectionMatrix()
    }
  }, [camera, size.width, size.height])

  useFrame(() => {
    const player = playerRef.current
    if (!player) {
      return
    }
    const shake = shakeRef.current ?? 0
    const lateral = player.x * GAME_CONFIG.camera.lateralInfluence
    const wobble = shake > 0 ? Math.sin(performance.now() * 0.06) * shake * 0.12 : 0

    if (camera instanceof PerspectiveCamera) {
      const speedBoost = Math.max(0, (speedRef.current - GAME_CONFIG.baseForwardSpeed) / GAME_CONFIG.baseForwardSpeed)
      const targetFov = (size.width < size.height ? GAME_CONFIG.camera.portraitFov : GAME_CONFIG.camera.landscapeFov) + speedBoost * 5
      camera.fov += (targetFov - camera.fov) * 0.08
      camera.updateProjectionMatrix()
    }

    cameraTarget.set(
      lateral + wobble,
      GAME_CONFIG.camera.height,
      player.z - GAME_CONFIG.camera.distance,
    )
    lookTarget.set(player.x * 0.35, 1.05, player.z + GAME_CONFIG.camera.lookAhead)
    camera.position.lerp(cameraTarget, GAME_CONFIG.camera.followLerp)
    camera.lookAt(lookTarget)
  })

  return null
}
