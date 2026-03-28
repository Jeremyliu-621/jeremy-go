interface Props {
  size?: number;
  className?: string;
  open?: boolean;
}

export default function PokeballSvg({ size = 120, className = "", open }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      {/* Red top half */}
      <path
        d="M 5 50 A 45 45 0 0 1 95 50"
        fill="#CC0000"
        stroke="#2A2A2A"
        strokeWidth="3"
        style={{
          transform: open ? "rotate(-15deg)" : "rotate(0deg)",
          transformOrigin: "50% 50%",
          transition: "transform 0.3s ease",
        }}
      />

      {/* White bottom half */}
      <path
        d="M 5 50 A 45 45 0 0 0 95 50"
        fill="#F0F0F0"
        stroke="#2A2A2A"
        strokeWidth="3"
      />

      {/* Center band */}
      <rect x="3" y="47" width="94" height="6" fill="#2A2A2A" rx="1" />

      {/* Center button outer */}
      <circle cx="50" cy="50" r="13" fill="#2A2A2A" />
      <circle cx="50" cy="50" r="10" fill="#F5F5F5" stroke="#2A2A2A" strokeWidth="2" />
      <circle cx="50" cy="50" r="5" fill="#FFFFFF" stroke="#CCCCCC" strokeWidth="1" />
    </svg>
  );
}
