export interface ThrowResult {
  caught: boolean
  wobbles: number
}

export function rollCatch(opts: {
  neverCaughtBefore: boolean
  throwAccuracy: number
}): ThrowResult {
  const bonus = opts.neverCaughtBefore ? 0.05 : 0
  const rate = Math.min(opts.throwAccuracy + bonus, 0.98)

  const roll = Math.random()
  if (roll < rate) {
    return { caught: true, wobbles: 3 }
  }

  const wobbles = roll < rate + 0.15 ? 2 : roll < rate + 0.3 ? 1 : 0
  return { caught: false, wobbles: Math.max(wobbles, 1) }
}
