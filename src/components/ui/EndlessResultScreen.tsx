import { Home, RotateCcw } from 'lucide-react'
import type { EndlessBestRecords, EndlessSnapshot } from '../../types/game'

type EndlessResultScreenProps = {
  snapshot: EndlessSnapshot
  records: EndlessBestRecords
  isNewBest: boolean
  onRetry: () => void
  onHome: () => void
}

export function EndlessResultScreen({ snapshot, records, isNewBest, onRetry, onHome }: EndlessResultScreenProps) {
  return (
    <div className="overlay panel result-panel">
      <h1>ゲームオーバー</h1>
      {isNewBest && <strong className="new-record">新記録！</strong>}
      <p>走った距離 {Math.floor(snapshot.distance).toLocaleString()}m</p>
      <p>集めた星 {snapshot.stars ?? 0}</p>
      <p>大きくなった回数 {snapshot.merges ?? 0}</p>
      <p>進化した回数 {snapshot.evolutionCount}</p>
      <p>最高の数字 {snapshot.highestNumber ?? snapshot.value}</p>
      <p>スコア {snapshot.score.toLocaleString()}</p>
      <p>ベストスコア {records.bestScore.toLocaleString()}</p>
      <div className="result-actions">
        <button className="primary-button" type="button" onClick={onRetry}><RotateCcw size={22} />もう一度</button>
        <button className="secondary-button" type="button" onClick={onHome}><Home size={22} />ホームへ戻る</button>
      </div>
    </div>
  )
}
