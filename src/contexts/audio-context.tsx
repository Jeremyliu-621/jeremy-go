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
    audio.volume = wantType === "idle" ? 0.08 : 0.1;
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

  const damageBufferRef = useRef<AudioBuffer | null>(null);
  const audioCtxRef = useRef<globalThis.AudioContext | null>(null);

  // Pre-load damage sound into an AudioBuffer so we can pitch-shift it
  useEffect(() => {
    fetch("/damage.mp3")
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        const ctx = new globalThis.AudioContext();
        audioCtxRef.current = ctx;
        return ctx.decodeAudioData(buf);
      })
      .then((decoded) => {
        damageBufferRef.current = decoded;
      })
      .catch(() => {});
  }, []);

  const playDamage = useCallback(() => {
    const ctx = audioCtxRef.current;
    const buffer = damageBufferRef.current;
    if (!ctx || !buffer) return;

    // Wide range: 0.4x (slow & deep) to 2.0x (fast & chipmunk)
    const rate = 0.4 + Math.random() * 1.6;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;

    const gain = ctx.createGain();
    gain.gain.value = 0.6;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }, []);

  return (
    <AudioCtx.Provider value={{ playDamage }}>{children}</AudioCtx.Provider>
  );
}
