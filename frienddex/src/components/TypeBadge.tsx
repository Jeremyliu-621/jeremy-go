import type { PokemonType } from '../types/database'
import { TYPE_COLORS } from '../lib/constants'

export function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  )
}
