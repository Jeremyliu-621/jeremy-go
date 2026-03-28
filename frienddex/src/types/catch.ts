import type { PokemonType } from './database'

export interface CatchTarget {
  id: string
  username: string
  photoUrl: string
  cp: number
  primaryType: PokemonType
  secondaryType?: PokemonType
}

export type CatchPhase =
  | 'ready'
  | 'aiming'
  | 'throwing'
  | 'absorbing'
  | 'wobbling'
  | 'success'
  | 'escaped'
  | 'transitioning'
