import { useState, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { CaughtFriend, Move, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";
import {
  createBattlePokemon,
  calculateDamage,
  getEffectivenessText,
  cpuPickMove,
  getSpeedOrder,
  type BattlePokemon,
  type BattlePhase,
} from "../lib/battle";

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
  const initialized = useRef(false);

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
    [],
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

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--color-navy)]">
      {/* === BATTLEFIELD (top ~60%) === */}
      <div
        className="relative flex-1"
        style={{
          background: "linear-gradient(180deg, #2a4a2a 0%, #4a7a3a 40%, #6a9a4a 70%, #8ab85a 100%)",
          minHeight: 0,
        }}
      >
        {/* Opponent (top-right) */}
        <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
          <OpponentInfoBox
            name={opponent.friend.username}
            level={opponentLevel}
            currentHp={opponent.currentHp}
            maxHp={opponent.maxHp}
            type={opponent.friend.primaryType}
          />
          <motion.div
            animate={opponentShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mt-4"
          >
            <PokemonSprite friend={opponent.friend} size={100} flipped />
          </motion.div>
        </div>

        {/* Player (bottom-left) */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <motion.div
            animate={playerShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="mb-2"
          >
            <PokemonSprite friend={player.friend} size={110} />
          </motion.div>
          <PlayerInfoBox
            name={player.friend.username}
            level={playerLevel}
            currentHp={player.currentHp}
            maxHp={player.maxHp}
            type={player.friend.primaryType}
          />
        </div>
      </div>

      {/* === BOTTOM PANEL (~40%) === */}
      <div
        className="flex shrink-0 flex-col"
        style={{ height: "40%", minHeight: 160, background: "#f8f0d0" }}
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
                className="rounded-lg px-8 py-3 text-lg font-black text-white"
                style={{
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

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, (current / max) * 100);
  const color = pct > 50 ? "#4ade80" : pct > 20 ? "#facc15" : "#ef4444";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-yellow-700">HP</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-600/40">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
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
      className="w-48 rounded-lg px-3 py-2"
      style={{ background: "#f8f0d0", border: "2px solid #a08060" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-gray-800">{name}</span>
        <span className="text-[10px] font-bold text-gray-500">
          Lv.{level}
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
      className="w-52 rounded-lg px-3 py-2"
      style={{ background: "#f8f0d0", border: "2px solid #a08060" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-gray-800">{name}</span>
        <span className="text-[10px] font-bold text-gray-500">
          Lv.{level}
        </span>
      </div>
      <HpBar current={currentHp} max={maxHp} />
      <p className="mt-0.5 text-right text-xs font-bold text-gray-600">
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
      className="overflow-hidden rounded-full border-3"
      style={{
        width: size,
        height: size,
        borderColor: typeColor,
        boxShadow: `0 4px 20px ${typeColor}44`,
        transform: flipped ? "scaleX(-1)" : undefined,
      }}
    >
      {friend.photoUrl ? (
        <img
          src={friend.photoUrl}
          alt={friend.username}
          className="h-full w-full object-cover"
          style={{ transform: flipped ? "scaleX(-1)" : undefined }}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-3xl font-black text-white"
          style={{ backgroundColor: typeColor + "88" }}
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
      className="flex flex-1 items-center px-5 py-4"
      style={{
        borderTop: "3px solid #a08060",
        borderRight: "2px solid #a08060",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-base font-semibold leading-snug text-gray-800"
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
  return (
    <div
      className="grid grid-cols-2 grid-rows-1 gap-2 p-4"
      style={{
        width: "45%",
        borderTop: "3px solid #a08060",
      }}
    >
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.95 }}
        onClick={onFight}
        disabled={disabled}
        className="rounded-lg py-3 text-base font-black text-white uppercase tracking-wide"
        style={{
          background: disabled ? "#999" : "#F08030",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Fight
      </motion.button>
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.95 }}
        onClick={onRun}
        disabled={disabled}
        className="rounded-lg py-3 text-base font-black text-white uppercase tracking-wide"
        style={{
          background: disabled ? "#999" : "#6890F0",
          cursor: disabled ? "not-allowed" : "pointer",
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
    <div className="flex h-full" style={{ borderTop: "3px solid #a08060" }}>
      <div className="grid flex-1 grid-cols-2 gap-2 p-3">
        {moves.map((move) => {
          const moveColor = TYPE_COLORS[move.type];
          return (
            <motion.button
              key={move.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(move)}
              className="flex flex-col items-start justify-center rounded-lg px-3 py-2"
              style={{
                background: moveColor + "33",
                border: `2px solid ${moveColor}`,
              }}
            >
              <span className="text-sm font-bold text-gray-800">
                {move.name}
              </span>
              <span className="text-[10px] font-semibold text-gray-500">
                {move.category} {move.power > 0 ? `PWR ${move.power}` : ""}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div
        className="flex w-20 items-center justify-center"
        style={{ borderLeft: "2px solid #a08060" }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="text-sm font-bold text-gray-500"
        >
          Back
        </motion.button>
      </div>
    </div>
  );
}
