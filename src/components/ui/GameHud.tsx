import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { UI_TEXT } from '../../config/uiText'
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
      <p>
        {UI_TEXT.reachedNumber} {value}
      </p>
      {time !== undefined ? (
        <p>
          {UI_TEXT.clearTime} {formatTime(time)}
        </p>
      ) : null}
      <button className="primary-button" type="button" onClick={onRetry}>
        <RotateCcw size={22} aria-hidden="true" />
        {UI_TEXT.retry}
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
        <div className="hud-pill stage-pill">
          {UI_TEXT.stage} 1
        </div>
        <div className="hud-pill number-pill">{snapshot.value}</div>
        <div className="progress-shell" aria-label="goal progress">
          <div className="progress-fill" style={{ width: `${snapshot.progress * 100}%` }} />
        </div>
        <button className="icon-button" type="button" aria-label={UI_TEXT.pause} onClick={phase === 'paused' ? onResume : onPause}>
          {phase === 'paused' ? <Play size={22} aria-hidden="true" /> : <Pause size={22} aria-hidden="true" />}
        </button>
      </header>

      {showHelp ? (
        <div className="hint">
          <strong>{UI_TEXT.dragToStart}</strong>
          <span>{UI_TEXT.mergeGuide}</span>
        </div>
      ) : null}

      {showReady ? (
        <div className="tap-start">
          <span>{UI_TEXT.dragToStart}</span>
        </div>
      ) : null}

      {phase === 'paused' ? (
        <div className="overlay panel">
          <h1>{UI_TEXT.paused}</h1>
          <p>
            {UI_TEXT.bestNumber} {settings.bestNumber}
          </p>
          <p>
            {UI_TEXT.bestTime} {settings.bestClearTime ? formatTime(settings.bestClearTime) : '--'}
          </p>
          <button className="primary-button" type="button" onClick={onResume}>
            <Play size={22} aria-hidden="true" />
            {UI_TEXT.resume}
          </button>
          <button className="secondary-button" type="button" onClick={onToggleSound}>
            {soundEnabled ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
            {UI_TEXT.sound} {soundEnabled ? UI_TEXT.soundOn : UI_TEXT.soundOff}
          </button>
          <button className="secondary-button" type="button" onClick={onRetry}>
            <RotateCcw size={20} aria-hidden="true" />
            {UI_TEXT.retry}
          </button>
        </div>
      ) : null}

      {phase === 'gameOver' ? <ResultOverlay title={UI_TEXT.gameOver} value={snapshot.value} onRetry={onRetry} /> : null}
      {phase === 'cleared' ? (
        <ResultOverlay title={UI_TEXT.stageClear} value={snapshot.value} time={snapshot.elapsedTime} onRetry={onRetry} />
      ) : null}
    </div>
  )
}
