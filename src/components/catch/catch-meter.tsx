import { motion, AnimatePresence } from "framer-motion";
import type { CatchPhase } from "../../types";

interface Props {
  phase: CatchPhase;
  accuracy: number | null;
  catchRate: number;
}

export default function CatchMeter({ phase, accuracy, catchRate }: Props) {
  const showMeter =
    accuracy !== null &&
    (phase === "absorbing" ||
      phase === "wobbling" ||
      phase === "success" ||
      phase === "escaped");

  if (!showMeter) return null;

  const clampedRate = Math.min(Math.max(catchRate, 0), 1);
  const percentage = Math.round(clampedRate * 100);

  const barColor =
    clampedRate >= 0.75
      ? "#78C850"
      : clampedRate >= 0.55
        ? "#F8D030"
        : clampedRate >= 0.35
          ? "#E8A020"
          : "#F08030";

  const label =
    clampedRate >= 0.75
      ? "Excellent!"
      : clampedRate >= 0.55
        ? "Great"
        : clampedRate >= 0.35
          ? "Nice"
          : "Tricky...";

  return (
    <AnimatePresence>
      <motion.div
        key="catch-meter"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className="absolute left-1/2 z-50 -translate-x-1/2"
        style={{ top: "10%" }}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5"
          style={{
            background: "rgba(20, 20, 30, 0.8)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            minWidth: 180,
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-4">
              <span
                className="uppercase"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: barColor }}
              >
                {label}
              </span>
              <span
                className="tabular-nums"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: "rgba(255,255,255,0.7)" }}
              >
                {percentage}%
              </span>
            </div>
            <div
              className="relative h-2 overflow-hidden rounded-full"
              style={{ width: 140, background: "rgba(255,255,255,0.08)" }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${percentage}%` }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.15,
                }}
                style={{
                  background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                  boxShadow: `0 0 12px ${barColor}66`,
                }}
              />
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${percentage}%` }}
                transition={{
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.15,
                }}
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
                }}
              />
            </div>
          </div>

          <MiniPokeball
            success={phase === "success"}
            wobbling={phase === "wobbling"}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MiniPokeball({
  success,
  wobbling,
}: {
  success: boolean;
  wobbling: boolean;
}) {
  return (
    <motion.div
      animate={
        success
          ? { scale: [1, 1.3, 1], rotate: [0, 0, 0] }
          : wobbling
            ? { rotate: [0, -8, 8, -5, 5, 0] }
            : {}
      }
      transition={
        success
          ? { duration: 0.4, ease: "easeOut" }
          : wobbling
            ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 }
            : {}
      }
    >
      <svg width="24" height="24" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#555" strokeWidth="4" />
        <clipPath id="meter-ball-clip">
          <circle cx="50" cy="50" r="44" />
        </clipPath>
        <g clipPath="url(#meter-ball-clip)">
          <rect
            x="0"
            y="0"
            width="100"
            height="50"
            fill={success ? "#FFCB05" : "#FF4444"}
          />
          <rect x="0" y="50" width="100" height="50" fill="#f5f5f5" />
          <rect x="0" y="46" width="100" height="8" fill="#555" />
        </g>
        <circle cx="50" cy="50" r="12" fill="#555" />
        <circle cx="50" cy="50" r="8" fill="#f5f5f5" />
      </svg>
    </motion.div>
  );
}
