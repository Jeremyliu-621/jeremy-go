declare module '@tensorflow/tfjs' {
  export function ready(): Promise<void>
  export function browser(): {
    fromPixels(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): unknown
  }
}

declare module '@tensorflow-models/face-landmarks-detection' {
  export interface Keypoint {
    x: number
    y: number
    z?: number
    name?: string
  }

  export interface Face {
    keypoints: Keypoint[]
    box?: {
      xMin: number
      yMin: number
      xMax: number
      yMax: number
      width: number
      height: number
    }
  }

  export interface FaceLandmarksDetector {
    estimateFaces(
      input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
      config?: { flipHorizontal?: boolean }
    ): Promise<Face[]>
    dispose(): void
  }

  export enum SupportedModels {
    MediaPipeFaceMesh = 'MediaPipeFaceMesh',
  }

  export interface MediaPipeFaceMeshTfjsModelConfig {
    runtime: 'tfjs'
    refineLandmarks?: boolean
    maxFaces?: number
  }

  export function createDetector(
    model: SupportedModels,
    config: MediaPipeFaceMeshTfjsModelConfig
  ): Promise<FaceLandmarksDetector>
}
