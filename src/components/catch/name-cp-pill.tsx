import { motion, AnimatePresence } from "framer-motion";
import type { CatchPhase, FriendProfile } from "../../types";

interface Props {
  friend: FriendProfile;
  phase: CatchPhase;
}

export default function NameCpPill({ friend, phase }: Props) {
  const visible = phase === "ready" || phase === "aiming" || phase === "escaped";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="flex items-center gap-2.5 rounded-full px-5 py-2"
          style={{
            background: "rgba(30, 30, 30, 0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* Pokéball icon */}
          <svg width="18" height="18" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="6" opacity="0.6" />
            <path d="M 5 50 A 45 45 0 0 1 95 50" fill="rgba(255,255,255,0.25)" />
            <rect x="3" y="47" width="94" height="6" fill="white" opacity="0.4" rx="1" />
            <circle cx="50" cy="50" r="8" fill="white" opacity="0.7" />
          </svg>

          <span
            className="text-white"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}
          >
            {friend.username || "???"}
          </span>

          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 8, color: "rgba(255,255,255,0.4)" }}>/</span>

          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10,
              color: "#FFCB05",
            }}
          >
            CP {friend.cp}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
