import { useState, useCallback, useRef } from 'react';
import type { ViolationType, Violation } from '../services/proctoring';
import { ViolationManager } from '../services/proctoring';

interface UseViolationsResult {
    violations: Violation[];
    addViolation: (type: ViolationType) => void;
    getCount: (type: ViolationType) => number;
    isTerminated: boolean;
    terminationReason: ViolationType | null;
    pendingWarning: { violation: Violation; count: number; max: number } | null;
    dismissWarning: () => void;
    reset: () => void;
}

export function useViolations(): UseViolationsResult {
    const [violations, setViolations] = useState<Violation[]>([]);
    const [isTerminated, setIsTerminated] = useState(false);
    const [terminationReason, setTerminationReason] = useState<ViolationType | null>(null);
    const [pendingWarning, setPendingWarning] = useState<{
        violation: Violation;
        count: number;
        max: number
    } | null>(null);

    const managerRef = useRef<ViolationManager | null>(null);

    if (!managerRef.current) {
        managerRef.current = new ViolationManager(
            (violation, count, max) => {
                setViolations(managerRef.current!.getAllViolations());

                // Only show modal for high/critical severity
                if (violation.severity === 'high' || violation.severity === 'critical') {
                    setPendingWarning({ violation, count, max });
                }
            },
            (type) => {
                setIsTerminated(true);
                setTerminationReason(type);
            }
        );
    }

    const addViolation = useCallback((type: ViolationType) => {
        if (managerRef.current && !isTerminated) {
            managerRef.current.addViolation(type);
        }
    }, [isTerminated]);

    const getCount = useCallback((type: ViolationType) => {
        return managerRef.current?.getViolationCount(type) || 0;
    }, []);

    const dismissWarning = useCallback(() => {
        setPendingWarning(null);
    }, []);

    const reset = useCallback(() => {
        managerRef.current?.reset();
        setViolations([]);
        setIsTerminated(false);
        setTerminationReason(null);
        setPendingWarning(null);
    }, []);

    return {
        violations,
        addViolation,
        getCount,
        isTerminated,
        terminationReason,
        pendingWarning,
        dismissWarning,
        reset,
    };
}
