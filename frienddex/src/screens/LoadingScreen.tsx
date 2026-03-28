import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FLAVOR_TEXT_LINES } from '../lib/constants'
import { PokeballSpinner } from '../components/PokeballSpinner'
import type { CatchTarget } from '../types/catch'

export function LoadingScreen() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const friend = (location.state as { friend?: CatchTarget })?.friend
  const [flavorIndex, setFlavorIndex] = useState(0)
  const [error, setError] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFlavorIndex(i => (i + 1) % FLAVOR_TEXT_LINES.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!friend || !user || startedRef.current) return
    startedRef.current = true

    async function generateAndSave() {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('personality_answers')
          .eq('id', friend!.id)
          .single()

        if (profileError || !profile?.personality_answers?.length) {
          throw new Error('Could not load personality data for this trainer')
        }

        const { data: genData, error: genError } = await supabase.functions.invoke(
          'generate-friend-stats',
          {
            body: {
              username: friend!.username,
              personalityAnswers: profile.personality_answers,
              isSelf: false,
            },
          }
        )
        if (genError) throw genError

        const entry = genData as Record<string, unknown>

        const { data: savedEntry, error: saveError } = await supabase
          .from('pokedex_entries')
          .upsert(
            {
              user_id: user!.id,
              target_user_id: friend!.id,
              primary_type: entry.primaryType as string,
              secondary_type: (entry.secondaryType as string) || null,
              cp: entry.cp as number,
              stats: entry.stats as Record<string, number>,
              moves: entry.moves as unknown[],
              description: entry.description as string,
              flavor_text: (entry.flavorText as string) || '',
            },
            { onConflict: 'user_id,target_user_id' }
          )
          .select()
          .single()

        if (saveError) throw saveError

        const { error: catchError } = await supabase
          .from('caught_friends')
          .upsert(
            {
              catcher_id: user!.id,
              caught_user_id: friend!.id,
              pokedex_entry_id: savedEntry.id,
            },
            { onConflict: 'catcher_id,caught_user_id' }
          )

        if (catchError) throw catchError

        navigate('/reveal', {
          replace: true,
          state: {
            entry: savedEntry,
            friendUsername: friend!.username,
            friendPhotoUrl: friend!.photoUrl,
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong generating stats')
      }
    }

    generateAndSave()
  }, [friend, user, navigate])

  if (!friend) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <p className="text-gray-400">No friend data. Returning...</p>
      </div>
    )
  }

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-navy"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-8">
        <PokeballSpinner size={72} />

        <div className="h-8 flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={flavorIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-center text-sm text-gray-400"
              style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
            >
              {FLAVOR_TEXT_LINES[flavorIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-pokemon-yellow"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-12 left-6 right-6"
          >
            <div
              className="rounded-2xl px-5 py-4 text-center"
              style={{
                background: 'rgba(244, 68, 68, 0.15)',
                border: '1px solid rgba(244, 68, 68, 0.3)',
              }}
            >
              <p className="mb-3 text-sm text-red-300">{error}</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/', { replace: true })}
                className="rounded-xl bg-white/10 px-6 py-2 text-sm font-semibold text-white"
              >
                Back to Scanner
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
