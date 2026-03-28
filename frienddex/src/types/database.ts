export type PokemonType =
  | 'Normal' | 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice'
  | 'Fighting' | 'Poison' | 'Ground' | 'Flying' | 'Psychic' | 'Bug'
  | 'Rock' | 'Ghost' | 'Dragon' | 'Dark' | 'Steel' | 'Fairy'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  personality_answers: string[]
  created_at: string
  profile_complete: boolean
}

export interface UserFace {
  id: string
  user_id: string
  face_descriptor: number[]
  created_at: string
}

export interface PokedexEntry {
  id: string
  user_id: string
  target_user_id: string
  primary_type: PokemonType
  secondary_type: PokemonType | null
  cp: number
  stats: {
    hp: number
    attack: number
    defense: number
    spAttack: number
    spDefense: number
    speed: number
  }
  moves: {
    name: string
    type: PokemonType
    category: 'Physical' | 'Special' | 'Status'
    power: number
    description: string
  }[]
  description: string
  flavor_text: string
  created_at: string
}

export interface CaughtFriend {
  id: string
  catcher_id: string
  caught_user_id: string
  pokedex_entry_id: string
  caught_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      user_faces: {
        Row: UserFace
        Insert: Omit<UserFace, 'id' | 'created_at'>
        Update: Partial<Omit<UserFace, 'id' | 'created_at'>>
      }
      pokedex_entries: {
        Row: PokedexEntry
        Insert: Omit<PokedexEntry, 'id' | 'created_at'>
        Update: Partial<Omit<PokedexEntry, 'id' | 'created_at'>>
      }
      caught_friends: {
        Row: CaughtFriend
        Insert: Omit<CaughtFriend, 'id' | 'caught_at'>
        Update: Partial<Omit<CaughtFriend, 'id' | 'caught_at'>>
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
