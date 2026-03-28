/// <reference types="vite/client" />

// Shape Detection API — FaceDetector (Chrome/Edge)
interface FaceDetectorOptions {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}

interface DetectedFaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface DetectedFaceResult {
  boundingBox: DetectedFaceBoundingBox;
  landmarks: Array<{ locations: Array<{ x: number; y: number }>; type: string }>;
}

declare class FaceDetector {
  constructor(options?: FaceDetectorOptions);
  detect(image: ImageBitmapSource): Promise<DetectedFaceResult[]>;
}