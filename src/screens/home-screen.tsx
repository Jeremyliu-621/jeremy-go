import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MENU_ITEMS = [
  {
    label: "Catch",
    description: "Scan & capture friends",
    path: "/scan",
    color: "#F08030",
    icon: "🎯",
  },
  {
    label: "Frienddex",
    description: "View your collection",
    path: "/frienddex",
    color: "#6890F0",
    icon: "📖",
  },
  {
    label: "Battle",
    description: "Pit your friends against each other",
    path: "/battle",
    color: "#C03028",
    icon: "⚔️",
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
        JeremyGO
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12 text-sm text-white/40"
      >
        Gotta catch &apos;em all
      </motion.p>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {MENU_ITEMS.map((item, i) => {
          const disabled = item.path === null;
          return (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileTap={disabled ? undefined : { scale: 0.97 }}
              onClick={() => item.path && navigate(item.path)}
              disabled={disabled}
              className="relative flex items-center gap-4 rounded-2xl p-5 text-left transition-colors"
              style={{
                background: disabled
                  ? "rgba(255,255,255,0.05)"
                  : `linear-gradient(135deg, ${item.color}22 0%, rgba(20,20,40,0.9) 70%)`,
                border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : item.color + "33"}`,
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="text-lg font-bold text-white">{item.label}</p>
                <p className="text-xs text-white/40">{item.description}</p>
              </div>
              {disabled && (
                <span className="absolute right-4 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                  Soon
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
