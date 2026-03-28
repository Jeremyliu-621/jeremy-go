import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import {
  fetchFriendDetail,
  STAT_LABELS,
  STAT_ORDER,
  STAT_MAX,
} from "../lib/frienddex";
import PokeballSpinner from "../components/pokeball-spinner";
import type { CaughtFriend, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";

export default function FriendDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const passedFriend = (location.state as { friend?: CaughtFriend })?.friend;
  const [friend, setFriend] = useState<CaughtFriend | null>(passedFriend ?? null);
  const [loading, setLoading] = useState(!passedFriend);

  useEffect(() => {
    if (passedFriend || !user || !id) return;
    fetchFriendDetail(user.id, id).then((data) => {
      setFriend(data);
      setLoading(false);
    });
  }, [user, id, passedFriend]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-navy)]">
        <PokeballSpinner size={64} />
      </div>
    );
  }

  if (!friend) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-navy)]">
        <p className="text-sm text-white/40">Friend not found.</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/frienddex", { replace: true })}
          className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-bold text-white"
        >
          Back to Frienddex
        </motion.button>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[friend.primaryType];

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
          onClick={() => navigate("/frienddex")}
          className="text-sm text-white/40 hover:text-white"
        >
          Back
        </motion.button>
        <h1 className="text-lg font-black">
          {friend.username.toUpperCase()}
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex flex-col items-center px-6 pb-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 mb-4 h-36 w-36 overflow-hidden rounded-full border-4"
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

        <h2 className="text-2xl font-black">{friend.username}</h2>

        <div className="mt-2 flex gap-2">
          <TypeBadge type={friend.primaryType} />
          {friend.secondaryType && <TypeBadge type={friend.secondaryType} />}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xl font-black"
          style={{ color: "var(--color-yellow)" }}
        >
          CP {friend.cp}
        </motion.p>

        <p className="mt-4 max-w-xs text-center text-sm italic text-white/40">
          {friend.description}
        </p>

        <div className="mt-8 w-full max-w-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">
            Stats
          </h3>
          <div className="space-y-3">
            {STAT_ORDER.map((key, i) => {
              const value =
                (friend.stats as Record<string, number>)[key] ?? 0;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
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
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 w-full max-w-sm">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/40">
            Moves
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {friend.moves.map((move, i) => {
              const moveColor = TYPE_COLORS[move.type];
              return (
                <motion.div
                  key={move.name + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: moveColor + "33",
                    borderLeft: `3px solid ${moveColor}`,
                  }}
                >
                  <p className="text-sm font-bold text-white">{move.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-white/50">
                      {move.category}
                    </span>
                    {move.power > 0 && (
                      <span className="text-xs font-semibold text-white/70">
                        PWR {move.power}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-white/30">
                    {move.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {friend.flavorText && (
          <p className="mt-8 max-w-xs text-center text-xs italic text-white/30">
            &ldquo;{friend.flavorText}&rdquo;
          </p>
        )}

        <p className="mt-6 text-xs text-white/20">
          Caught {new Date(friend.caughtAt).toLocaleDateString()}
        </p>
      </div>
    </div>
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
