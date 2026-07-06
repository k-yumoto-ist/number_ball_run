import type { EndlessBestRecords } from '../../types/game'

declare const __APP_VERSION__: string

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
        <h1 className="home-title">NUMBER BALL RUN</h1>
        <p className="home-copy">よけて、星を集めて、同じ数字で大きくなろう。</p>
        <div className="home-actions">
          <button className="primary-button wide-button" type="button" onClick={onStartEndless}>
            スタート
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
            <dt>累計スター</dt>
            <dd>{records.totalStars.toLocaleString()}</dd>
          </div>
        </dl>
        <p className="app-version">v{__APP_VERSION__}</p>
      </div>
    </section>
  )
}
