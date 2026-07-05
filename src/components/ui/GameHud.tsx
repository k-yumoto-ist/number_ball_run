import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import type { BallNumber, GamePhase, PlayerSnapshot, StoredSettings } from '../../types/game'

type GameHudProps = {
  phase: GamePhase
  snapshot: PlayerSnapshot
  settings: StoredSettings
  soundEnabled: boolean
  onPause: () => void
  onResume: () => void
  onRetry: () => void
  onToggleSound: () => void
}

function formatTime(value: number) {
  return `${value.toFixed(1)}s`
}

function ResultOverlay({
  title,
  value,
  time,
  onRetry,
}: {
  title: string
  value: BallNumber
  time?: number
  onRetry: () => void
}) {
  return (
    <div className="overlay panel">
      <h1>{title}</h1>
      <p>Reached {value}</p>
      {time !== undefined ? <p>Clear time {formatTime(time)}</p> : null}
      <button className="primary-button" type="button" onClick={onRetry}>
        <RotateCcw size={22} aria-hidden="true" />
        RETRY
      </button>
    </div>
  )
}

export function GameHud({
  phase,
  snapshot,
  settings,
  soundEnabled,
  onPause,
  onResume,
  onRetry,
  onToggleSound,
}: GameHudProps) {
  const showHelp = phase === 'ready' && !settings.hasSeenHelp
  const showReady = phase === 'ready' && settings.hasSeenHelp

  return (
    <div className="ui-layer">
      <header className="hud">
        <div className="hud-pill">STAGE 1</div>
        <div className="hud-pill number-pill">{snapshot.value}</div>
        <div className="progress-shell" aria-label="goal progress">
          <div className="progress-fill" style={{ width: `${snapshot.progress * 100}%` }} />
        </div>
        <button className="icon-button" type="button" aria-label="pause" onClick={phase === 'paused' ? onResume : onPause}>
          {phase === 'paused' ? <Play size={22} aria-hidden="true" /> : <Pause size={22} aria-hidden="true" />}
        </button>
      </header>

      {showHelp ? (
        <div className="hint">
          <strong>左右にスワイプして移動</strong>
          <span>同じ数字のボールと合体しよう</span>
        </div>
      ) : null}

      {showReady ? (
        <div className="tap-start">
          <span>DRAG TO START</span>
        </div>
      ) : null}

      {phase === 'paused' ? (
        <div className="overlay panel">
          <h1>PAUSED</h1>
          <p>Best number {settings.bestNumber}</p>
          <p>Best time {settings.bestClearTime ? formatTime(settings.bestClearTime) : '--'}</p>
          <button className="primary-button" type="button" onClick={onResume}>
            <Play size={22} aria-hidden="true" />
            RESUME
          </button>
          <button className="secondary-button" type="button" onClick={onToggleSound}>
            {soundEnabled ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
            SOUND {soundEnabled ? 'ON' : 'OFF'}
          </button>
          <button className="secondary-button" type="button" onClick={onRetry}>
            <RotateCcw size={20} aria-hidden="true" />
            RETRY
          </button>
        </div>
      ) : null}

      {phase === 'gameOver' ? <ResultOverlay title="GAME OVER" value={snapshot.value} onRetry={onRetry} /> : null}
      {phase === 'cleared' ? (
        <ResultOverlay title="STAGE CLEAR" value={snapshot.value} time={snapshot.elapsedTime} onRetry={onRetry} />
      ) : null}
    </div>
  )
}
