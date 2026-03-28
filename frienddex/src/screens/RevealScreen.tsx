import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { generateFriendStats, saveCatch } from '../lib/frienddex'
import { supabase } from '../lib/supabase'
import { PokeballSpinner } from '../components/PokeballSpinner'
import { TypeBadge } from '../components/TypeBadge'
import { getTypeColor, STAT_LABELS, STAT_ORDER, STAT_MAX, FLAVOR_TEXT_LINES } from '../lib/constants'
import type { PokedexEntry, Profile } from '../types/database'
import type { CatchTarget } from '../types/catch'

type RevealState = 'loading' | 'revealing' | 'done' | 'error'

export function RevealScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const friend = (location.state as { friend?: CatchTarget })?.friend
  const [state, setState] = useState<RevealState>('loading')
  const [entry, setEntry] = useState<PokedexEntry | null>(null)
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [flavorIdx, setFlavorIdx] = useState(0)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!friend || !user || hasStarted.current) return
    hasStarted.current = true

    const run = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', friend.id)
          .single()

        if (profile) setTargetProfile(profile as Profile)

        const answers = (profile as Profile | null)?.personality_answers ?? []

        const stats = generateFriendStats(friend.username, answers)

        const { entry: savedEntry } = await saveCatch(
          user.id,
          friend.id,
          stats,
        )

        setEntry(savedEntry)
        setState('revealing')

        setTimeout(() => setState('done'), 600)
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
        setState('error')
      }
    }
    run()
  }, [friend, user])

  useEffect(() => {
    if (state !== 'loading') return
    const interval = setInterval(() => {
      setFlavorIdx((i) => (i + 1) % FLAVOR_TEXT_LINES.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [state])

  if (!friend) {
    return (
      <div className="fixed inset-0 bg-navy flex items-center justify-center">
        <p className="text-gray-400">No friend data. Something went wrong.</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center px-8 gap-6">
        <p className="text-red-400 text-center font-semibold">{errorMsg}</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/', { replace: true })}
          className="px-6 py-3 rounded-full bg-primary text-white font-bold text-sm"
        >
          Back to Home
        </motion.button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center gap-6">
        <PokeballSpinner size={72} wobble />
        <AnimatePresence mode="wait">
          <motion.p
            key={flavorIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-gray-400 text-sm font-medium"
          >
            {FLAVOR_TEXT_LINES[flavorIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    )
  }

  if (!entry) return null

  const photoUrl = targetProfile?.avatar_url || friend.photoUrl

  return (
    <motion.div
      className="fixed inset-0 bg-navy frienddex-scroll"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center px-6 pt-12 pb-16">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6"
        >
          New Frienddex Entry
        </motion.p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          className="w-40 h-40 rounded-full overflow-hidden border-4 shadow-lg shadow-black/30"
          style={{
            borderColor: getTypeColor(entry.primary_type),
            boxShadow: `0 0 40px ${getTypeColor(entry.primary_type)}44`,
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={friend.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-black text-white"
              style={{ backgroundColor: getTypeColor(entry.primary_type) + '66' }}
            >
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-black text-white mt-5"
        >
          {friend.username}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2 mt-3"
        >
          <TypeBadge type={entry.primary_type} />
          {entry.secondary_type && <TypeBadge type={entry.secondary_type} />}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-pokemon-yellow font-black text-2xl mt-3"
        >
          CP {entry.cp}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-400 text-sm italic text-center mt-4 max-w-xs"
        >
          {entry.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full max-w-sm mt-8"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Stats
          </h3>
          <div className="space-y-3">
            {STAT_ORDER.map((key, i) => {
              const stats = entry.stats as Record<string, number>
              const value = stats[key] ?? 0
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 font-semibold">
                      {STAT_LABELS[key] || key}
                    </span>
                    <span className="text-white font-bold">{value}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: getTypeColor(entry.primary_type) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / STAT_MAX) * 100}%` }}
                      transition={{ duration: 0.6, delay: 1.0 + i * 0.1 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          className="w-full max-w-sm mt-8"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Moves
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(entry.moves as Array<{ name: string; type: string; power: number; category: string }>).map(
              (move, i) => (
                <motion.div
                  key={move.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 + i * 0.1 }}
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor:
                      getTypeColor(move.type as import('../types/database').PokemonType) + '33',
                    borderLeft: `3px solid ${getTypeColor(
                      move.type as import('../types/database').PokemonType,
                    )}`,
                  }}
                >
                  <p className="text-sm font-bold text-white">{move.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{move.category}</span>
                    {move.power > 0 && (
                      <span className="text-xs text-gray-300 font-semibold">
                        PWR {move.power}
                      </span>
                    )}
                  </div>
                </motion.div>
              ),
            )}
          </div>
        </motion.div>

        {entry.flavor_text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="text-gray-500 text-xs italic text-center mt-8 max-w-xs"
          >
            &ldquo;{entry.flavor_text}&rdquo;
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.4 }}
          className="text-green-400 font-black text-sm uppercase tracking-wider mt-8"
        >
          Added to your Frienddex!
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/frienddex', { replace: true })}
          className="mt-6 px-8 py-3 rounded-full bg-primary text-white font-bold text-sm"
        >
          View Frienddex
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/', { replace: true })}
          className="mt-3 px-6 py-2 text-gray-400 text-sm font-medium"
        >
          Back to Scanning
        </motion.button>
      </div>
    </motion.div>
  )
}
