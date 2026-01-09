# ProctorVision — AI-Powered Exam Proctoring System

Browser-based exam proctoring using computer vision for face detection, eye tracking, and attention monitoring — all processed locally for privacy.

🌐 **Live Demo**: [proctorvision.vercel.app](https://proctorvision.vercel.app/)  
📦 **GitHub**: [github.com/Akanksha1225/proctorvision](https://github.com/Akanksha1225/proctorvision)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Face Detection** | Real-time face presence monitoring |
| **Head Pose Tracking** | Detects if head turns left/right/up/down |
| **Eye Gaze Tracking** | Ensures eyes are focused on screen |
| **Tab Switch Detection** | Alerts when user leaves exam window |
| **3-Strike Warning System** | Violations trigger warnings, 3rd = termination |
| **Question Randomization** | Questions change on each violation |
| **Attention Score** | Real-time 0-100 focus score |

---

## 🚨 Violation Detection

| Violation | Detection Method | Threshold |
|-----------|-----------------|-----------|
| **Head Left/Right** | Nose position relative to ears | Yaw > 0.25 |
| **Looking Down** | Nose vertical position | Pitch > 0.3 |
| **Eyes Off Screen** | Iris position in eye socket | Deviation > 0.4 |
| **Face Absent** | No face landmarks detected | 3 seconds |
| **Multiple Faces** | Face count > 1 | Immediate |
| **Tab Switch** | Visibility API | Immediate |
| **Window Blur** | Focus event | 3s debounce |

---

## 🛠️ Tech Stack

- **React 18 + TypeScript** — UI framework
- **Vite** — Build tool
- **MediaPipe Face Mesh** — 468 facial landmarks
- **CSS Variables** — Dark theme design system

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/Akanksha1225/proctorvision.git
cd proctorvision

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure

```
proctorvision/
├── src/
│   ├── App.tsx              # Main application
│   ├── index.css            # Design system
│   ├── components/
│   │   ├── Exam/
│   │   │   ├── AttentionMeter.tsx
│   │   │   └── QuestionCard.tsx
│   │   ├── Warnings/
│   │   │   ├── Toast.tsx
│   │   │   ├── WarningModal.tsx
│   │   │   └── TerminationScreen.tsx
│   │   └── Webcam/
│   │       └── WebcamCapture.tsx
│   ├── hooks/
│   │   ├── useAttentionScore.ts
│   │   ├── useFaceDetection.ts
│   │   └── useViolations.ts
│   └── services/
│       ├── mediapipe.ts     # Face mesh utilities
│       └── proctoring.ts    # Violation logic
├── index.html
├── package.json
└── vite.config.ts
```

---

## 🎨 UI Components

### Landing Page
- Eye icon with "ProctorVision" title
- Feature cards explaining camera, eye tracking, tab detection
- "3 Strikes Rule" explanation
- "Start Demo Exam" button

### Exam Interface
- **Webcam HUD** — Bottom-right camera preview with face mesh overlay
- **Attention Meter** — Top-right score display (0-100)
- **Gaze Indicator** — Top-center 5-zone head pose indicator
- **Question Card** — MCQ with A/B/C/D options
- **Progress Bar** — Question progress indicator
- **Timer** — 10-minute countdown

### Warning Modal
- Warning count (1/3, 2/3, 3/3)
- Violation description
- "I Understand" acknowledgment button
- Final warning alert on 2nd violation

### Termination Screen
- Violation summary
- Tab switch count
- Final attention score
- "Try Again" button

---

## 🔧 Configuration

Key detection thresholds (in `App.tsx`):

```typescript
// Head pose thresholds
const yawThreshold = 0.25;      // Left/right rotation
const pitchThreshold = 0.3;     // Up/down tilt

// Eye gaze thresholds
const horizontalThreshold = 0.4;  // Left/right gaze
const verticalThreshold = 0.3;    // Up/down gaze

// Timing
const violationDuration = 2500;   // ms before triggering warning
const warningCooldown = 6000;     // ms between warnings
const tabDebounce = 2000;         // ms debounce for tab switch
```

---

## 🔐 Privacy

- **100% Browser-Based** — No server processing
- **No Data Stored** — All processing is real-time
- **No External Requests** — MediaPipe models loaded from CDN
- **Camera Never Recorded** — Video stream processed locally only

---

## 🎯 Use Cases

- Online exam proctoring
- Remote certification tests
- Interview monitoring
- Attention span research
- Focus training tool

---

## 📄 License

MIT License — Feel free to use and modify!

---

## 👤 Author

**Akanksha** — [GitHub](https://github.com/Akanksha1225)
