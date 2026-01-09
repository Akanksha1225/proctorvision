import React from 'react';
import { Violation } from '../../services/proctoring';

interface WarningModalProps {
    violation: Violation;
    count: number;
    maxCount: number;
    onAcknowledge: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
    violation,
    count,
    maxCount,
    onAcknowledge,
}) => {
    const icons: Record<string, string> = {
        FACE_ABSENT: '👤',
        MULTIPLE_FACES: '👥',
        LOOKING_AWAY: '👀',
        LOW_ATTENTION: '😴',
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-icon">{icons[violation.type] || '⚠️'}</div>
                <h2 className="modal-title">Warning</h2>
                <p className="modal-message">{violation.message}</p>
                <p className="modal-count">
                    This is warning {count} of {maxCount}
                </p>
                <button className="btn btn-primary" onClick={onAcknowledge}>
                    I Understand
                </button>
            </div>
        </div>
    );
};
