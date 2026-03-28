import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { TypeBadge } from '../components/TypeBadge'
import { PokeballSpinner } from '../components/PokeballSpinner'
import { getTypeColor, STAT_LABELS, STAT_ORDER, STAT_MAX } from '../lib/constants'
import type { PokedexEntry } from '../types/database'

export function ProfileScreen() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const [entry, setEntry] = useState<PokedexEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('pokedex_entries')
      .select('*')
      .eq('user_id', profile.id)
      .eq('target_user_id', profile.id)
      .single()
      .then(({ data }) => {
        setEntry(data as PokedexEntry | null)
        setLoading(false)
      })
  }, [profile])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <PokeballSpinner size={64} />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="fixed inset-0 bg-navy jeremy-go-scroll">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-navy/90 backdrop-blur-sm">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white"
        >
          Back
        </motion.button>
        <h1 className="text-lg font-black">MY PROFILE</h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-white"
        >
          Sign Out
        </motion.button>
      </div>

      <div className="flex flex-col items-center px-6 pb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-36 h-36 rounded-full overflow-hidden mt-4 mb-4 border-4"
          style={{
            borderColor: entry ? getTypeColor(entry.primary_type) : '#555',
          }}
        >
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          )}
        </motion.div>

        <h2 className="text-2xl font-black">{profile.username}</h2>

        {entry && (
          <>
            <div className="flex gap-2 mt-2">
              <TypeBadge type={entry.primary_type} />
              {entry.secondary_type && <TypeBadge type={entry.secondary_type} />}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-pokemon-yellow font-black text-xl mt-3"
            >
              CP {entry.cp}
            </motion.p>

            <p className="text-gray-400 text-sm italic text-center mt-4 max-w-xs">
              {entry.description}
            </p>

            <div className="w-full max-w-sm mt-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Stats</h3>
              <div className="space-y-3">
                {STAT_ORDER.map((key, i) => {
                  const stats = entry.stats as Record<string, number>
                  const value = stats[key] ?? 0
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 font-semibold">{STAT_LABELS[key] || key}</span>
                        <span className="text-white font-bold">{value}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: getTypeColor(entry.primary_type) }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(value / STAT_MAX) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="w-full max-w-sm mt-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Moves</h3>
              <div className="grid grid-cols-2 gap-3">
                {(entry.moves as Array<{ name: string; type: string; category: string; power: number; description: string }>).map((move, i) => (
                  <motion.div
                    key={move.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: getTypeColor(move.type as import('../types/database').PokemonType) + '33',
                      borderLeft: `3px solid ${getTypeColor(move.type as import('../types/database').PokemonType)}`,
                    }}
                  >
                    <p className="text-sm font-bold text-white">{move.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{move.category}</span>
                      {move.power > 0 && (
                        <span className="text-xs text-gray-300 font-semibold">PWR {move.power}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {entry.flavor_text && (
              <p className="text-gray-500 text-xs italic text-center mt-8 max-w-xs">
                &ldquo;{entry.flavor_text}&rdquo;
              </p>
            )}
          </>
        )}

        {!entry && (
          <p className="text-gray-400 text-sm mt-8">No Pokédex entry generated yet.</p>
        )}
      </div>
    </div>
  )
}
