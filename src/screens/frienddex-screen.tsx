import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/auth-context";
import { fetchFrienddex } from "../lib/frienddex";
import PokeballSpinner from "../components/pokeball-spinner";
import PokeballSvg from "../components/pokeball-svg";
import type { CaughtFriend, PokemonType } from "../types";
import { TYPE_COLORS } from "../types";

type SortMode = "recent" | "cp";

export default function FrienddexScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [friends, setFriends] = useState<CaughtFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("recent");

  useEffect(() => {
    if (!user) return;
    setFriends(fetchFrienddex(user.id));
    setLoading(false);
  }, [user]);

  const sorted = [...friends].sort((a, b) => {
    if (sort === "cp") return b.cp - a.cp;
    return new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime();
  });

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-navy)]">
        <PokeballSpinner size={64} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto bg-[var(--color-navy)]"
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm"
        style={{ background: "rgba(26,26,46,0.9)" }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")}
          className="text-sm text-white/40 hover:text-white"
        >
          Back
        </motion.button>
        <h1 className="text-lg font-black">FRIENDDEX</h1>
        <span className="text-sm font-semibold tabular-nums text-white/30">
          {friends.length} caught
        </span>
      </div>

      {friends.length > 1 && (
        <div className="flex gap-2 px-4 pb-3">
          {(["recent", "cp"] as const).map((mode) => (
            <motion.button
              key={mode}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSort(mode)}
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor:
                  sort === mode ? "rgba(255,255,255,0.15)" : "transparent",
                color: sort === mode ? "#fff" : "#888",
              }}
            >
              {mode === "recent" ? "Recent" : "CP"}
            </motion.button>
          ))}
        </div>
      )}

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 px-8 pt-24">
          <div className="opacity-20">
            <PokeballSvg size={80} />
          </div>
          <p className="text-center text-sm leading-relaxed text-white/30">
            Your Frienddex is empty.
            <br />
            Scan and capture friends to fill it up!
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white"
          >
            Start Scanning
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-8">
          <AnimatePresence>
            {sorted.map((friend, i) => (
              <FriendCard key={friend.id} friend={friend} index={i} navigate={navigate} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FriendCard({
  friend,
  index,
  navigate,
}: {
  friend: CaughtFriend;
  index: number;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const typeColor = TYPE_COLORS[friend.primaryType];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={() =>
        navigate(`/frienddex/${friend.id}`, { state: { friend } })
      }
      className="relative flex flex-col items-center rounded-2xl p-4 text-center"
      style={{
        background: `linear-gradient(145deg, ${typeColor}22 0%, rgba(20,20,40,0.9) 70%)`,
        border: `1px solid ${typeColor}33`,
      }}
    >
      <div
        className="mb-2 h-20 w-20 overflow-hidden rounded-full border-2"
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
            className="flex h-full w-full items-center justify-center text-xl font-black text-white"
            style={{ backgroundColor: typeColor + "66" }}
          >
            {friend.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <p className="w-full truncate text-sm font-bold text-white">
        {friend.username}
      </p>

      <p className="mt-0.5 text-xs font-black" style={{ color: "#F8D030" }}>
        CP {friend.cp}
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-1">
        <TypeBadge type={friend.primaryType} />
        {friend.secondaryType && <TypeBadge type={friend.secondaryType} />}
      </div>
    </motion.button>
  );
}

function TypeBadge({ type }: { type: PokemonType }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ backgroundColor: TYPE_COLORS[type] }}
    >
      {type}
    </span>
  );
}
