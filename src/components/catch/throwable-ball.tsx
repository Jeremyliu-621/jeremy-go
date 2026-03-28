import { useRef, useCallback, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import Pokeball3D from "./pokeball-3d";
import type { CatchPhase } from "../../types";

interface DragTrail {
  x: number;
  y: number;
}

interface Props {
  phase: CatchPhase;
  onThrowComplete: (accuracy: number) => void;
  enabled: boolean;
}

const BALL_SIZE = 100;

export default function ThrowableBall({
  phase,
  onThrowComplete,
  enabled,
}: Props) {
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const trailRef = useRef<DragTrail[]>([]);
  const [dragging, setDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });
  const [showTrail, setShowTrail] = useState(false);
  const [trailPoints, setTrailPoints] = useState<DragTrail[]>([]);
  const [ballTilt, setBallTilt] = useState(0);

  const isReady = phase === "ready" || phase === "escaped";

  const beginDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !isReady) return;
      startRef.current = { x: clientX, y: clientY, t: Date.now() };
      trailRef.current = [{ x: clientX, y: clientY }];
      setDragging(true);
      setDragDelta({ x: 0, y: 0 });
      setShowTrail(true);
    },
    [enabled, isReady],
  );

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    if (!startRef.current) return;
    const dx = clientX - startRef.current.x;
    const dy = clientY - startRef.current.y;
    setDragDelta({ x: dx, y: dy });
    setBallTilt(dx * 0.005);
    trailRef.current.push({ x: clientX, y: clientY });
    if (trailRef.current.length > 20) trailRef.current.shift();
    setTrailPoints([...trailRef.current]);
  }, []);

  const endDrag = useCallback(
    async (clientX: number, clientY: number) => {
      if (!startRef.current || !enabled || !isReady) return;

      const dragOffX = dragDelta.x * 0.3;
      const dragOffY = dragDelta.y * 0.4;

      setDragging(false);
      setShowTrail(false);
      setTrailPoints([]);
      setBallTilt(0);

      const dy = startRef.current.y - clientY;
      const dx = clientX - startRef.current.x;
      const dt = Math.max(Date.now() - startRef.current.t, 1);
      startRef.current = null;
      setDragDelta({ x: 0, y: 0 });

      const swipeDist = Math.sqrt(dx * dx + dy * dy);
      if (swipeDist < 40) return;

      const vh = window.innerHeight;
      const vw = window.innerWidth;

      const velocity = Math.min(swipeDist / dt, 4);
      const flightDuration = 0.45 + (1 - velocity / 4) * 0.3;

      const throwScale = 2.8;
      const finalX = dx * throwScale;
      const finalY = -dy * throwScale;

      const targetCenterX = vw / 2;
      const targetCenterY = vh * 0.28;
      const ballStartX = vw / 2;
      const ballStartY = vh * 0.85;
      const landX = ballStartX + finalX;
      const landY = ballStartY + finalY;

      const distToTarget = Math.sqrt(
        (landX - targetCenterX) ** 2 + (landY - targetCenterY) ** 2,
      );
      const maxMissDistance = vh * 0.5;
      const accuracy = Math.max(0, Math.min(1, 1 - distToTarget / maxMissDistance));

      if (navigator.vibrate) navigator.vibrate(15);

      controls.set({ x: dragOffX, y: dragOffY, scale: 1, rotate: 0 });

      controls.start({
        x: finalX,
        y: finalY,
        scale: 0.3,
        rotate: 720 + Math.random() * 180,
        transition: {
          duration: flightDuration,
          x: { duration: flightDuration, ease: [0.2, 0.8, 0.3, 1] },
          y: { duration: flightDuration, ease: [0.05, 0.7, 0.25, 1] },
          scale: { duration: flightDuration, ease: [0.3, 0.6, 0.4, 1] },
          rotate: { duration: flightDuration, ease: "easeOut" },
        },
      });

      setTimeout(
        () => onThrowComplete(Math.max(0.05, Math.min(accuracy, 1.0))),
        flightDuration * 1000 + 50,
      );
    },
    [enabled, isReady, controls, onThrowComplete, dragDelta],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) =>
      beginDrag(e.touches[0].clientX, e.touches[0].clientY),
    [beginDrag],
  );
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) =>
      moveDrag(e.touches[0].clientX, e.touches[0].clientY),
    [moveDrag],
  );
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) =>
      endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY),
    [endDrag],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      beginDrag(e.clientX, e.clientY);
    },
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
    (e: React.MouseEvent) => {
      if (dragging) endDrag(e.clientX, e.clientY);
    },
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

  useEffect(() => {
    if (phase === "escaped") {
      resetBall();
    }
  }, [phase, resetBall]);

  const showBall =
    phase === "ready" ||
    phase === "aiming" ||
    phase === "throwing" ||
    phase === "escaped";
  if (!showBall) return null;

  const dragDistance = Math.sqrt(dragDelta.x ** 2 + dragDelta.y ** 2);
  const dragPower = Math.min(dragDistance / 200, 1);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center"
      style={{ paddingBottom: "max(28px, env(safe-area-inset-bottom, 20px))" }}
    >
      <AnimatePresence>
        {showTrail && trailPoints.length > 2 && (
          <motion.svg
            className="pointer-events-none fixed inset-0 z-20"
            style={{ width: "100vw", height: "100vh" }}
            initial={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <polyline
              points={trailPoints.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(255,203,5,0.5)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      <p
        className="mb-2 text-center text-xs font-semibold"
        style={{
          color: "rgba(255,255,255,0.5)",
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
        }}
      >
        {dragging ? "Release to throw!" : "Drag up to throw"}
      </p>

      <div className="relative flex flex-col items-center">
        {dragging && <DragPowerBar power={dragPower} />}

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
            width: BALL_SIZE,
            height: BALL_SIZE,
            transform: dragging
              ? `translate(${dragDelta.x * 0.3}px, ${dragDelta.y * 0.4}px)`
              : undefined,
            transition: dragging ? "none" : undefined,
          }}
          whileTap={{ scale: 1.08 }}
        >
          <Canvas
            camera={{ position: [0, 0, 2.5], fov: 50 }}
            dpr={[1, 2]}
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
            gl={{ alpha: true, antialias: true }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />
            <directionalLight
              position={[-2, 3, -2]}
              intensity={0.3}
              color="#88aaff"
            />
            <Suspense fallback={null}>
              <group rotation={[0, 0, ballTilt]}>
                <Pokeball3D pulse={!dragging && isReady} />
              </group>
              <Environment preset="sunset" />
            </Suspense>
          </Canvas>

          <div
            className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2"
            style={{
              width: dragging ? "70px" : "80px",
              height: "14px",
              borderRadius: "50%",
              background:
                "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
              filter: "blur(2px)",
              transition: "width 0.2s",
            }}
          />
        </motion.div>
      </div>

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
            <path
              d="M12 2C8 2 4 6 4 12s4 10 8 10 8-4 8-10S16 2 12 2z"
              fill="#E74C3C"
              opacity="0.8"
            />
            <path
              d="M12 2c-2 4-2 8 0 12s2 8 0 10"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              opacity="0.4"
            />
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.7"
          >
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

function DragPowerBar({ power }: { power: number }) {
  const color = power < 0.3 ? "#78C850" : power < 0.7 ? "#F8D030" : "#F08030";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 -translate-x-1/2"
      style={{ width: 6, height: 60 }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        style={{
          background: "rgba(0,0,0,0.4)",
          height: "100%",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-full"
        animate={{ height: `${power * 100}%` }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          background: `linear-gradient(to top, ${color}, ${color}dd)`,
          boxShadow: `0 0 8px ${color}88`,
        }}
      />
    </motion.div>
  );
}
