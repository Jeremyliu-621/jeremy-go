import { useRef, useState, useCallback } from "react";

export interface SwipeData {
  velocityY: number;
  velocityX: number;
  accuracy: number;
  startY: number;
  endY: number;
  angle: number;
}

interface Opts {
  minSwipeDistance?: number;
  onThrow: (data: SwipeData) => void;
  enabled?: boolean;
}

export function useSwipeThrow({ minSwipeDistance = 60, onThrow, enabled = true }: Opts) {
  const startPos = useRef<{ x: number; y: number; t: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
      setDragging(true);
      setDragOffset({ x: 0, y: 0 });
    },
    [enabled],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current || !enabled) return;
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - startPos.current.x,
        y: touch.clientY - startPos.current.y,
      });
    },
    [enabled],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!startPos.current || !enabled) return;
      setDragging(false);

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = startPos.current.y - touch.clientY; // positive = upward
      const dt = Math.max(Date.now() - startPos.current.t, 1);

      if (dy > minSwipeDistance) {
        const velocityY = dy / dt;
        const velocityX = dx / dt;
        const rawAngle = Math.atan2(dy, dx);
        const centerDeviation = Math.abs(dx) / window.innerWidth;
        const accuracy = Math.max(0, 1 - centerDeviation * 2);

        onThrow({
          velocityY: Math.min(velocityY, 3),
          velocityX,
          accuracy,
          startY: startPos.current.y,
          endY: touch.clientY,
          angle: rawAngle,
        });
      }

      setDragOffset({ x: 0, y: 0 });
      startPos.current = null;
    },
    [enabled, minSwipeDistance, onThrow],
  );

  return {
    dragging,
    dragOffset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
