import React from 'react';

interface ToastProps {
    message: string;
    type: 'warning' | 'danger' | 'success';
    onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    const icons = {
        warning: '⚠️',
        danger: '🚨',
        success: '✅',
    };

    return (
        <div className={`toast ${type}`} onClick={onDismiss}>
            <span>{icons[type]}</span>
            <span>{message}</span>
        </div>
    );
};

interface ToastContainerProps {
    toasts: {
        id: string;
        message: string;
        type: 'warning' | 'danger' | 'success';
    }[];
    onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => onDismiss(toast.id)}
                />
            ))}
        </div>
    );
};
