# 🪔 Akshara-Drishti: Comprehensive Developer & AI Assistant Knowledge Base

> **⚠️ CRITICAL NOTICE TO AI ASSISTANTS:**
> This document acts as your **Master Context System Prompt**. It contains exhaustive details about the Akshara-Drishti project. You MUST read this carefully before proposing any modifications to the codebase, suggesting debugging steps, or answering user queries. Do not make assumptions about the stack; refer strictly to the guidelines defined below.

---

## 1. Project Overview & Objective

**Akshara-Drishti** (meaning "Script Vision") is an advanced, AI-powered digital epigraphy research platform. Its primary objective is to analyze photographs of ancient inscriptions (found on temples, monuments, and artifacts) and accurately classify the Indic script being used. 

The project bridges historical preservation and modern Deep Learning by providing an accessible, highly polished web interface that communicates seamlessly with a robust Python/TensorFlow backend.

**Current Supported Script Classes:**
1. `brahmi`
2. `devanagari`
3. `tamil`

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

## 3. Deep Learning Engine (`Akshara_Drishti_Training.ipynb` & `model/`)

The core intelligence of Akshara-Drishti is a Convolutional Neural Network (CNN) built on TensorFlow/Keras.

### 3.1 Model Architecture Details
The model leverages Transfer Learning using **EfficientNetB0**.
- **Input Shape:** `(224, 224, 3)`
- **Base Model:** Pre-trained on ImageNet.
- **Custom Classification Head:**
  1. `GlobalAveragePooling2D()`: Flattens the feature maps gracefully.
  2. `BatchNormalization()`: Stabilizes activations.
  3. `Dense(128, activation='relu')`: Feature extraction layer.
  4. `Dropout(0.5)`: High regularization to prevent overfitting on scarce historical data.
  5. `Dense(3, activation='softmax')`: Output layer mapping to Brahmi, Devanagari, and Tamil.

### 3.2 Training Strategy
- **Stage 1 (Feature Extraction):** Base model completely frozen. Trained for 20 epochs with Adam optimizer at Learning Rate `1e-4`.
- **Stage 2 (Fine-Tuning):** The top 30 layers of EfficientNetB0 are unfrozen. Trained for 10 epochs with a lowered Learning Rate of `1e-5` to gently adjust the deep weights to inscription textures.

### 3.3 The Data Pipeline & Data Augmentation
Because inscriptions are often degraded, the tf.data pipeline is critical:
- **Augmentations used:** `RandomRotation(0.1)`, `RandomZoom(0.1)`, `RandomContrast(0.1)`, `RandomFlip("horizontal")`.
- **Pre-Processing (The CLAHE Pass - CRITICAL):**
  We use Contrast Limited Adaptive Histogram Equalization (CLAHE) to enhance the structural edges of weathered scripts. 
  - `clipLimit=2.0`
  - `tileGridSize=(8, 8)`
  *Note:* CLAHE requires grayscale conversion, but EfficientNet requires 3 channels. Therefore, images are converted: `RGB -> Grayscale -> CLAHE -> Back to RGB`.

---

## 4. Backend Server Implementation (`app.py`)

The backend is built with **Flask** and serves a dual purpose: it acts as a static file server for the UI and exposes REST APIs for inference.

### 4.1 Server Startup & State Management
- **Lazy Loading Model:** The `script_model.keras` file is NOT loaded into memory when the server starts. It is loaded only upon the first request to `/api/predict`. This ensures the server starts instantly and prevents crashing if the model file is temporarily absent during UI edits.
- **Cross-Origin Resource Sharing (CORS):** fully enabled via `flask-cors`.

### 4.2 Exact Inference Pipeline (MUST Mirror Training)
The `preprocess_image()` function in `app.py` is the most fragile part of the system. **AIs MUST NOT alter this function without ensuring absolute parity with the `.ipynb` file.**
1. Reads `multipart/form-data` image bytes.
2. Uses Pillow (`PIL`) to convert to an RGB array.
3. Resizes to `224x224` using Lanczos resampling.
4. Applies OpenAI/CV2 CLAHE (Grayscale -> CLAHE -> RGB).
5. Normalizes values to float32 `[0.0, 1.0]`.
6. Expands dimensions to `(1, 224, 224, 3)` for batching.

### 4.3 API Endpoints
**1. `GET /api/health`**
- Purpose: Heartbeat for the frontend's "Model Online" indicator.
- Response Signature:
  ```json
  {
    "status": "ok",
    "model_loaded": true,
    "model_path": "model/script_model.keras",
    "classes": ["brahmi", "devanagari", "tamil"]
  }
  ```

**2. `POST /api/predict`**
- Purpose: Executes inference.
- Payload: `FormData` with a key of `image` containing the raw file blob.
- Response Signature:
  ```json
  {
    "predicted_class": "Tamil",
    "confidence": 96.34,
    "all_scores": {
      "brahmi": 1.25,
      "devanagari": 2.41,
      "tamil": 96.34
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
