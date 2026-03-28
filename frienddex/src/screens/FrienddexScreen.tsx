import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { fetchFrienddex, type CaughtFriendWithDetails } from '../lib/frienddex'
import { PokeballSpinner, PokeballSVG } from '../components/PokeballSpinner'
import { TypeBadge } from '../components/TypeBadge'
import { getTypeColor } from '../lib/constants'

type SortMode = 'recent' | 'cp'

export function FrienddexScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [friends, setFriends] = useState<CaughtFriendWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<SortMode>('recent')

  useEffect(() => {
    if (!user) return
    fetchFrienddex(user.id)
      .then(setFriends)
      .finally(() => setLoading(false))
  }, [user])

  const sorted = [...friends].sort((a, b) => {
    if (sort === 'cp') return b.pokedex_entry.cp - a.pokedex_entry.cp
    return new Date(b.caught_at).getTime() - new Date(a.caught_at).getTime()
  })

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <PokeballSpinner size={64} />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-navy frienddex-scroll">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-navy/90 backdrop-blur-sm">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white"
        >
          Back
        </motion.button>
        <h1 className="text-lg font-black">FRIENDDEX</h1>
        <span className="text-sm text-gray-500 font-semibold tabular-nums">
          {friends.length} caught
        </span>
      </div>

      {friends.length > 1 && (
        <div className="flex gap-2 px-4 pb-3">
          {(['recent', 'cp'] as const).map((mode) => (
            <motion.button
              key={mode}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSort(mode)}
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: sort === mode ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: sort === mode ? '#fff' : '#888',
              }}
            >
              {mode === 'recent' ? 'Recent' : 'CP'}
            </motion.button>
          ))}
        </div>
      )}

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 pt-24 gap-6">
          <div className="w-20 h-20 opacity-20">
            <PokeballSVG size={80} />
          </div>
          <p className="text-gray-500 text-center text-sm leading-relaxed">
            Your Frienddex is empty.<br />
            Scan and capture friends to fill it up!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-full bg-primary text-white font-bold text-sm"
          >
            Start Scanning
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-8">
          <AnimatePresence>
            {sorted.map((item, i) => (
              <FriendCard key={item.id} item={item} index={i} navigate={navigate} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function FriendCard({
  item,
  index,
  navigate,
}: {
  item: CaughtFriendWithDetails
  index: number
  navigate: ReturnType<typeof useNavigate>
}) {
  const { pokedex_entry: entry, caught_profile: profile } = item
  const typeColor = getTypeColor(entry.primary_type)

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={() =>
        navigate(`/frienddex/${item.caught_user_id}`, {
          state: { item },
        })
      }
      className="relative flex flex-col items-center p-4 rounded-2xl text-center"
      style={{
        background: `linear-gradient(145deg, ${typeColor}22 0%, rgba(20,20,40,0.9) 70%)`,
        border: `1px solid ${typeColor}33`,
      }}
    >
      <div
        className="w-20 h-20 rounded-full overflow-hidden border-2 mb-2"
        style={{ borderColor: typeColor }}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl font-black text-white"
            style={{ backgroundColor: typeColor + '66' }}
          >
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <p className="text-white font-bold text-sm truncate w-full">
        {profile.username}
      </p>

      <p
        className="text-xs font-black mt-0.5"
        style={{ color: '#F8D030' }}
      >
        CP {entry.cp}
      </p>

      <div className="flex gap-1 mt-2 flex-wrap justify-center">
        <TypeBadge type={entry.primary_type} />
        {entry.secondary_type && <TypeBadge type={entry.secondary_type} />}
      </div>
    </motion.button>
  )
}
