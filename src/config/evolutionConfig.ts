export const EVOLUTION_RANKS = [
  { rank: 1, name: 'ノーマル', accent: '#33c7ff' },
  { rank: 2, name: 'ブロンズ', accent: '#d48a4a' },
  { rank: 3, name: 'シルバー', accent: '#c9d4df' },
  { rank: 4, name: 'ゴールド', accent: '#ffd84d' },
  { rank: 5, name: 'プラチナ', accent: '#b8fff6' },
] as const

export function getEvolutionRankName(rank: number) {
  return EVOLUTION_RANKS[rank - 1]?.name ?? `ランク ${rank}`
}

export function getEvolutionAccent(rank: number) {
  return EVOLUTION_RANKS[rank - 1]?.accent ?? '#ffffff'
}
