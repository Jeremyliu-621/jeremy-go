import PokeballSvg from "./pokeball-svg";

export default function PokeballSpinner({ size = 48 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin-slow">
        <PokeballSvg size={size} />
      </div>
    </div>
  );
}
