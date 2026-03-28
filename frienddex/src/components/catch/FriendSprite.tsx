import { motion, type Variants } from 'framer-motion'
import type { CatchPhase, CatchTarget } from '../../types/catch'
import { TYPE_COLORS } from '../../lib/constants'
import type { PokemonType } from '../../types/database'

const spriteVariants: Variants = {
  idle: { scale: 1, opacity: 1, y: 0 },
  absorbing: {
    scale: 0,
    opacity: 0,
    y: 80,
    transition: { duration: 0.5, ease: 'easeIn' },
  },
  escaped: {
    scale: [0, 0.3, 1.1, 1],
    opacity: [0, 0.5, 1, 1],
    y: [80, 40, -8, 0],
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

interface Props {
  friend: CatchTarget
  phase: CatchPhase
}

export function FriendSprite({ friend, phase }: Props) {
  const typeColor = TYPE_COLORS[friend.primaryType as PokemonType] ?? '#A8A878'
  const isVisible = phase === 'ready' || phase === 'aiming' || phase === 'escaped'
  const animState =
    phase === 'absorbing'
      ? 'absorbing'
      : phase === 'escaped'
        ? 'escaped'
        : 'idle'

  const shouldShow = isVisible || phase === 'absorbing'
  if (!shouldShow) return null

  return (
    <motion.div
      className="relative flex flex-col items-center"
      variants={spriteVariants}
      animate={animState}
    >
      <div
        className="absolute"
        style={{
          bottom: '-8px',
          width: '140px',
          height: '20px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
          filter: 'blur(3px)',
        }}
      />

      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: 'min(130px, 28vw)',
          height: 'min(130px, 28vw)',
          border: `4px solid ${typeColor}`,
          boxShadow: `0 0 20px ${typeColor}44, 0 8px 24px rgba(0,0,0,0.3)`,
        }}
      >
        {friend.photoUrl ? (
          <img
            src={friend.photoUrl}
            alt={friend.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl font-extrabold"
            style={{
              background: `linear-gradient(135deg, ${typeColor}CC, ${typeColor}88)`,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {friend.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `inset 0 0 20px ${typeColor}33` }}
        />
      </div>
    </motion.div>
  )
}
