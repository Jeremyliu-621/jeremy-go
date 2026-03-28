import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/auth-context";
import HomeScreen from "./screens/home-screen";
import ScanScreen from "./screens/scan-screen";
import CatchScreen from "./screens/catch-screen";
import RevealScreen from "./screens/reveal-screen";
import FrienddexScreen from "./screens/frienddex-screen";
import FriendDetailScreen from "./screens/friend-detail-screen";
import BattleSelectScreen from "./screens/battle-select-screen";
import BattleScreen from "./screens/battle-screen";

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/scan" element={<ScanScreen />} />
        <Route path="/catch" element={<CatchScreen />} />
        <Route path="/reveal" element={<RevealScreen />} />
        <Route path="/frienddex" element={<FrienddexScreen />} />
        <Route path="/frienddex/:id" element={<FriendDetailScreen />} />
        <Route path="/battle" element={<BattleSelectScreen />} />
        <Route path="/battle/fight" element={<BattleScreen />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
