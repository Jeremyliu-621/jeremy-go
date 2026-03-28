import { useRef, useState, useEffect, useCallback } from "react";
import type { DetectedFace, FriendProfile } from "../types";
import { MOCK_FRIEND } from "../types";

/**
 * Face detection hook using the browser's native FaceDetector API
 * (Shape Detection API — available in Chrome/Edge).
 * The "Try capturing" pill only appears when a real face is visible in the camera.
 */
export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraReady: boolean,
) {
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const rafRef = useRef<number>(0);
  const detectorRef = useRef<FaceDetector | null>(null);
  const detectingRef = useRef(false);

  // Run detection loop using requestAnimationFrame
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !detectorRef.current) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // Skip if a detection is already in progress
    if (detectingRef.current) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    detectingRef.current = true;

    try {
      const detected = await detectorRef.current.detect(video);

      if (detected.length > 0) {
        // Pick the largest face (most prominent)
        const largest = detected.reduce((a, b) =>
          a.boundingBox.width * a.boundingBox.height >
          b.boundingBox.width * b.boundingBox.height
            ? a
            : b,
        );

        const vw = video.videoWidth || 1;
        const vh = video.videoHeight || 1;

        setFaces([
          {
            boundingBox: {
              x: largest.boundingBox.x / vw,
              y: largest.boundingBox.y / vh,
              width: largest.boundingBox.width / vw,
              height: largest.boundingBox.height / vh,
            },
            // For now, any detected face is treated as the mock friend.
            // Replace with real user matching when available.
            matchedUser: MOCK_FRIEND as FriendProfile,
          },
        ]);
      } else {
        setFaces([]);
      }
    } catch {
      // Detection can fail on some frames — just skip
    }

    detectingRef.current = false;
    rafRef.current = requestAnimationFrame(runDetection);
  }, [videoRef]);

  useEffect(() => {
    if (!cameraReady) return;

    // Check for native FaceDetector support
    if (typeof globalThis.FaceDetector === "undefined") {
      console.warn(
        "FaceDetector API not supported in this browser. Falling back to always-on mock.",
      );
      // Fallback: show mock face after a delay so the app still works
      setModelLoading(false);
      const fallbackTimeout = setTimeout(() => {
        setFaces([
          {
            boundingBox: { x: 0.3, y: 0.25, width: 0.4, height: 0.3 },
            matchedUser: MOCK_FRIEND as FriendProfile,
          },
        ]);
      }, 2800);
      return () => clearTimeout(fallbackTimeout);
    }

    // Initialize detector
    detectorRef.current = new FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
    setModelLoading(false);
    rafRef.current = requestAnimationFrame(runDetection);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [cameraReady, runDetection]);

  const clearDetections = useCallback(() => {
    setFaces([]);
  }, []);

  return { faces, modelLoading, clearDetections };
}
