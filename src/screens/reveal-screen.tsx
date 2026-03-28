import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import {
  generateFriendStats,
  saveCatch,
  STAT_LABELS,
  STAT_ORDER,
  STAT_MAX,
  FLAVOR_LOADING_LINES,
  type GeneratedStats,
} from "../lib/frienddex";
import PokeballSpinner from "../components/pokeball-spinner";
import type { FriendProfile, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";

type RevealState = "loading" | "revealing" | "done" | "error";

export default function RevealScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const friend = (location.state as { friend?: FriendProfile })?.friend;

  const [state, setState] = useState<RevealState>("loading");
  const [stats, setStats] = useState<GeneratedStats | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [flavorIdx, setFlavorIdx] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!friend || !user || hasStarted.current) return;
    hasStarted.current = true;

    const run = () => {
      try {
        const generated = generateFriendStats(friend.username);
        setStats(generated);

        saveCatch(user.id, friend, generated);

        setState("revealing");
        setTimeout(() => setState("done"), 600);
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong",
        );
        setState("error");
      }
    };

    setTimeout(run, 1800);
  }, [friend, user]);

  useEffect(() => {
    if (state !== "loading") return;
    const interval = setInterval(() => {
      setFlavorIdx((i) => (i + 1) % FLAVOR_LOADING_LINES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [state]);

  if (!friend) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-navy)]">
        <p className="text-white/50">No friend data.</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--color-navy)] px-8">
        <p className="text-center font-semibold text-red-400">{errorMsg}</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/", { replace: true })}
          className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white"
        >
          Back to Home
        </motion.button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--color-navy)]">
        <PokeballSpinner size={72} wobble />
        <AnimatePresence mode="wait">
          <motion.p
            key={flavorIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-white/50"
          >
            {FLAVOR_LOADING_LINES[flavorIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  if (!stats) return null;

  const typeColor = TYPE_COLORS[stats.primaryType];

  return (
    <motion.div
      className="fixed inset-0 overflow-y-auto bg-[var(--color-navy)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      <div className="flex flex-col items-center px-6 pt-12 pb-16">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 text-sm font-bold uppercase tracking-widest text-white/40"
        >
          New Frienddex Entry
        </motion.p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.3,
          }}
          className="h-40 w-40 overflow-hidden rounded-full border-4"
          style={{
            borderColor: typeColor,
            boxShadow: `0 0 40px ${typeColor}44`,
          }}
        >
          {friend.photoUrl ? (
            <img
              src={friend.photoUrl}
              alt={friend.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-4xl font-black text-white"
              style={{ backgroundColor: typeColor + "66" }}
            >
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-3xl font-black text-white"
        >
          {friend.username}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-3 flex gap-2"
        >
          <TypeBadge type={stats.primaryType} />
          {stats.secondaryType && <TypeBadge type={stats.secondaryType} />}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-3 text-2xl font-black"
          style={{ color: "var(--color-yellow)" }}
        >
          CP {stats.cp}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 max-w-xs text-center text-sm italic text-white/50"
        >
          {stats.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 w-full max-w-sm"
        >
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">
            Stats
          </h3>
          <div className="space-y-3">
            {STAT_ORDER.map((key, i) => {
              const value = (stats.stats as Record<string, number>)[key] ?? 0;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                >
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-white/70">
                      {STAT_LABELS[key]}
                    </span>
                    <span className="font-bold text-white">{value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: typeColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / STAT_MAX) * 100}%` }}
                      transition={{ duration: 0.6, delay: 1.0 + i * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          className="mt-8 w-full max-w-sm"
        >
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">
            Moves
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {stats.moves.map((move, i) => {
              const moveColor = TYPE_COLORS[move.type];
              return (
                <motion.div
                  key={move.name + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 + i * 0.1 }}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: moveColor + "33",
                    borderLeft: `3px solid ${moveColor}`,
                  }}
                >
                  <p className="text-sm font-bold text-white">{move.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-white/50">{move.category}</span>
                    {move.power > 0 && (
                      <span className="text-xs font-semibold text-white/70">
                        PWR {move.power}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {stats.flavorText && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="mt-8 max-w-xs text-center text-xs italic text-white/30"
          >
            &ldquo;{stats.flavorText}&rdquo;
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.4 }}
          className="mt-8 text-sm font-black uppercase tracking-wider text-green-400"
        >
          Added to your Frienddex!
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/frienddex", { replace: true })}
          className="mt-6 rounded-full bg-[var(--color-primary)] px-8 py-3 text-sm font-bold text-white"
        >
          View Frienddex
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/", { replace: true })}
          className="mt-3 px-6 py-2 text-sm font-medium text-white/40"
        >
          Back to Scanning
        </motion.button>
      </div>
    </motion.div>
  );
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}
