import type { PokemonType } from '../types/database'

export const TYPE_COLORS: Record<PokemonType, string> = {
  Normal:   '#A8A878',
  Fire:     '#F08030',
  Water:    '#6890F0',
  Grass:    '#78C850',
  Electric: '#F8D030',
  Ice:      '#98D8D8',
  Fighting: '#C03028',
  Poison:   '#A040A0',
  Ground:   '#E0C068',
  Flying:   '#A890F0',
  Psychic:  '#F85888',
  Bug:      '#A8B820',
  Rock:     '#B8A038',
  Ghost:    '#705898',
  Dragon:   '#7038F8',
  Dark:     '#705848',
  Steel:    '#B8B8D0',
  Fairy:    '#EE99AC',
}

export function getTypeColor(type: PokemonType): string {
  return TYPE_COLORS[type]
}

export const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  spAttack: 'SP.ATK',
  spDefense: 'SP.DEF',
  speed: 'SPD',
}

export const STAT_ORDER = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const

export const STAT_MAX = 255

export const FLAVOR_TEXT_LINES = [
  'Consulting Jeremy GO!...',
  'Analyzing trainer aura...',
  'Cross-referencing personality data...',
  'Professor Oak is busy, hold on...',
  'Calibrating catch metrics...',
  'Decoding friendship wavelengths...',
]

export function getStatColor(value: number): string {
  if (value <= 50) return '#F34444'
  if (value <= 100) return '#FF7F0F'
  if (value <= 150) return '#FFDD57'
  if (value <= 200) return '#A0E515'
  return '#23CD5E'
}
