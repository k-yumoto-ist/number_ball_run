import { Pause, Play, Shield } from 'lucide-react'
import { getEvolutionRankName } from '../../config/evolutionConfig'
import type { EndlessPhase, EndlessSnapshot } from '../../types/game'

type EndlessHudProps = {
  phase: EndlessPhase
  snapshot: EndlessSnapshot
  onPause: () => void
  onResume: () => void
}

export function EndlessHud({ phase, snapshot, onPause, onResume }: EndlessHudProps) {
  const progress = Math.max(0, Math.min(snapshot.checkpointProgress, 1))
  return (
    <div className="ui-layer">
      <div className={`hud endless-hud ${snapshot.combo >= 3 ? 'hud-combo' : ''}`}>
        <div className="hud-pill number-pill">{snapshot.value}</div>
        <div className="hud-pill rank-pill">{getEvolutionRankName(snapshot.evolutionRank)}</div>
        <div className="progress-shell endless-progress" aria-label={`チェックポイントまで ${Math.round(progress * 100)}%`}>
          <div className="progress-fill" style={{ width: `calc(${progress * 100}% - 4px)` }} />
          <span>CP {Math.round(progress * 100)}%</span>
        </div>
        <button className="icon-button" type="button" aria-label={phase === 'paused' ? '再開' : '一時停止'} onClick={phase === 'paused' ? onResume : onPause}>
          {phase === 'paused' ? <Play size={24} /> : <Pause size={24} />}
        </button>
      </div>
      <div className="endless-subhud">
        <span>{Math.floor(snapshot.distance).toLocaleString()}m</span>
        {snapshot.combo > 0 && <strong>{snapshot.combo} コンボ</strong>}
        <span className="shield-chip"><Shield size={15} /> {snapshot.shields}</span>
      </div>
      {phase === 'ready' && (
        <div className="hint">
          <strong>左右にドラッグしてスタート</strong>
          <span>同じ数字のボールと合体し、チェックポイントで強化を選ぼう</span>
        </div>
      )}
      {phase === 'paused' && (
        <div className="overlay panel">
          <h1>一時停止中</h1>
          <p>スコア {snapshot.score.toLocaleString()}</p>
          <button className="primary-button" type="button" onClick={onResume}>
            再開する
          </button>
        </div>
      )}
    </div>
  )
}
