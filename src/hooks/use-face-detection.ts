import { useRef, useState, useEffect, useCallback } from "react";
import type { DetectedFace, FriendProfile } from "../types";
import { MOCK_FRIEND } from "../types";

/**
 * Face detection hook. Uses a simulated detection loop for the demo.
 * When TF.js is integrated (Phase 2 complete), replace the mock
 * with real model inference inside the detect() call.
 */
export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraReady: boolean,
) {
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const rafRef = useRef<number>(0);
  const simulatedRef = useRef(false);

  const runDetection = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // --- Demo simulation ---
    // In production, replace this block with:
    //   const predictions = await detector.estimateFaces(videoRef.current);
    //   then map predictions → DetectedFace[]
    if (!simulatedRef.current) {
      simulatedRef.current = true;
      setTimeout(() => {
        setFaces([
          {
            boundingBox: { x: 0.3, y: 0.25, width: 0.4, height: 0.3 },
            matchedUser: MOCK_FRIEND as FriendProfile,
          },
        ]);
      }, 2800);
    }

    rafRef.current = requestAnimationFrame(runDetection);
  }, [videoRef]);

  useEffect(() => {
    if (!cameraReady) return;

    const initTimeout = setTimeout(() => {
      setModelLoading(false);
      rafRef.current = requestAnimationFrame(runDetection);
    }, 1500);

    return () => {
      clearTimeout(initTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [cameraReady, runDetection]);

  const clearDetections = useCallback(() => {
    setFaces([]);
    simulatedRef.current = false;
  }, []);

  return { faces, modelLoading, clearDetections };
}
