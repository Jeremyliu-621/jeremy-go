import type { CatchPhase } from '../../types/catch'

interface Props {
  phase: CatchPhase
}

export function TargetRing({ phase }: Props) {
  const visible = phase === 'ready' || phase === 'aiming'
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute" style={{ bottom: 'calc(50% - 18px)', left: '50%', transform: 'translateX(-50%)' }}>
      <div
        style={{
          width: '160px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(120,200,80,0.6)',
          animation: 'target-ring-pulse 2.2s ease-in-out infinite',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '25px',
            borderRadius: '50%',
            border: '2px solid rgba(180,220,80,0.45)',
            animation: 'target-ring-pulse 2.2s ease-in-out infinite 0.3s',
          }}
        />
      </div>
    </div>
  )
}
