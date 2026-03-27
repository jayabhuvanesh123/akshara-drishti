"""
Akshara-Drishti — Flask Backend API (Production-Ready)
Loads the trained .keras model and serves predictions via REST API.
"""

import os
import io
import logging
import numpy as np
import cv2
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

# ── Logging Setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(asctime)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("AksharaDrishti")

# ── Configuration ────────────────────────────────────────────────────────────
IMG_SIZE = 96
CLASS_NAMES = ["brahmi", "devanagari", "kannada", "malayalam", "tamil", "telugu"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "model", "final_model.keras"),
)

# ── App Setup ────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)  # allow requests from any origin

_model = None

def _load_model():
    global _model
    if _model is not None:
        return
    logger.info("Loading model from %s …", MODEL_PATH)
    try:
        import tensorflow as tf
        _model = tf.keras.models.load_model(MODEL_PATH)
        logger.info("Model loaded successfully.")
    except Exception as exc:
        logger.error("Could not load model: %s", exc)
        _model = None

def _get_model():
    if _model is None:
        _load_model()
    return _model

# ── Image Preprocessing & Dual Pipeline Math ───────────────────────────────
def calc_entropy(probs):
    """Calculate Shannon entropy for confidence score."""
    probs = np.clip(probs, 1e-9, 1.0)
    return -np.sum(probs * np.log(probs))

def prepare_tensor(img_arr, target_size=(96, 96)):
    """Resize & normalize for model input."""
    img = Image.fromarray(img_arr).resize(target_size, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

def apply_clahe_sharpen(img_arr):
    """CLAHE + Edge Sharpening for Inscription Path."""
    gray = cv2.cvtColor(img_arr, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_clahe = clahe.apply(gray)
    
    # Kernel for edge sharpening 
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    sharpened = cv2.filter2D(gray_clahe, -1, kernel)
    
    return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2RGB)

# ── Helpers ──────────────────────────────────────────────────────────────────
def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")

@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(".", path)

@app.route("/api/predict", methods=["POST"])
def predict():
    logger.info("Dual Pipeline Prediction request received.")

    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    file = request.files["image"]
    if file.filename == "" or not _allowed_file(file.filename):
        return jsonify({"error": "Invalid file. PNG, JPG, JPEG, and WebP only."}), 400

    image_bytes = file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        return jsonify({"error": "Image must be under 10 MB."}), 400

    model = _get_model()
    if model is None:
        return jsonify({"error": "Model not available."}), 503

    try:
        # Load base image into NumPy RGB
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        base_arr = np.array(pil_img, dtype=np.uint8)

        input_shape = model.input_shape
        target_size = (input_shape[1], input_shape[2]) if input_shape and len(input_shape) >= 3 else (IMG_SIZE, IMG_SIZE)
        
        best_overall_probs = None
        best_overall_entropy = float('inf')
        
        # ==========================================
        # PIPELINE 1: MODERN / PAPER PATH (Rotations)
        # ==========================================
        rotations = [0, 90, 180, 270]
        for angle in rotations:
            if angle == 0:
                rot_arr = base_arr
            else:
                rot_pil = pil_img.rotate(angle, expand=True)
                rot_arr = np.array(rot_pil, dtype=np.uint8)
            
            tensor = prepare_tensor(rot_arr, target_size)
            probs = model.predict(tensor, verbose=0)[0]
            entropy = calc_entropy(probs)
            
            if entropy < best_overall_entropy:
                best_overall_entropy = entropy
                best_overall_probs = probs

        # ==========================================
        # PIPELINE 2: INSCRIPTION PATH (CLAHE + Sharpening)
        # ==========================================
        # Real-world inscriptions benefit from CLAHE & sharpening
        enhanced_arr = apply_clahe_sharpen(base_arr)
        
        # Simplified Patch Extraction Approximation (evaluate whole enhanced image)
        tensor_enhanced = prepare_tensor(enhanced_arr, target_size)
        probs_enhanced = model.predict(tensor_enhanced, verbose=0)[0]
        entropy_enhanced = calc_entropy(probs_enhanced)
        
        # Cubic Hard Voting simulation (conf^3 weighting)
        probs_cubic = np.power(probs_enhanced, 3)
        probs_enhanced = probs_cubic / np.sum(probs_cubic)  # Normalize
        
        # Tiebreaker adjustment: penalize high-entropy Kannada predictions if Tamil is close
        if probs_enhanced[2] > 0.4 and probs_enhanced[4] > 0.3:  # Kannada=2, Tamil=4
            probs_enhanced[4] += 0.1 # boost Tamil slightly due to known Grantha similarity
            probs_enhanced = probs_enhanced / np.sum(probs_enhanced)
            entropy_enhanced = calc_entropy(probs_enhanced)

        if entropy_enhanced < best_overall_entropy:
            best_overall_entropy = entropy_enhanced
            best_overall_probs = probs_enhanced
            logger.info("Inscription Path yielded higher confidence!")
        else:
            logger.info("Modern/Paper Path yielded higher confidence!")

        # ==========================================
        # FORMAT RESULTS
        # ==========================================
        probs = best_overall_probs
        num_classes = len(probs)
        active_classes = list(CLASS_NAMES)
        
        if num_classes != len(active_classes):
            if num_classes > len(active_classes):
                missing = num_classes - len(active_classes)
                active_classes.extend([f"script_{i+1}" for i in range(missing)])
            else:
                active_classes = active_classes[:num_classes]

        all_scores = {}
        for i, name in enumerate(active_classes):
            all_scores[name] = round(float(probs[i]) * 100, 2)

        predicted_idx = int(np.argmax(probs))
        predicted_class = active_classes[predicted_idx].capitalize()
        confidence = round(float(probs[predicted_idx]) * 100, 2)

        logger.info("Final Prediction: %s (%.2f%%) [Entropy: %.4f]", predicted_class, confidence, best_overall_entropy)

        return jsonify({
            "predicted_class": predicted_class,
            "confidence": confidence,
            "all_scores": all_scores,
        })

    except Exception as exc:
        logger.error("Prediction failed: %s", exc, exc_info=True)
        return jsonify({"error": f"Prediction failed: {str(exc)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    model = _get_model()
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "classes": CLASS_NAMES,
    })


if __name__ == "__main__":
    _load_model()
    port = int(os.environ.get("PORT", 5000))
    logger.info("Starting Akshara-Drishti API on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
