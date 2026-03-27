# 🪔 Akshara-Drishti: Comprehensive Developer & AI Assistant Knowledge Base

> **⚠️ CRITICAL NOTICE TO AI ASSISTANTS:**
> This document acts as your **Master Context System Prompt**. It contains exhaustive details about the Akshara-Drishti project. You MUST read this carefully before proposing any modifications to the codebase, suggesting debugging steps, or answering user queries. Do not make assumptions about the stack; refer strictly to the guidelines defined below.

---

## 1. Project Overview & Objective

**Akshara-Drishti** (meaning "Script Vision") is an advanced, AI-powered digital epigraphy research platform. Its primary objective is to analyze photographs of ancient inscriptions (found on temples, monuments, and artifacts) and accurately classify the Indic script being used. 

The system supports 6 core scripts:
1. `brahmi`
2. `devanagari`
3. `kannada`
4. `malayalam`
5. `tamil`
6. `telugu`

---

## 2. Exhaustive Repository Architecture

### Directory Tree

```text
d:\ss\
├── .git/                               # Version control tracking
├── README.md                           # Master Knowledge Base (This File)
├── Akshara_Drishti_Training.ipynb      # Source of truth for model training pipelines
├── app.py                              # Flask API Server and Inference Engine
├── requirements.txt                    # Exact environment dependencies
├── model/                              # Model storage directory
│   └── script_model.keras              # Compiled TensorFlow 2.15.0 model archive
├── index.html                          # Landing page (Hero, Stats, Features)
├── upload.html                         # Core application interface (Upload Zone, Results)
├── about.html                          # Project timeline, tech stack, team details
├── styles.css                          # Centralized global design system (Custom properties)
├── script.js                           # Shared GSAP interactions and navbar logic
├── upload.js                           # Client-side API fetching and DOM manipulation
└── cursor.js                           # Custom animated mouse follower
```

---

## 3. Deep Learning Engine (`model/`)

The core intelligence of Akshara-Drishti is a CNN built on **MobileNetV2**.

### 3.1 Model Architecture Details
- **Input Shape:** `(96, 96, 3)`
- **Base Model:** MobileNetV2 (Pre-trained on ImageNet).
- **Classification Head:** Custom Dense layers mapping to the 6 supported scripts.
- **Training Data:** 800 train / 150 val / 150 test images per class. Uses synthetic generation with Google Noto Sans and BrahmiGAN for historical data.
- **Training Strategy:** 2-Stage training (Frozen backbone for 12 epochs @ lr 1e-3, Fine-tuning top 40 layers for 15 epochs @ lr 1e-5). Uses label smoothing (0.05).
- **Validation Accuracy:** ~90%

### 3.2 Inference Architecture — Dual Pipeline
Because inscriptions are often degraded or rotated differently than modern text, the engine utilizes a dual pipeline approach:
1. **Modern/Paper Path:** Tries 0°, 90°, 180°, and 270° rotations. Picks the prediction with the lowest entropy (highest confidence). Excellent for phone photos.
2. **Inscription Path:** Uses CLAHE restoration and advanced cropping/patch extraction. Hard voting connects patch results, with a tiebreaker specifically designed for Tamil/Kannada granular similarity.

The system auto-runs both pipelines and selects the path yielding the highest overall confidence.

---

## 4. Backend Server Implementation (`app.py`)

The backend is built with **Flask** and implements the Dual Pipeline Inference Engine.

### 4.1 Server Startup & State Management
- **Lazy Loading Model:** The `.keras` file is NOT loaded into memory when the server starts. It is loaded only upon the first request to `/api/predict`.
- **Cross-Origin Resource Sharing (CORS):** fully enabled.

### 4.2 Exact Inference Pipeline
The `predict()` function dynamically processes the image across the Dual Pipelines (Rotations and CLAHE variants), calculates entropy ($-\sum p \log(p)$), and returns the most confident assessment.

### 4.3 API Endpoints
**1. `GET /api/health`**
- Returns server status and supported classes list.

**2. `POST /api/predict`**
- Purpose: Executes Dual Pipeline inference.
- Payload: `FormData` with a key of `image`.
- Response Signature:
  ```json
  {
    "predicted_class": "Tamil",
    "confidence": 96.34,
    "all_scores": {
      "brahmi": 1.25,
      "devanagari": 2.41,
      "kannada": 0.0,
      "malayalam": 0.0,
      "tamil": 96.34,
      "telugu": 0.0
    }
  }
  ```
- Error Handling: Returns proper HTTP status codes (400 for bad files, 503 if model is missing, 500 for inference crashes) and a JSON string `{"error": "Contextual error message"}`.

