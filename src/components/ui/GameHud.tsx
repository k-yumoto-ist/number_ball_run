import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { UI_TEXT } from '../../config/uiText'
import type { GamePhase, PlayerSnapshot, StoredSettings } from '../../types/game'

type GameHudProps = {
  phase: GamePhase
  stageId: number
  hasNextStage: boolean
  snapshot: PlayerSnapshot
  settings: StoredSettings
  soundEnabled: boolean
  onPause: () => void
  onResume: () => void
  onRetry: () => void
  onNextStage: () => void
  onToggleSound: () => void
}

function formatTime(value: number) {
  return `${value.toFixed(1)}s`
}

function ResultOverlay({
  title,
  snapshot,
  hasNextStage,
  isClear,
  onRetry,
  onNextStage,
}: {
  title: string
  snapshot: PlayerSnapshot
  hasNextStage?: boolean
  isClear?: boolean
  onRetry: () => void
  onNextStage?: () => void
}) {
  return (
    <div className="overlay panel">
      <h1>{title}</h1>
      <p>
        {UI_TEXT.reachedNumber} {snapshot.value}
      </p>
      <p>
        {UI_TEXT.maxCombo} {snapshot.maxCombo}
      </p>
      <p>
        {UI_TEXT.destroyedWalls} {snapshot.wallsDestroyed + snapshot.bonusWallsDestroyed}
      </p>
      <p>
        {isClear ? UI_TEXT.clearTime : UI_TEXT.time} {formatTime(snapshot.elapsedTime)}
      </p>
      <p>
        {UI_TEXT.score} {Math.round(snapshot.score)}
      </p>
      <button className="primary-button" type="button" onClick={onRetry}>
        <RotateCcw size={22} aria-hidden="true" />
        {UI_TEXT.retry}
      </button>
      {hasNextStage && onNextStage ? (
        <button className="secondary-button" type="button" onClick={onNextStage}>
          <Play size={20} aria-hidden="true" />
          {UI_TEXT.nextStage}
        </button>
      ) : null}
    </div>
  )
}

export function GameHud({
  phase,
  stageId,
  hasNextStage,
  snapshot,
  settings,
  soundEnabled,
  onPause,
  onResume,
  onRetry,
  onNextStage,
  onToggleSound,
}: GameHudProps) {
  const showHelp = phase === 'ready' && !settings.hasSeenHelp
  const showReady = phase === 'ready' && settings.hasSeenHelp
  const comboVisible = snapshot.combo >= 2 && phase === 'playing'

  return (
    <div className="ui-layer">
      <header className={`hud ${snapshot.combo >= 3 ? 'hud-combo' : ''}`}>
        <div className="hud-pill stage-pill">
          {UI_TEXT.stage} {stageId}
        </div>
        <div className="hud-pill number-pill">{snapshot.value}</div>
        <div className="progress-shell" aria-label="goal progress">
          <div className="progress-fill" style={{ width: `${snapshot.progress * 100}%` }} />
        </div>
        <button className="icon-button" type="button" aria-label={UI_TEXT.pause} onClick={phase === 'paused' ? onResume : onPause}>
          {phase === 'paused' ? <Play size={22} aria-hidden="true" /> : <Pause size={22} aria-hidden="true" />}
        </button>
      </header>

      {comboVisible ? (
        <div key={snapshot.combo} className="combo-pop">
          {snapshot.combo} {UI_TEXT.combo}
        </div>
      ) : null}

      {snapshot.isBonus && phase === 'playing' ? <div className="bonus-label">{UI_TEXT.bonus}</div> : null}

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
          <p>
            {UI_TEXT.score} {Math.round(snapshot.score)}
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

      {phase === 'gameOver' ? <ResultOverlay title={UI_TEXT.gameOver} snapshot={snapshot} onRetry={onRetry} /> : null}
      {phase === 'cleared' ? (
        <ResultOverlay
          title={hasNextStage ? UI_TEXT.stageClear : UI_TEXT.finalStageClear}
          snapshot={snapshot}
          isClear
          hasNextStage={hasNextStage}
          onRetry={onRetry}
          onNextStage={onNextStage}
        />
      ) : null}
    </div>
  )
}
