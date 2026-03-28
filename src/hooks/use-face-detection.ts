import { useRef, useState, useEffect, useCallback } from "react";
import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import type { DetectedFace, FriendProfile } from "../types";
import { MOCK_FRIEND } from "../types";

/** How many consecutive "no face" frames before we clear the detection */
const MISS_THRESHOLD = 5;

/**
 * Face detection hook using MediaPipe's BlazeFace model.
 * Runs real face detection on every video frame — the "Try capturing" pill
 * only appears when an actual face is visible in the camera.
 */
export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraReady: boolean,
) {
  const [faces, setFaces] = useState<DetectedFace[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const detectorRef = useRef<FaceDetector | null>(null);
  const rafRef = useRef<number>(0);
  const missCountRef = useRef(0);
  const lastTimestampRef = useRef(-1);

  const runDetection = useCallback(() => {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || video.readyState < 2 || !detector) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // MediaPipe requires strictly increasing timestamps
    const now = performance.now();
    if (now <= lastTimestampRef.current) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }
    lastTimestampRef.current = now;

    try {
      const results = detector.detectForVideo(video, now);

      if (results.detections.length > 0) {
        missCountRef.current = 0;

        // Pick the largest face (most prominent)
        const largest = results.detections.reduce((a, b) => {
          const aBox = a.boundingBox!;
          const bBox = b.boundingBox!;
          return aBox.width * aBox.height > bBox.width * bBox.height ? a : b;
        });

        const bb = largest.boundingBox!;
        const vw = video.videoWidth || 1;
        const vh = video.videoHeight || 1;

        setFaces([
          {
            boundingBox: {
              x: bb.originX / vw,
              y: bb.originY / vh,
              width: bb.width / vw,
              height: bb.height / vh,
            },
            // For now, any detected face is treated as the mock friend.
            // Replace with real user matching when available.
            matchedUser: MOCK_FRIEND as FriendProfile,
          },
        ]);
      } else {
        missCountRef.current++;
        if (missCountRef.current >= MISS_THRESHOLD) {
          setFaces([]);
        }
      }
    } catch {
      // Detection can fail on some frames — just skip
    }

    rafRef.current = requestAnimationFrame(runDetection);
  }, [videoRef]);

  useEffect(() => {
    if (!cameraReady) return;

    let cancelled = false;

    async function initDetector() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );

        if (cancelled) return;

        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });

        if (cancelled) {
          detector.close();
          return;
        }

        detectorRef.current = detector;
        setModelLoading(false);
        rafRef.current = requestAnimationFrame(runDetection);
      } catch (err) {
        console.error("Failed to initialize MediaPipe face detector:", err);
        setModelLoading(false);
      }
    }

    initDetector();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
    };
  }, [cameraReady, runDetection]);

  const clearDetections = useCallback(() => {
    setFaces([]);
    missCountRef.current = MISS_THRESHOLD;
  }, []);

  return { faces, modelLoading, clearDetections };
}