---

## 5. Frontend Application Integration & Design System

The UI is a bespoke, zero-framework implementation focusing on high aesthetics. **AIs must NOT implement Tailwind, Bootstrap, or React. Retain Vanilla HTML/CSS/JS.**

### 5.1 Design Tokens (`styles.css` root variables)
- **Colors:** Deep dark background (`#050505`), Card surfaces (`rgba(14, 14, 14, 0.7)`), Primary Text (`#ffffff`).
- **Accent Theme:** A futuristic neon-lime green.
  - Base Accent: `--accent: #9eff3d;`
  - Glow State: `--accent-glow: #7cff2b;`
  - Error/Offline State: `--accent-red: #ff3c3c;`
- **Typography:** `Montserrat` (Headings, 500/600/700/800 weights) and `Inter` (Body, 400/500/600 weights).
- **Aesthetic:** Heavy use of `backdrop-filter: blur(12px)` for glassmorphism, 1px translucent borders, and radial background gradients to simulate ambient light.

### 5.2 JavaScript Architecture

#### `upload.js` (State Machine & API Calls)
- **Health Polling:** Queries `/api/health` via `setInterval` every 30 seconds. Dynamically updates `#statusIndicator` CSS classes (`online` vs `offline`).
- **Drag & Drop Events:** Overrides default browser behaviors to allow dropping files into `#uploadZone`. Adds `.dragover` classes for CSS visual feedback.
- **Client-Side Validation:** Blocks files > 10MB and strictly enforces `image/*` MIME types before uploading to the server to save bandwidth.
- **Result Animations:** On successful API response, dynamically builds an HTML breakdown of `all_scores` probabilities and animates the width of the confidence `.score-bar-fill` nodes using GSAP timeline staggers.
- **Error Toasts:** Consumes backend JSON error messages and displays them in a sliding, auto-dismissing glassmorphic toast notification.

#### `script.js` (GSAP Animations)
- **Hero Reveal:** A tightly choreographed timeline that drops in the Badge -> Title -> Subtitle -> Description -> CTA Buttons sequentially using `power4.out` easing.
- **Scroll Triggers:** Automatically hooks into classes like `.features-grid`, `.tech-grid`, and `.gsap-hidden`. As the user scrolls, elements stagger into view from `opacity: 0, y: 30`.
- **Hamburger Navigation:** Toggles mobile menu states, transforming the 3 lines into an "X".

#### `cursor.js` (The Interaction Layer)
- Silently disables itself on mobile/touch interfaces (`ontouchstart`, `maxTouchPoints > 0`, `max-width: 768px`).
- Injects two `divs` (`.cursor-ring`, `.cursor-dot`) into the DOM.
- Uses `requestAnimationFrame` and Linear Interpolation (Lerp) to smoothly drag the visual cursor behind the actual mouse coordinates.
- Listens for `mouseover` on interactive selectors (a, button, input) to trigger the ring `.hover` state (expands ring, compresses dot).

---

## 6. AI Development Protocols & Extension Guide

If the user asks an AI to extend or modify this project, the AI MUST follow these protocols:

### A. Extending the Model
If the user wants to add a new script class (e.g., *Grantha*):
1. Update `Akshara_Drishti_Training.ipynb` to include Grantha in the sorting/cleaning paths.
2. Train a new model resulting in `script_model.keras`.
3. You MUST update `CLASS_NAMES` in `app.py` line 12. Ensure it remains strictly in ALPHABETICAL order to match `tf.keras.preprocessing.image_dataset_from_directory` class indices.

### B. UI/UX Refactoring
If the user wants UI changes:
1. Preserve Glassmorphism: Any new card or panel must use `--bg-card` and `backdrop-filter`.
2. Do not inline styles. Always write classes linked back to `styles.css`.
3. Form elements must retain custom styling. `input type="file"` is deeply hidden and proxied through the `#uploadZone` and Browse buttons in `upload.html`.

### C. Troubleshooting Checklist for AIs
1. **ModuleNotFoundError:** Ensure `requirements.txt` is updated and pip has executed successfully.
2. **Poor Inference Accuracy:** Verify that the image wasn't sent as raw RGB. Did `app.py` correctly apply `cv2.createCLAHE`? Did it cast to float32 and divide by 255.0?
3. **503 Model Unavailable Errors:** The user likely did not place `script_model.keras` inside the `d:\ss\model\` directory. Remind the user of the path hierarchy.
4. **GSAP Errors:** Ensure that DOM elements exist before attempting to animate them. `script.js` wraps checks like `if (heroTitle)` to prevent console errors on pages without an element.

---

*End of Knowledge Base.*
