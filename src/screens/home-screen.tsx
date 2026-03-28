import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MENU_ITEMS = [
  {
    label: "Catch",
    description: "Scan & capture people",
    path: "/scan",
  },
  {
    label: "Chuddex",
    description: "View your collection",
    path: "/chuddex",
  },
  {
    label: "Battle",
    description: "Pit your catches against each other",
    path: "/battle",
  },
] as const;

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-navy)] px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-2 text-4xl font-black tracking-tight"
        style={{ color: "var(--color-yellow)" }}
      >
        Jeremy GO!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12 text-sm text-white/40"
      >
        Gotta catch &apos;em all
      </motion.p>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {MENU_ITEMS.map((item, i) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(item.path)}
            className="flex flex-col rounded-2xl p-5 text-left"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-lg font-bold text-white">{item.label}</p>
            <p className="text-xs text-white/40">{item.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
