import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import { fetchChuddex, STAT_LABELS, STAT_ORDER, STAT_MAX } from "../lib/chuddex";
import PokeballSpinner from "../components/pokeball-spinner";
import type { CaughtFriend, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";
import DogFilter from "../components/dog-filter";

const PX = "'Press Start 2P', monospace";

type SelectStep = "pick-player" | "pick-opponent";

export default function BattleSelectScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [friends, setFriends] = useState<CaughtFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<SelectStep>("pick-player");
  const [playerPick, setPlayerPick] = useState<CaughtFriend | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchChuddex(user.id).then((data) => {
      data.sort((a, b) => a.pokedexNumber - b.pokedexNumber);
      setFriends(data);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const row = el.children[selectedIdx] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIdx]);

  const availableFriends =
    step === "pick-opponent" && playerPick
      ? friends.filter((f) => f.id !== playerPick.id)
      : friends;

  const selected = availableFriends[selectedIdx] ?? null;
  const pad3 = (n: number) => String(n).padStart(3, "0");

  const handleSelect = () => {
    if (!selected) return;
    if (step === "pick-player") {
      setPlayerPick(selected);
      setStep("pick-opponent");
      setSelectedIdx(0);
    } else if (playerPick) {
      navigate("/battle/fight", {
        state: { player: playerPick, opponent: selected },
      });
    }
  };

  const handleBack = () => {
    if (step === "pick-opponent") {
      setStep("pick-player");
      setPlayerPick(null);
      setSelectedIdx(0);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-navy)]">
        <PokeballSpinner size={64} />
      </div>
    );
  }

  if (friends.length < 2) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ fontFamily: PX, background: "#b8211a", padding: 32, gap: 24 }}
      >
        <p
          className="text-center text-white"
          style={{ fontSize: 11, lineHeight: "2.2" }}
        >
          You need at least 2 entries in your Chuddex to battle. Go catch some more!
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="text-white"
          onClick={() => navigate("/")}
          style={{
            fontSize: 12,
            padding: "10px 24px",
            background: "#5a2a2a",
            border: "4px solid #3a1a1a",
            borderRadius: 8,
          }}
        >
          BACK HOME
        </motion.button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ fontFamily: PX, background: "#b8211a" }}
    >
      {/* Top bar */}
      <div
        className="flex shrink-0 items-center justify-between"
        style={{ background: "#9a1a14", height: 52, padding: "0 24px" }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleBack}
          className="text-white"
          style={{ fontSize: 13 }}
        >
          ← BACK
        </motion.button>
        {step === "pick-opponent" && playerPick && (
          <span className="text-white" style={{ fontSize: 9, opacity: 0.5 }}>
            YOUR: {playerPick.username.toUpperCase()}
          </span>
        )}
      </div>

      {/* Device body */}
      <div
        className="flex min-h-0 flex-1"
        style={{ gap: 28, padding: 28 }}
      >
        {/* ═══ LEFT SCREEN: Detail ═══ */}
        <div
          className="flex w-[50%] shrink-0 flex-col overflow-hidden"
          style={{
            background: "#e8e0c0",
            border: "5px solid #505050",
            borderRadius: 10,
            boxShadow:
              "inset 0 0 12px rgba(0,0,0,0.12), 5px 5px 0 rgba(0,0,0,0.2)",
          }}
        >
          {selected ? (
            <LeftDetail friend={selected} pad3={pad3} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <p
                style={{ fontSize: 12, color: "#888", lineHeight: "2.2" }}
                className="text-center"
              >
                No friends available.
              </p>
            </div>
          )}
        </div>

        {/* ═══ RIGHT PANEL: List ═══ */}
        <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 14 }}>
          {/* Header */}
          <div
            className="shrink-0 text-center text-white"
            style={{
              fontSize: 11,
              padding: "12px 16px",
              background: "#5a2a2a",
              border: "4px solid #3a1a1a",
              borderRadius: 10,
              letterSpacing: "0.05em",
            }}
          >
            BATTLE SELECT
          </div>

          {/* Step instruction */}
          <div
            className="shrink-0 text-center"
            style={{
              fontSize: 10,
              padding: "10px 16px",
              background: "#e0d8b8",
              border: "4px solid #585858",
              borderRadius: 8,
              color: step === "pick-player" ? "#c03028" : "#2868a8",
            }}
          >
            {step === "pick-player"
              ? "CHOOSE YOUR FIGHTER"
              : "CHOOSE OPPONENT"}
          </div>

          {/* Scrollable list */}
          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-y-auto"
            style={{
              background: "#283848",
              border: "4px solid #585858",
              borderRadius: 10,
              touchAction: "pan-y",
              padding: "4px 0",
            }}
          >
            {availableFriends.map((f, i) => {
              const isSelected = i === selectedIdx;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedIdx(i)}
                  className="flex w-full items-center text-left"
                  style={{
                    fontSize: 11,
                    padding: "10px 14px",
                    gap: 10,
                    color: isSelected ? "#fff" : "#8899aa",
                    background: isSelected
                      ? "#4878a8"
                      : i % 2 === 0
                        ? "transparent"
                        : "rgba(255,255,255,0.03)",
                    borderLeft: isSelected
                      ? "5px solid #88ccff"
                      : "5px solid transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <span
                    style={{
                      color: isSelected ? "#aaddff" : "#556677",
                      fontSize: 10,
                      minWidth: 44,
                    }}
                  >
                    #{pad3(f.pokedexNumber)}
                  </span>
                  <span className="truncate">
                    {f.username.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ background: "#9a1a14", height: 56, gap: 28, padding: "0 24px" }}
      >
        <button
          onClick={() => setSelectedIdx((p) => Math.max(0, p - 1))}
          className="text-white active:opacity-70"
          style={{
            fontSize: 12,
            padding: "8px 20px",
            background: "#5a2a2a",
            border: "4px solid #3a1a1a",
            borderRadius: 8,
          }}
        >
          ▲ PREV
        </button>
        <button
          onClick={handleSelect}
          className="text-white active:opacity-70"
          style={{
            fontSize: 12,
            padding: "8px 24px",
            background: step === "pick-player" ? "#c03028" : "#2868a8",
            border: "4px solid #3a1a1a",
            borderRadius: 8,
          }}
        >
          SELECT
        </button>
        <button
          onClick={() =>
            setSelectedIdx((p) =>
              Math.min(availableFriends.length - 1, p + 1),
            )
          }
          className="text-white active:opacity-70"
          style={{
            fontSize: 12,
            padding: "8px 20px",
            background: "#5a2a2a",
            border: "4px solid #3a1a1a",
            borderRadius: 8,
          }}
        >
          ▼ NEXT
        </button>
      </div>
    </div>
  );
}

/* ─── Left Detail Panel ─── */

function LeftDetail({
  friend,
  pad3,
}: {
  friend: CaughtFriend;
  pad3: (n: number) => string;
}) {
  const typeColor = TYPE_COLORS[friend.primaryType];

  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto"
      style={{ padding: 16 }}
    >
      {/* Type + number header */}
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 11, color: "#505050", paddingBottom: 10 }}
      >
        <span>{friend.primaryType.toUpperCase()}</span>
        <span>#{pad3(friend.pokedexNumber)}</span>
      </div>

      {/* Photo frame */}
      <div className="flex justify-center" style={{ paddingBottom: 12 }}>
        <div
          className="relative overflow-hidden"
          style={{
            width: 110,
            height: 110,
            background: "#f0e8d0",
            border: "5px solid #888",
            borderRadius: 8,
            boxShadow: "inset 3px 3px 0 #ccc, inset -3px -3px 0 #aaa",
          }}
        >
          {friend.photoUrl ? (
            <>
              <img
                src={friend.photoUrl}
                alt={friend.username}
                className="h-full w-full object-cover"
                draggable={false}
              />
              <DogFilter />
            </>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-white"
              style={{
                backgroundColor: typeColor + "66",
                fontFamily: PX,
                fontSize: 36,
              }}
            >
              {friend.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Description box */}
      <div
        style={{
          fontSize: 9,
          lineHeight: "2",
          color: "#404040",
          background: "#f0e8d0",
          border: "4px solid #888",
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 12,
        }}
      >
        {friend.description}
      </div>

      {/* Type badges + CP */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 12, padding: "0 2px" }}
      >
        <div className="flex" style={{ gap: 8 }}>
          <TypeBadge type={friend.primaryType} />
          {friend.secondaryType && <TypeBadge type={friend.secondaryType} />}
        </div>
        <span style={{ fontSize: 11, color: "#c8a830", fontFamily: PX }}>
          CP {friend.cp}
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          background: "#f0e8d0",
          border: "4px solid #888",
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 12,
        }}
      >
        {STAT_ORDER.map((key) => {
          const value = (friend.stats as unknown as Record<string, number>)[key] ?? 0;
          const pct = (value / STAT_MAX) * 100;
          return (
            <div
              key={key}
              className="flex items-center"
              style={{ gap: 8, padding: "5px 0" }}
            >
              <span
                style={{
                  fontSize: 8,
                  color: "#606060",
                  minWidth: 48,
                  fontFamily: PX,
                }}
              >
                {STAT_LABELS[key]}
              </span>
              <div
                className="flex-1"
                style={{ height: 7, background: "#c8c0a0", borderRadius: 2 }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: typeColor,
                    borderRadius: 2,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 8,
                  color: "#404040",
                  minWidth: 28,
                  textAlign: "right",
                  fontFamily: PX,
                }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Flavor text */}
      {friend.flavorText && (
        <p
          className="text-center italic"
          style={{
            fontSize: 8,
            color: "#807060",
            lineHeight: "1.9",
            padding: "4px 8px",
          }}
        >
          &ldquo;{friend.flavorText}&rdquo;
        </p>
      )}
    </div>
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
        letterSpacing: "0.05em",
        padding: "5px 10px",
        borderRadius: 4,
      }}
    >
      {type.toUpperCase()}
    </span>
  );
}
