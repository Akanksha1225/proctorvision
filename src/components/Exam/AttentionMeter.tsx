import React from 'react';

interface AttentionMeterProps {
    score: number;
    facePresent: boolean;
    isLookingAtScreen: boolean;
}

export const AttentionMeter: React.FC<AttentionMeterProps> = ({
    score,
    facePresent,
    isLookingAtScreen,
}) => {
    const getScoreColor = () => {
        if (score >= 80) return '#22c55e';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="attention-meter">
            <div className="attention-label">Attention Score</div>
            <div className="attention-score" style={{ color: getScoreColor() }}>
                {score}
            </div>
            <div className="attention-bar">
                <div
                    className="attention-bar-fill"
                    style={{ width: `${score}%` }}
                />
            </div>
            <div style={{
                marginTop: '12px',
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
            }}>
                <span
                    className={`status-dot ${facePresent ? 'success' : 'danger'}`}
                    title={facePresent ? 'Face detected' : 'Face not detected'}
                />
                <span
                    className={`status-dot ${isLookingAtScreen ? 'success' : facePresent ? 'warning' : 'danger'}`}
                    title={isLookingAtScreen ? 'Looking at screen' : 'Looking away'}
                />
            </div>
        </div>
    );
};
