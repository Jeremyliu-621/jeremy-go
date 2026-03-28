export default function EnvironmentBg() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <img
        src="/catch.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
