import { useEffect, useState } from "react";

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  hue: number;
}

export default function StarParticles({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }

    const pts: Particle[] = Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      angle: (i / 16) * 360 + Math.random() * 15,
      distance: 80 + Math.random() * 100,
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.2,
      hue: 40 + Math.random() * 20,
    }));
    setParticles(pts);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: p.id % 3 === 0 ? "2px" : "50%",
              background: `hsl(${p.hue}, 90%, 60%)`,
              boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue}, 90%, 50%)`,
              transform: "translate(-50%, -50%)",
              ["--tx" as string]: `${tx}px`,
              ["--ty" as string]: `${ty}px`,
              animation: `star-particle 0.8s ${p.delay}s ease-out forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
