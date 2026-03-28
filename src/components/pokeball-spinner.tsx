import PokeballSvg from "./pokeball-svg";

export default function PokeballSpinner({
  size = 48,
  wobble = false,
}: {
  size?: number;
  wobble?: boolean;
}) {
  return (
    <div className="flex items-center justify-center">
      <div className={wobble ? "animate-wobble" : "animate-spin-slow"}>
        <PokeballSvg size={size} />
      </div>
    </div>
  );
}
