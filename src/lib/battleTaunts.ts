/** Short trash-talk lines for battle speech bubbles (attacker vs. person taking the hit). */

const ATTACKER: string[] = [
  "ur so bad",
  "too easy",
  "sit down",
  "cry about it",
  "skill issue",
  "that all?",
  "learn to play",
  "bodied",
  "gg ez",
  "nice try lol",
  "wasted",
  "get good",
];

const DEFENDER: string[] = [
  "screw you!",
  "cheap shot!",
  "not cool!",
  "ow ow ow",
  "that hurt!",
  "you wish",
  "lucky hit",
  "whatever",
  "still standing",
  "really?!",
  "rude much",
];

function pick<T>(lines: T[], seed: number): T {
  return lines[Math.floor(seed * lines.length) % lines.length];
}

/** `salt` varies per hit so repeats feel less same-y */
export function getTauntPair(salt: number): { attacker: string; defender: string } {
  const a = (Math.sin(salt * 12.9898) * 43758.5453) % 1;
  const b = (Math.cos(salt * 78.233) * 12345.6789) % 1;
  const aa = a < 0 ? a + 1 : a;
  const bb = b < 0 ? b + 1 : b;
  return {
    attacker: pick(ATTACKER, aa),
    defender: pick(DEFENDER, bb),
  };
}
