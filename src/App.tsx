import { useCallback, useMemo, useRef, useState } from 'react'
import { GameScene } from './components/game/GameScene'
import { GameHud } from './components/ui/GameHud'
import { STAGES } from './data/stageOne'
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
  combo: 0,
  maxCombo: 0,
  score: 0,
  wallsDestroyed: 0,
  bonusWallsDestroyed: 0,
  isBonus: false,
}

function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [runId, setRunId] = useState(0)
  const [stageIndex, setStageIndex] = useState(0)
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>(INITIAL_SNAPSHOT)
  const [settings, setSettings] = useState<StoredSettings>(() => loadSettings())
  const stage = STAGES[stageIndex]

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

  const nextStage = useCallback(() => {
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setSnapshot(INITIAL_SNAPSHOT)
    setStageIndex((current) => Math.min(current + 1, STAGES.length - 1))
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
        key={`${stage.id}-${runId}`}
        stage={stage}
        phase={phase}
        controlsRef={controlsRef}
        soundEnabled={settings.soundEnabled}
        onSnapshot={setSnapshot}
        onGameOver={handleGameOver}
        onClear={handleClear}
      />
    ),
    [controlsRef, handleClear, handleGameOver, phase, runId, settings.soundEnabled, stage],
  )

  return (
    <main ref={hostRef} className="game-root" aria-label={stage.name}>
      {scene}
      <GameHud
        phase={phase}
        stageId={stage.id}
        hasNextStage={stageIndex < STAGES.length - 1}
        snapshot={snapshot}
        settings={settings}
        soundEnabled={settings.soundEnabled}
        onPause={() => transitionTo(phase === 'playing' ? 'paused' : phase)}
        onResume={() => transitionTo('playing')}
        onRetry={retry}
        onNextStage={nextStage}
        onToggleSound={toggleSound}
      />
    </main>
  )
}

export default App
