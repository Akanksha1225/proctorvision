import { useState, useEffect, useRef } from 'react';
import './index.css';

// Types
type AppState = 'landing' | 'exam' | 'terminated';

// Sample Questions
const DEMO_QUESTIONS = [
  {
    id: 1,
    text: 'What is the primary purpose of a firewall in network security?',
    options: [
      'To speed up internet connection',
      'To filter incoming and outgoing network traffic',
      'To store backup data',
      'To manage email accounts',
    ],
  },
  {
    id: 2,
    text: 'Which data structure uses LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Array', 'Stack', 'Linked List'],
  },
  {
    id: 3,
    text: 'What does CPU stand for?',
    options: [
      'Central Processing Unit',
      'Computer Personal Unit',
      'Central Program Utility',
      'Core Processing Unit',
    ],
  },
  {
    id: 4,
    text: 'Which of these is NOT a programming paradigm?',
    options: [
      'Object-Oriented Programming',
      'Functional Programming',
      'Structural Programming',
      'Visual Programming',
    ],
  },
  {
    id: 5,
    text: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
  },
  {
    id: 6,
    text: 'What does HTML stand for?',
    options: [
      'Hyper Text Markup Language',
      'High Tech Modern Language',
      'Home Tool Markup Language',
      'Hyperlinks Text Mark Language',
    ],
  },
  {
    id: 7,
    text: 'Which company developed JavaScript?',
    options: ['Microsoft', 'Netscape', 'Google', 'Apple'],
  },
  {
    id: 8,
    text: 'What is the main purpose of an operating system?',
    options: [
      'To browse the internet',
      'To manage hardware and software resources',
      'To create documents',
      'To play games',
    ],
  },
];

// Face landmark indices for head pose
const NOSE_TIP = 1;
const CHIN = 152;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const LEFT_EAR = 234;
const RIGHT_EAR = 454;
const FOREHEAD = 10;

// Eye tracking landmarks
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_INNER = 362;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;

function calculateHeadPose(landmarks: any[]) {
  if (!landmarks || landmarks.length < 478) {
    return { yaw: 0, pitch: 0, isFacingStraight: false };
  }

  // Calculate yaw (left/right rotation) using nose and ears
  const nose = landmarks[NOSE_TIP];
  const leftEar = landmarks[LEFT_EAR];
  const rightEar = landmarks[RIGHT_EAR];

  // Normalized horizontal position of nose between ears
  const earWidth = rightEar.x - leftEar.x;
  const noseFromLeft = nose.x - leftEar.x;
  const yaw = (noseFromLeft / earWidth - 0.5) * 2; // -1 to 1

  // Calculate pitch (up/down rotation) using forehead, nose, chin
  const forehead = landmarks[FOREHEAD];
  const chin = landmarks[CHIN];

  // Vertical ratio
  const faceHeight = chin.y - forehead.y;
  const noseFromTop = nose.y - forehead.y;
  const expectedRatio = 0.45; // Nose should be about 45% from top
  const actualRatio = noseFromTop / faceHeight;
  const pitch = (actualRatio - expectedRatio) * 4; // -1 (looking up) to 1 (looking down)

  // Thresholds for "facing straight"
  const yawThreshold = 0.25;
  const pitchThreshold = 0.3;

  const isFacingStraight = Math.abs(yaw) < yawThreshold && Math.abs(pitch) < pitchThreshold;

  return { yaw, pitch, isFacingStraight };
}

