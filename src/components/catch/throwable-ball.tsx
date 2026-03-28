import { useRef, useCallback, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import PokeballSvg from "../pokeball-svg";
import type { CatchPhase } from "../../types";

interface Props {
  phase: CatchPhase;
  onThrowComplete: () => void;
  enabled: boolean;
}

export default function ThrowableBall({ phase, onThrowComplete, enabled }: Props) {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

  const isReady = phase === "ready" || phase === "escaped";

  const beginDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !isReady) return;
      startRef.current = { x: clientX, y: clientY, t: Date.now() };
      setDragging(true);
      setDragDelta({ x: 0, y: 0 });
    },
    [enabled, isReady],
  );

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!startRef.current) return;
    setDragDelta({
      x: clientX - startRef.current.x,
      y: clientY - startRef.current.y,
    });
  }, []);

  const endDrag = useCallback(
    async (clientX: number, clientY: number) => {
      if (!startRef.current || !enabled || !isReady) return;
      setDragging(false);

      const dy = startRef.current.y - clientY;
      const dx = clientX - startRef.current.x;
      const dt = Math.max(Date.now() - startRef.current.t, 1);
      startRef.current = null;
      setDragDelta({ x: 0, y: 0 });

      // Click fallback: treat a short-distance click as a straight throw
      const isClick = dy < 10 && Math.abs(dx) < 10 && dt < 300;
      if (!isClick && dy < 40) return;

      const velocity = isClick ? 1.5 : Math.min(dy / dt, 3);
      const flightDuration = 0.6 + (1 - velocity / 3) * 0.5;

      const vh = window.innerHeight;
      const targetY = -(vh * 0.42);
      const lateralDrift = dx * 0.3;

      if (navigator.vibrate) navigator.vibrate(15);

      controls.start({
        x: [0, lateralDrift * 0.5, lateralDrift * 0.2, 0],
        y: [0, targetY - 60, targetY],
        scale: [1, 0.65, 0.45],
        rotate: [0, 360 * 2],
        transition: {
          duration: flightDuration,
          ease: [0.22, 0.68, 0.35, 1],
          x: { duration: flightDuration, ease: "easeOut" },
          y: {
            duration: flightDuration,
            times: [0, 0.4, 1],
            ease: [0.22, 0.68, 0.35, 1],
          },
          scale: {
            duration: flightDuration,
            times: [0, 0.5, 1],
          },
        },
      });

      setTimeout(() => onThrowComplete(), flightDuration * 1000 + 50);
    },
    [enabled, isReady, controls, onThrowComplete],
  );

  /* Touch handlers */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => beginDrag(e.touches[0].clientX, e.touches[0].clientY),
    [beginDrag],
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY),
    [moveDrag],
  );
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY),
    [endDrag],
  );

  /* Mouse handlers (for desktop testing) */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => { e.preventDefault(); beginDrag(e.clientX, e.clientY); },
    [beginDrag],
  );
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY),
    [moveDrag],
  );
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => endDrag(e.clientX, e.clientY),
    [endDrag],
  );
  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => { if (dragging) endDrag(e.clientX, e.clientY); },
    [dragging, endDrag],
  );

  const resetBall = useCallback(async () => {
    await controls.start({
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: { duration: 0 },
    });
  }, [controls]);

  if (phase === "escaped") {
    requestAnimationFrame(() => resetBall());
  }

  const showBall =
    phase === "ready" ||
    phase === "aiming" ||
    phase === "throwing" ||
    phase === "escaped";

  if (!showBall) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center"
      style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom, 12px))" }}
    >
      <p
        className="mb-2 text-center text-xs font-semibold"
        style={{ color: "rgba(255,255,255,0.5)", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
      >
        ∞
      </p>

      <motion.div
        animate={controls}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={dragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          touchAction: "none",
          cursor: dragging ? "grabbing" : "grab",
          transform: dragging
            ? `translate(${dragDelta.x * 0.3}px, ${dragDelta.y * 0.4}px)`
            : undefined,
          transition: dragging ? "none" : undefined,
        }}
        whileTap={{ scale: 1.08 }}
      >
        <PokeballSvg size={90} />
      </motion.div>

      <div className="mt-4 flex w-full items-center justify-between px-10">
        <button
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "rgba(30,30,30,0.55)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2z" fill="#E74C3C" opacity="0.8" />
            <path d="M12 2c-2 4-2 8 0 12s2 8 0 10" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
            <circle cx="9" cy="8" r="2" fill="white" opacity="0.3" />
          </svg>
        </button>

        <button
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: "rgba(30,30,30,0.55)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
