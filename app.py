"""
Akshara-Drishti — Flask Backend API (Production-Ready)
Loads the trained .keras model and serves predictions via REST API.
"""

import os
import io
import logging
import numpy as np
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
IMG_SIZE = 224
CLASS_NAMES = ["brahmi", "devanagari", "tamil"]  # alphabetical — matches tf dataset order
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

# Path to the trained model file.
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "model", "final_model.keras"),
)

# ── App Setup ────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)  # allow requests from any origin

# ── Global Model Cache (loaded once, reused for every request) ───────────────
_model = None


def _load_model():
    """Load the Keras model from disk. Called once on first prediction (lazy)."""
    global _model
    if _model is not None:
        return  # already loaded

    logger.info("Loading model from %s …", MODEL_PATH)
    try:
        import tensorflow as tf

        _model = tf.keras.models.load_model(MODEL_PATH)
        logger.info("Model loaded successfully.")
    except Exception as exc:
        logger.error("Could not load model: %s", exc)
        _model = None


def _get_model():
    """Return the cached model, loading it on first call."""
    if _model is None:
        _load_model()
    return _model


# ── Image Preprocessing (strict pipeline) ───────────────────────────────────
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Replicate the training pipeline:
      1. Open & convert to RGB
      2. Resize to IMG_SIZE × IMG_SIZE
      3. Convert to grayscale
      4. Apply CLAHE contrast enhancement
      5. Apply Canny edge detection
      6. Combine CLAHE + edges via weighted sum
      7. Convert back to RGB
      8. Normalise to float32 [0, 1]
      9. Expand to batch dimension
    """
    import cv2

    # 1 — Open with Pillow, resize, convert to numpy
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    arr = np.array(img, dtype=np.uint8)

    # 2 — Grayscale
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)

    # 3 — CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # 4 — Canny edge detection
    edges = cv2.Canny(enhanced, threshold1=50, threshold2=150)

    # 5 — Combine CLAHE + edges (weighted sum)
    combined = cv2.addWeighted(enhanced, 0.7, edges, 0.3, 0)

    # 6 — Back to 3-channel RGB
    arr = cv2.cvtColor(combined, cv2.COLOR_GRAY2RGB)

    # 7 — Normalise to float32 [0, 1]
    arr = arr.astype(np.float32) / 255.0

    # 8 — Batch dimension → (1, 224, 224, 3)
    return np.expand_dims(arr, axis=0)


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
    """
    Accepts a multipart/form-data POST with field 'image'.
    Returns JSON:
      {
        "predicted_class": "Tamil",
        "confidence": 96.3,
        "all_scores": {"brahmi": 1.2, "devanagari": 2.5, "tamil": 96.3}
      }
    """
    logger.info("Prediction request received.")

    # ── Validate file presence ───────────────────────────────────────────────
    if "image" not in request.files:
        logger.warning("No image file in request.")
        return jsonify({"error": "No image file provided. Send a file with key 'image'."}), 400

    file = request.files["image"]

    if file.filename == "":
        logger.warning("Empty filename received.")
        return jsonify({"error": "Empty filename."}), 400

    if not _allowed_file(file.filename):
        logger.warning("Disallowed file type: %s", file.filename)
        return jsonify({"error": "Only PNG, JPG, JPEG, and WebP images are allowed."}), 400

    # ── Read file and check size ─────────────────────────────────────────────
    image_bytes = file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        logger.warning("File too large: %d bytes", len(image_bytes))
        return jsonify({"error": "Image must be under 10 MB."}), 400

    # ── Ensure model is loaded ───────────────────────────────────────────────
    model = _get_model()
    if model is None:
        logger.error("Model not available for prediction.")
        return (
            jsonify({"error": "Model not available. Place 'final_model.keras' in the model/ directory."}),
            503,
        )

    # ── Inference ────────────────────────────────────────────────────────────
    try:
        input_tensor = preprocess_image(image_bytes)

        predictions = model.predict(input_tensor, verbose=0)  # shape (1, num_classes)

        # Validate output shape
        if predictions is None or predictions.ndim < 2 or predictions.shape[1] != len(CLASS_NAMES):
            logger.error("Unexpected prediction shape: %s", getattr(predictions, "shape", None))
            return jsonify({"error": "Model produced an unexpected output."}), 500

        probs = predictions[0]  # shape (num_classes,)

        # Build per-class scores (percentages, 2 dp)
        all_scores = {}
        for i, name in enumerate(CLASS_NAMES):
            all_scores[name] = round(float(probs[i]) * 100, 2)

        predicted_idx = int(np.argmax(probs))
        predicted_class = CLASS_NAMES[predicted_idx].capitalize()
        confidence = round(float(probs[predicted_idx]) * 100, 2)

        logger.info("Prediction: %s (%.2f%%)", predicted_class, confidence)

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
    """Health-check endpoint."""
    model = _get_model()
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "classes": CLASS_NAMES,
    })


# ── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    _load_model()
    port = int(os.environ.get("PORT", 5000))
    logger.info("Starting Akshara-Drishti API on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=False)
