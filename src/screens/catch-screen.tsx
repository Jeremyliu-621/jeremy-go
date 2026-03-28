import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import type { CatchPhase, FriendProfile } from "../types";
import { MOCK_FRIEND } from "../types";
import { rollCatch, type ThrowResult } from "../lib/catch-mechanics";
import TopBar from "../components/top-bar";
import EnvironmentBg from "../components/catch/environment-bg";
import FriendSprite from "../components/catch/friend-sprite";

import TargetRing from "../components/catch/target-ring";
import ThrowableBall from "../components/catch/throwable-ball";
import WobbleBall from "../components/catch/wobble-ball";
import CatchMeter from "../components/catch/catch-meter";
import DogFilter from "../components/dog-filter";

export default function CatchScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const friend: FriendProfile =
    (location.state as { friend?: FriendProfile })?.friend ?? MOCK_FRIEND;

  const [phase, setPhase] = useState<CatchPhase>("ready");
  const [message, setMessage] = useState<string | null>(null);
  const [throwAccuracy, setThrowAccuracy] = useState<number | null>(null);
  const [catchRate, setCatchRate] = useState(0);
  const [nickname, setNickname] = useState("");
  const resultRef = useRef<ThrowResult | null>(null);

  const handleThrowComplete = useCallback((accuracy: number) => {
    setPhase("absorbing");
    setThrowAccuracy(accuracy);

    const result = rollCatch({
      neverCaughtBefore: true,
      throwAccuracy: accuracy,
    });
    resultRef.current = result;

    const rate = 0.25 + (true ? 0.15 : 0) + accuracy * 0.45;
    setCatchRate(Math.min(rate, 0.95));

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
      setMessage("Oh no! They escaped!");
      setThrowAccuracy(null);
      setCatchRate(0);
      setTimeout(() => setMessage(null), 2200);
    }
  }, [friend, navigate]);

  const handleSuccessAnimDone = useCallback(() => {
    setPhase("naming");
  }, []);

  const handleNameConfirm = useCallback(() => {
    const name = nickname.trim();
    if (!name) return;
    const namedFriend = { ...friend, username: name };
    navigate("/reveal", { state: { friend: namedFriend }, replace: true });
  }, [nickname, friend, navigate]);

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

      <CatchMeter
        phase={phase}
        accuracy={throwAccuracy}
        catchRate={catchRate}
      />

      <div
        className="absolute left-0 right-0 z-10 flex flex-col items-center"
        style={{ top: "24%", pointerEvents: "none" }}
      >
        <FriendSprite friend={friend} phase={phase} />
        <div className="relative mt-1">
          <TargetRing phase={phase} />
        </div>
      </div>

      <ThrowableBall
        phase={phase}
        onThrowComplete={handleThrowComplete}
        enabled={phase === "ready" || phase === "escaped"}
      />

      <WobbleBall
        phase={phase}
        wobbleCount={resultRef.current?.wobbles ?? 3}
        onWobbleComplete={handleWobbleComplete}
        onSuccessAnimDone={handleSuccessAnimDone}
      />

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
            }}
          >
            <p className="whitespace-nowrap text-center text-sm font-bold text-white">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message + tap to continue */}
      <AnimatePresence>
        {phase === "success" && (
          <motion.div
            key="success-banner"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.4 }}
            className="absolute left-1/2 z-50 -translate-x-1/2 flex flex-col items-center gap-3"
            style={{ top: "30%" }}
          >
            <p
              className="rounded-2xl px-8 py-3 text-lg font-black text-white"
              style={{
                background: "rgba(30, 30, 30, 0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              Gotcha!
            </p>
            <button
              onClick={() => setPhase("naming")}
              className="rounded-full px-6 py-2 text-sm font-semibold text-white/70"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
              }}
            >
              Tap to name your catch
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Naming overlay */}
      <AnimatePresence>
        {phase === "naming" && (
          <motion.div
            key="naming-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center px-8"
            style={{
              background: "rgba(26, 26, 46, 0.92)",
              backdropFilter: "blur(16px)",
            }}
          >
            {friend.photoUrl && (
              <div className="relative mb-6">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="h-28 w-28 overflow-hidden rounded-full border-4 border-white/20"
                >
                  <img src={friend.photoUrl} alt="" className="h-full w-full object-cover" />
                </motion.div>
                <DogFilter />
              </div>
            )}

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-lg font-bold text-white/80"
            >
              Name your catch!
            </motion.p>

            <motion.input
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameConfirm()}
              placeholder="Enter a name..."
              autoFocus
              maxLength={20}
              className="w-full max-w-xs rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-center text-lg font-semibold text-white placeholder-white/30 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNameConfirm}
              disabled={!nickname.trim()}
              className="mt-5 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-white disabled:opacity-30"
            >
              Confirm
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fail burst effect on ball */}
      <AnimatePresence>
        {phase === "escaped" && (
          <motion.div
            key="burst-effect"
            className="pointer-events-none absolute left-1/2 z-40 -translate-x-1/2"
            style={{ top: "43%" }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div
              className="h-16 w-16 rounded-full"
              style={{
                background: "rgba(255,255,255,0.3)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
