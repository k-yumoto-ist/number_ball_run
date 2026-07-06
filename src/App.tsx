import { useCallback, useMemo, useRef, useState } from 'react'
import { EndlessGame } from './components/game/EndlessGame'
import { GameScene } from './components/game/GameScene'
import { GameHud } from './components/ui/GameHud'
import { HomeScreen } from './components/ui/HomeScreen'
import { STAGES } from './data/stageOne'
import { useInputControls } from './hooks/useInputControls'
import type { AppMode, GamePhase, PlayerSnapshot, StoredSettings } from './types/game'
import {
  incrementEndlessPlayCount,
  loadEndlessRecords,
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
  const [mode, setMode] = useState<AppMode>('home')
  const [phase, setPhase] = useState<GamePhase>('ready')
  const [runId, setRunId] = useState(0)
  const [stageIndex, setStageIndex] = useState(0)
  const [snapshot, setSnapshot] = useState<PlayerSnapshot>(INITIAL_SNAPSHOT)
  const [settings, setSettings] = useState<StoredSettings>(() => loadSettings())
  const [endlessRecords, setEndlessRecords] = useState(() => loadEndlessRecords())
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

  const startEndless = useCallback(() => {
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setEndlessRecords(incrementEndlessPlayCount())
    setMode('endless')
  }, [controlsRef])

  const startTutorial = useCallback(() => {
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setSnapshot(INITIAL_SNAPSHOT)
    setStageIndex(0)
    setRunId((current) => current + 1)
    setPhase('ready')
    setMode('tutorial')
  }, [controlsRef])

  const backHome = useCallback(() => {
    controlsRef.current.targetX = 0
    controlsRef.current.keyboardAxis = 0
    controlsRef.current.hasInteracted = false
    setPhase('ready')
    setMode('home')
  }, [controlsRef])

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

  if (mode === 'home') {
    return (
      <main ref={hostRef} className="game-root" aria-label="Number Ball Run">
        <HomeScreen records={endlessRecords} onStartEndless={startEndless} onStartTutorial={startTutorial} />
      </main>
    )
  }

  if (mode === 'endless') {
    return (
      <main className="game-root" aria-label="エンドレスモード">
        <EndlessGame
          records={endlessRecords}
          soundEnabled={settings.soundEnabled}
          onRecordsChange={setEndlessRecords}
          onHome={backHome}
        />
      </main>
    )
  }

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
      <button className="home-return-button" type="button" onClick={backHome}>
        ホーム
      </button>
    </main>
  )
}

export default App
