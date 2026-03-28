import type {
  PokemonType,
  CaughtFriend,
  FriendStats,
  FriendProfile,
  Move,
} from "../types";
import { supabase } from "./supabase";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
  "Consulting the Chuddex...",
  "Analyzing aura...",
  "Cross-referencing personality data...",
  "Professor Oak is busy, hold on...",
  "Calibrating catch metrics...",
  "Decoding wavelengths...",
];

export { STAT_LABELS, STAT_ORDER, STAT_MAX, FLAVOR_LOADING_LINES };

function buildPrompt(username: string, hasPhoto: boolean): string {
  const photoInstructions = hasPhoto
    ? `A photo of this person is attached. Look at them. Use what you actually see — their face, expression, what they're wearing, their posture, the setting — to decide everything. Be specific and observational, not generic.`
    : `No photo available. Base everything on the name alone.`;

  return `You're generating a profile for a person named "${username}" in a game where you catch people like Pokémon.

${photoInstructions}

TONE RULES — THIS IS IMPORTANT:
- Write like a normal person, not like a corporate AI trying to be funny
- NO puns. NO wordplay on the person's name. NO "vibe check" or "main character energy" or any played-out internet slang
- Move names should sound like real Pokémon moves — short, punchy, abstract. Think "Thunderbolt", "Sludge Bomb", "Calm Mind", "Iron Head". They should fit the TYPE, not literally describe what you see in the photo. Do NOT name moves after their clothing or specific objects in the image. The photo informs the type/vibe, the moves come from the type.
- Descriptions should read like actual Pokédex entries — deadpan, matter-of-fact, slightly absurd observations about the person's personality. Think "It sleeps 14 hours a day but claims to be busy" not "This creature is powered by caffeine and vibes!!!"
- Flavor text: one short dry sentence. Understated. Not trying to be epic or inspirational
- The photo is for getting a read on the person's energy and picking types/stats. Do NOT just list what you see in the photo. Use it subtly.
- For types: DO NOT default to Normal or Psychic. Those are boring safe picks. Look at the person and commit to something interesting. Someone in red? Fire. Looking tough? Fighting. Dark clothes? Dark or Ghost. Bright colors? Fairy or Electric. Use ALL 18 types. Psychic and Normal should be rare, not the default.
- Stats should use the FULL range 40-220. Be generous — most stats should be 80-180. Give at least one or two stats above 150. Don't cluster everything around 60-90, that's boring. Make the stat spread interesting with clear strengths and weaknesses.
- If you catch yourself writing something that sounds like it came from a motivational poster or a BuzzFeed quiz, delete it and try again

Valid types: ${ALL_TYPES.join(", ")}

CP (Combat Power): single number 100-999 reflecting overall power level. Spread it out — use the whole range. Some people are 200, some are 700. Don't just default to high numbers.

Return ONLY valid JSON matching this schema:
{
  "primaryType": "<type based on what you actually see/sense>",
  "secondaryType": "<type or null>",
  "cp": <100-999>,
  "stats": {
    "hp": <40-220>,
    "attack": <40-220>,
    "defense": <40-220>,
    "spAttack": <40-220>,
    "spDefense": <40-220>,
    "speed": <40-220>
  },
  "moves": [
    {
      "name": "<short, dry move name>",
      "type": "<type>",
      "category": "<Physical|Special|Status>",
      "power": <0-130, 0 for Status>,
      "description": "<one sentence, deadpan>"
    }
  ],
  "description": "<2-3 sentences, pokédex style, dry and specific>",
  "flavorText": "<one short dry sentence>"
}

Exactly 4 moves. No markdown. No code fences. Just JSON.`;
}

function validateResponse(data: unknown): GeneratedStats {
  const d = data as Record<string, unknown>;

  const primaryType = d.primaryType as string;
  if (!ALL_TYPES.includes(primaryType as PokemonType)) {
    throw new Error("Invalid primaryType from API");
  }

  let secondaryType: PokemonType | null = null;
  if (d.secondaryType && ALL_TYPES.includes(d.secondaryType as PokemonType)) {
    secondaryType = d.secondaryType as PokemonType;
  }

  const rawStats = d.stats as Record<string, number>;
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(v || min)));

  const stats: FriendStats = {
    hp: clamp(rawStats.hp, 40, 220),
    attack: clamp(rawStats.attack, 40, 220),
    defense: clamp(rawStats.defense, 40, 220),
    spAttack: clamp(rawStats.spAttack, 40, 220),
    spDefense: clamp(rawStats.spDefense, 40, 220),
    speed: clamp(rawStats.speed, 40, 220),
  };

  const cp = clamp(d.cp as number, 100, 999);

  const rawMoves = d.moves as Array<Record<string, unknown>>;
  const moves: Move[] = (rawMoves || []).slice(0, 4).map((m) => ({
    name: String(m.name || "Unknown Move"),
    type: ALL_TYPES.includes(m.type as PokemonType)
      ? (m.type as PokemonType)
      : (primaryType as PokemonType),
    category: (["Physical", "Special", "Status"].includes(m.category as string)
      ? m.category
      : "Physical") as Move["category"],
    power: clamp(m.power as number, 0, 130),
    description: String(m.description || ""),
  }));

  return {
    primaryType: primaryType as PokemonType,
    secondaryType,
    cp,
    stats,
    moves,
    description: String(d.description || `${primaryType}-type creature.`),
    flavorText: String(d.flavorText || "A mysterious specimen."),
  };
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

export async function generateFriendStats(
  username: string,
  photoUrl?: string,
): Promise<GeneratedStats> {
  const hasPhoto = !!photoUrl && photoUrl.startsWith("data:");
  const prompt = buildPrompt(username, hasPhoto);

  const parts: Array<Record<string, unknown>> = [];

  if (hasPhoto) {
    const parsed = parseDataUrl(photoUrl!);
    if (parsed) {
      parts.push({
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.base64,
        },
      });
    }
  }

  parts.push({ text: prompt });

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 1.0,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const body = await res.json();
  const text =
    body?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  const parsed = JSON.parse(text);
  return validateResponse(parsed);
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

export async function fetchChuddex(
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
