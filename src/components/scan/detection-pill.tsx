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
        <motion.button
          key="detection-pill"
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={() => onTap(face)}
          className="animate-pill-glow"
          style={{
            position: "absolute",
            bottom: "max(32px, env(safe-area-inset-bottom, 20px))",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
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
          }}
          whileTap={{ scale: 0.95 }}
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
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: "15px",
              color: "white",
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {matched
              ? `Try capturing ${matched.username}?`
              : "Unknown Trainer — invite them?"}
          </span>

          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: "14px", opacity: 0.6 }}
          >
            ›
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
