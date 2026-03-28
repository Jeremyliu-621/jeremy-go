import type {
  PokemonType,
  CaughtFriend,
  FriendStats,
  FriendProfile,
  Move,
} from "../types";
import { supabase } from "./supabase";

export interface GeneratedStats {
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  cp: number;
  stats: FriendStats;
  moves: Move[];
  description: string;
  flavorText: string;
}

interface DbRow {
  id: string;
  catcher_id: string;
  friend_id: string;
  username: string;
  photo_url: string;
  cp: number;
  primary_type: string;
  secondary_type: string | null;
  caught_at: string;
  stats: FriendStats;
  moves: Move[];
  description: string;
  flavor_text: string;
  pokedex_number: number;
}

function rowToCaughtFriend(row: DbRow): CaughtFriend {
  return {
    id: row.id,
    username: row.username,
    photoUrl: row.photo_url,
    cp: row.cp,
    primaryType: row.primary_type as PokemonType,
    secondaryType: row.secondary_type as PokemonType | undefined,
    caughtAt: row.caught_at,
    stats: row.stats,
    moves: row.moves,
    description: row.description,
    flavorText: row.flavor_text,
    pokedexNumber: row.pokedex_number,
  };
}

const ALL_TYPES: PokemonType[] = [
  "Normal", "Fire", "Water", "Grass", "Electric", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

const MOVE_TEMPLATES: Record<PokemonType, string[]> = {
  Normal: ["Friendship Slam", "Vibe Check", "Awkward Wave", "Small Talk"],
  Fire: ["Roast Session", "Hot Take", "Burn Notice", "Flame War"],
  Water: ["Tears of Joy", "Deep Dive", "Splash Zone", "Emotional Flood"],
  Grass: ["Touch Grass", "Grow Up", "Root Canal", "Leaf Me Alone"],
  Electric: ["Energy Surge", "Shock Factor", "Static Cling", "Power Nap"],
  Ice: ["Cold Shoulder", "Brain Freeze", "Icy Stare", "Chill Pill"],
  Fighting: ["Reality Check", "Power Move", "Glow Up", "Flex Zone"],
  Poison: ["Toxic Gossip", "Shade Throw", "Bitter Pill", "Venom Drip"],
  Ground: ["Down to Earth", "Earthquake Take", "Grounded", "Mud Sling"],
  Flying: ["Head in Clouds", "Fly By", "Air Strike", "Wing It"],
  Psychic: ["Mind Read", "Overthink", "Big Brain", "Psyche Out"],
  Bug: ["Bug Report", "Swarm Rush", "Buzz Kill", "Creepy Crawl"],
  Rock: ["Rock Solid", "Hard Headed", "Stone Cold", "Boulder Dash"],
  Ghost: ["Ghost Read", "Phantom Text", "Boo Scare", "Vanishing Act"],
  Dragon: ["Main Character Energy", "Dragon Breath", "Power Trip", "Rage Quit"],
  Dark: ["Plot Twist", "Dark Humor", "Shadow Sneak", "Night Owl"],
  Steel: ["Iron Will", "Steel Nerve", "Metal Head", "Armor Up"],
  Fairy: ["Charm Offensive", "Pixie Dust", "Fairy Tale", "Sparkle Bomb"],
};

const DESCRIPTIONS = [
  (name: string) => `${name} was first observed lurking in group chats. This species communicates primarily through memes and rarely appears before noon.`,
  (name: string) => `A wild ${name} is known for its unpredictable energy levels. Scientists theorize it is powered entirely by caffeine and spite.`,
  (name: string) => `${name} has been documented in various social habitats. It forms strong bonds with its trainer through shared snacks and inside jokes.`,
  (name: string) => `Field researchers note that ${name} emits a distinctive aura when excited. Approach with caution during karaoke sessions.`,
  (name: string) => `${name} is a rare specimen known for its ability to procrastinate at superhuman levels while still somehow getting things done.`,
  (name: string) => `The elusive ${name} prefers comfortable environments and is most active during late-night hours. Feeds primarily on takeout.`,
];

const FLAVOR_TEXTS = [
  (name: string) => `If ${name} says "trust me," you probably shouldn't.`,
  (name: string) => `${name}'s vibe is immaculate, but their sleep schedule is not.`,
  (name: string) => `Legends say ${name} once stayed up for 36 hours straight. The reason remains classified.`,
  (name: string) => `${name}: proof that chaos and charm can coexist.`,
  (name: string) => `Do not challenge ${name} to a trivia contest unless you enjoy losing.`,
  (name: string) => `${name}'s energy is contagious — and there is no cure.`,
];

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  spAttack: "SP.ATK",
  spDefense: "SP.DEF",
  speed: "SPD",
};

const STAT_ORDER = ["hp", "attack", "defense", "spAttack", "spDefense", "speed"] as const;

