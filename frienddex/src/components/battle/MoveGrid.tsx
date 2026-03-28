import { motion } from 'framer-motion';
import { TYPE_COLORS } from '../../lib/constants';
import type { PokemonType } from '../../types/database';

interface Move {
  name: string;
  type: PokemonType;
  category: 'Physical' | 'Special' | 'Status';
  power: number;
  description: string;
}

interface MoveGridProps {
  moves: [Move, Move, Move, Move];
  onSelect: (moveName: string) => void;
  disabled: boolean;
  selectedMove: string | null;
}

export function MoveGrid({ moves, onSelect, disabled, selectedMove }: MoveGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {moves.map((move) => {
        const bg = TYPE_COLORS[move.type];
        const isSelected = selectedMove === move.name;
        const isStatus = move.category === 'Status';

        return (
          <motion.button
            key={move.name}
            whileTap={disabled ? {} : { scale: 0.93 }}
            onClick={() => !disabled && onSelect(move.name)}
            disabled={disabled}
            className={`
              relative rounded-xl px-3 py-3 text-left transition-all border-2
              ${isSelected ? 'border-pokemon-yellow ring-2 ring-pokemon-yellow/40' : 'border-transparent'}
              ${disabled && !isSelected ? 'opacity-40' : 'opacity-100'}
            `}
            style={{
              background: `linear-gradient(135deg, ${bg}cc, ${bg}88)`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white truncate">{move.name}</span>
              {!isStatus && (
                <span className="font-mono text-[10px] text-white/70 ml-1">
                  {move.power}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-block rounded-full px-1.5 py-px text-[9px] font-bold uppercase text-white/90"
                style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
              >
                {move.category}
              </span>
            </div>
            {disabled && !isSelected && (
              <div className="absolute inset-0 rounded-xl bg-black/40 flex items-center justify-center">
                <span className="text-xs font-bold text-white/60">
                  {selectedMove ? 'Locked' : 'Waiting...'}
                </span>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
