import { ENDLESS_CONFIG } from '../config/endlessConfig'
import { UPGRADES } from '../data/upgrades'
import type { UpgradeDefinition, UpgradeLevels } from '../types/game'
import { SeededRandom } from './SeededRandom'

const RARITY_WEIGHTS = {
  common: 1,
  rare: 0.55,
  epic: 0.22,
} as const

export function getUpgradeLevel(levels: UpgradeLevels, id: UpgradeDefinition['id']) {
  return levels[id] ?? 0
}

export function chooseUpgradeOptions(rng: SeededRandom, levels: UpgradeLevels, shieldCount: number) {
  const options: UpgradeDefinition[] = []
  const categoryCount = new Map<string, number>()
  const available = UPGRADES.filter((upgrade) => getUpgradeLevel(levels, upgrade.id) < upgrade.maxLevel)

  while (options.length < 3 && options.length < available.length) {
    const candidate = rng.weightedPick(available, (upgrade) => {
      if (options.some((option) => option.id === upgrade.id)) {
        return 0
      }
      const categoryUsed = categoryCount.get(upgrade.category) ?? 0
      if (categoryUsed >= 2) {
        return 0
      }
      let weight = RARITY_WEIGHTS[upgrade.rarity]
      if (shieldCount === 0 && upgrade.category === 'defense') {
        weight *= 1.35
      }
      return weight
    })
    if (options.some((option) => option.id === candidate.id)) {
      break
    }
    options.push(candidate)
    categoryCount.set(candidate.category, (categoryCount.get(candidate.category) ?? 0) + 1)
  }

  return options
}

export function applyUpgrade(levels: UpgradeLevels, upgrade: UpgradeDefinition) {
  return {
    ...levels,
    [upgrade.id]: Math.min((levels[upgrade.id] ?? 0) + 1, upgrade.maxLevel),
  }
}

export function getUpgradeEffects(levels: UpgradeLevels) {
  const magnetRange = 1.2 + getUpgradeLevel(levels, 'magnetRange') * 0.45
  const mergeRange = Math.min(getUpgradeLevel(levels, 'mergeRange') * 0.12, 0.48)
  const doubleUpChance = Math.min(getUpgradeLevel(levels, 'doubleUp') * 0.12, 0.32)
  const comboTimeout = ENDLESS_CONFIG.comboTimeoutSeconds + getUpgradeLevel(levels, 'comboExtend') * 0.35
  const comboSpeedBonus = 0.2 + getUpgradeLevel(levels, 'comboAccel') * 0.06
  const numberGuardChance = Math.min(getUpgradeLevel(levels, 'numberGuard') * 0.14, 0.5)
  const wallScoreMultiplier = 1 + getUpgradeLevel(levels, 'wallBonus') * 0.25
  const comboScoreMultiplier = 1 + getUpgradeLevel(levels, 'comboBonus') * 0.18
  const riskRewardMultiplier = 1 + getUpgradeLevel(levels, 'riskReward') * 0.35
  const recoveryInvincible = ENDLESS_CONFIG.courseRecoveryInvincibleSeconds + getUpgradeLevel(levels, 'courseRecovery') * 0.75

  return {
    magnetRange,
    mergeRange,
    doubleUpChance,
    comboTimeout,
    comboSpeedBonus,
    numberGuardChance,
    wallScoreMultiplier,
    comboScoreMultiplier,
    riskRewardMultiplier,
    recoveryInvincible,
    hasCourseRecovery: getUpgradeLevel(levels, 'courseRecovery') > 0,
    comboShieldLevel: getUpgradeLevel(levels, 'comboShield'),
  }
}
