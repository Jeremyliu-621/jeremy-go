import { Routes, Route, Navigate } from 'react-router-dom'
import { ProfileSetupScreen } from './screens/ProfileSetupScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ScanScreen } from './screens/ScanScreen'
import { CatchScreen } from './screens/CatchScreen'
import { RevealScreen } from './screens/RevealScreen'
import { FrienddexScreen } from './screens/FrienddexScreen'
import { FriendDetailScreen } from './screens/FriendDetailScreen'

export function App() {

  return (
    <Routes>
      <Route path="/" element={<ScanScreen />} />
      <Route path="/catch" element={<CatchScreen />} />
      <Route path="/reveal" element={<RevealScreen />} />
      <Route path="/frienddex" element={<FrienddexScreen />} />
      <Route path="/frienddex/:friendId" element={<FriendDetailScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="/setup" element={<ProfileSetupScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
