import { useEffect, useRef, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { motion, useAnimation } from 'framer-motion'
import { Pokeball3D } from './Pokeball3D'
import { StarParticles } from './StarParticles'
import type { CatchPhase } from '../../types/catch'

interface Props {
  phase: CatchPhase
  wobbleCount: number
  onWobbleComplete: () => void
  onSuccessAnimDone: () => void
}

export function WobbleBall({ phase, wobbleCount, onWobbleComplete, onSuccessAnimDone }: Props) {
  const controls = useAnimation()
  const hasRun = useRef(false)

  useEffect(() => {
    if (phase !== 'wobbling' || hasRun.current) return
    hasRun.current = true

    const WOBBLE_MS = 650
    const GAP_MS = 300
    const amplitudes = [28, 20, 12]

    for (let i = 0; i < wobbleCount; i++) {
      const delay = i * (WOBBLE_MS + GAP_MS)
      const amp = amplitudes[i] ?? 10
      setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(25)
        controls.start({
          rotate: [0, amp, -amp * 0.8, amp * 0.5, -amp * 0.3, 0],
          y: [0, -4, 0, -3, 0],
          transition: { duration: WOBBLE_MS / 1000, ease: 'easeInOut' },
        })
      }, delay)
    }

    const totalMs = wobbleCount * (WOBBLE_MS + GAP_MS)
    setTimeout(onWobbleComplete, totalMs)
  }, [phase, wobbleCount, controls, onWobbleComplete])

  useEffect(() => {
    if (phase === 'success') {
      controls.start({
        scale: [1, 1.12, 0.92, 1.04, 1],
        transition: { duration: 0.45, ease: 'easeInOut' },
      })
      if (navigator.vibrate) navigator.vibrate([50, 30, 80, 30, 120])
      setTimeout(onSuccessAnimDone, 1550)
    }
    if (phase === 'escaped') {
      hasRun.current = false
      controls.start({
        rotate: 0, scale: 1, y: 0,
        transition: { duration: 0 },
      })
    }
  }, [phase, controls, onSuccessAnimDone])

  const visible = phase === 'wobbling' || phase === 'success' || phase === 'transitioning'
  if (!visible) return null

  return (
    <div className="absolute left-1/2 z-30 -translate-x-1/2" style={{ top: '56%' }}>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: '-12px',
          width: '90px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
          animation: phase === 'wobbling' ? 'ball-shadow-wobble 0.65s ease-in-out infinite' : 'none',
        }}
      />

      <motion.div animate={controls} style={{ width: 80, height: 80 }}>
        <Canvas
          camera={{ position: [0, 0.5, 2.8], fov: 38 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 4]} intensity={1.0} />
          <pointLight
            position={[0, 0, 2]}
            intensity={phase === 'success' ? 2.5 : 0.3}
            color={phase === 'success' ? '#FFCB05' : '#ffffff'}
          />
          <Suspense fallback={null}>
            <Pokeball3D
              wobble={phase === 'wobbling'}
              wobbleIntensity={0.25}
              pulse={phase === 'success'}
            />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </motion.div>

      <StarParticles active={phase === 'success'} />
    </div>
  )
}
