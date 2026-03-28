export function PokeballSVG({
  size = 120,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
    >
      <defs>
        <clipPath id="ball-clip">
          <circle cx="50" cy="50" r="46" />
        </clipPath>
        <linearGradient id="red-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF4444" />
          <stop offset="100%" stopColor="#CC0000" />
        </linearGradient>
        <linearGradient id="white-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#DDDDDD" />
        </linearGradient>
      </defs>

      <g clipPath="url(#ball-clip)">
        <rect x="0" y="0" width="100" height="50" fill="url(#red-shine)" />
        <rect
          x="0"
          y="50"
          width="100"
          height="50"
          fill="url(#white-shine)"
        />
        <rect x="0" y="45" width="100" height="10" fill="#333" />
      </g>

      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="#333"
        strokeWidth="4"
      />

      <circle cx="50" cy="50" r="14" fill="#333" />
      <circle cx="50" cy="50" r="10" fill="#F5F5F5" />
      <circle
        cx="50"
        cy="50"
        r="10"
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="5" fill="#F5F5F5" stroke="#333" strokeWidth="1.5" />

      <ellipse
        cx="35"
        cy="28"
        rx="12"
        ry="6"
        fill="white"
        opacity="0.2"
        transform="rotate(-25 35 28)"
      />
    </svg>
  );
}

export function PokeballSpinner({
  size = 80,
  wobble = false,
}: {
  size?: number;
  wobble?: boolean;
}) {
  return (
    <div
      style={{
        animation: wobble
          ? "pokeball-wobble 0.4s ease-in-out infinite"
          : "pokeball-spin 1s linear infinite",
        width: size,
        height: size,
      }}
    >
      <PokeballSVG size={size} />
    </div>
  );
}
