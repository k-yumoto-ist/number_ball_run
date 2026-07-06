import { RotateCcw, Home } from 'lucide-react'
import { getEvolutionRankName } from '../../config/evolutionConfig'
import type { EndlessBestRecords, EndlessSnapshot } from '../../types/game'

type EndlessResultScreenProps = {
  snapshot: EndlessSnapshot
  records: EndlessBestRecords
  isNewBest: boolean
  onRetry: () => void
  onHome: () => void
}

export function EndlessResultScreen({ snapshot, records, isNewBest, onRetry, onHome }: EndlessResultScreenProps) {
  const upgradeCount = Object.values(snapshot.upgrades).reduce((sum, level) => sum + (level ?? 0), 0)
  return (
    <div className="overlay panel result-panel">
      <h1>ゲームオーバー</h1>
      {isNewBest && <strong className="new-record">新記録！</strong>}
      <p>走行距離 {Math.floor(snapshot.distance).toLocaleString()}m</p>
      <p>到達ランク {getEvolutionRankName(snapshot.evolutionRank)}</p>
      <p>進化回数 {snapshot.evolutionCount}</p>
      <p>最終数字 {snapshot.value}</p>
      <p>最大コンボ {snapshot.maxCombo}</p>
      <p>破壊した壁 {snapshot.wallsDestroyed}</p>
      <p>獲得した強化 {upgradeCount}</p>
      <p>スコア {snapshot.score.toLocaleString()}</p>
      <p>ベスト {records.bestScore.toLocaleString()}</p>
      <div className="result-actions">
        <button className="primary-button" type="button" onClick={onRetry}><RotateCcw size={22} />もう一度</button>
        <button className="secondary-button" type="button" onClick={onHome}><Home size={22} />ホームへ戻る</button>
      </div>
    </div>
  )
}
