import type { EndlessBestRecords } from '../../types/game'
import { getEvolutionRankName } from '../../config/evolutionConfig'

type HomeScreenProps = {
  records: EndlessBestRecords
  onStartEndless: () => void
  onStartTutorial: () => void
}

export function HomeScreen({ records, onStartEndless, onStartTutorial }: HomeScreenProps) {
  return (
    <section className="home-screen">
      <div className="home-inner">
        <p className="home-kicker">Number Ball Run</p>
        <h1>エンドレスラン</h1>
        <p className="home-copy">数字を育て、強化を選び、何度進化できるか挑戦します。</p>
        <div className="home-actions">
          <button className="primary-button wide-button" type="button" onClick={onStartEndless}>
            エンドレス
          </button>
          <button className="secondary-button wide-button" type="button" onClick={onStartTutorial}>
            遊び方
          </button>
        </div>
        <dl className="home-records">
          <div>
            <dt>ベストスコア</dt>
            <dd>{records.bestScore.toLocaleString()}</dd>
          </div>
          <div>
            <dt>最長距離</dt>
            <dd>{Math.floor(records.longestDistance).toLocaleString()}m</dd>
          </div>
          <div>
            <dt>最高ランク</dt>
            <dd>{getEvolutionRankName(records.highestRank)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
