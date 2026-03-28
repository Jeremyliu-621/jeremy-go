import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import {
  generateFriendStats,
  saveCatch,
  checkNameTaken,
  STAT_LABELS,
  STAT_ORDER,
  STAT_MAX,
  FLAVOR_LOADING_LINES,
  type GeneratedStats,
} from "../lib/chuddex";
import PokeballSpinner from "../components/pokeball-spinner";
import type { FriendProfile, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";
import DogFilter from "../components/dog-filter";

const PX = "'Press Start 2P', monospace";

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

  const [nickname, setNickname] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!friend || !user || hasStarted.current) return;
    hasStarted.current = true;

    const run = async () => {
      try {
        const generated = await generateFriendStats(friend.username, friend.photoUrl);
        setStats(generated);
        setNickname(friend.username);
        setState("revealing");
        setTimeout(() => setState("done"), 600);
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong",
        );
        setState("error");
      }
    };

    run();
  }, [friend, user]);

  const handleSave = async () => {
    if (!nickname.trim() || !user || !friend || !stats) return;
    setSaving(true);
    setNameError("");

    try {
      const taken = await checkNameTaken(user.id, nickname.trim());
      if (taken) {
        setNameError("That name is already in your Chuddex!");
        setSaving(false);
        return;
      }
      await saveCatch(user.id, friend, stats, nickname.trim());
      setSaved(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("unique") || msg.includes("duplicate")) {
        setNameError("Name already taken!");
      } else {
        setNameError("Save failed. Try again.");
      }
    }
    setSaving(false);
  };

  useEffect(() => {
    if (state !== "loading") return;
    const interval = setInterval(() => {
      setFlavorIdx((i) => (i + 1) % FLAVOR_LOADING_LINES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [state]);

  if (!friend) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-[var(--color-navy)]"
        style={{ fontFamily: PX }}
      >
        <p className="text-white/50" style={{ fontSize: 10 }}>
          No data.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-navy)]"
        style={{ fontFamily: PX, gap: 24, padding: 32 }}
      >
        <p className="text-center text-red-400" style={{ fontSize: 10, lineHeight: "2" }}>
          {errorMsg}
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/", { replace: true })}
          className="text-white"
          style={{
            fontSize: 11,
            padding: "10px 24px",
            background: "var(--color-primary)",
            borderRadius: 8,
            border: "3px solid rgba(255,255,255,0.2)",
          }}
        >
          BACK HOME
        </motion.button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-navy)]"
        style={{ fontFamily: PX, gap: 24 }}
      >
        <PokeballSpinner size={72} wobble />
        <AnimatePresence mode="wait">
          <motion.p
            key={flavorIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="text-white/50"
            style={{ fontSize: 9, padding: "0 24px", textAlign: "center", lineHeight: "1.8" }}
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
      style={{ fontFamily: PX, touchAction: "pan-y", userSelect: "none" }}
    >
      <div
        className="flex flex-col items-center"
        style={{ padding: "40px 24px 64px" }}
      >
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="uppercase text-white/40"
          style={{ fontSize: 10, letterSpacing: "0.1em", marginBottom: 24 }}
        >
          New Chuddex Entry
        </motion.p>

        {/* Photo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
          className="relative overflow-hidden rounded-full"
          style={{
            width: 120,
            height: 120,
            border: `5px solid ${typeColor}`,
          }}
        >
          {friend.photoUrl ? (
            <>
              <img
                src={friend.photoUrl}
                alt={friend.username}
                className="h-full w-full object-cover"
              />
              <DogFilter />
            </>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-white"
              style={{ backgroundColor: typeColor + "66", fontSize: 36 }}
            >
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Name */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white"
          style={{ fontSize: 18, marginTop: 20 }}
        >
          {friend.username}
        </motion.h2>

        {/* Types */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="flex"
          style={{ gap: 8, marginTop: 12 }}
        >
          <TypeBadge type={stats.primaryType} />
          {stats.secondaryType && <TypeBadge type={stats.secondaryType} />}
        </motion.div>

        {/* CP */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ fontSize: 16, color: "#FFCB05", marginTop: 12 }}
        >
          CP {stats.cp}
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center italic text-white/50"
          style={{ fontSize: 8, lineHeight: "2", marginTop: 16, maxWidth: 280 }}
        >
          {stats.description}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full"
          style={{ maxWidth: 320, marginTop: 32 }}
        >
          <h3
            className="uppercase text-white/40"
            style={{ fontSize: 10, letterSpacing: "0.1em", marginBottom: 12 }}
          >
            Stats
          </h3>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "3px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "12px 16px",
            }}
          >
            {STAT_ORDER.map((key, i) => {
              const value = (stats.stats as unknown as Record<string, number>)[key] ?? 0;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="flex items-center"
                  style={{ gap: 8, padding: "6px 0" }}
                >
                  <span
                    className="text-white/60"
                    style={{ fontSize: 8, minWidth: 48 }}
                  >
                    {STAT_LABELS[key]}
                  </span>
                  <div
                    className="flex-1"
                    style={{ height: 7, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}
                  >
                    <motion.div
                      style={{
                        height: "100%",
                        backgroundColor: typeColor,
                        borderRadius: 2,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / STAT_MAX) * 100}%` }}
                      transition={{ duration: 0.6, delay: 1.0 + i * 0.1 }}
                    />
                  </div>
                  <span
                    className="text-white"
                    style={{ fontSize: 8, minWidth: 28, textAlign: "right" }}
                  >
                    {value}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Moves */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7 }}
          className="w-full"
          style={{ maxWidth: 320, marginTop: 32 }}
        >
          <h3
            className="uppercase text-white/40"
            style={{ fontSize: 10, letterSpacing: "0.1em", marginBottom: 12 }}
          >
            Moves
          </h3>
          <div className="grid grid-cols-2" style={{ gap: 10 }}>
            {stats.moves.map((move, i) => {
              const moveColor = TYPE_COLORS[move.type];
              return (
                <motion.div
                  key={move.name + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8 + i * 0.1 }}
                  style={{
                    backgroundColor: moveColor + "33",
                    borderLeft: `4px solid ${moveColor}`,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <p className="text-white" style={{ fontSize: 9 }}>
                    {move.name}
                  </p>
                  <div className="flex items-center" style={{ gap: 6, marginTop: 4 }}>
                    <span className="text-white/50" style={{ fontSize: 7 }}>
                      {move.category}
                    </span>
                    {move.power > 0 && (
                      <span className="text-white/70" style={{ fontSize: 7 }}>
                        PWR {move.power}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Flavor text */}
        {stats.flavorText && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="text-center italic text-white/30"
            style={{ fontSize: 7, lineHeight: "2", marginTop: 32, maxWidth: 260 }}
          >
            &ldquo;{stats.flavorText}&rdquo;
          </motion.p>
        )}

        {/* Save section */}
        {!saved ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
              className="w-full"
              style={{ maxWidth: 320, marginTop: 32 }}
            >
              <h3
                className="text-center uppercase text-white/40"
                style={{ fontSize: 10, letterSpacing: "0.1em", marginBottom: 12 }}
              >
                Name Your Catch
              </h3>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNameError("");
                }}
                maxLength={20}
                className="w-full text-center text-white outline-none"
                style={{
                  fontFamily: PX,
                  fontSize: 12,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.08)",
                  border: "3px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                }}
                placeholder="Enter a name..."
              />
              {nameError && (
                <p
                  className="text-center text-red-400"
                  style={{ fontSize: 8, marginTop: 8, lineHeight: "1.8" }}
                >
                  {nameError}
                </p>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving || !nickname.trim()}
              className="text-white disabled:opacity-50"
              style={{
                fontSize: 12,
                marginTop: 24,
                padding: "12px 32px",
                background: "var(--color-primary)",
                border: "3px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
              }}
            >
              {saving ? "SAVING..." : "CONFIRM"}
            </motion.button>
          </>
        ) : (
          <>
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="uppercase text-green-400"
              style={{ fontSize: 11, marginTop: 32, letterSpacing: "0.05em" }}
            >
              Added to your Chuddex!
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/chuddex", { replace: true })}
              className="text-white"
              style={{
                fontSize: 11,
                marginTop: 24,
                padding: "12px 28px",
                background: "var(--color-primary)",
                border: "3px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
              }}
            >
              VIEW CHUDDEX
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/", { replace: true })}
              className="text-white/40"
              style={{ fontSize: 9, marginTop: 12, padding: "8px 16px" }}
            >
              BACK TO SCANNING
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="inline-block text-white"
      style={{
        fontSize: 8,
        fontFamily: PX,
        backgroundColor: TYPE_COLORS[type],
        padding: "5px 10px",
        borderRadius: 4,
        letterSpacing: "0.05em",
      }}
    >
      {type.toUpperCase()}
    </span>
  );
}
