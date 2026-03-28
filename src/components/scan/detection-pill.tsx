import { motion, AnimatePresence } from "framer-motion";
import type { DetectedFace } from "../../types";

interface Props {
  face: DetectedFace | null;
  onTap: (face: DetectedFace) => void;
}

export default function DetectionPill({ face, onTap }: Props) {
  const matched = face?.matchedUser;

  return (
    <AnimatePresence>
      {face && (
        <motion.div
          key="detection-pill-wrapper"
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            position: "absolute",
            bottom: "max(32px, env(safe-area-inset-bottom, 20px))",
            left: 0,
            right: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <button
            onClick={() => onTap(face)}
            className="animate-pill-glow"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 28px",
              borderRadius: "9999px",
              background: "rgba(30, 30, 30, 0.78)",
              backdropFilter: "blur(16px) saturate(1.4)",
              WebkitBackdropFilter: "blur(16px) saturate(1.4)",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                lineHeight: 1,
                filter: "drop-shadow(0 0 4px rgba(255,203,5,0.6))",
              }}
            >
              ✦
            </span>

            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: "10px",
                color: "white",
                letterSpacing: "0.01em",
                whiteSpace: "nowrap",
              }}
            >
              {matched
                ? `Try capturing ts chud?`
                : "Unknown Trainer — invite them?"}
            </span>

            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: "14px", opacity: 0.6 }}
            >
              ›
            </motion.span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
