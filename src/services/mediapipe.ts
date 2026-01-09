// MediaPipe Face Detection Service
import { FaceMesh } from '@mediapipe/face_mesh';

export interface GazeData {
  horizontal: number; // -1 (left) to +1 (right)
  vertical: number;   // -1 (down) to +1 (up)
  isLookingAtScreen: boolean;
  facePresent: boolean;
  multipleFaces: boolean;
}

export interface FaceData {
  detected: boolean;
  count: number;
  landmarks: number[][] | null;
}

// Eye landmark indices for MediaPipe Face Mesh
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;
const NOSE_TIP = 1;

export function createFaceMesh(onResults: (results: any) => void): FaceMesh {
  const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 2,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);
  return faceMesh;
}

export function processFaceData(results: any): FaceData {
  const landmarks = results.multiFaceLandmarks;

  return {
    detected: landmarks && landmarks.length > 0,
    count: landmarks ? landmarks.length : 0,
    landmarks: landmarks && landmarks.length > 0
      ? landmarks[0].map((l: any) => [l.x, l.y, l.z])
      : null,
  };
}

export function calculateGaze(landmarks: number[][]): GazeData {
  if (!landmarks || landmarks.length < 478) {
    return {
      horizontal: 0,
      vertical: 0,
      isLookingAtScreen: false,
      facePresent: false,
      multipleFaces: false,
    };
  }

  // Get eye centers
  const leftEyeCenter = [
    (landmarks[LEFT_EYE_INNER][0] + landmarks[LEFT_EYE_OUTER][0]) / 2,
    (landmarks[LEFT_EYE_INNER][1] + landmarks[LEFT_EYE_OUTER][1]) / 2,
  ];

  const rightEyeCenter = [
    (landmarks[RIGHT_EYE_INNER][0] + landmarks[RIGHT_EYE_OUTER][0]) / 2,
    (landmarks[RIGHT_EYE_INNER][1] + landmarks[RIGHT_EYE_OUTER][1]) / 2,
  ];

  // Get iris positions (if available)
  const leftIris = landmarks[LEFT_IRIS] || leftEyeCenter;
  const rightIris = landmarks[RIGHT_IRIS] || rightEyeCenter;

  // Calculate horizontal deviation
  const leftEyeWidth = Math.abs(landmarks[LEFT_EYE_OUTER][0] - landmarks[LEFT_EYE_INNER][0]);
  const rightEyeWidth = Math.abs(landmarks[RIGHT_EYE_OUTER][0] - landmarks[RIGHT_EYE_INNER][0]);

  const leftIrisOffset = (leftIris[0] - leftEyeCenter[0]) / (leftEyeWidth / 2);
  const rightIrisOffset = (rightIris[0] - rightEyeCenter[0]) / (rightEyeWidth / 2);

  const horizontal = (leftIrisOffset + rightIrisOffset) / 2;

  // Calculate vertical deviation using nose as reference
  const nose = landmarks[NOSE_TIP];
  const eyesCenterY = (leftEyeCenter[1] + rightEyeCenter[1]) / 2;
  const faceHeight = Math.abs(nose[1] - eyesCenterY);
  const vertical = ((leftIris[1] + rightIris[1]) / 2 - eyesCenterY) / faceHeight;

  // Thresholds for looking at screen
  const horizontalThreshold = 0.35;
  const verticalThreshold = 0.4;

  const isLookingAtScreen =
    Math.abs(horizontal) < horizontalThreshold &&
    Math.abs(vertical) < verticalThreshold;

  return {
    horizontal,
    vertical,
    isLookingAtScreen,
    facePresent: true,
    multipleFaces: false,
  };
}

export function getGazeDirection(horizontal: number, vertical: number): string {
  if (Math.abs(horizontal) < 0.2 && Math.abs(vertical) < 0.2) {
    return 'center';
  }

  if (horizontal < -0.3) return 'left';
  if (horizontal > 0.3) return 'right';
  if (vertical > 0.3) return 'down';
  if (vertical < -0.3) return 'up';

  return 'center';
}
