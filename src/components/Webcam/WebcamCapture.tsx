import { useRef, useEffect, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface WebcamCaptureProps {
    onResults: (results: any) => void;
    showPreview?: boolean;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({
    onResults,
    showPreview = true,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        if (!videoRef.current) return;

        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
            maxNumFaces: 2,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
            onResults(results);
            setStatus(results.multiFaceLandmarks?.length ? 'Face detected' : 'No face');

            // Draw on canvas
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx && results.image) {
                    canvasRef.current.width = results.image.width;
                    canvasRef.current.height = results.image.height;
                    ctx.save();
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    ctx.drawImage(results.image, 0, 0);

                    // Draw face mesh
                    if (results.multiFaceLandmarks) {
                        for (const landmarks of results.multiFaceLandmarks) {
                            // Draw key points
                            ctx.fillStyle = '#22c55e';
                            for (let i = 0; i < landmarks.length; i += 10) {
                                const point = landmarks[i];
                                ctx.beginPath();
                                ctx.arc(
                                    point.x * canvasRef.current.width,
                                    point.y * canvasRef.current.height,
                                    1,
                                    0,
                                    2 * Math.PI
                                );
                                ctx.fill();
                            }
                        }
                    }
                    ctx.restore();
                }
            }
        });

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) {
                    await faceMesh.send({ image: videoRef.current });
                }
            },
            width: 640,
            height: 480,
        });

        camera
            .start()
            .then(() => {
                setIsLoading(false);
                setStatus('Camera ready');
            })
            .catch(() => {
                setError('Camera access denied. Please allow camera permissions.');
                setIsLoading(false);
            });

        return () => {
            camera.stop();
        };
    }, [onResults]);

    if (error) {
        return (
            <div className="webcam-hud">
                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                    <div style={{ fontSize: '12px' }}>{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="webcam-hud">
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
            />
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    transform: 'scaleX(-1)',
                    display: showPreview ? 'block' : 'none',
                }}
            />
            <div className="webcam-hud-status">
                <span
                    className={`status-dot ${status === 'Face detected' ? 'success' :
                        status === 'No face' ? 'danger' : ''
                        }`}
                />
                <span>{isLoading ? 'Loading...' : status}</span>
            </div>
        </div>
    );
};
