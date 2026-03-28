import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import type { CatchPhase, FriendProfile } from "../types";
import { MOCK_FRIEND } from "../types";
import { rollCatch, type ThrowResult } from "../lib/catch-mechanics";
import TopBar from "../components/top-bar";
import EnvironmentBg from "../components/catch/environment-bg";
import FriendSprite from "../components/catch/friend-sprite";
import NameCpPill from "../components/catch/name-cp-pill";
import TargetRing from "../components/catch/target-ring";
import ThrowableBall from "../components/catch/throwable-ball";
import WobbleBall from "../components/catch/wobble-ball";

export default function CatchScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const friend: FriendProfile =
    (location.state as { friend?: FriendProfile })?.friend ?? MOCK_FRIEND;

  const [phase, setPhase] = useState<CatchPhase>("ready");
  const [message, setMessage] = useState<string | null>(null);
  const resultRef = useRef<ThrowResult | null>(null);

  const handleThrowComplete = useCallback(() => {
    setPhase("absorbing");

    const result = rollCatch({
      neverCaughtBefore: true,
      throwAccuracy: 0.7,
    });
    resultRef.current = result;

    setTimeout(() => {
      setPhase("wobbling");
    }, 600);
  }, []);

  const handleWobbleComplete = useCallback(() => {
    const result = resultRef.current;
    if (!result) return;

    if (result.caught) {
      setPhase("success");
      if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
    } else {
      setPhase("escaped");
      setMessage(`Oh no! ${friend.username} escaped!`);
      setTimeout(() => setMessage(null), 2200);
    }
  }, [friend.username]);

  const handleSuccessAnimDone = useCallback(() => {
    setPhase("transitioning");
  }, []);

  const handleRunAway = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <EnvironmentBg />

      <TopBar variant="catch" onRunAway={handleRunAway} />

      {/* Friend zone — absolutely positioned in upper scene */}
      <div
        className="absolute left-0 right-0 z-10 flex flex-col items-center"
        style={{ top: "16%", pointerEvents: "none" }}
      >
        <NameCpPill friend={friend} phase={phase} />
        <div className="h-3" />
        <FriendSprite friend={friend} phase={phase} />
        <div className="relative mt-1">
          <TargetRing phase={phase} />
        </div>
      </div>

      {/* Throwable ball (bottom) */}
      <ThrowableBall
        phase={phase}
        onThrowComplete={handleThrowComplete}
        enabled={phase === "ready" || phase === "escaped"}
      />

      {/* Wobble ball (center, after throw hits) */}
      <WobbleBall
        phase={phase}
        wobbleCount={resultRef.current?.wobbles ?? 3}
        onWobbleComplete={handleWobbleComplete}
        onSuccessAnimDone={handleSuccessAnimDone}
      />

      {/* Flash overlay on absorb */}
      <AnimatePresence>
        {phase === "absorbing" && (
          <motion.div
            key="absorb-flash"
            className="pointer-events-none absolute inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.5, times: [0, 0.15, 1] }}
            style={{ background: "white" }}
          />
        )}
      </AnimatePresence>

      {/* Success white flash + transition */}
      <AnimatePresence>
        {phase === "transitioning" && (
          <motion.div
            key="success-flash"
            className="pointer-events-none absolute inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ background: "white" }}
          />
        )}
      </AnimatePresence>

      {/* Escaped message */}
      <AnimatePresence>
        {message && (
          <motion.div
            key="escape-msg"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute left-1/2 z-50 -translate-x-1/2 rounded-2xl px-6 py-3"
            style={{
              top: "42%",
              background: "rgba(30, 30, 30, 0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <p className="whitespace-nowrap text-center text-sm font-bold text-white">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fail burst effect on ball */}
      <AnimatePresence>
        {phase === "escaped" && (
          <motion.div
            key="burst-effect"
            className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2"
            style={{ top: "53%" }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className="h-16 w-16 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,100,80,0.6) 0%, rgba(255,200,50,0.3) 50%, transparent 70%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
