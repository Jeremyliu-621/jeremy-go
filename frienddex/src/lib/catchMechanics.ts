const BASE_CATCH_RATE = 0.45
const NEVER_CAUGHT_BONUS = 0.2
const THROW_ACCURACY_FACTOR = 0.15

export interface ThrowResult {
  caught: boolean
  wobbles: number
}

export function rollCatch(opts: {
  neverCaughtBefore: boolean
  throwAccuracy: number
}): ThrowResult {
  let rate = BASE_CATCH_RATE
  if (opts.neverCaughtBefore) rate += NEVER_CAUGHT_BONUS
  rate += opts.throwAccuracy * THROW_ACCURACY_FACTOR
  rate = Math.min(rate, 0.95)

  const roll = Math.random()
  if (roll < rate) {
    return { caught: true, wobbles: 3 }
  }

  const wobbles = roll < rate + 0.15 ? 2 : roll < rate + 0.3 ? 1 : 0
  return { caught: false, wobbles: Math.max(wobbles, 1) }
}
