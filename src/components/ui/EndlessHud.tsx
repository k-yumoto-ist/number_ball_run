import { Heart, Pause, Play, Shield, Star } from 'lucide-react'
import type { EndlessPhase, EndlessSnapshot } from '../../types/game'

type EndlessHudProps = {
  phase: EndlessPhase
  snapshot: EndlessSnapshot
  onPause: () => void
  onResume: () => void
}

export function EndlessHud({ phase, snapshot, onPause, onResume }: EndlessHudProps) {
  const activeItems = snapshot.activeItems ?? []
  const hearts = snapshot.hearts ?? 3

  return (
    <div className="ui-layer">
      <div className="hud endless-hud kids-hud">
        <div className="heart-row" aria-label={`ハート ${hearts}`}>
          {Array.from({ length: 3 }, (_, index) => (
            <Heart key={index} size={20} fill={index < hearts ? '#ff5f7a' : 'transparent'} />
          ))}
        </div>
        <div className="hud-pill number-pill">{snapshot.value}</div>
        <div className="hud-pill distance-pill">{Math.floor(snapshot.distance).toLocaleString()}m</div>
        <div className="hud-pill star-pill"><Star size={16} fill="#ffd84d" />{snapshot.stars ?? 0}</div>
        <div className="hud-pill evo-pill">進化 {snapshot.evolutionCount}</div>
        <div className="item-strip" aria-label="使用中アイテム">
          {activeItems.map((item) => <span key={item}>{item}</span>)}
        </div>
        <button className="icon-button" type="button" aria-label={phase === 'paused' ? '再開' : '一時停止'} onClick={phase === 'paused' ? onResume : onPause}>
          {phase === 'paused' ? <Play size={24} /> : <Pause size={24} />}
        </button>
      </div>
      {snapshot.shields > 0 && <div className="kids-status"><Shield size={16} /> シールド</div>}
      {phase === 'ready' && (
        <div className="hint">
          <strong>左右にドラッグしてスタート</strong>
          <span>星とアイテムを集めて、同じ数字で大きくなろう</span>
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
