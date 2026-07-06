import { getEvolutionRankName } from '../../config/evolutionConfig'
import type { EndlessSnapshot, UpgradeDefinition } from '../../types/game'
import { UpgradeCard } from './UpgradeCard'

type CheckpointScreenProps = {
  checkpointNumber: number
  snapshot: EndlessSnapshot
  options: UpgradeDefinition[]
  onSelect: (upgrade: UpgradeDefinition) => void
}

export function CheckpointScreen({ checkpointNumber, snapshot, options, onSelect }: CheckpointScreenProps) {
  return (
    <div className="checkpoint-layer">
      <section className="checkpoint-panel">
        <p className="home-kicker">チェックポイント {checkpointNumber}</p>
        <h1>強化を選んでください</h1>
        <dl className="checkpoint-stats">
          <div><dt>距離</dt><dd>{Math.floor(snapshot.distance).toLocaleString()}m</dd></div>
          <div><dt>ランク</dt><dd>{getEvolutionRankName(snapshot.evolutionRank)}</dd></div>
          <div><dt>数字</dt><dd>{snapshot.value}</dd></div>
          <div><dt>最大コンボ</dt><dd>{snapshot.maxCombo}</dd></div>
          <div><dt>スコア</dt><dd>{snapshot.score.toLocaleString()}</dd></div>
          <div><dt>次の難易度</dt><dd>Lv.{snapshot.difficultyLevel + 1}</dd></div>
        </dl>
        <div className="upgrade-grid">
          {options.map((option) => (
            <UpgradeCard key={option.id} upgrade={option} levels={snapshot.upgrades} onSelect={onSelect} />
          ))}
        </div>
      </section>
    </div>
  )
}
