import { RARITY_LABELS } from '../../data/upgrades'
import type { UpgradeDefinition, UpgradeLevels } from '../../types/game'

type UpgradeCardProps = {
  upgrade: UpgradeDefinition
  levels: UpgradeLevels
  onSelect: (upgrade: UpgradeDefinition) => void
}

export function UpgradeCard({ upgrade, levels, onSelect }: UpgradeCardProps) {
  const level = levels[upgrade.id] ?? 0
  return (
    <button className={`upgrade-card rarity-${upgrade.rarity}`} type="button" onClick={() => onSelect(upgrade)}>
      <span className="upgrade-rarity">{RARITY_LABELS[upgrade.rarity]}</span>
      <strong>{upgrade.name}</strong>
      <span>Lv.{level} → Lv.{level + 1}</span>
      <p>{upgrade.description}</p>
      <small>{upgrade.nextDescription}</small>
    </button>
  )
}
