import type { UpgradeDefinition } from '../types/game'

export const UPGRADES: UpgradeDefinition[] = [
  { id: 'magnetRange', name: '吸引範囲アップ', description: '同じ数字のボールを少し引き寄せる', nextDescription: '吸引距離が広がる', category: 'merge', rarity: 'common', maxLevel: 5 },
  { id: 'mergeRange', name: '合体範囲アップ', description: '同じ数字との接触判定が少し広がる', nextDescription: '判定範囲が広がる', category: 'merge', rarity: 'common', maxLevel: 4 },
  { id: 'doubleUp', name: 'ダブルアップ', description: '合体時に確率で2段階成長する', nextDescription: '発動率が上がる', category: 'merge', rarity: 'epic', maxLevel: 3 },
  { id: 'comboExtend', name: 'コンボ延長', description: 'コンボが切れるまでの時間を延ばす', nextDescription: '猶予時間がさらに伸びる', category: 'combo', rarity: 'common', maxLevel: 5 },
  { id: 'comboAccel', name: 'コンボ加速', description: 'コンボ中の速度上昇を強くする', nextDescription: '速度ボーナスが増える', category: 'combo', rarity: 'rare', maxLevel: 4 },
  { id: 'comboShield', name: 'コンボシールド', description: '5コンボ到達時にシールドを得る', nextDescription: '発動間隔が短くなる', category: 'combo', rarity: 'rare', maxLevel: 3 },
  { id: 'shield', name: 'シールド', description: '次のダメージを1回防ぐ', nextDescription: '所持数が増える', category: 'defense', rarity: 'common', maxLevel: 3 },
  { id: 'numberGuard', name: '数字保護', description: '数字ダウンを確率で防ぐ', nextDescription: '防御率が上がる', category: 'defense', rarity: 'rare', maxLevel: 4 },
  { id: 'courseRecovery', name: 'コース復帰', description: 'コースアウトを1回だけ中央復帰に変える', nextDescription: '復帰後の無敵が伸びる', category: 'defense', rarity: 'epic', maxLevel: 2 },
  { id: 'wallBonus', name: '壁破壊ボーナス', description: '壁破壊スコアが増える', nextDescription: '倍率が上がる', category: 'score', rarity: 'common', maxLevel: 5 },
  { id: 'comboBonus', name: 'コンボボーナス', description: 'コンボスコアが増える', nextDescription: '倍率が上がる', category: 'score', rarity: 'common', maxLevel: 5 },
  { id: 'riskReward', name: 'リスク報酬', description: '危険ルート通過時のスコアが増える', nextDescription: '報酬が増える', category: 'score', rarity: 'rare', maxLevel: 4 },
]

export const RARITY_LABELS = {
  common: 'コモン',
  rare: 'レア',
  epic: 'エピック',
} as const
