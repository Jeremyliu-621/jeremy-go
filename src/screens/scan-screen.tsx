import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCamera } from "../hooks/use-camera";
import { useFaceDetection } from "../hooks/use-face-detection";
import TopBar from "../components/top-bar";
import DetectionPill from "../components/scan/detection-pill";
import PokeballSpinner from "../components/pokeball-spinner";
import type { DetectedFace } from "../types";

export default function ScanScreen() {
  const navigate = useNavigate();
  const { videoRef, ready, denied, error, toggleCamera } = useCamera();
  const { faces, modelLoading } = useFaceDetection(videoRef, ready);
  const topFace = faces.length > 0 ? faces[0] : null;

  const handleCapture = useCallback(
    (face: DetectedFace) => {
      if (!face.matchedUser) return;
      if (navigator.vibrate) navigator.vibrate(30);
      navigate("/catch", { state: { friend: face.matchedUser } });
    },
    [navigate],
  );

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      <TopBar variant="scan" />

      {/* Camera toggle */}
      <button
        onClick={toggleCamera}
        className="absolute z-40 flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          top: "calc(env(safe-area-inset-top, 12px) + 64px)",
          right: "16px",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2-3h6l2 3h1a2 2 0 0 1 2 2v4" />
          <circle cx="12" cy="12" r="3" />
          <path d="M17 22l3.5-3.5L17 15" />
          <path d="M21 18.5H14" />
        </svg>
      </button>

      {/* Denied / error states */}
      <AnimatePresence>
        {denied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[var(--color-navy)]"
          >
            <div className="text-5xl">📷</div>
            <p className="px-8 text-center text-sm font-medium text-white/70">
              Camera access is required to scan for friends.
              <br />
              Please enable it in your browser settings.
            </p>
          </motion.div>
        )}

        {error && !denied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[var(--color-navy)]"
          >
            <p className="text-sm font-medium text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Model loading overlay */}
      <AnimatePresence>
        {modelLoading && ready && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          >
            <PokeballSpinner size={40} />
            <p className="text-xs font-medium text-white/60">
              Initializing scanner...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint text when no face */}
      <AnimatePresence>
        {!topFace && !modelLoading && ready && (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="animate-shimmer absolute z-10"
            style={{
              bottom: "max(40px, env(safe-area-inset-bottom, 20px))",
              left: 0,
              right: 0,
              textAlign: "center",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.5)",
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              letterSpacing: "0.02em",
            }}
          >
            Point at a friend to capture them
          </motion.p>
        )}
      </AnimatePresence>

      {/* Detection pill */}
      <DetectionPill face={topFace} onTap={handleCapture} />
    </motion.div>
  );
}
