export interface FriendProfile {
  id: string;
  username: string;
  photoUrl: string;
  cp: number;
  primaryType: PokemonType;
  secondaryType?: PokemonType;
}

export interface CaughtFriend extends FriendProfile {
  caughtAt: string;
  stats: FriendStats;
  moves: Move[];
  description: string;
  flavorText: string;
  pokedexNumber: number;
}

export interface FriendStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface Move {
  name: string;
  type: PokemonType;
  category: "Physical" | "Special" | "Status";
  power: number;
  description: string;
}

export type PokemonType =
  | "Normal"
  | "Fire"
  | "Water"
  | "Grass"
  | "Electric"
  | "Ice"
  | "Fighting"
  | "Poison"
  | "Ground"
  | "Flying"
  | "Psychic"
  | "Bug"
  | "Rock"
  | "Ghost"
  | "Dragon"
  | "Dark"
  | "Steel"
  | "Fairy";

export interface DetectedFace {
  boundingBox: { x: number; y: number; width: number; height: number };
  matchedUser: FriendProfile | null;
}

export type CatchPhase =
  | "ready"
  | "aiming"
  | "throwing"
  | "absorbing"
  | "wobbling"
  | "success"
  | "escaped"
  | "transitioning";

export const TYPE_COLORS: Record<PokemonType, string> = {
  Normal: "#A8A878",
  Fire: "#F08030",
  Water: "#6890F0",
  Grass: "#78C850",
  Electric: "#F8D030",
  Ice: "#98D8D8",
  Fighting: "#C03028",
  Poison: "#A040A0",
  Ground: "#E0C068",
  Flying: "#A890F0",
  Psychic: "#F85888",
  Bug: "#A8B820",
  Rock: "#B8A038",
  Ghost: "#705898",
  Dragon: "#7038F8",
  Dark: "#705848",
  Steel: "#B8B8D0",
  Fairy: "#EE99AC",
};

export const MOCK_FRIEND: FriendProfile = {
  id: "demo-friend-001",
  username: "Chud",
  photoUrl: "",
  cp: 247,
  primaryType: "Electric",
  secondaryType: "Psychic",
};
