import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { fetchFriendDetail, type CaughtFriendWithDetails } from '../lib/frienddex'
import { PokeballSpinner } from '../components/PokeballSpinner'
import { TypeBadge } from '../components/TypeBadge'
import { getTypeColor, STAT_LABELS, STAT_ORDER, STAT_MAX } from '../lib/constants'

export function FriendDetailScreen() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const passedItem = (location.state as { item?: CaughtFriendWithDetails })?.item

  const [item, setItem] = useState<CaughtFriendWithDetails | null>(passedItem ?? null)
  const [loading, setLoading] = useState(!passedItem)

  useEffect(() => {
    if (passedItem || !user || !friendId) return
    fetchFriendDetail(user.id, friendId)
      .then((data) => {
        setItem(data)
        setLoading(false)
      })
  }, [user, friendId, passedItem])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <PokeballSpinner size={64} />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-sm">Friend not found in your Frienddex.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/frienddex', { replace: true })}
          className="px-5 py-2 rounded-full bg-primary text-white font-bold text-sm"
        >
          Back to Frienddex
        </motion.button>
      </div>
    )
  }

  const { pokedex_entry: entry, caught_profile: profile } = item
  const typeColor = getTypeColor(entry.primary_type)
  const photoUrl = profile.avatar_url

  return (
    <div className="fixed inset-0 bg-navy frienddex-scroll">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-navy/90 backdrop-blur-sm">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/frienddex')}
          className="text-sm text-gray-400 hover:text-white"
        >
          Back
        </motion.button>
        <h1 className="text-lg font-black">{profile.username.toUpperCase()}</h1>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center px-6 pb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-36 h-36 rounded-full overflow-hidden mt-4 mb-4 border-4"
          style={{
            borderColor: typeColor,
            boxShadow: `0 0 40px ${typeColor}44`,
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-black text-white"
              style={{ backgroundColor: typeColor + '66' }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        <h2 className="text-2xl font-black">{profile.username}</h2>

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
                  transition={{ delay: i * 0.1 }}
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
                      style={{ backgroundColor: typeColor }}
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
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
            Moves
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(entry.moves as Array<{ name: string; type: string; power: number; category: string; description: string }>).map(
              (move, i) => (
                <motion.div
                  key={move.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
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
                  <p className="text-xs text-gray-500 mt-1">{move.description}</p>
                </motion.div>
              ),
            )}
          </div>
        </div>

        {entry.flavor_text && (
          <p className="text-gray-500 text-xs italic text-center mt-8 max-w-xs">
            &ldquo;{entry.flavor_text}&rdquo;
          </p>
        )}

        <p className="text-gray-600 text-xs mt-6">
          Caught {new Date(item.caught_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
