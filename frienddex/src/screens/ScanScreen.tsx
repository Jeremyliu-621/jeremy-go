import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  loadFaceModel,
  computeDescriptorFromKeypoints,
  compareFaceDescriptors,
  FACE_MATCH_THRESHOLD,
} from '../lib/faceDetection'
import { PokeballSpinner } from '../components/PokeballSpinner'
import type { PokemonType, PokedexEntry } from '../types/database'
import type { CatchTarget } from '../types/catch'
import type { FaceLandmarksDetector } from '@tensorflow-models/face-landmarks-detection'

interface RegisteredFace {
  userId: string
  username: string
  avatarUrl: string | null
  descriptor: number[]
}

type PillState =
  | { kind: 'idle' }
  | { kind: 'loading_model' }
  | { kind: 'unknown' }
  | { kind: 'self' }
  | { kind: 'already_caught'; username: string }
  | { kind: 'matched'; userId: string; username: string; avatarUrl: string | null }

const SCAN_INTERVAL = 800

export function ScanScreen() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')

  // Detection
  const detectorRef = useRef<FaceLandmarksDetector | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  const registeredFacesRef = useRef<RegisteredFace[]>([])
  const caughtIdsRef = useRef<Set<string>>(new Set())
  const scanningRef = useRef(false)

  // Match state
  const [pill, setPill] = useState<PillState>({ kind: 'loading_model' })
  const [navigating, setNavigating] = useState(false)

  // ---- Camera ----
  const startCamera = useCallback(async () => {
    setCameraReady(false)
    setCameraError('')
    // Stop any existing stream
    streamRef.current?.getTracks().forEach(t => t.stop())

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current!.play()
          setCameraReady(true)
        }
      }
    } catch {
      setCameraError('Camera access denied. Please enable camera permissions.')
    }
  }, [facingMode])

  const flipCamera = useCallback(() => {
    setFacingMode(m => (m === 'environment' ? 'user' : 'environment'))
  }, [])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [startCamera])

  // ---- Load model + fetch data ----
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        console.warn('[init] loading face model…')
        const detector = await loadFaceModel()
        console.warn('[init] model loaded OK')
        if (cancelled) return
        detectorRef.current = detector
        setModelLoaded(true)
        setPill({ kind: 'idle' })
      } catch (err) {
        console.warn('[init] model load FAILED:', err)
        if (!cancelled) setCameraError('Face detection model failed to load')
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!user) return

    async function fetchData() {
      // Fetch all registered faces with profiles
      const { data: faces } = await supabase
        .from('user_faces')
        .select('user_id, face_descriptor')

      if (faces) {
        // Now fetch profiles for these users
        const userIds = faces.map(f => f.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        const profileMap = new Map(
          (profiles || []).map(p => [p.id, p])
        )

        registeredFacesRef.current = faces
          .filter(f => f.face_descriptor?.length > 0)
          .map(f => {
            const p = profileMap.get(f.user_id)
            return {
              userId: f.user_id,
              username: p?.username || 'Unknown',
              avatarUrl: p?.avatar_url || null,
              descriptor: f.face_descriptor,
            }
          })
      }

      // Fetch already-caught user IDs
      const { data: caught } = await supabase
        .from('caught_friends')
        .select('caught_user_id')
        .eq('catcher_id', user!.id)

      caughtIdsRef.current = new Set(
        (caught || []).map(c => c.caught_user_id)
      )
    }

    fetchData()
  }, [user])

  // ---- Scanning loop ----
  const scan = useCallback(async () => {
    if (
      scanningRef.current ||
      !videoRef.current ||
      !detectorRef.current ||
      videoRef.current.videoWidth === 0 ||
      navigating
    ) {
      return
    }

    scanningRef.current = true
    try {
      console.warn('[scan] running estimateFaces…')
      const faces = await detectorRef.current.estimateFaces(videoRef.current)
      console.warn('[scan] faces found:', faces.length)

      if (faces.length === 0) {
        setPill(prev => (prev.kind === 'loading_model' ? prev : { kind: 'idle' }))
        scanningRef.current = false
        return
      }

      // Pick largest face (most prominent) by bounding box area
      let bestFace = faces[0]
      let bestArea = 0
      for (const face of faces) {
        const xs = face.keypoints.map(k => k.x)
        const ys = face.keypoints.map(k => k.y)
        const area =
          (Math.max(...xs) - Math.min(...xs)) *
          (Math.max(...ys) - Math.min(...ys))
        if (area > bestArea) {
          bestArea = area
          bestFace = face
        }
      }

      // Compute descriptor for detected face
      let detectedDescriptor: number[]
      try {
        detectedDescriptor = computeDescriptorFromKeypoints(bestFace.keypoints)
      } catch {
        // Not enough keypoints — treat as no face
        setPill({ kind: 'idle' })
        scanningRef.current = false
        return
      }

      // Match against registered faces
      let bestMatch: RegisteredFace | null = null
      let bestDistance = Infinity
      for (const rf of registeredFacesRef.current) {
        const dist = compareFaceDescriptors(detectedDescriptor, rf.descriptor)
        if (dist < bestDistance) {
          bestDistance = dist
          bestMatch = rf
        }
      }

      if (!bestMatch || bestDistance > FACE_MATCH_THRESHOLD) {
        setPill({ kind: 'unknown' })
      } else if (bestMatch.userId === user?.id) {
        setPill({ kind: 'self' })
      } else if (caughtIdsRef.current.has(bestMatch.userId)) {
        setPill({ kind: 'already_caught', username: bestMatch.username })
      } else {
        setPill({
          kind: 'matched',
          userId: bestMatch.userId,
          username: bestMatch.username,
          avatarUrl: bestMatch.avatarUrl,
        })
      }
    } catch (err) {
      console.warn('[scan] error:', err)
    } finally {
      scanningRef.current = false
    }
  }, [user?.id, navigating])

  useEffect(() => {
    if (!cameraReady || !modelLoaded) return
    const interval = window.setInterval(scan, SCAN_INTERVAL)
    return () => clearInterval(interval)
  }, [cameraReady, modelLoaded, scan])

  // ---- Pill tap → navigate to catch ----
  const handlePillTap = useCallback(async () => {
    if (pill.kind !== 'matched' || navigating) return
    setNavigating(true)

    try {
      // Fetch the target's self pokedex entry for CP and types
      const { data: entry } = await supabase
        .from('pokedex_entries')
        .select('*')
        .eq('user_id', pill.userId)
        .eq('target_user_id', pill.userId)
        .single()

      const target: CatchTarget = {
        id: pill.userId,
        username: pill.username,
        photoUrl: pill.avatarUrl || '',
        cp: (entry as PokedexEntry | null)?.cp ?? Math.floor(100 + Math.random() * 400),
        primaryType: ((entry as PokedexEntry | null)?.primary_type ?? 'Normal') as PokemonType,
        secondaryType: (entry as PokedexEntry | null)?.secondary_type as PokemonType | undefined,
      }

      // Stop camera before navigating
      streamRef.current?.getTracks().forEach(t => t.stop())
      navigate('/catch', { state: { friend: target } })
    } catch {
      setNavigating(false)
    }
  }, [pill, navigating, navigate])

  // ---- Render ----
  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
      />

      {/* Top bar */}
      <div
        className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
          paddingBottom: 16,
        }}
      >
        <h1
          className="text-lg font-black text-white/80"
          style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
        >
          FRIENDDEX
        </h1>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={flipCamera}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
            aria-label="Flip camera"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
              <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
              <polyline points="16 3 19 6 16 9" />
              <polyline points="8 21 5 18 8 15" />
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/profile')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white backdrop-blur-sm"
          >
            {profile?.username?.charAt(0).toUpperCase() || '?'}
          </motion.button>
        </div>
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-navy/90 px-8">
          <svg viewBox="0 0 24 24" className="mb-4 h-12 w-12 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <p className="text-center text-sm text-gray-400">{cameraError}</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startCamera}
            className="mt-4 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white"
          >
            Retry
          </motion.button>
        </div>
      )}

      {/* Model loading indicator */}
      {!modelLoaded && !cameraError && (
        <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-black/50 px-5 py-2 backdrop-blur-sm">
            <PokeballSpinner size={20} />
            <span className="text-xs text-gray-300">Initializing scanner...</span>
          </div>
        </div>
      )}

      {/* Bottom pill area */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence mode="wait">
          {pill.kind === 'idle' && modelLoaded && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 text-center text-xs text-white/40"
              style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
            >
              Point at a friend to capture them
            </motion.p>
          )}

          {pill.kind === 'unknown' && (
            <motion.div
              key="unknown"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="mb-4 rounded-full px-6 py-3"
              style={{
                background: 'rgba(30, 30, 30, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p
                className="text-center text-sm font-semibold text-white/70"
                style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
              >
                Unknown Trainer — invite them?
              </p>
            </motion.div>
          )}

          {pill.kind === 'self' && (
            <motion.div
              key="self"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="mb-4 rounded-full px-6 py-3"
              style={{
                background: 'rgba(30, 30, 30, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p
                className="text-center text-sm font-semibold text-white/70"
                style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
              >
                That's you, trainer!
              </p>
            </motion.div>
          )}

          {pill.kind === 'already_caught' && (
            <motion.div
              key="caught"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="mb-4 rounded-full px-6 py-3"
              style={{
                background: 'rgba(30, 30, 30, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <p
                className="text-center text-sm font-semibold text-white/70"
                style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
              >
                {pill.username} is already in your Frienddex
              </p>
            </motion.div>
          )}

          {pill.kind === 'matched' && (
            <motion.button
              key="matched"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePillTap}
              disabled={navigating}
              className="mb-4 flex items-center gap-3 rounded-full px-6 py-3"
              style={{
                background: 'rgba(30, 30, 30, 0.75)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,203,5,0.25)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                animation: 'pill-glow 2s ease-in-out infinite',
              }}
            >
              {pill.avatarUrl ? (
                <img
                  src={pill.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                  {pill.username.charAt(0).toUpperCase()}
                </div>
              )}
              <p
                className="text-sm font-bold text-white"
                style={{ fontFamily: "'Poppins', 'Nunito', sans-serif" }}
              >
                {navigating ? 'Loading...' : `Try capturing ${pill.username}?`}
              </p>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-pokemon-yellow" fill="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
