import React from 'react';
import { Violation, ViolationType, VIOLATION_CONFIGS } from '../../services/proctoring';

interface TerminationScreenProps {
    reason: ViolationType;
    violations: Violation[];
    onRestart?: () => void;
}

export const TerminationScreen: React.FC<TerminationScreenProps> = ({
    reason,
    violations,
    onRestart,
}) => {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <div className="termination-screen">
            <div className="termination-icon">🚫</div>
            <h1 className="termination-title">Exam Terminated</h1>
            <p className="termination-reason">
                Reason: {VIOLATION_CONFIGS[reason].message}
            </p>

            <div className="violation-list">
                <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Violation Log</h3>
                {violations.map((v, i) => (
                    <div key={i} className="violation-item">
                        <span>{v.message}</span>
                        <span style={{ color: '#94a3b8' }}>{formatTime(v.timestamp)}</span>
                    </div>
                ))}
            </div>

            {onRestart && (
                <button className="btn btn-outline" onClick={onRestart}>
                    Try Again (Demo)
                </button>
            )}

            <p style={{ marginTop: '24px', color: '#94a3b8', fontSize: '14px' }}>
                Contact support if you believe this was an error.
            </p>
        </div>
    );
};
