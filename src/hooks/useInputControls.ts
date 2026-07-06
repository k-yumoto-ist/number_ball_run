import { useEffect, useRef } from 'react'
import { GAME_CONFIG } from '../config/gameConfig'
import type { EndlessPhase, GamePhase } from '../types/game'

export type InputControls = {
  targetX: number
  keyboardAxis: number
  hasInteracted: boolean
}

export function useInputControls(
  hostRef: React.RefObject<HTMLElement | null>,
  phase: GamePhase | EndlessPhase | 'home',
  onFirstInput: () => void,
) {
  const controlsRef = useRef<InputControls>({ targetX: 0, keyboardAxis: 0, hasInteracted: false })
  const phaseRef = useRef(phase)
  const pointerRef = useRef<{ active: boolean; x: number; id: number | null }>({
    active: false,
    x: 0,
    id: null,
  })

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    const markInput = () => {
      if (!controlsRef.current.hasInteracted) {
        controlsRef.current.hasInteracted = true
        onFirstInput()
      }
    }

    const isInputBlocked = () =>
      phaseRef.current === 'home' ||
      phaseRef.current === 'paused' ||
      phaseRef.current === 'gameOver' ||
      phaseRef.current === 'cleared' ||
      phaseRef.current === 'checkpoint' ||
      phaseRef.current === 'evolving'

    const isInteractiveTarget = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('button, a, input, select, textarea, [data-ui-control="true"]'))

    const onPointerDown = (event: PointerEvent) => {
      if (isInputBlocked() || isInteractiveTarget(event.target)) {
        return
      }
      pointerRef.current = { active: true, x: event.clientX, id: event.pointerId }
      markInput()
      try {
        host.setPointerCapture(event.pointerId)
      } catch {
        // Some mobile browsers can reject pointer capture when the canvas is the event target.
        // The window-level move listener below keeps dragging responsive in that case.
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      const pointer = pointerRef.current
      if (!pointer.active || pointer.id !== event.pointerId) {
        return
      }
      event.preventDefault()
      const width = Math.max(window.innerWidth, 320)
      const delta = ((event.clientX - pointer.x) / width) * GAME_CONFIG.inputSensitivity
      controlsRef.current.targetX += delta
      pointer.x = event.clientX
      markInput()
    }

    const onPointerUp = (event: PointerEvent) => {
      if (pointerRef.current.id === event.pointerId) {
        pointerRef.current.active = false
        pointerRef.current.id = null
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isInputBlocked()) {
        return
      }
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        controlsRef.current.keyboardAxis = -1
        markInput()
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        controlsRef.current.keyboardAxis = 1
        markInput()
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === 'ArrowLeft' ||
        event.key === 'ArrowRight' ||
        event.key.toLowerCase() === 'a' ||
        event.key.toLowerCase() === 'd'
      ) {
        controlsRef.current.keyboardAxis = 0
      }
    }

    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('pointermove', onPointerMove, { passive: false })
    host.addEventListener('pointerup', onPointerUp)
    host.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerup', onPointerUp)
      host.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [hostRef, onFirstInput])

  return controlsRef
}
