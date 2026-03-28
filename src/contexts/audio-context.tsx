import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

interface AudioContextValue {
  playDamage: () => void;
}

const AudioCtx = createContext<AudioContextValue>({
  playDamage: () => {},
});

export function useAudio() {
  return useContext(AudioCtx);
}

const BATTLE_TRACKS = ["/battle1.mp3", "/battle2.mp3", "/battle3.mp3"];

export function AudioProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const trackTypeRef = useRef<"idle" | "battle" | "none">("none");
  const lastBattleTrackRef = useRef("");

  const isHome = location.pathname === "/";

  useEffect(() => {
    const wantType: "idle" | "battle" = isHome ? "idle" : "battle";
    if (trackTypeRef.current === wantType) return;

    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.src = "";
      bgmRef.current = null;
    }

    let src: string;
    if (wantType === "idle") {
      src = "/idle.mp3";
    } else {
      const choices = BATTLE_TRACKS.filter(
        (t) => t !== lastBattleTrackRef.current,
      );
      src = choices[Math.floor(Math.random() * choices.length)];
      lastBattleTrackRef.current = src;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = wantType === "idle" ? 0.25 : 0.35;
    bgmRef.current = audio;
    trackTypeRef.current = wantType;

    audio.play().catch(() => {
      /* blocked until user gesture — unlock handler below will retry */
    });
  }, [isHome]);

  // Unlock audio on first user gesture (mobile browsers block autoplay)
  useEffect(() => {
    const unlock = () => {
      if (bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play().catch(() => {});
      }
      document.removeEventListener("pointerdown", unlock);
    };
    document.addEventListener("pointerdown", unlock);
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
    };
  }, []);

  const playDamage = useCallback(() => {
    const sfx = new Audio("/damage.mp3");
    sfx.volume = 0.6;
    sfx.play().catch(() => {});
  }, []);

  return (
    <AudioCtx.Provider value={{ playDamage }}>{children}</AudioCtx.Provider>
  );
}
