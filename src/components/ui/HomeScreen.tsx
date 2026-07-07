import { Flag, HelpCircle, Play, Star, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { NUMBER_STYLES } from '../../config/numberConfig'
import type { BallNumber, EndlessBestRecords } from '../../types/game'

declare const __APP_VERSION__: string

type HomeScreenProps = {
  records: EndlessBestRecords
  onStartEndless: () => void
  onStartTutorial: () => void
}

const HERO_VALUES: BallNumber[] = [2, 4, 8, 16]

export function HomeScreen({ records, onStartEndless, onStartTutorial }: HomeScreenProps) {
  const [heroIndex, setHeroIndex] = useState(2)
  const heroValue = HERO_VALUES[heroIndex]
  const heroStyle = NUMBER_STYLES[heroValue]
  const heroBallStyle = useMemo(
    () => ({
      '--hero-ball-color': heroStyle.color,
      '--hero-ball-emissive': heroStyle.emissive,
      '--hero-ball-text': heroStyle.textColor,
    }) as CSSProperties,
    [heroStyle],
  )

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      return
    }
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % HERO_VALUES.length)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="home-screen">
      <div className="home-decoration" aria-hidden="true">
        <span className="decor-ball decor-ball-a">2</span>
        <span className="decor-ball decor-ball-b">4</span>
        <span className="decor-ball decor-ball-c">8</span>
        <span className="decor-star decor-star-a">✦</span>
        <span className="decor-star decor-star-b">☆</span>
        <span className="decor-star decor-star-c">✦</span>
        <span className="decor-star decor-star-d">☆</span>
        <span className="decor-trail decor-trail-a" />
        <span className="decor-trail decor-trail-b" />
        <span className="decor-cloud decor-cloud-a" />
        <span className="decor-cloud decor-cloud-b" />
      </div>

      <div className="home-inner home-content">
        <header className="home-hero-copy">
          <h1 className="home-title">
            <span>NUMBER BALL</span>
            <span>RUN</span>
          </h1>
          <p className="home-copy">よけて、あつめて、大きくなろう！</p>
        </header>

        <div className="hero-ball-wrap" aria-hidden="true">
          <div className="hero-ball" style={heroBallStyle}>
            <span key={heroValue}>{heroValue}</span>
          </div>
          <div className="hero-shadow" />
        </div>

        <div className="home-actions">
          <button className="primary-button wide-button home-start-button" type="button" onClick={onStartEndless}>
            <Play size={24} fill="currentColor" />
            <span>スタート</span>
          </button>
          <button className="secondary-button home-help-button" type="button" onClick={onStartTutorial}>
            <HelpCircle size={20} />
            <span>遊び方</span>
          </button>
        </div>

        <dl className="home-records stats-grid">
          <div>
            <dt><Trophy size={18} /></dt>
            <dd>{records.bestScore.toLocaleString()}</dd>
            <span>ベスト</span>
          </div>
          <div>
            <dt><Flag size={18} /></dt>
            <dd>{Math.floor(records.longestDistance).toLocaleString()}m</dd>
            <span>最長距離</span>
          </div>
          <div>
            <dt><Star size={18} fill="currentColor" /></dt>
            <dd>{records.totalStars.toLocaleString()}</dd>
            <span>スター</span>
          </div>
        </dl>

        <p className="app-version">v{__APP_VERSION__}</p>
      </div>
    </section>
  )
}
