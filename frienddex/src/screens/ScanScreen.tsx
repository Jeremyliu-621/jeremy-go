import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export function ScanScreen() {
  const navigate = useNavigate()
  const { signOut, profile } = useAuth()

  return (
    <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <h1 className="text-lg font-black text-offwhite/80">FRIENDDEX</h1>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-offwhite"
        >
          {profile?.username?.charAt(0).toUpperCase() || '?'}
        </button>
      </div>

      <div className="text-center px-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">Camera scan — coming in Phase 3</p>
        <p className="text-gray-500 text-xs mt-2">Point at a friend to capture them</p>
      </div>

      <div className="absolute bottom-8 flex gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/frienddex')}
          className="px-5 py-2 rounded-full bg-primary text-white font-semibold text-sm"
        >
          Frienddex
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/profile')}
          className="px-5 py-2 rounded-full bg-white/10 text-gray-300 font-semibold text-sm"
        >
          My Profile
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="px-5 py-2 rounded-full bg-white/10 text-gray-300 font-semibold text-sm"
        >
          Sign Out
        </motion.button>
      </div>
    </div>
  )
}
