import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const PX = "'Press Start 2P', monospace";

const MENU_ITEMS = [
  {
    label: "CATCH",
    description: "Scan & capture people",
    path: "/scan",
    color: "#F08030",
  },
  {
    label: "CHUDDEX",
    description: "View your collection",
    path: "/chuddex",
    color: "#6890F0",
  },
  {
    label: "BATTLE",
    description: "Pit your catches against each other",
    path: "/battle",
    color: "#C03028",
  },
] as const;

const NYAN_SIZE = 140;

interface NyanCat {
  id: number;
  y: number;
  speed: number;
  direction: "left" | "right";
  startX: number;
}

function useNyanCats() {
  const [cats, setCats] = useState<NyanCat[]>([]);
  const nextId = { current: 0 };

  const spawnCat = useCallback(() => {
    const direction = Math.random() > 0.5 ? "left" : "right";
    const speed = 2 + Math.random() * 5;
    const y = Math.random() * (window.innerHeight - NYAN_SIZE);

    const cat: NyanCat = {
      id: nextId.current++,
      y,
      speed,
      direction,
      startX: direction === "right" ? -NYAN_SIZE - 20 : window.innerWidth + 20,
    };
    setCats((prev) => [...prev, cat]);
  }, []);

  const removeCat = useCallback((id: number) => {
    setCats((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => {
    spawnCat();
    const interval = setInterval(spawnCat, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [spawnCat]);

  return { cats, removeCat };
}

function NyanSprite({ cat, onDone }: { cat: NyanCat; onDone: () => void }) {
  const endX =
    cat.direction === "right"
      ? window.innerWidth + NYAN_SIZE + 20
      : -NYAN_SIZE - 20;

  const distance = Math.abs(endX - cat.startX);
  const duration = distance / (cat.speed * 60);

  return (
    <motion.img
      src="/nyan_cat.png"
      alt=""
      draggable={false}
      initial={{ x: cat.startX }}
      animate={{ x: endX }}
      transition={{ duration, ease: "linear" }}
      onAnimationComplete={onDone}
      className="pointer-events-none absolute z-[5]"
      style={{
        top: cat.y,
        width: NYAN_SIZE,
        height: NYAN_SIZE,
        objectFit: "contain",
        transform: cat.direction === "left" ? "scaleX(-1)" : undefined,
        imageRendering: "pixelated",
      }}
    />
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { cats, removeCat } = useNyanCats();

  return (
    <div className="fixed inset-0" style={{ fontFamily: PX }}>
      {/* Background image */}
      <img
        src="/homepage.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)" }}
      />

      {/* Nyan cats */}
      {cats.map((cat) => (
        <NyanSprite
          key={cat.id}
          cat={cat}
          onDone={() => removeCat(cat.id)}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-1 text-center"
        >
          <h1
            style={{
              fontSize: 44,
              color: "#FFCB05",
              textShadow:
                "4px 4px 0 #b8860b, -2px -2px 0 #b8860b, 2px -2px 0 #b8860b, -2px 2px 0 #b8860b",
              letterSpacing: "0.05em",
            }}
          >
            JeremyGO
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 48,
          }}
        >
          Gotta catch &apos;em all
        </motion.p>

        <div className="flex w-full max-w-xs flex-col" style={{ gap: 16 }}>
          {MENU_ITEMS.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.path)}
              className="text-left text-white"
              style={{
                padding: "16px 20px",
                background: "rgba(0,0,0,0.6)",
                border: `3px solid ${item.color}`,
                borderRadius: 10,
                backdropFilter: "blur(8px)",
              }}
            >
              <p style={{ fontSize: 14, color: item.color, marginBottom: 6 }}>
                {item.label}
              </p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>
                {item.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
