import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import type { PokedexEntry, PokemonType } from '../types/database'
import { TypeBadge } from '../components/TypeBadge'
import { PokeballSpinner } from '../components/PokeballSpinner'
import {
  TYPE_COLORS,
  STAT_LABELS,
  STAT_ORDER,
  STAT_MAX,
  getStatColor,
} from '../lib/constants'

interface RevealState {
  entry: PokedexEntry
  friendUsername: string
  friendPhotoUrl: string
}

function StatBar({
  label,
  value,
  delay,
}: {
  label: string
  value: number
  delay: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const pct = Math.min((value / STAT_MAX) * 100, 100)
  const color = getStatColor(value)

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={visible ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <span
        className="w-14 text-right text-xs font-bold tracking-wide text-gray-400"
        style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
      >
        {label}
      </span>
      <span className="w-9 text-right text-sm font-bold text-white">{value}</span>
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={visible ? { width: `${pct}%` } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  )
}

function MoveCard({
  move,
  index,
}: {
  move: PokedexEntry['moves'][number]
  index: number
}) {
  const typeColor = TYPE_COLORS[move.type as PokemonType] || '#A8A878'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.8 + index * 0.12 }}
      className="rounded-xl p-3"
      style={{
        background: `linear-gradient(135deg, ${typeColor}22, ${typeColor}11)`,
        border: `1px solid ${typeColor}44`,
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className="text-sm font-bold text-white"
          style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
        >
          {move.name}
        </span>
        {move.power > 0 && (
          <span className="text-xs font-bold text-gray-400">
            {move.power}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
          style={{ backgroundColor: typeColor }}
        >
          {move.type}
        </span>
        <span className="text-[10px] text-gray-500">{move.category}</span>
      </div>
    </motion.div>
  )
}

function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2
    const dist = 60 + Math.random() * 80
    const tx = Math.cos(angle) * dist
    const ty = Math.sin(angle) * dist
    const size = 4 + Math.random() * 6
    const hue = Math.random() * 360
    const delay = Math.random() * 0.3

    return { tx, ty, size, hue, delay, id: i }
  })

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: `hsl(${p.hue}, 80%, 65%)`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0.3 }}
          transition={{ duration: 1, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

export function RevealScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as RevealState | null

  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 600)
    return () => clearTimeout(timer)
  }, [])

  if (!state?.entry) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <PokeballSpinner size={48} />
      </div>
    )
  }

  const { entry, friendUsername, friendPhotoUrl } = state
  const primaryColor =
    TYPE_COLORS[entry.primary_type as PokemonType] || '#A8A878'

  return (
    <motion.div
      className="fixed inset-0 overflow-y-auto bg-navy"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* White flash on entry */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 bg-white"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      <div className="relative mx-auto flex min-h-full max-w-md flex-col items-center px-6 pb-12 pt-16">
        {/* Confetti */}
        <AnimatePresence>{showConfetti && <ConfettiBurst />}</AnimatePresence>

        {/* Friend photo with glow */}
        <motion.div
          className="relative mb-6"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            type: 'spring',
            stiffness: 200,
            damping: 18,
          }}
        >
          <div
            className="absolute -inset-3 rounded-full opacity-50 blur-xl"
            style={{ backgroundColor: primaryColor }}
          />
          <div
            className="relative h-36 w-36 overflow-hidden rounded-full border-4"
            style={{ borderColor: primaryColor }}
          >
            {friendPhotoUrl ? (
              <img
                src={friendPhotoUrl}
                alt={friendUsername}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl font-black text-white"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}88, ${primaryColor}44)`,
                }}
              >
                {friendUsername.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1
          className="mb-1 text-2xl font-black text-white"
          style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {friendUsername}
        </motion.h1>

        {/* Pokédex number (use entry id first 4 chars) */}
        <motion.p
          className="mb-4 font-mono text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          #{entry.id.slice(0, 4).toUpperCase()}
        </motion.p>

        {/* Type badges */}
        <motion.div
          className="mb-5 flex gap-2"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
        >
          <TypeBadge type={entry.primary_type} />
          {entry.secondary_type && <TypeBadge type={entry.secondary_type} />}
        </motion.div>

        {/* CP counter */}
        <motion.div
          className="mb-6 flex items-baseline gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-xs font-bold tracking-wider text-gray-500">
            CP
          </span>
          <motion.span
            className="text-3xl font-black text-white"
            style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
          >
            {entry.cp}
          </motion.span>
        </motion.div>

        {/* Description */}
        <motion.p
          className="mb-8 text-center text-sm italic leading-relaxed text-gray-400"
          style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          {entry.description}
        </motion.p>

        {/* Stats */}
        <div className="mb-8 w-full space-y-2.5">
          {STAT_ORDER.map((key, i) => (
            <StatBar
              key={key}
              label={STAT_LABELS[key]}
              value={entry.stats[key as keyof typeof entry.stats]}
              delay={1100 + i * 150}
            />
          ))}
        </div>

        {/* Moves */}
        <div className="mb-8 grid w-full grid-cols-2 gap-3">
          {entry.moves.slice(0, 4).map((move, i) => (
            <MoveCard key={move.name} move={move} index={i} />
          ))}
        </div>

        {/* Flavor text */}
        {entry.flavor_text && (
          <motion.p
            className="mb-6 text-center text-xs italic text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4 }}
          >
            "{entry.flavor_text}"
          </motion.p>
        )}

        {/* Added banner */}
        <motion.p
          className="mb-6 text-center text-lg font-black"
          style={{
            fontFamily: "'Poppins', 'Nunito', sans-serif",
            color: '#FFCB05',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 2.6,
            duration: 0.5,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          Added to your Frienddex!
        </motion.p>

        {/* View in Frienddex button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.4 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/', { replace: true })}
          className="w-full max-w-xs rounded-2xl py-4 text-center font-bold text-navy"
          style={{
            fontFamily: "'Poppins', 'Nunito', sans-serif",
            background: 'linear-gradient(135deg, #FFCB05, #FFD94A)',
            boxShadow: '0 4px 20px rgba(255, 203, 5, 0.3)',
          }}
        >
          View in Frienddex
        </motion.button>
      </div>
    </motion.div>
  )
}
