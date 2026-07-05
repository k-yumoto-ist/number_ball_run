import { useCallback, useMemo, useRef, useState } from 'react'
import { GameScene } from './components/game/GameScene'
import { GameHud } from './components/ui/GameHud'
import { STAGE_ONE } from './data/stageOne'
import { useInputControls } from './hooks/useInputControls'
import type { GamePhase, PlayerSnapshot, StoredSettings } from './types/game'
import {
  loadSettings,
  saveBestClearTime,
  saveBestNumber,
  saveHasSeenHelp,
  saveSoundEnabled,
} from './utils/storage'

const INITIAL_SNAPSHOT: PlayerSnapshot = {
  value: 2,
  progress: 0,
  elapsedTime: 0,
}

function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [runId, setRunId] = useState(0)
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>(INITIAL_SNAPSHOT)
  const [settings, setSettings] = useState<StoredSettings>(() => loadSettings())

  const transitionTo = useCallback((nextPhase: GamePhase) => {
    setPhase(nextPhase)
  }, [])

  const markHelpSeen = useCallback(() => {
    setSettings((current) => {
      if (current.hasSeenHelp) {
        return current
      }
      saveHasSeenHelp()
      return { ...current, hasSeenHelp: true }
    })
  }, [])

  const handleFirstInput = useCallback(() => {
    markHelpSeen()
    setPhase((current) => (current === 'ready' ? 'playing' : current))
  }, [markHelpSeen])

  const controlsRef = useInputControls(hostRef, phase, handleFirstInput)

  const handleGameOver = useCallback(
    (nextSnapshot: PlayerSnapshot) => {
      setSnapshot(nextSnapshot)
      saveBestNumber(nextSnapshot.value)
      setSettings(loadSettings())
      transitionTo('gameOver')
    },
    [transitionTo],
  )

  const handleClear = useCallback(
    (nextSnapshot: PlayerSnapshot) => {
      setSnapshot(nextSnapshot)
      saveBestNumber(nextSnapshot.value)
      saveBestClearTime(nextSnapshot.elapsedTime)
      setSettings(loadSettings())
      transitionTo('cleared')
    },
    [transitionTo],
  )

  const retry = useCallback(() => {
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setSnapshot(INITIAL_SNAPSHOT)
    setRunId((current) => current + 1)
    transitionTo('ready')
  }, [controlsRef, transitionTo])

  const toggleSound = useCallback(() => {
    setSettings((current) => {
      const next = { ...current, soundEnabled: !current.soundEnabled }
      saveSoundEnabled(next.soundEnabled)
      return next
    })
  }, [])

  const scene = useMemo(
    () => (
      <GameScene
        key={runId}
        phase={phase}
        controlsRef={controlsRef}
        soundEnabled={settings.soundEnabled}
        onSnapshot={setSnapshot}
        onGameOver={handleGameOver}
        onClear={handleClear}
      />
    ),
    [controlsRef, handleClear, handleGameOver, phase, runId, settings.soundEnabled],
  )

  return (
    <main ref={hostRef} className="game-root" aria-label={STAGE_ONE.name}>
      {scene}
      <GameHud
        phase={phase}
        snapshot={snapshot}
        settings={settings}
        soundEnabled={settings.soundEnabled}
        onPause={() => transitionTo(phase === 'playing' ? 'paused' : phase)}
        onResume={() => transitionTo('playing')}
        onRetry={retry}
        onToggleSound={toggleSound}
      />
    </main>
  )
}

export default App
