import { useRef, useCallback, useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { Pokeball3D } from './Pokeball3D'
import type { CatchPhase } from '../../types/catch'

interface Props {
  phase: CatchPhase
  onThrowComplete: (accuracy: number) => void
  enabled: boolean
}

interface DragTrail {
  x: number
  y: number
  t: number
}

export function ThrowableBall({ phase, onThrowComplete, enabled }: Props) {
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const trailRef = useRef<DragTrail[]>([])
  const [dragging, setDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 })
  const [showTrail, setShowTrail] = useState(false)
  const [trailPoints, setTrailPoints] = useState<DragTrail[]>([])
  const [ballRotation, setBallRotation] = useState(0)

  const isReady = phase === 'ready' || phase === 'escaped'

  const beginDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !isReady) return
      startRef.current = { x: clientX, y: clientY, t: Date.now() }
      trailRef.current = [{ x: clientX, y: clientY, t: Date.now() }]
      setDragging(true)
      setDragDelta({ x: 0, y: 0 })
      setShowTrail(true)
    },
    [enabled, isReady],
  )

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!startRef.current) return
    const dx = clientX - startRef.current.x
    const dy = clientY - startRef.current.y
    setDragDelta({ x: dx, y: dy })
    trailRef.current.push({ x: clientX, y: clientY, t: Date.now() })
    if (trailRef.current.length > 20) trailRef.current.shift()
    setTrailPoints([...trailRef.current])
    setBallRotation((prev) => prev + Math.abs(dx) * 0.5 + Math.abs(dy) * 0.5)
  }, [])

  const endDrag = useCallback(
    async (clientX: number, clientY: number) => {
      if (!startRef.current || !enabled || !isReady) return
      setDragging(false)
      setShowTrail(false)
      setTrailPoints([])

      const dy = startRef.current.y - clientY
      const dx = clientX - startRef.current.x
      const dt = Math.max(Date.now() - startRef.current.t, 1)
      startRef.current = null
      setDragDelta({ x: 0, y: 0 })

      if (dy < 40 && Math.abs(dx) < 15) return

      const velocity = Math.min(dy / dt, 4)
      const lateralError = Math.abs(dx) / window.innerWidth
      const speedScore = Math.min(velocity / 2.0, 1.0)
      const accuracyScore = Math.max(0, 1.0 - lateralError * 3)
      const accuracy = Math.min(speedScore * 0.5 + accuracyScore * 0.5, 1.0)
      const flightDuration = 0.55 + (1 - velocity / 4) * 0.4

      const vh = window.innerHeight
      const targetY = -(vh * 0.42)
      const lateralDrift = dx * 0.25

      if (navigator.vibrate) navigator.vibrate(15)

      controls.start({
        x: [0, lateralDrift * 0.5, lateralDrift * 0.15, 0],
        y: [0, targetY * 0.3, targetY - 30, targetY],
        scale: [1, 0.8, 0.55, 0.4],
        rotate: [0, 360 * 2 + Math.random() * 180],
        transition: {
          duration: flightDuration,
          ease: [0.15, 0.75, 0.3, 1],
          x: { duration: flightDuration, ease: 'easeOut' },
          y: {
            duration: flightDuration,
            times: [0, 0.25, 0.7, 1],
            ease: [0.15, 0.75, 0.3, 1],
          },
          scale: {
            duration: flightDuration,
            times: [0, 0.3, 0.6, 1],
          },
        },
      })

      setTimeout(() => onThrowComplete(accuracy), flightDuration * 1000 + 50)
    },
    [enabled, isReady, controls, onThrowComplete],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => beginDrag(e.touches[0].clientX, e.touches[0].clientY),
    [beginDrag],
  )
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY),
    [moveDrag],
  )
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY),
    [endDrag],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => { e.preventDefault(); beginDrag(e.clientX, e.clientY) },
    [beginDrag],
  )
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY),
    [moveDrag],
  )
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => endDrag(e.clientX, e.clientY),
    [endDrag],
  )
  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => { if (dragging) endDrag(e.clientX, e.clientY) },
    [dragging, endDrag],
  )

  const resetBall = useCallback(async () => {
    await controls.start({
      x: 0, y: 0, scale: 1, rotate: 0,
      transition: { duration: 0 },
    })
  }, [controls])

  useEffect(() => {
    if (phase === 'escaped') {
      resetBall()
    }
  }, [phase, resetBall])

  const showBall = phase === 'ready' || phase === 'aiming' || phase === 'throwing' || phase === 'escaped'
  if (!showBall) return null

  const dragDistance = Math.sqrt(dragDelta.x ** 2 + dragDelta.y ** 2)
  const dragPower = Math.min(dragDistance / 200, 1)

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 12px))' }}
    >
      {dragging && (
        <DragPowerIndicator power={dragPower} />
      )}

      <AnimatePresence>
        {showTrail && trailPoints.length > 2 && (
          <motion.svg
            className="pointer-events-none absolute inset-0 z-20"
            initial={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="trail-grad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FFCB05" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FF4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            {trailPoints.length > 1 && (
              <polyline
                points={trailPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="url(#trail-grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </motion.svg>
        )}
      </AnimatePresence>

      <p
        className="mb-2 text-center text-xs font-semibold"
        style={{ color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
      >
        {dragging ? 'Release to throw!' : 'Drag up to throw'}
      </p>

      <motion.div
        animate={controls}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={dragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
          width: 110,
          height: 110,
          transform: dragging
            ? `translate(${dragDelta.x * 0.3}px, ${dragDelta.y * 0.4}px)`
            : undefined,
          transition: dragging ? 'none' : undefined,
        }}
        whileTap={{ scale: 1.06 }}
      >
        <Canvas
          camera={{ position: [0, 0.6, 2.8], fov: 40 }}
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />
          <directionalLight position={[-2, 3, -2]} intensity={0.3} color="#88aaff" />
          <Suspense fallback={null}>
            <group rotation={[0, ballRotation * 0.01, dragging ? dragDelta.x * 0.003 : 0]}>
              <Pokeball3D pulse={!dragging && isReady} />
            </group>
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>

        <div
          className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2"
          style={{
            width: dragging ? '70px' : '80px',
            height: '14px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)',
            filter: 'blur(2px)',
            transition: 'width 0.2s',
          }}
        />
      </motion.div>

      <div className="mt-4 flex w-full items-center justify-between px-10">
        <button
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: 'rgba(30,30,30,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2z" fill="#E74C3C" opacity="0.8" />
            <path d="M12 2c-2 4-2 8 0 12s2 8 0 10" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="9" cy="8" r="2" fill="white" opacity="0.3" />
          </svg>
        </button>

        <button
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: 'rgba(30,30,30,0.55)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function DragPowerIndicator({ power }: { power: number }) {
  const color = power < 0.3
    ? '#78C850'
    : power < 0.7
      ? '#F8D030'
      : '#F08030'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute -top-16 left-1/2 -translate-x-1/2"
      style={{ width: 6, height: 60, zIndex: 40 }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        style={{
          background: 'rgba(0,0,0,0.4)',
          height: '100%',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        animate={{ height: `${power * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: `linear-gradient(to top, ${color}, ${color}dd)`,
          boxShadow: `0 0 8px ${color}88`,
        }}
      />
    </motion.div>
  )
}
