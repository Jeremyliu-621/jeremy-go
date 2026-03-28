import { useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { motion, useAnimation } from "framer-motion";
import Pokeball3D from "./pokeball-3d";
import StarParticles from "./star-particles";
import type { CatchPhase } from "../../types";

interface Props {
  phase: CatchPhase;
  wobbleCount: number;
  onWobbleComplete: () => void;
  onSuccessAnimDone: () => void;
}

const WOBBLE_BALL_SIZE = 70;

export default function WobbleBall({
  phase,
  wobbleCount,
  onWobbleComplete,
  onSuccessAnimDone,
}: Props) {
  const controls = useAnimation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (phase !== "wobbling" || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      const amplitudes = [28, 20, 12];
      for (let i = 0; i < wobbleCount; i++) {
        const amp = amplitudes[i] ?? 10;
        if (navigator.vibrate) navigator.vibrate(25);
        await controls.start({
          rotate: [0, amp, -amp * 0.8, amp * 0.5, -amp * 0.3, 0],
          y: [0, -4, 0, -3, 0],
          transition: { duration: 0.65, ease: "easeInOut" },
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      onWobbleComplete();
    })();
  }, [phase, wobbleCount, controls, onWobbleComplete]);

  useEffect(() => {
    if (phase === "success") {
      (async () => {
        await controls.start({
          scale: [1, 1.12, 0.92, 1.04, 1],
          transition: { duration: 0.45, ease: "easeInOut" },
        });
        if (navigator.vibrate) navigator.vibrate([50, 30, 80, 30, 120]);
        await new Promise((r) => setTimeout(r, 1200));
        onSuccessAnimDone();
      })();
    }
    if (phase === "escaped") {
      hasRun.current = false;
      controls.start({
        rotate: 0,
        scale: 1,
        y: 0,
        transition: { duration: 0 },
      });
    }
  }, [phase, controls, onSuccessAnimDone]);

  const visible =
    phase === "wobbling" || phase === "success" || phase === "transitioning";
  if (!visible) return null;

  return (
    <div
      className="absolute left-1/2 z-30 -translate-x-1/2"
      style={{ top: "35%", transform: "translate(-50%, -50%)" }}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "-10px",
          width: "80px",
          height: "16px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)",
          animation:
            phase === "wobbling"
              ? "ball-shadow-wobble 0.65s ease-in-out infinite"
              : "none",
        }}
      />

      <motion.div
        animate={controls}
        style={{ width: WOBBLE_BALL_SIZE, height: WOBBLE_BALL_SIZE }}
      >
        <Canvas
            camera={{ position: [0, 0.3, 2.5], fov: 50 }}
          dpr={[1, 2]}
          style={{ width: "100%", height: "100%" }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 4]} intensity={1.0} />
          <pointLight
            position={[0, 0, 2]}
            intensity={phase === "success" ? 2.5 : 0.3}
            color={phase === "success" ? "#FFCB05" : "#ffffff"}
          />
          <Suspense fallback={null}>
            <Pokeball3D
              wobble={phase === "wobbling"}
              wobbleIntensity={0.25}
              pulse={phase === "success"}
            />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>
      </motion.div>

      <StarParticles active={phase === "success"} />
    </div>
  );
}
