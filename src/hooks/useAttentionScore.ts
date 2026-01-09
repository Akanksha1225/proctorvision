import { useState, useCallback, useRef } from 'react';
import { AttentionScorer } from '../services/proctoring';

interface UseAttentionScoreResult {
    score: number;
    update: (facePresent: boolean, isLookingAtScreen: boolean) => void;
    reset: () => void;
}

export function useAttentionScore(): UseAttentionScoreResult {
    const [score, setScore] = useState(100);
    const scorerRef = useRef(new AttentionScorer());

    const update = useCallback((facePresent: boolean, isLookingAtScreen: boolean) => {
        const newScore = scorerRef.current.update(facePresent, isLookingAtScreen);
        setScore(newScore);
    }, []);

    const reset = useCallback(() => {
        scorerRef.current.reset();
        setScore(100);
    }, []);

    return { score, update, reset };
}
