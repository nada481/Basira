const MEDIAPIPE_ESM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/+esm'

let cached = null

/** Load MediaPipe Tasks Vision from CDN (browser only). */
export async function loadMediaPipeVision() {
  if (cached) return cached
  if (typeof window === 'undefined') {
    throw new Error('MediaPipe can only load in the browser')
  }
  cached = await import(/* webpackIgnore: true */ MEDIAPIPE_ESM)
  return cached
}
