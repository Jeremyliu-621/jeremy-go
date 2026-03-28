import { useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import PokeballSvg from "../pokeball-svg";
import StarParticles from "./star-particles";
import type { CatchPhase } from "../../types";

interface Props {
  phase: CatchPhase;
  wobbleCount: number;
  onWobbleComplete: () => void;
  onSuccessAnimDone: () => void;
}

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

    const amplitudes = [28, 20, 12];
    const wobbleDuration = 650;
    const pauseBetween = 300;

    for (let i = 0; i < wobbleCount; i++) {
      const amp = amplitudes[i] ?? 10;
      const delay = i * (wobbleDuration + pauseBetween);
      setTimeout(() => {
        controls.start({
          rotate: [0, amp, -amp * 0.8, amp * 0.5, -amp * 0.3, 0],
          y: [0, -3, 0, -2, 0],
          transition: { duration: 0.65, ease: "easeInOut" },
        });
      }, delay);
    }

    const totalTime = wobbleCount * (wobbleDuration + pauseBetween);
    setTimeout(() => onWobbleComplete(), totalTime);
  }, [phase, wobbleCount, controls, onWobbleComplete]);

  useEffect(() => {
    if (phase === "success") {
      controls.start({
        scale: [1, 1.08, 0.95, 1],
        transition: { duration: 0.35, ease: "easeInOut" },
      });
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
      setTimeout(() => onSuccessAnimDone(), 1600);
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
    <div className="absolute left-1/2 z-30 -translate-x-1/2" style={{ top: "58%" }}>
      {/* Ground shadow */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "-10px",
          width: "80px",
          height: "16px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)",
          animation:
            phase === "wobbling"
              ? "ball-shadow-wobble 0.65s ease-in-out infinite"
              : "none",
        }}
      />

      <motion.div animate={controls}>
        <PokeballSvg size={70} />
      </motion.div>

      <StarParticles active={phase === "success"} />
    </div>
  );
}
