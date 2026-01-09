// Proctoring Service - Violation Management

export type ViolationType =
    | 'FACE_ABSENT'
    | 'MULTIPLE_FACES'
    | 'LOOKING_AWAY'
    | 'LOW_ATTENTION';

export interface Violation {
    type: ViolationType;
    timestamp: number;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ViolationConfig {
    severity: 'low' | 'medium' | 'high' | 'critical';
    maxCount: number;
    message: string;
}

export const VIOLATION_CONFIGS: Record<ViolationType, ViolationConfig> = {
    FACE_ABSENT: {
        severity: 'high',
        maxCount: 3,
        message: 'Face not detected',
    },
    MULTIPLE_FACES: {
        severity: 'critical',
        maxCount: 1,
        message: 'Multiple faces detected',
    },
    LOOKING_AWAY: {
        severity: 'medium',
        maxCount: 10,
        message: 'Looking away from screen',
    },
    LOW_ATTENTION: {
        severity: 'medium',
        maxCount: 5,
        message: 'Low attention score',
    },
};

export class AttentionScorer {
    private score: number = 100;
    private history: { timestamp: number; score: number }[] = [];

    update(facePresent: boolean, isLookingAtScreen: boolean): number {
        if (!facePresent) {
            this.score = Math.max(0, this.score - 5);
        } else if (!isLookingAtScreen) {
            this.score = Math.max(0, this.score - 2);
        } else {
            this.score = Math.min(100, this.score + 0.5);
        }

        this.history.push({
            timestamp: Date.now(),
            score: this.score,
        });

        // Keep only last 100 entries
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
        }

        return Math.round(this.score);
    }

    getScore(): number {
        return Math.round(this.score);
    }

    reset(): void {
        this.score = 100;
        this.history = [];
    }
}

export class ViolationManager {
    private violations: Map<ViolationType, Violation[]> = new Map();
    private onWarning: (violation: Violation, count: number, max: number) => void;
    private onTerminate: (type: ViolationType, violations: Violation[]) => void;

    constructor(
        onWarning: (violation: Violation, count: number, max: number) => void,
        onTerminate: (type: ViolationType, violations: Violation[]) => void
    ) {
        this.onWarning = onWarning;
        this.onTerminate = onTerminate;
    }

    addViolation(type: ViolationType): void {
        const config = VIOLATION_CONFIGS[type];
        const violation: Violation = {
            type,
            timestamp: Date.now(),
            message: config.message,
            severity: config.severity,
        };

        if (!this.violations.has(type)) {
            this.violations.set(type, []);
        }

        const typeViolations = this.violations.get(type)!;
        typeViolations.push(violation);

        const count = typeViolations.length;
        const max = config.maxCount;

        this.onWarning(violation, count, max);

        if (count >= max) {
            this.onTerminate(type, typeViolations);
        }
    }

    getViolations(): Map<ViolationType, Violation[]> {
        return this.violations;
    }

    getViolationCount(type: ViolationType): number {
        return this.violations.get(type)?.length || 0;
    }

    getAllViolations(): Violation[] {
        const all: Violation[] = [];
        this.violations.forEach((v) => all.push(...v));
        return all.sort((a, b) => a.timestamp - b.timestamp);
    }

    reset(): void {
        this.violations.clear();
    }
}
