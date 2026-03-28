import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AuthScreen } from './screens/AuthScreen'
import { ProfileSetupScreen } from './screens/ProfileSetupScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ScanScreen } from './screens/ScanScreen'
import { PokeballSpinner } from './components/PokeballSpinner'

export function App() {
  const { user, loading, profile } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-navy">
        <PokeballSpinner size={64} />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }

  if (profile && !profile.profile_complete) {
    return (
      <Routes>
        <Route path="/setup" element={<ProfileSetupScreen />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<ScanScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/setup" element={<ProfileSetupScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
