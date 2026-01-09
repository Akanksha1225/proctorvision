import { useState, useCallback, useRef } from 'react';
import { GazeData, FaceData, processFaceData, calculateGaze } from '../services/mediapipe';

interface UseFaceDetectionResult {
    faceData: FaceData;
    gazeData: GazeData;
    isAbsent: boolean;
    absenceCount: number;
    processResults: (results: any) => void;
}

export function useFaceDetection(absenceThresholdMs: number = 3000): UseFaceDetectionResult {
    const [faceData, setFaceData] = useState<FaceData>({
        detected: false,
        count: 0,
        landmarks: null,
    });

    const [gazeData, setGazeData] = useState<GazeData>({
        horizontal: 0,
        vertical: 0,
        isLookingAtScreen: true,
        facePresent: false,
        multipleFaces: false,
    });

    const [isAbsent, setIsAbsent] = useState(false);
    const [absenceCount, setAbsenceCount] = useState(0);

    const absenceStartRef = useRef<number | null>(null);
    const wasAbsentRef = useRef(false);

    const processResults = useCallback((results: any) => {
        const face = processFaceData(results);
        setFaceData(face);

        if (face.detected && face.landmarks) {
            const gaze = calculateGaze(face.landmarks);
            gaze.multipleFaces = face.count > 1;
            setGazeData(gaze);

            // Face is present, reset absence timer
            absenceStartRef.current = null;
            if (wasAbsentRef.current) {
                wasAbsentRef.current = false;
                setIsAbsent(false);
            }
        } else {
            // Face not detected
            setGazeData(prev => ({ ...prev, facePresent: false, isLookingAtScreen: false }));

            if (!absenceStartRef.current) {
                absenceStartRef.current = Date.now();
            } else {
                const duration = Date.now() - absenceStartRef.current;
                if (duration >= absenceThresholdMs && !wasAbsentRef.current) {
                    wasAbsentRef.current = true;
                    setIsAbsent(true);
                    setAbsenceCount(prev => prev + 1);
                }
            }
        }
    }, [absenceThresholdMs]);

    return {
        faceData,
        gazeData,
        isAbsent,
        absenceCount,
        processResults,
    };
}
