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
  const [sniperOn, setSniperOn] = useState<"player" | "opponent" | null>(null);
  const [hitOn, setHitOn] = useState<"player" | "opponent" | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
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

  useEffect(() => {
    if (phase !== "victory" && phase !== "defeat") return;
    const timer = setTimeout(() => setShowVideo(true), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const animateHit = (attackerSide: "player" | "opponent") => {
    playDamage();
    const target = attackerSide === "player" ? "opponent" : "player";
    setSniperOn(attackerSide);
    setHitOn(target);

    if (target === "player") {
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 400);
    } else {
      setOpponentShake(true);
      setTimeout(() => setOpponentShake(false), 400);
    }

    setTimeout(() => {
      setSniperOn(null);
      setHitOn(null);
    }, 600);
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

      animateHit(attackerSide);

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

        {/* Opponent: sprite + info box together (top-right) */}
        <div
          className="absolute z-10 flex items-start"
          style={{ top: "4%", right: "4%", gap: 6 }}
        >
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
            style={{ position: "relative" }}
          >
            <PokemonSprite friend={opponent.friend} size={170} flipped showGlasses={phase === "defeat"} />
            <AttackOverlay type="sniper" visible={sniperOn === "opponent"} size={170} side="opponent" />
            <AttackOverlay type="hit" visible={hitOn === "opponent"} size={170} side="opponent" />
          </motion.div>
        </div>

        {/* Player: sprite + info box together (bottom-left) */}
        <div
          className="absolute z-10 flex items-end"
          style={{ bottom: "4%", left: "4%", gap: 6 }}
        >
          <motion.div
            animate={playerShake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{ position: "relative" }}
          >
            <PokemonSprite friend={player.friend} size={190} showGlasses={phase === "victory"} />
            <AttackOverlay type="sniper" visible={sniperOn === "player"} size={190} side="player" />
            <AttackOverlay type="hit" visible={hitOn === "player"} size={190} side="player" />
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

      {/* === BOTTOM PANEL (Pokemon-style: large text, two halves) === */}
      <div
        className="flex shrink-0"
        style={{
          height: "34%",
          minHeight: 130,
          background: "#f8f0d0",
          borderTop: "4px solid #585858",
        }}
      >
        {phase === "moves" ? (
          <MoveSelectPanel
            moves={player.friend.moves}
            onSelect={(move) => handleFight(move)}
            onBack={() => setPhase("player-turn")}
          />
        ) : (
          <>
            {/* Left: narrator text */}
            <div
              className="flex flex-1 items-center"
              style={{
                padding: "16px 24px",
                borderRight: "3px solid #585858",
              }}
            >
              <p
                className="text-gray-900"
                style={{ fontFamily: pixelFont, fontSize: 20, lineHeight: "1.6" }}
              >
                {narrative}
              </p>
            </div>
            {/* Right: Fight / Run stacked */}
            <div
              className="flex flex-col"
              style={{ width: "40%" }}
            >
              {(phase === "victory" || phase === "defeat") ? (
                <div className="flex flex-1 items-center justify-center" style={{ padding: 8 }}>
                  <p style={{ fontFamily: pixelFont, fontSize: 18, color: "#505050" }}>
                    {phase === "victory" ? "You win!" : "You lose..."}
                  </p>
                </div>
              ) : (
                <>
                  <motion.button
                    whileTap={phase === "player-turn" ? { scale: 0.97 } : undefined}
                    onClick={phase === "player-turn" ? () => setPhase("moves") : undefined}
                    className="flex flex-1 items-center justify-center uppercase text-white"
                    style={{
                      fontFamily: pixelFont,
                      fontSize: 22,
                      background: phase !== "player-turn" ? "#b0a888" : "#F08030",
                      borderBottom: "3px solid #585858",
                      cursor: phase !== "player-turn" ? "not-allowed" : "pointer",
                      opacity: phase !== "player-turn" ? 0.5 : 1,
                    }}
                  >
                    Fight
                  </motion.button>
                  <motion.button
                    whileTap={phase === "player-turn" ? { scale: 0.97 } : undefined}
                    onClick={phase === "player-turn" ? () => {
                      setNarrative("Got away safely!");
                      setPhase("ran");
                      setTimeout(() => navigate("/"), 1200);
                    } : undefined}
                    className="flex flex-1 items-center justify-center uppercase text-white"
                    style={{
                      fontFamily: pixelFont,
                      fontSize: 22,
                      background: phase !== "player-turn" ? "#b0a888" : "#6890F0",
                      cursor: phase !== "player-turn" ? "not-allowed" : "pointer",
                      opacity: phase !== "player-turn" ? 0.5 : 1,
                    }}
                  >
                    Run
                  </motion.button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* === VICTORY VIDEO OVERLAY === */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "#000" }}
          >
            <video
              ref={videoRef}
              src="/victory.mp4"
              autoPlay
              playsInline
              onLoadedMetadata={(e) => {
                (e.target as HTMLVideoElement).playbackRate = 2;
              }}
              onEnded={() => setVideoEnded(true)}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: 0.7 }}
            />

            <motion.h1
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 6, stiffness: 80, delay: 0.3 }}
              style={{
                fontFamily: pixelFont,
                fontSize: 52,
                color: "#FFD700",
                textShadow: "0 0 20px #FFD700, 0 0 40px #FF8C00, 4px 4px 0 #000",
                zIndex: 10,
                textTransform: "uppercase",
                letterSpacing: 6,
              }}
            >
              {phase === "victory" ? "Victory" : "Defeat"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              style={{
                fontFamily: pixelFont,
                fontSize: 16,
                color: "#fff",
                zIndex: 10,
                marginTop: 20,
              }}
            >
              {phase === "victory"
                ? `${player.friend.username} dominated!`
                : `${opponent.friend.username} was too strong...`}
            </motion.p>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: videoEnded ? 1 : 0.4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              style={{
                fontFamily: pixelFont,
                fontSize: 16,
                color: "#fff",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: 8,
                padding: "12px 32px",
                marginTop: 40,
                zIndex: 10,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Leave
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

const PX_FONT = "'Press Start 2P', monospace";

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
      style={{
        fontFamily: PX_FONT,
        width: 210,
        padding: "12px 16px",
        background: "linear-gradient(180deg, #f0e8c8 0%, #d8d0a8 100%)",
        border: "4px solid #585858",
        borderRadius: 8,
        boxShadow: "3px 3px 0 #404040",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
        <span
          className="truncate text-gray-900"
          style={{ fontSize: 12, maxWidth: 130 }}
        >
          {name}
        </span>
        <span style={{ fontSize: 10, color: "#606060" }}>
          Lv{level}
        </span>
      </div>
      <HpBar current={currentHp} max={maxHp} />
      <p
        className="text-right"
        style={{ fontSize: 10, color: "#505050", marginTop: 5 }}
      >
        {currentHp}/{maxHp}
      </p>
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
      style={{
        fontFamily: PX_FONT,
        width: 220,
        padding: "12px 16px",
        background: "linear-gradient(180deg, #f0e8c8 0%, #d8d0a8 100%)",
        border: "4px solid #585858",
        borderRadius: 8,
        boxShadow: "3px 3px 0 #404040",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
        <span
          className="truncate text-gray-900"
          style={{ fontSize: 12, maxWidth: 140 }}
        >
          {name}
        </span>
        <span style={{ fontSize: 10, color: "#606060" }}>
          Lv{level}
        </span>
      </div>
      <HpBar current={currentHp} max={maxHp} />
      <p
        className="text-right"
        style={{ fontSize: 10, color: "#505050", marginTop: 5 }}
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
  showGlasses,
}: {
  friend: CaughtFriend;
  size: number;
  flipped?: boolean;
  showGlasses?: boolean;
}) {
  const typeColor = TYPE_COLORS[friend.primaryType];
  return (
    <div
      className="rounded-full"
      style={{
        width: size,
        height: size,
        position: "relative",
        border: `3px solid ${typeColor}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px ${typeColor}44`,
        transform: flipped ? "scaleX(-1)" : undefined,
        overflow: "hidden",
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
      <AnimatePresence>
        {showGlasses && (
          <motion.img
            src="/glasses.png"
            initial={{ y: -size, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 8, stiffness: 120, delay: 0.2 }}
            style={{
              position: "absolute",
              top: "18%",
              left: "5%",
              width: "90%",
              pointerEvents: "none",
              zIndex: 10,
              transform: flipped ? "scaleX(-1)" : undefined,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AttackOverlay({
  type,
  visible,
  size,
  side,
}: {
  type: "sniper" | "hit";
  visible: boolean;
  size: number;
  side: "player" | "opponent";
}) {
  if (type === "hit") {
    return (
      <AnimatePresence>
        {visible && (
          <motion.img
            src="/hit.png"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.9, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: "50%",
              objectFit: "cover",
              pointerEvents: "none",
              zIndex: 20,
            }}
          />
        )}
      </AnimatePresence>
    );
  }

  const sniperSize = size * 0.7;
  const isPlayer = side === "player";

  return (
    <AnimatePresence>
      {visible && (
        <motion.img
          src="/sniper.jpg"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 0.95, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute",
            top: isPlayer ? -sniperSize * 0.45 : undefined,
            bottom: isPlayer ? undefined : -sniperSize * 0.45,
            left: isPlayer ? undefined : -sniperSize * 0.45,
            right: isPlayer ? -sniperSize * 0.45 : undefined,
            width: sniperSize,
            height: sniperSize,
            objectFit: "contain",
            pointerEvents: "none",
            zIndex: 25,
            transform: isPlayer
              ? "rotate(-35deg) scaleX(-1)"
              : "rotate(-35deg)",
          }}
        />
      )}
    </AnimatePresence>
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
  const [selected, setSelected] = useState(0);
  const current = moves[selected];
  const currentColor = current ? TYPE_COLORS[current.type] : "#888";

  return (
    <div className="flex h-full w-full">
      {/* Left: move list */}
      <div
        className="flex flex-1 flex-col justify-center"
        style={{ padding: "12px 20px", borderRight: "3px solid #585858" }}
      >
        {moves.map((move, i) => (
          <motion.button
            key={move.name}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setSelected(i); onSelect(move); }}
            onMouseEnter={() => setSelected(i)}
            className="flex items-center text-left text-gray-900"
            style={{
              fontFamily: PX_FONT,
              fontSize: 17,
              padding: "6px 8px",
              borderRadius: 4,
              background: i === selected ? "#d8d0a8" : "transparent",
            }}
          >
            <span style={{ marginRight: 8, opacity: i === selected ? 1 : 0 }}>
              {"\u25B6"}
            </span>
            {move.name}
          </motion.button>
        ))}
      </div>
      {/* Right: move details + back */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "38%", padding: "14px 16px" }}
      >
        <div>
          <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
            <span
              style={{
                fontFamily: PX_FONT,
                fontSize: 11,
                color: "#fff",
                background: currentColor,
                padding: "4px 8px",
                borderRadius: 4,
                textTransform: "uppercase",
              }}
            >
              {current?.type}
            </span>
            <span style={{ fontFamily: PX_FONT, fontSize: 11, color: "#606060" }}>
              {current?.category}
            </span>
          </div>
          {current?.power > 0 && (
            <p style={{ fontFamily: PX_FONT, fontSize: 13, color: "#404040" }}>
              PWR {current.power}
            </p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="self-end uppercase"
          style={{
            fontFamily: PX_FONT,
            fontSize: 14,
            color: "#505050",
            background: "#e8e0c0",
            border: "2px solid #a09878",
            borderRadius: 6,
            padding: "8px 20px",
          }}
        >
          Back
        </motion.button>
      </div>
    </div>
  );
}
