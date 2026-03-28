import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCamera } from "../hooks/use-camera";
import { useFaceDetection } from "../hooks/use-face-detection";
import TopBar from "../components/top-bar";
import DetectionPill from "../components/scan/detection-pill";
import PokeballSpinner from "../components/pokeball-spinner";
import type { DetectedFace } from "../types";

/**
 * Converts a normalized video bounding box to screen pixel positions,
 * accounting for the object-cover scaling/cropping of the video element.
 */
function videoBoxToScreen(
  box: { x: number; y: number; width: number; height: number },
  video: HTMLVideoElement,
) {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  const cw = video.clientWidth || 1;
  const ch = video.clientHeight || 1;

  const videoAspect = vw / vh;
  const containerAspect = cw / ch;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > containerAspect) {
    // Video is wider — cropped horizontally
    scale = ch / vh;
    offsetX = (vw * scale - cw) / 2;
  } else {
    // Video is taller — cropped vertically
    scale = cw / vw;
    offsetY = (vh * scale - ch) / 2;
  }

  return {
    left: box.x * vw * scale - offsetX,
    top: box.y * vh * scale - offsetY,
    width: box.width * vw * scale,
    height: box.height * vh * scale,
  };
}

export default function ScanScreen() {
  const navigate = useNavigate();
  const { videoRef, ready, denied, error } = useCamera();
  const { faces, modelLoading } = useFaceDetection(videoRef, ready);
  const topFace = faces.length > 0 ? faces[0] : null;

  // Force re-render when video resizes so face boxes stay aligned
  const [, setTick] = useState(0);
  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleCapture = useCallback(
    (face: DetectedFace) => {
      if (!face.matchedUser) return;
      if (navigator.vibrate) navigator.vibrate(30);

      // Snapshot the detected face region from the video feed
      let photoUrl = "";
      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const bb = face.boundingBox;

        // Add padding around the face crop (30% each side)
        const pad = 0.3;
        const sx = Math.max(0, (bb.x - bb.width * pad) * vw);
        const sy = Math.max(0, (bb.y - bb.height * pad) * vh);
        const sw = Math.min(vw - sx, bb.width * (1 + pad * 2) * vw);
        const sh = Math.min(vh - sy, bb.height * (1 + pad * 2) * vh);

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
          photoUrl = canvas.toDataURL("image/jpeg", 0.85);
        }
      }

      navigate("/catch", {
        state: { friend: { ...face.matchedUser, photoUrl } },
      });
    },
    [navigate, videoRef],
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

      {/* Debug: face bounding boxes */}
      {faces.map((face, i) => {
        const video = videoRef.current;
        if (!video) return null;
        const rect = videoBoxToScreen(face.boundingBox, video);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              border: "2px solid #00ff88",
              borderRadius: 8,
              zIndex: 15,
              pointerEvents: "none",
              boxShadow: "0 0 8px rgba(0,255,136,0.4)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -22,
                left: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "#00ff88",
                background: "rgba(0,0,0,0.5)",
                padding: "2px 6px",
                borderRadius: 4,
                whiteSpace: "nowrap",
              }}
            >
              {face.matchedUser?.username ?? "Unknown"}
            </span>
          </div>
        );
      })}

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
