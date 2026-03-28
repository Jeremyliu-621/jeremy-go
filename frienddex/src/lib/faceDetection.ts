import * as tf from '@tensorflow/tfjs'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'

let model: faceLandmarksDetection.FaceLandmarksDetector | null = null

export async function loadFaceModel(): Promise<faceLandmarksDetection.FaceLandmarksDetector> {
  if (model) return model

  await tf.ready()

  model = await faceLandmarksDetection.createDetector(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
    {
      runtime: 'tfjs',
      refineLandmarks: false,
      maxFaces: 5,
    }
  )

  return model
}

export async function extractFaceDescriptor(imageUrl: string): Promise<number[]> {
  const detector = await loadFaceModel()

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = imageUrl
  })

  const faces = await detector.estimateFaces(img)
  if (faces.length === 0) {
    throw new Error('No face detected in the image')
  }

  const face = faces[0]
  const keypoints = face.keypoints

  const descriptor = computeDescriptorFromKeypoints(keypoints)
  return descriptor
}

/**
 * Computes a simplified face descriptor from facial landmark keypoints.
 * Uses relative distances between key facial landmarks as a fingerprint,
 * normalized by inter-eye distance for scale invariance.
 */
function computeDescriptorFromKeypoints(
  keypoints: faceLandmarksDetection.Keypoint[]
): number[] {
  const anchorIndices = [
    10, 152, 234, 454, 1, 33, 263, 61, 291, 199,
    94, 0, 17, 78, 308, 14, 87, 317, 133, 362,
    70, 300, 105, 334, 107, 336, 168, 197, 5, 4,
  ]

  const anchors = anchorIndices
    .filter(i => i < keypoints.length)
    .map(i => keypoints[i])

  if (anchors.length < 10) {
    throw new Error('Not enough keypoints for descriptor')
  }

  const leftEye = keypoints[33] || anchors[0]
  const rightEye = keypoints[263] || anchors[1]
  const interEyeDist = Math.sqrt(
    (rightEye.x - leftEye.x) ** 2 + (rightEye.y - leftEye.y) ** 2
  )

  if (interEyeDist < 1) {
    throw new Error('Face too small to extract descriptor')
  }

  const descriptor: number[] = []
  for (let i = 0; i < anchors.length; i++) {
    for (let j = i + 1; j < anchors.length && descriptor.length < 128; j++) {
      const dx = (anchors[j].x - anchors[i].x) / interEyeDist
      const dy = (anchors[j].y - anchors[i].y) / interEyeDist
      descriptor.push(dx, dy)
    }
  }

  return descriptor.slice(0, 128)
}

export function compareFaceDescriptors(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return Infinity
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2
  }
  return Math.sqrt(sum / a.length)
}

export const FACE_MATCH_THRESHOLD = 0.6
