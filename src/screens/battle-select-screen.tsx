import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import { fetchFrienddex } from "../lib/frienddex";
import PokeballSpinner from "../components/pokeball-spinner";
import type { CaughtFriend, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";

type SelectStep = "pick-player" | "pick-opponent";

export default function BattleSelectScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [friends, setFriends] = useState<CaughtFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<SelectStep>("pick-player");
  const [playerPick, setPlayerPick] = useState<CaughtFriend | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchFrienddex(user.id).then((data) => {
      setFriends(data);
      setLoading(false);
    });
  }, [user]);

  const handlePick = (friend: CaughtFriend) => {
    if (step === "pick-player") {
      setPlayerPick(friend);
      setStep("pick-opponent");
    } else if (playerPick) {
      navigate("/battle/fight", {
        state: { player: playerPick, opponent: friend },
      });
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
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 bg-[var(--color-navy)] px-8">
        <p className="text-center text-sm leading-relaxed text-white/40">
          You need at least 2 friends in your Frienddex to battle.
          <br />
          Go catch some more!
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white"
        >
          Back to Home
        </motion.button>
      </div>
    );
  }

  const availableFriends =
    step === "pick-opponent" && playerPick
      ? friends.filter((f) => f.id !== playerPick.id)
      : friends;

  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-[var(--color-navy)]"
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm"
        style={{ background: "rgba(26,26,46,0.9)" }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (step === "pick-opponent") {
              setStep("pick-player");
              setPlayerPick(null);
            } else {
              navigate("/");
            }
          }}
          className="text-sm text-white/40 hover:text-white"
        >
          Back
        </motion.button>
        <h1 className="text-lg font-black">BATTLE</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 pb-3">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm font-semibold"
          style={{ color: "var(--color-yellow)" }}
        >
          {step === "pick-player"
            ? "Choose your fighter"
            : "Choose the opponent"}
        </motion.p>
        {playerPick && step === "pick-opponent" && (
          <p className="mt-1 text-center text-xs text-white/30">
            You're controlling <span className="font-bold text-white/50">{playerPick.username}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pb-8">
        {availableFriends.map((friend, i) => (
          <MiniCard
            key={friend.id}
            friend={friend}
            index={i}
            onPick={() => handlePick(friend)}
          />
        ))}
      </div>
    </div>
  );
}

function MiniCard({
  friend,
  index,
  onPick,
}: {
  friend: CaughtFriend;
  index: number;
  onPick: () => void;
}) {
  const typeColor = TYPE_COLORS[friend.primaryType];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onPick}
      className="flex flex-col items-center rounded-2xl p-4 text-center"
      style={{
        background: `linear-gradient(145deg, ${typeColor}22 0%, rgba(20,20,40,0.9) 70%)`,
        border: `1px solid ${typeColor}33`,
      }}
    >
      <div
        className="mb-2 h-16 w-16 overflow-hidden rounded-full border-2"
        style={{ borderColor: typeColor }}
      >
        {friend.photoUrl ? (
          <img
            src={friend.photoUrl}
            alt={friend.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-black text-white"
            style={{ backgroundColor: typeColor + "66" }}
          >
            {friend.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <p className="w-full truncate text-sm font-bold text-white">
        {friend.username}
      </p>
      <p className="text-xs font-black" style={{ color: "#F8D030" }}>
        CP {friend.cp}
      </p>
      <div className="mt-1 flex gap-1">
        <TypeBadge type={friend.primaryType} />
        {friend.secondaryType && <TypeBadge type={friend.secondaryType} />}
      </div>
    </motion.button>
  );
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}
