import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { CaughtFriend, Move, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";
import DogFilter from "../components/dog-filter";
import {
  createBattlePokemon,
  calculateDamage,
  getEffectivenessText,
  cpuPickMove,
  getSpeedOrder,
  type BattlePokemon,
  type BattlePhase,
} from "../lib/battle";
import { getTauntPair } from "../lib/battleTaunts";
import { useAudio } from "../contexts/audio-context";

interface TurnResult {
  attackerName: string;
  defenderName: string;
  move: Move;
  damage: number;
  effectiveness: number;
}

export default function BattleScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { playDamage } = useAudio();
  const state = location.state as {
    player?: CaughtFriend;
    opponent?: CaughtFriend;
  } | null;

  const [player, setPlayer] = useState<BattlePokemon | null>(null);
  const [opponent, setOpponent] = useState<BattlePokemon | null>(null);
  const [phase, setPhase] = useState<BattlePhase>("intro");
  const [narrative, setNarrative] = useState("");
  const [playerShake, setPlayerShake] = useState(false);
  const [opponentShake, setOpponentShake] = useState(false);
  const [playerSpeech, setPlayerSpeech] = useState<string | null>(null);
  const [opponentSpeech, setOpponentSpeech] = useState<string | null>(null);
  const initialized = useRef(false);
  const tauntClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTauntsSoon = useCallback(() => {
    if (tauntClearRef.current) clearTimeout(tauntClearRef.current);
    tauntClearRef.current = setTimeout(() => {
      setPlayerSpeech(null);
      setOpponentSpeech(null);
      tauntClearRef.current = null;
    }, 5500);
  }, []);

  useEffect(() => {
    return () => {
      if (tauntClearRef.current) clearTimeout(tauntClearRef.current);
    };
  }, []);

  useEffect(() => {
    if (!state?.player || !state?.opponent || initialized.current) return;
    initialized.current = true;
    const p = createBattlePokemon(state.player);
    const o = createBattlePokemon(state.opponent);
    setPlayer(p);
    setOpponent(o);
    setNarrative(`A wild ${o.friend.username} appeared!`);
    setTimeout(() => {
      setNarrative(`What will ${p.friend.username} do?`);
      setPhase("player-turn");
    }, 1800);
  }, [state]);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const animateHit = (target: "player" | "opponent") => {
    playDamage();
    if (target === "player") {
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 400);
    } else {
      setOpponentShake(true);
      setTimeout(() => setOpponentShake(false), 400);
    }
  };

  const executeTurn = useCallback(
    async (
      attacker: BattlePokemon,
      defender: BattlePokemon,
      move: Move,
      attackerSide: "player" | "opponent",
    ): Promise<TurnResult & { defenderHp: number }> => {
      const { damage, effectiveness } = calculateDamage(
        attacker.friend,
        defender.friend,
        move,
      );

      setNarrative(`${attacker.friend.username} used ${move.name}!`);
      await delay(1200);

      animateHit(attackerSide === "player" ? "opponent" : "player");

      const newHp = Math.max(0, defender.currentHp - damage);

      if (damage > 0) {
        const { attacker: atkLine, defender: defLine } = getTauntPair(
          damage * 0.01 + effectiveness + Math.random(),
        );
        if (attackerSide === "player") {
          setPlayerSpeech(atkLine);
          setOpponentSpeech(defLine);
        } else {
          setOpponentSpeech(atkLine);
          setPlayerSpeech(defLine);
        }
        clearTauntsSoon();
      }

      if (attackerSide === "player") {
        setOpponent((prev) => (prev ? { ...prev, currentHp: newHp } : prev));
      } else {
        setPlayer((prev) => (prev ? { ...prev, currentHp: newHp } : prev));
      }

      const effText = getEffectivenessText(effectiveness);
      if (effText) {
        await delay(800);
        setNarrative(effText);
        await delay(1200);
      } else {
        await delay(600);
      }

      return {
        attackerName: attacker.friend.username,
        defenderName: defender.friend.username,
        move,
        damage,
        effectiveness,
        defenderHp: newHp,
      };
    },
    [clearTauntsSoon],
  );

  const handleFight = useCallback(
    async (move: Move) => {
      if (!player || !opponent) return;
      setPhase("animating");

      const speedFirst = getSpeedOrder(player.friend, opponent.friend);
      const cpuMove = cpuPickMove(opponent.friend);

      let currentPlayer = player;
      let currentOpponent = opponent;

      if (speedFirst === "player") {
        const r1 = await executeTurn(currentPlayer, currentOpponent, move, "player");
        currentOpponent = { ...currentOpponent, currentHp: r1.defenderHp };

        if (r1.defenderHp <= 0) {
          setNarrative(`${opponent.friend.username} fainted!`);
          await delay(1500);
          setNarrative(`${player.friend.username} wins!`);
          setPhase("victory");
          return;
        }

        const r2 = await executeTurn(currentOpponent, currentPlayer, cpuMove, "opponent");
        currentPlayer = { ...currentPlayer, currentHp: r2.defenderHp };

        if (r2.defenderHp <= 0) {
          setNarrative(`${player.friend.username} fainted!`);
          await delay(1500);
          setNarrative(`${opponent.friend.username} wins...`);
          setPhase("defeat");
          return;
        }
      } else {
        const r1 = await executeTurn(currentOpponent, currentPlayer, cpuMove, "opponent");
        currentPlayer = { ...currentPlayer, currentHp: r1.defenderHp };

        if (r1.defenderHp <= 0) {
          setNarrative(`${player.friend.username} fainted!`);
          await delay(1500);
          setNarrative(`${opponent.friend.username} wins...`);
          setPhase("defeat");
          return;
        }

        const r2 = await executeTurn(currentPlayer, currentOpponent, move, "player");
        currentOpponent = { ...currentOpponent, currentHp: r2.defenderHp };

        if (r2.defenderHp <= 0) {
          setNarrative(`${opponent.friend.username} fainted!`);
          await delay(1500);
          setNarrative(`${player.friend.username} wins!`);
          setPhase("victory");
          return;
        }
      }

      setNarrative(`What will ${player.friend.username} do?`);
      setPhase("player-turn");
    },
    [player, opponent, executeTurn],
  );

  if (!state?.player || !state?.opponent || !player || !opponent) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-navy)]">
        <p className="text-sm text-white/40">No battle data.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white"
        >
          Back to Home
        </motion.button>
      </div>
    );
  }

  const playerLevel = Math.max(1, Math.floor(player.friend.cp / 20));
  const opponentLevel = Math.max(1, Math.floor(opponent.friend.cp / 20));

  const pixelFont = "'Press Start 2P', monospace";

  return (
    <div className="fixed inset-0 flex flex-col" style={{ fontFamily: pixelFont }}>
      {/* === BATTLEFIELD (top ~60%) === */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      >
        <img
          src="/battlearena.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* Opponent info box (top-left, like classic Pokemon) */}
        <div className="absolute top-3 left-3 z-10">
          <OpponentInfoBox
            name={opponent.friend.username}
            level={opponentLevel}
            currentHp={opponent.currentHp}
            maxHp={opponent.maxHp}
            type={opponent.friend.primaryType}
          />
        </div>

        {/* Opponent sprite — on the far platform (upper-right) */}
        <div
          className="absolute z-10 flex flex-col items-end gap-1"
          style={{ top: "10%", right: "8%" }}
        >
          <TauntBubble text={opponentSpeech} side="opponent" />
          <motion.div
            animate={opponentShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <PokemonSprite friend={opponent.friend} size={96} flipped />
          </motion.div>
        </div>

        {/* Player info box (bottom-right, like classic Pokemon) */}
        <div className="absolute right-3 bottom-3 z-10">
          <PlayerInfoBox
            name={player.friend.username}
            level={playerLevel}
            currentHp={player.currentHp}
            maxHp={player.maxHp}
            type={player.friend.primaryType}
          />
        </div>

        {/* Player sprite — on the near platform (lower-left) */}
        <div
          className="absolute z-10 flex flex-col items-start gap-1"
          style={{ bottom: "8%", left: "8%" }}
        >
          <TauntBubble text={playerSpeech} side="player" />
          <motion.div
            animate={playerShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <PokemonSprite friend={player.friend} size={120} />
          </motion.div>
        </div>
      </div>

      {/* === BOTTOM PANEL (~38%) === */}
      <div
        className="flex shrink-0 flex-col"
        style={{ height: "38%", minHeight: 150, background: "#f8f0d0" }}
      >
        {phase === "moves" ? (
          <MoveSelectPanel
            moves={player.friend.moves}
            onSelect={(move) => {
              handleFight(move);
            }}
            onBack={() => setPhase("player-turn")}
          />
        ) : phase === "victory" || phase === "defeat" ? (
          <div className="flex h-full">
            <NarratorBox text={narrative} />
            <div className="flex flex-1 items-center justify-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
                className="rounded-lg px-6 py-3 text-white uppercase"
                style={{
                  fontFamily: pixelFont,
                  fontSize: 11,
                  background: phase === "victory" ? "#4a9a3a" : "#C03028",
                }}
              >
                {phase === "victory" ? "Victory!" : "Try Again"}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            <NarratorBox text={narrative} />
            <ActionButtons
              disabled={phase !== "player-turn"}
              onFight={() => setPhase("moves")}
              onRun={() => {
                setNarrative("Got away safely!");
                setPhase("ran");
                setTimeout(() => navigate("/"), 1200);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

const PX_FONT = "'Press Start 2P', monospace";

function TauntBubble({
  text,
  side,
}: {
  text: string | null;
  side: "player" | "opponent";
}) {
  if (!text) return null;

  return (
    <div className="relative mb-2 w-full max-w-[min(92vw,320px)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={text + side}
          role="status"
          initial={{ opacity: 0, scale: 0.88, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 520, damping: 28 }}
          className={`pointer-events-none relative z-30 w-max max-w-[min(92vw,320px)] rounded-lg border-4 border-[#2a2a2a] bg-[#fffef5] px-5 py-4 shadow-[4px_6px_0_#1a1a1a,0_8px_24px_rgba(0,0,0,0.45)] ${
            side === "opponent" ? "ml-auto" : ""
          }`}
          style={{
            fontFamily: PX_FONT,
            fontSize: "clamp(11px, 3.2vw, 16px)",
            lineHeight: 1.45,
            color: "#111",
            textShadow:
              "0 1px 0 #fff, 0 0 2px rgba(255,255,255,0.9), 1px 1px 0 rgba(0,0,0,0.15)",
          }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, (current / max) * 100);
  const color = pct > 50 ? "#4ade80" : pct > 20 ? "#facc15" : "#ef4444";

  return (
    <div className="flex items-center gap-1.5">
      <span
        style={{ fontFamily: PX_FONT, fontSize: 7, color: "#c8a830" }}
      >
        HP
      </span>
      <div
        className="h-[6px] flex-1 overflow-hidden"
        style={{ background: "#3a3a3a", borderRadius: 1 }}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: color, borderRadius: 1 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function OpponentInfoBox({
  name,
  level,
  currentHp,
  maxHp,
}: {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  type: PokemonType;
}) {
  return (
    <div
      className="w-44 px-3 py-2"
      style={{
        fontFamily: PX_FONT,
        background: "linear-gradient(180deg, #f0e8c8 0%, #d8d0a8 100%)",
        border: "3px solid #585858",
        borderRadius: 6,
        boxShadow: "2px 2px 0 #404040",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="truncate text-gray-900"
          style={{ fontSize: 10, maxWidth: 90 }}
        >
          {name}
        </span>
        <span style={{ fontSize: 8, color: "#606060" }}>
          Lv{level}
        </span>
      </div>
      <HpBar current={currentHp} max={maxHp} />
    </div>
  );
}

function PlayerInfoBox({
  name,
  level,
  currentHp,
  maxHp,
}: {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  type: PokemonType;
}) {
  return (
    <div
      className="w-48 px-3 py-2"
      style={{
        fontFamily: PX_FONT,
        background: "linear-gradient(180deg, #f0e8c8 0%, #d8d0a8 100%)",
        border: "3px solid #585858",
        borderRadius: 6,
        boxShadow: "2px 2px 0 #404040",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="truncate text-gray-900"
          style={{ fontSize: 10, maxWidth: 100 }}
        >
          {name}
        </span>
        <span style={{ fontSize: 8, color: "#606060" }}>
          Lv{level}
        </span>
      </div>
      <HpBar current={currentHp} max={maxHp} />
      <p
        className="mt-0.5 text-right"
        style={{ fontSize: 8, color: "#505050" }}
      >
        {currentHp}/{maxHp}
      </p>
    </div>
  );
}

function PokemonSprite({
  friend,
  size,
  flipped,
}: {
  friend: CaughtFriend;
  size: number;
  flipped?: boolean;
}) {
  const typeColor = TYPE_COLORS[friend.primaryType];
  return (
    <div
      className="relative overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        border: `3px solid ${typeColor}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px ${typeColor}44`,
        transform: flipped ? "scaleX(-1)" : undefined,
      }}
    >
      {friend.photoUrl ? (
        <>
          <img
            src={friend.photoUrl}
            alt={friend.username}
            className="h-full w-full object-cover"
            style={{ transform: flipped ? "scaleX(-1)" : undefined }}
          />
          <DogFilter />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-white"
          style={{
            backgroundColor: typeColor + "88",
            fontFamily: PX_FONT,
            fontSize: size * 0.3,
          }}
        >
          <span style={{ transform: flipped ? "scaleX(-1)" : undefined }}>
            {friend.username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

function NarratorBox({ text }: { text: string }) {
  return (
    <div
      className="flex flex-1 items-center px-4 py-3"
      style={{
        borderTop: "3px solid #585858",
        borderRight: "2px solid #585858",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="leading-relaxed text-gray-900"
          style={{ fontFamily: PX_FONT, fontSize: 12 }}
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function ActionButtons({
  disabled,
  onFight,
  onRun,
}: {
  disabled: boolean;
  onFight: () => void;
  onRun: () => void;
}) {
  const btnBase = {
    fontFamily: PX_FONT,
    fontSize: 12,
    borderRadius: 6,
    border: "2px solid #585858",
    cursor: disabled ? ("not-allowed" as const) : ("pointer" as const),
  };

  return (
    <div
      className="grid grid-cols-2 grid-rows-1 gap-2 p-3"
      style={{
        width: "45%",
        borderTop: "3px solid #585858",
      }}
    >
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.95 }}
        onClick={onFight}
        disabled={disabled}
        className="py-3 uppercase text-white"
        style={{
          ...btnBase,
          background: disabled ? "#999" : "#F08030",
        }}
      >
        Fight
      </motion.button>
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.95 }}
        onClick={onRun}
        disabled={disabled}
        className="py-3 uppercase text-white"
        style={{
          ...btnBase,
          background: disabled ? "#999" : "#6890F0",
        }}
      >
        Run
      </motion.button>
    </div>
  );
}

function MoveSelectPanel({
  moves,
  onSelect,
  onBack,
}: {
  moves: Move[];
  onSelect: (move: Move) => void;
  onBack: () => void;
}) {
  return (
    <div
      className="flex h-full"
      style={{ borderTop: "3px solid #585858" }}
    >
      <div className="grid flex-1 grid-cols-2 gap-2 p-3">
        {moves.map((move) => {
          const moveColor = TYPE_COLORS[move.type];
          return (
            <motion.button
              key={move.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(move)}
              className="flex flex-col items-start justify-center px-3 py-2"
              style={{
                fontFamily: PX_FONT,
                background: moveColor + "33",
                border: `2px solid ${moveColor}`,
                borderRadius: 6,
              }}
            >
              <span className="text-gray-900" style={{ fontSize: 10 }}>
                {move.name}
              </span>
              <span style={{ fontSize: 7, color: "#707070", marginTop: 2 }}>
                {move.category} {move.power > 0 ? `PWR ${move.power}` : ""}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div
        className="flex w-20 items-center justify-center"
        style={{ borderLeft: "2px solid #585858" }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          style={{ fontFamily: PX_FONT, fontSize: 10, color: "#707070" }}
        >
          Back
        </motion.button>
      </div>
    </div>
  );
}
