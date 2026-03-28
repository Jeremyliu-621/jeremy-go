import { motion, type Variants } from "framer-motion";
import type { CatchPhase, FriendProfile } from "../../types";
import { TYPE_COLORS } from "../../types";
import DogFilter from "../dog-filter";

const spriteVariants: Variants = {
  idle: { scale: 1, opacity: 1, y: 0 },
  absorbing: {
    scale: 0,
    opacity: 0,
    y: 80,
    transition: { duration: 0.5, ease: "easeIn" },
  },
  escaped: {
    scale: [0, 0.3, 1.1, 1],
    opacity: [0, 0.5, 1, 1],
    y: [80, 40, -8, 0],
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

interface Props {
  friend: FriendProfile;
  phase: CatchPhase;
}

export default function FriendSprite({ friend, phase }: Props) {
  const typeColor = TYPE_COLORS[friend.primaryType];
  const isVisible = phase === "ready" || phase === "aiming" || phase === "escaped";
  const animState =
    phase === "absorbing"
      ? "absorbing"
      : phase === "escaped"
        ? "escaped"
        : "idle";

  return (
    <motion.div
      className="relative flex flex-col items-center"
      variants={spriteVariants}
      animate={animState}
      style={{
        display: isVisible || phase === "absorbing" ? "flex" : "none",
      }}
    >
      {/* Ground shadow */}
      <div
        className="absolute"
        style={{
          bottom: "-8px",
          width: "120px",
          height: "16px",
          borderRadius: "50%",
          background: "rgba(0,0,0,0.2)",
          filter: "blur(6px)",
        }}
      />

      {/* Friend photo circle */}
      <div
        className="relative"
        style={{
          width: "min(130px, 28vw)",
          height: "min(130px, 28vw)",
        }}
      >
        <div
          className="overflow-hidden rounded-full"
          style={{
            width: "100%",
            height: "100%",
            border: `4px solid ${typeColor}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
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
              className="flex h-full w-full items-center justify-center text-4xl font-extrabold text-white"
              style={{
                backgroundColor: typeColor,
              }}
            >
              {friend.username ? friend.username.charAt(0).toUpperCase() : "?"}
            </div>
          )}
        </div>
        <DogFilter />
      </div>
    </motion.div>
  );
}
