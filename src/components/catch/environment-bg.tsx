/**
 * Illustrated environment background — coded CSS fallback.
 * Replace with real asset from ASSETS.md when available.
 *
 * Layers: sky gradient → sun glow → clouds → distant hills →
 *         midground grass → foreground grass + texture
 */
export default function EnvironmentBg() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Sky */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 72% 8%, rgba(255,235,140,0.35) 0%, transparent 35%),
            linear-gradient(180deg,
              #5AB3E8 0%,
              #7EC8F0 18%,
              #A4DAF4 32%,
              #C5E8D8 42%,
              #A8D5A0 48%,
              #7DC370 54%,
              #5FB050 62%,
              #4DA043 72%,
              #3C8A35 85%,
              #2E7528 100%
            )
          `,
        }}
      />

      {/* Clouds */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        style={{ height: "30%", opacity: 0.7 }}
      >
        <ellipse cx="60" cy="35" rx="55" ry="18" fill="rgba(255,255,255,0.5)" />
        <ellipse cx="90" cy="28" rx="40" ry="16" fill="rgba(255,255,255,0.6)" />
        <ellipse
          cx="40"
          cy="30"
          rx="30"
          ry="14"
          fill="rgba(255,255,255,0.45)"
        />

        <ellipse
          cx="280"
          cy="45"
          rx="45"
          ry="15"
          fill="rgba(255,255,255,0.4)"
        />
        <ellipse
          cx="310"
          cy="40"
          rx="35"
          ry="13"
          fill="rgba(255,255,255,0.5)"
        />

        <ellipse
          cx="180"
          cy="20"
          rx="25"
          ry="10"
          fill="rgba(255,255,255,0.3)"
        />
      </svg>

      {/* Distant tree line */}
      <svg
        className="absolute w-full"
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        style={{ top: "38%", height: "12%", opacity: 0.45 }}
      >
        <path
          d="M0 60 L0 35 Q20 10 40 30 Q55 5 70 28 Q85 8 100 25 Q115 2 130 28
             Q145 8 160 30 Q175 5 190 25 Q205 0 220 28 Q235 10 250 30
             Q265 5 280 25 Q295 8 310 30 Q325 2 340 28 Q355 10 370 25
             Q385 5 400 30 L400 60 Z"
          fill="#3A7A30"
        />
      </svg>

      {/* Midground grass texture — subtle stripes */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: "52%",
          background: `
            repeating-linear-gradient(
              92deg,
              rgba(80,160,50,0.08) 0px,
              transparent 2px,
              transparent 18px
            ),
            repeating-linear-gradient(
              88deg,
              rgba(40,120,30,0.06) 0px,
              transparent 1px,
              transparent 24px
            )
          `,
        }}
      />

      {/* Foreground grass blades (bottom) */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        style={{ height: "6%" }}
      >
        {Array.from({ length: 30 }).map((_, i) => {
          const x = (i / 30) * 400 + Math.sin(i * 1.7) * 8;
          const h = 15 + Math.sin(i * 2.3) * 12;
          return (
            <path
              key={i}
              d={`M${x} 40 Q${x + 2} ${40 - h} ${x + 4 + Math.sin(i) * 3} ${40 - h - 4}`}
              stroke="#2D6B1E"
              strokeWidth="2"
              fill="none"
              opacity={0.3 + Math.sin(i * 1.1) * 0.15}
            />
          );
        })}
      </svg>

      {/* Light rays from sun position */}
      <div
        className="absolute"
        style={{
          top: "2%",
          right: "15%",
          width: "200px",
          height: "200px",
          background:
            "radial-gradient(circle, rgba(255,240,180,0.2) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
