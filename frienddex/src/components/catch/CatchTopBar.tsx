import { useAuth } from '../../contexts/AuthContext'

interface Props {
  onRunAway: () => void
}

export function CatchTopBar({ onRunAway }: Props) {
  const { profile } = useAuth()

  return (
    <div
      className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
      style={{
        paddingTop: 'env(safe-area-inset-top, 12px)',
        height: 'calc(env(safe-area-inset-top, 12px) + 56px)',
      }}
    >
      <button
        onClick={onRunAway}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        <span className="text-xs font-semibold text-white/90">Run</span>
      </button>

      <div
        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
        style={{
          background: 'linear-gradient(135deg, #FFCB05, #F0A000)',
          color: '#1A1A2E',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {profile?.username?.charAt(0).toUpperCase() ?? '?'}
      </div>
    </div>
  )
}