function calculateGaze(landmarks: any[]) {
  if (!landmarks || landmarks.length < 478) {
    return { horizontal: 0, vertical: 0, isLookingAtScreen: false };
  }

  const leftEyeCenter = [
    (landmarks[LEFT_EYE_INNER].x + landmarks[LEFT_EYE_OUTER].x) / 2,
    (landmarks[LEFT_EYE_INNER].y + landmarks[LEFT_EYE_OUTER].y) / 2,
  ];

  const rightEyeCenter = [
    (landmarks[RIGHT_EYE_INNER].x + landmarks[RIGHT_EYE_OUTER].x) / 2,
    (landmarks[RIGHT_EYE_INNER].y + landmarks[RIGHT_EYE_OUTER].y) / 2,
  ];

  const leftIris = landmarks[LEFT_IRIS];
  const rightIris = landmarks[RIGHT_IRIS];

  const leftEyeWidth = Math.abs(landmarks[LEFT_EYE_OUTER].x - landmarks[LEFT_EYE_INNER].x);
  const rightEyeWidth = Math.abs(landmarks[RIGHT_EYE_OUTER].x - landmarks[RIGHT_EYE_INNER].x);

  const leftIrisOffset = (leftIris.x - leftEyeCenter[0]) / (leftEyeWidth / 2);
  const rightIrisOffset = (rightIris.x - rightEyeCenter[0]) / (rightEyeWidth / 2);

  const horizontal = (leftIrisOffset + rightIrisOffset) / 2;
  const vertical = ((leftIris.y - leftEyeCenter[1]) + (rightIris.y - rightEyeCenter[1])) / 2 / leftEyeWidth;

  const isLookingAtScreen = Math.abs(horizontal) < 0.4 && Math.abs(vertical) < 0.3;

  return { horizontal, vertical, isLookingAtScreen };
}

