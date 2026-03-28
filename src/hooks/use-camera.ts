import { useRef, useState, useCallback, useEffect } from "react";

type Facing = "environment" | "user";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (facingMode: Facing) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode === "environment" ? "environment" : "user",
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
        setDenied(false);
        setError(null);
      }
    } catch (err) {
      const e = err as DOMException;
      if (e.name === "NotAllowedError") {
        setDenied(true);
      } else {
        setError(e.message ?? "Camera unavailable");
      }
      setReady(false);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const next: Facing = facing === "environment" ? "user" : "environment";
    setFacing(next);
    startCamera(next);
  }, [facing, startCamera]);

  useEffect(() => {
    startCamera(facing);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { videoRef, ready, denied, error, facing, toggleCamera };
}