const STAT_MAX = 255;

const FLAVOR_LOADING_LINES = [
  "Consulting the Frienddex...",
  "Analyzing trainer aura...",
  "Cross-referencing personality data...",
  "Professor Oak is busy, hold on...",
  "Calibrating catch metrics...",
  "Decoding friendship wavelengths...",
];

export { STAT_LABELS, STAT_ORDER, STAT_MAX, FLAVOR_LOADING_LINES };

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 0x100000000;
  };
}

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randBetween(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function generateFriendStats(username: string): GeneratedStats {
  const rng = seededRandom(username + Date.now().toString());

  const primaryType = pickRandom(ALL_TYPES, rng);
  const hasSecondary = rng() > 0.35;
  let secondaryType: PokemonType | null = null;
  if (hasSecondary) {
    do {
      secondaryType = pickRandom(ALL_TYPES, rng);
    } while (secondaryType === primaryType);
  }

  const stats: FriendStats = {
    hp: randBetween(40, 220, rng),
    attack: randBetween(40, 220, rng),
    defense: randBetween(40, 220, rng),
    spAttack: randBetween(40, 220, rng),
    spDefense: randBetween(40, 220, rng),
    speed: randBetween(40, 220, rng),
  };

  const totalStats = Object.values(stats).reduce((a, b) => a + b, 0);
  const cp = Math.min(
    999,
    Math.max(100, Math.floor(totalStats / 7.5) + randBetween(-30, 30, rng)),
  );

  const primaryMoves = MOVE_TEMPLATES[primaryType];
  const secondaryMoves = secondaryType
    ? MOVE_TEMPLATES[secondaryType]
    : primaryMoves;
  const categories: Array<"Physical" | "Special" | "Status"> = [
    "Physical",
    "Special",
    "Status",
    "Physical",
  ];

  const moves: Move[] = [
    {
      name: pickRandom(primaryMoves, rng),
      type: primaryType,
      category: categories[0],
      power: randBetween(50, 120, rng),
      description: "A signature move that hits hard.",
    },
    {
      name: pickRandom(secondaryMoves, rng),
      type: secondaryType ?? primaryType,
      category: categories[1],
      power: randBetween(60, 130, rng),
      description: "Unleashes stored-up energy.",
    },
    {
      name: pickRandom(primaryMoves, rng),
      type: primaryType,
      category: categories[2],
      power: 0,
      description: "A strategic play that shifts the momentum.",
    },
    {
      name: pickRandom(
        ALL_TYPES.map((t) => pickRandom(MOVE_TEMPLATES[t], rng)),
        rng,
      ),
      type: pickRandom(ALL_TYPES, rng),
      category: categories[3],
      power: randBetween(40, 100, rng),
      description: "A wild card move nobody sees coming.",
    },
  ];

  return {
    primaryType,
    secondaryType,
    cp,
    stats,
    moves,
    description: pickRandom(DESCRIPTIONS, rng)(username),
    flavorText: pickRandom(FLAVOR_TEXTS, rng)(username),
  };
}

export async function checkNameTaken(
  catcherId: string,
  name: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("caught_friends")
    .select("id")
    .eq("catcher_id", catcherId)
    .eq("username", name)
    .maybeSingle();
  return !!data;
}

export async function saveCatch(
  catcherId: string,
  friend: FriendProfile,
  statsData: GeneratedStats,
  nickname: string,
): Promise<CaughtFriend> {
  const { count } = await supabase
    .from("caught_friends")
    .select("*", { count: "exact", head: true })
    .eq("catcher_id", catcherId);

  const nextNumber = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("caught_friends")
    .insert({
      catcher_id: catcherId,
      friend_id: friend.id,
      username: nickname,
      photo_url: friend.photoUrl,
      cp: statsData.cp,
      primary_type: statsData.primaryType,
      secondary_type: statsData.secondaryType,
      stats: statsData.stats,
      moves: statsData.moves,
      description: statsData.description,
      flavor_text: statsData.flavorText,
      pokedex_number: nextNumber,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save catch");
  }

  return rowToCaughtFriend(data as DbRow);
}

export async function fetchFrienddex(
  catcherId: string,
): Promise<CaughtFriend[]> {
  const { data, error } = await supabase
    .from("caught_friends")
    .select("*")
    .eq("catcher_id", catcherId)
    .order("caught_at", { ascending: false });

  if (error || !data) return [];
  return (data as DbRow[]).map(rowToCaughtFriend);
}

export async function fetchFriendDetail(
  catcherId: string,
  entryId: string,
): Promise<CaughtFriend | null> {
  const { data, error } = await supabase
    .from("caught_friends")
    .select("*")
    .eq("catcher_id", catcherId)
    .eq("id", entryId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCaughtFriend(data as DbRow);
}
