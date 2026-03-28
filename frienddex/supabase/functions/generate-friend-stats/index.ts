// Supabase Edge Function — Deno runtime
// Calls Google Gemini to generate a Pokédex-style entry from personality data.
// Deploy with: supabase functions deploy generate-friend-stats
// Required secret: GEMINI_API_KEY (set via supabase secrets set)

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const VALID_TYPES = [
  "Normal", "Fire", "Water", "Grass", "Electric", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

const SYSTEM_PROMPT = `You are a Pokédex AI that generates personality-based Pokémon-style entries for real people.

Given a person's name and their answers to 5 personality questions, generate a creative and fun Pokédex entry.

Return ONLY valid JSON (no markdown, no code fences) matching this exact schema:

{
  "primaryType": "<one of: Normal, Fire, Water, Grass, Electric, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy>",
  "secondaryType": "<same type options, or null if single-type>",
  "cp": <integer between 100 and 999>,
  "stats": {
    "hp": <integer 1-255>,
    "attack": <integer 1-255>,
    "defense": <integer 1-255>,
    "spAttack": <integer 1-255>,
    "spDefense": <integer 1-255>,
    "speed": <integer 1-255>
  },
  "moves": [
    {
      "name": "<creative pun or personality-based move name>",
      "type": "<Pokémon type>",
      "category": "<Physical|Special|Status>",
      "power": <integer 0-150, use 0 for Status moves>,
      "description": "<one witty sentence describing the move>"
    },
    <...3 more moves, exactly 4 total>
  ],
  "description": "<2-3 sentence Pokédex-style description of this person as if they were a Pokémon. Write in the detached, observational tone of a real Pokédex entry.>",
  "flavorText": "<one witty, memorable sentence — the kind you'd see on a trading card>"
}

Rules:
- Types MUST reflect the person's personality traits. Bookish/analytical → Psychic. Athletic/competitive → Fighting. Creative/dreamy → Fairy. etc.
- Move names should be creative puns or references to the person's traits. Never use real Pokémon move names.
- At least one move should match the primary type, one should match the secondary type (if any).
- Include at least one Status move.
- Stats should reflect personality: an energetic person gets high Speed, a stubborn person gets high Defense, etc.
- CP should roughly correlate with the total stat power.
- The description should sound like an actual Pokédex entry — third person, observational, slightly scientific tone.
- The flavorText should be witty and quotable.
- Return ONLY the JSON object. No explanation, no markdown formatting.`;

function buildUserPrompt(username: string, answers: string[]): string {
  return `Generate a Pokédex entry for a person named "${username}".

Their personality profile (answers to 5 questions):
1. ${answers[0] ?? "No answer provided"}
2. ${answers[1] ?? "No answer provided"}
3. ${answers[2] ?? "No answer provided"}
4. ${answers[3] ?? "No answer provided"}
5. ${answers[4] ?? "No answer provided"}`;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndClean(raw: any): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;

  const primaryType = VALID_TYPES.includes(raw.primaryType) ? raw.primaryType : null;
  if (!primaryType) return null;

  const secondaryType =
    raw.secondaryType && VALID_TYPES.includes(raw.secondaryType)
      ? raw.secondaryType
      : null;

  const stats = raw.stats;
  if (!stats || typeof stats !== "object") return null;

  const cleanStats = {
    hp: clamp(Number(stats.hp) || 100, 1, 255),
    attack: clamp(Number(stats.attack) || 100, 1, 255),
    defense: clamp(Number(stats.defense) || 100, 1, 255),
    spAttack: clamp(Number(stats.spAttack) || 100, 1, 255),
    spDefense: clamp(Number(stats.spDefense) || 100, 1, 255),
    speed: clamp(Number(stats.speed) || 100, 1, 255),
  };

  if (!Array.isArray(raw.moves) || raw.moves.length < 4) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanMoves = raw.moves.slice(0, 4).map((m: any) => ({
    name: String(m.name || "Unknown Move"),
    type: VALID_TYPES.includes(m.type) ? m.type : primaryType,
    category: ["Physical", "Special", "Status"].includes(m.category)
      ? m.category
      : "Special",
    power: clamp(Number(m.power) || 0, 0, 150),
    description: String(m.description || "A mysterious move."),
  }));

  return {
    primaryType,
    secondaryType,
    cp: clamp(Number(raw.cp) || 500, 100, 999),
    stats: cleanStats,
    moves: cleanMoves,
    description: String(raw.description || "A mysterious trainer."),
    flavorText: String(raw.flavorText || "Gotta catch 'em all."),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { username, personalityAnswers } = body;

    if (
      !username ||
      typeof username !== "string" ||
      !Array.isArray(personalityAnswers) ||
      personalityAnswers.length < 1
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid 'username' (string) and 'personalityAnswers' (string[])",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const userPrompt = buildUserPrompt(username, personalityAnswers);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "Gemini API call failed", details: errText }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const geminiData: GeminiResponse = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: rawText }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const validated = validateAndClean(parsed);
    if (!validated) {
      return new Response(
        JSON.stringify({ error: "AI response failed validation", raw: parsed }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(validated), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