function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(DEMO_QUESTIONS.length).fill(null));
  const [timeRemaining, setTimeRemaining] = useState(10 * 60);
  const [score, setScore] = useState(100);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
  const [gazeData, setGazeData] = useState({ horizontal: 0, vertical: 0, isLookingAtScreen: true, facePresent: false });
  const [headPose, setHeadPose] = useState({ yaw: 0, pitch: 0, isFacingStraight: true });

  // Warning system
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentWarning, setCurrentWarning] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [modalWarningNum, setModalWarningNum] = useState(0); // For displaying in modal

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const violationStartRef = useRef<number | null>(null);
  const lastWarningTimeRef = useRef<number>(0);
  const lastTabWarningRef = useRef<number>(0);

  // Tab visibility detection
  useEffect(() => {
    if (appState !== 'exam') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        // Debounce - no more than one warning per 2 seconds
        if (now - lastTabWarningRef.current < 2000) return;
        lastTabWarningRef.current = now;

        console.log('Tab switch detected!');
        setTabSwitchCount(prev => prev + 1);

        // Use functional update to get the latest count
        setWarningCount(prevCount => {
          const newCount = prevCount + 1;
          console.log('New warning count:', newCount);

          setModalWarningNum(newCount); // Set this for modal display
          setCurrentWarning('🚨 TAB SWITCH DETECTED! You left the exam window. This is a serious violation!');
          setShowWarningModal(true);

          // Change question
          setCurrentQuestion(prevQ => Math.min(DEMO_QUESTIONS.length - 1, prevQ + 1));

          // Terminate if too many warnings
          if (newCount >= 3) {
            setTerminationReason('Tab switch detected - You left the exam window');
            setAppState('terminated');
          }

          return newCount;
        });
      }
    };

    const handleBlur = () => {
      // Skip if tab is hidden (already handled by visibilitychange)
      if (document.hidden) return;

      const now = Date.now();
      // Debounce - no more than one warning per 3 seconds
      if (now - lastWarningTimeRef.current < 3000) return;
      lastWarningTimeRef.current = now;

      console.log('Window blur detected!');

      setWarningCount(prevCount => {
        const newCount = prevCount + 1;
        console.log('New warning count from blur:', newCount);

        setModalWarningNum(newCount); // Set this for modal display
        setCurrentWarning('⚠️ Window focus lost! Please stay on the exam window.');
        setShowWarningModal(true);

        setCurrentQuestion(prevQ => Math.min(DEMO_QUESTIONS.length - 1, prevQ + 1));

        if (newCount >= 3) {
          setTerminationReason('Window focus lost - You switched to another application');
          setAppState('terminated');
        }

        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [appState]);

  // Timer
  useEffect(() => {
    if (appState !== 'exam') return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [appState]);

  // Initialize MediaPipe when exam starts
  useEffect(() => {
    if (appState !== 'exam' || !videoRef.current) return;

    let camera: any = null;
    let isActive = true;

    const loadMediaPipe = async () => {
      try {
        // @ts-ignore
        const FaceMesh = window.FaceMesh;
        // @ts-ignore
        const Camera = window.Camera;

        if (!FaceMesh || !Camera) {
          console.error('MediaPipe not loaded');
          return;
        }

        const faceMesh = new FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 2,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          if (!isActive) return;

          const landmarks = results.multiFaceLandmarks;
          const faceDetected = landmarks && landmarks.length > 0;
          const now = Date.now();

          if (faceDetected) {
            const face = landmarks[0];

            // Calculate head pose
            const pose = calculateHeadPose(face);
            setHeadPose(pose);

            // Calculate gaze
            const gaze = calculateGaze(face);
            setGazeData({ ...gaze, facePresent: true });

            // Check for violations
            const isViolation = !pose.isFacingStraight || !gaze.isLookingAtScreen;

            if (isViolation) {
              if (!violationStartRef.current) {
                violationStartRef.current = now;
              } else if (now - violationStartRef.current > 2500) {
                // Violation for 2.5+ seconds
                if (now - lastWarningTimeRef.current > 6000) {
                  let message = '';
                  if (pose.yaw < -0.25) {
                    message = '🚨 Head turned LEFT! Face the screen directly.';
                  } else if (pose.yaw > 0.25) {
                    message = '🚨 Head turned RIGHT! Face the screen directly.';
                  } else if (pose.pitch > 0.3) {
                    message = '🚨 Head tilted DOWN! No looking at notes. Face the screen.';
                  } else if (pose.pitch < -0.3) {
                    message = '🚨 Head tilted UP! Face the screen directly.';
                  } else if (!gaze.isLookingAtScreen) {
                    message = '🚨 Eyes not on screen! Keep your eyes on the exam.';
                  }

                  if (message) {
                    triggerWarning(message, true);
                    lastWarningTimeRef.current = now;
                  }
                }
                violationStartRef.current = now;
              }
              setScore((prev) => Math.max(0, prev - 1.5));
            } else {
              violationStartRef.current = null;
              setScore((prev) => Math.min(100, prev + 0.2));
            }

            // Check for multiple faces
            if (landmarks.length > 1 && now - lastWarningTimeRef.current > 6000) {
              triggerWarning('🚨 Multiple faces detected! Only you should be visible.', true);
              lastWarningTimeRef.current = now;
            }
          } else {
            // No face
            setGazeData({ horizontal: 0, vertical: 0, isLookingAtScreen: false, facePresent: false });
            setHeadPose({ yaw: 0, pitch: 0, isFacingStraight: false });

            if (!violationStartRef.current) {
              violationStartRef.current = now;
            } else if (now - violationStartRef.current > 3000) {
              if (now - lastWarningTimeRef.current > 6000) {
                triggerWarning('🚨 Face not detected! Stay in front of the camera.', true);
                lastWarningTimeRef.current = now;
              }
              violationStartRef.current = now;
            }
            setScore((prev) => Math.max(0, prev - 2));
          }

          // Draw to canvas
          if (canvasRef.current && results.image) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = results.image.width;
              canvasRef.current.height = results.image.height;
              ctx.drawImage(results.image, 0, 0);

              if (faceDetected) {
                // Draw face mesh
                const color = headPose.isFacingStraight && gazeData.isLookingAtScreen ? '#22c55e' : '#ef4444';
                ctx.fillStyle = color;
                for (let i = 0; i < landmarks[0].length; i += 20) {
                  const point = landmarks[0][i];
                  ctx.beginPath();
                  ctx.arc(point.x * canvasRef.current.width, point.y * canvasRef.current.height, 1.5, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
            }
          }
        });

        camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && isActive) {
              await faceMesh.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240,
        });

        await camera.start();
      } catch (err) {
        console.error('Failed to initialize MediaPipe:', err);
      }
    };

    loadMediaPipe();

    return () => {
      isActive = false;
      if (camera) camera.stop();
    };
  }, [appState]);

  const triggerWarning = (message: string, changeQuestion: boolean = false) => {
    const newCount = warningCount + 1;
    setWarningCount(newCount);
    setCurrentWarning(message);
    setShowWarningModal(true);

    // Change question on violation
    if (changeQuestion && currentQuestion < DEMO_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => Math.min(DEMO_QUESTIONS.length - 1, prev + 1));
    }

    // Terminate after 3 warnings
    if (newCount >= 3) {
      setTerminationReason(message);
      setAppState('terminated');
    }
  };

  const dismissWarning = () => {
    setShowWarningModal(false);
  };

  const addToast = (message: string, type: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExam = () => {
    setAppState('exam');
    setWarningCount(0);
    setScore(100);
    setTabSwitchCount(0);
  };

  const handleRestart = () => {
    setAppState('landing');
    setCurrentQuestion(0);
    setAnswers(new Array(DEMO_QUESTIONS.length).fill(null));
    setTimeRemaining(10 * 60);
    setScore(100);
    setWarningCount(0);
    setTabSwitchCount(0);
  };

  // Get status label
  const getStatusLabel = () => {
    if (!gazeData.facePresent) return '❌ No Face';
    if (!headPose.isFacingStraight) {
      if (headPose.yaw < -0.25) return '← Head Left';
      if (headPose.yaw > 0.25) return '→ Head Right';
      if (headPose.pitch > 0.3) return '↓ Looking Down';
      if (headPose.pitch < -0.3) return '↑ Looking Up';
    }
    if (!gazeData.isLookingAtScreen) return '👀 Eyes Off Screen';
    return '✅ Good';
  };

  const getStatusColor = () => {
    if (!gazeData.facePresent) return 'danger';
    if (!headPose.isFacingStraight || !gazeData.isLookingAtScreen) return 'warning';
    return 'success';
  };

  // Landing page
  if (appState === 'landing') {
    return (
      <div className="landing">
        <div className="landing-icon">👁️</div>
        <h1 className="landing-title">ProctorVision</h1>
        <p className="landing-subtitle">
          AI-powered exam proctoring with face & eye tracking.
          We detect head movements, eye direction, and tab switching.
        </p>

        <div className="permission-card">
          <div className="permission-item">
            <span className="permission-icon">📷</span>
            <div className="permission-text">
              <strong>Face Tracking</strong>
              Detects if you turn your head left, right, up, or down
            </div>
          </div>
          <div className="permission-item">
            <span className="permission-icon">👀</span>
            <div className="permission-text">
              <strong>Eye Tracking</strong>
              Ensures your eyes stay focused on the screen
            </div>
          </div>
          <div className="permission-item">
            <span className="permission-icon">🔄</span>
            <div className="permission-text">
              <strong>Tab Detection</strong>
              Detects if you switch to another tab or window
            </div>
          </div>
          <div className="permission-item">
            <span className="permission-icon">⚠️</span>
            <div className="permission-text">
              <strong>3 Strikes Rule</strong>
              After 3 warnings, exam terminates + question changes
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={startExam}>
          Start Demo Exam →
        </button>
      </div>
    );
  }

  // Termination screen
  if (appState === 'terminated') {
    return (
      <div className="termination-screen">
        <div className="termination-icon">🚫</div>
        <h1 className="termination-title">Exam Terminated</h1>
        <p className="termination-reason">{terminationReason}</p>
        <div className="violation-list">
          <h3 style={{ marginBottom: '16px', color: '#f8fafc' }}>Violation Summary</h3>
          <div className="violation-item">
            <span>Total Warnings</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>{warningCount}</span>
          </div>
          <div className="violation-item">
            <span>Tab Switches Detected</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{tabSwitchCount}</span>
          </div>
          <div className="violation-item">
            <span>Final Attention Score</span>
            <span style={{ color: score >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{Math.round(score)}%</span>
          </div>
          <div className="violation-item">
            <span>Questions Reached</span>
            <span>{currentQuestion + 1} / {DEMO_QUESTIONS.length}</span>
          </div>
        </div>
        <button className="btn btn-outline" onClick={handleRestart}>
          Try Again (Demo)
        </button>
      </div>
    );
  }

  // Exam view
  const question = DEMO_QUESTIONS[currentQuestion];

  return (
    <div className="app-container">
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">🚨</div>
            <h2 className="modal-title" style={{ color: modalWarningNum >= 2 ? '#ef4444' : '#f59e0b' }}>
              Warning {modalWarningNum}/3
            </h2>
            <p className="modal-message">{currentWarning}</p>
            {modalWarningNum >= 2 && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px', fontWeight: 600 }}>
                ⚠️ FINAL WARNING! Next violation = Exam Termination
              </p>
            )}
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
              Question has been changed. Keep your face straight and eyes on screen.
            </p>
            <button className="btn btn-primary" onClick={dismissWarning}>
              I Understand - Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* Webcam HUD */}
      <div className="webcam-hud">
        <video ref={videoRef} style={{ display: 'none' }} playsInline />
        <canvas ref={canvasRef} style={{ width: '100%', transform: 'scaleX(-1)' }} />
        <div className="webcam-hud-status">
          <span className={`status-dot ${getStatusColor()}`} />
          <span>{getStatusLabel()}</span>
        </div>
      </div>

      {/* Attention Meter */}
      <div className="attention-meter">
        <div className="attention-label">Focus Score</div>
        <div className="attention-score" style={{
          color: score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
        }}>
          {Math.round(score)}
        </div>
        <div className="attention-bar">
          <div className="attention-bar-fill" style={{ width: `${score}%` }} />
        </div>
        <div style={{
          marginTop: '12px',
          fontSize: '12px',
          color: warningCount >= 2 ? '#ef4444' : '#f59e0b',
          textAlign: 'center',
          fontWeight: warningCount >= 2 ? 600 : 400
        }}>
          ⚠️ {warningCount}/3 Warnings
        </div>
      </div>

      {/* Head Pose Indicator */}
      <div className="gaze-indicator">
        <span className={`gaze-zone ${headPose.yaw < -0.2 ? 'warning' : ''}`} title="Left" />
        <span className={`gaze-zone ${headPose.pitch < -0.2 ? 'warning' : ''}`} title="Up" />
        <span className={`gaze-zone ${headPose.isFacingStraight && gazeData.isLookingAtScreen ? 'active' : ''}`} title="Center" />
        <span className={`gaze-zone ${headPose.pitch > 0.2 ? 'warning' : ''}`} title="Down" />
        <span className={`gaze-zone ${headPose.yaw > 0.2 ? 'warning' : ''}`} title="Right" />
      </div>

      <main className="exam-container">
        <div className="exam-header">
          <h1 className="exam-title">Demo Exam</h1>
          <div className="exam-timer">{formatTime(timeRemaining)}</div>
        </div>

        <div className="progress-bar" style={{ marginBottom: '24px' }}>
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestion + 1) / DEMO_QUESTIONS.length) * 100}%` }}
          />
        </div>

        <div className="question-card">
          <div className="question-number">
            Question {currentQuestion + 1} of {DEMO_QUESTIONS.length}
          </div>
          <div className="question-text">{question.text}</div>
          <div className="options-list">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`option ${answers[currentQuestion] === index ? 'selected' : ''}`}
                onClick={() => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestion] = index;
                  setAnswers(newAnswers);
                }}
              >
                <span className="option-letter">{['A', 'B', 'C', 'D'][index]}</span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button
            className="btn btn-outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            ← Previous
          </button>

          {currentQuestion < DEMO_QUESTIONS.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrentQuestion(currentQuestion + 1)}>
              Next →
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                addToast('Exam submitted successfully!', 'success');
                setTimeout(handleRestart, 2000);
              }}
            >
              Submit Exam ✓
            </button>
          )}
        </div>
      </main>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
