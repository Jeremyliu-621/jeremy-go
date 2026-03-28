import type { CaughtFriend, Move, PokemonType } from "../types";

export interface BattlePokemon {
  friend: CaughtFriend;
  currentHp: number;
  maxHp: number;
}

export interface BattleLogEntry {
  text: string;
}

export type BattlePhase = "intro" | "player-turn" | "moves" | "animating" | "opponent-turn" | "victory" | "defeat" | "ran";

const TYPE_EFFECTIVENESS: Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  Fire: { Grass: 2, Ice: 2, Bug: 2, Steel: 2, Water: 0.5, Rock: 0.5, Fire: 0.5, Dragon: 0.5 },
  Water: { Fire: 2, Ground: 2, Rock: 2, Water: 0.5, Grass: 0.5, Dragon: 0.5 },
  Grass: { Water: 2, Ground: 2, Rock: 2, Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5 },
  Electric: { Water: 2, Flying: 2, Grass: 0.5, Electric: 0.5, Dragon: 0.5, Ground: 0 },
  Ice: { Grass: 2, Ground: 2, Flying: 2, Dragon: 2, Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Fairy: 0.5, Ghost: 0 },
  Poison: { Grass: 2, Fairy: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
  Ground: { Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2, Grass: 0.5, Bug: 0.5, Flying: 0 },
  Flying: { Grass: 2, Fighting: 2, Bug: 2, Electric: 0.5, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Steel: 0.5, Dark: 0 },
  Bug: { Grass: 2, Psychic: 2, Dark: 2, Fire: 0.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5 },
  Rock: { Fire: 2, Ice: 2, Flying: 2, Bug: 2, Fighting: 0.5, Ground: 0.5, Steel: 0.5 },
  Ghost: { Psychic: 2, Ghost: 2, Dark: 0.5, Normal: 0 },
  Dragon: { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark: { Psychic: 2, Ghost: 2, Fighting: 0.5, Dark: 0.5, Fairy: 0.5 },
  Steel: { Ice: 2, Rock: 2, Fairy: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5 },
  Fairy: { Fighting: 2, Dragon: 2, Dark: 2, Fire: 0.5, Poison: 0.5, Steel: 0.5 },
  Normal: { Rock: 0.5, Steel: 0.5, Ghost: 0 },
};

function getEffectiveness(moveType: PokemonType, defenderType: PokemonType): number {
  return TYPE_EFFECTIVENESS[moveType]?.[defenderType] ?? 1;
}

function getTotalEffectiveness(moveType: PokemonType, defender: CaughtFriend): number {
  let mult = getEffectiveness(moveType, defender.primaryType);
  if (defender.secondaryType) {
    mult *= getEffectiveness(moveType, defender.secondaryType);
  }
  return mult;
}

export function calculateDamage(
  attacker: CaughtFriend,
  defender: CaughtFriend,
  move: Move,
): { damage: number; effectiveness: number } {
  if (move.power === 0) {
    return { damage: 0, effectiveness: 1 };
  }

  const atkStat = move.category === "Physical" ? attacker.stats.attack : attacker.stats.spAttack;
  const defStat = move.category === "Physical" ? defender.stats.defense : defender.stats.spDefense;

  // Simplified Pokemon damage formula
  const level = Math.max(1, Math.floor(attacker.cp / 20));
  const baseDamage = ((2 * level / 5 + 2) * move.power * (atkStat / defStat)) / 50 + 2;

  const effectiveness = getTotalEffectiveness(move.type, defender);

  // STAB (Same Type Attack Bonus)
  const stab = (move.type === attacker.primaryType || move.type === attacker.secondaryType) ? 1.5 : 1;

  // Random factor 0.85–1.0
  const random = 0.85 + Math.random() * 0.15;

  const damage = Math.max(1, Math.floor(baseDamage * effectiveness * stab * random));
  return { damage, effectiveness };
}

export function getEffectivenessText(effectiveness: number): string | null {
  if (effectiveness >= 2) return "It's super effective!";
  if (effectiveness > 0 && effectiveness < 1) return "It's not very effective...";
  if (effectiveness === 0) return "It had no effect...";
  return null;
}

export function cpuPickMove(pokemon: CaughtFriend): Move {
  const validMoves = pokemon.moves.filter((m) => m.power > 0);
  const pool = validMoves.length > 0 ? validMoves : pokemon.moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getSpeedOrder(
  player: CaughtFriend,
  opponent: CaughtFriend,
): "player" | "opponent" {
  if (player.stats.speed === opponent.stats.speed) {
    return Math.random() < 0.5 ? "player" : "opponent";
  }
  return player.stats.speed > opponent.stats.speed ? "player" : "opponent";
}

export function createBattlePokemon(friend: CaughtFriend): BattlePokemon {
  return {
    friend,
    currentHp: friend.stats.hp,
    maxHp: friend.stats.hp,
  };
}
