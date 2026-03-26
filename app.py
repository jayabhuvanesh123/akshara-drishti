"""
Akshara-Drishti — Flask Backend API
Loads the trained .keras model and serves predictions via REST API.
"""

import os
import io
import numpy as np
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

# ── Configuration ────────────────────────────────────────────────────────────
IMG_SIZE = 224
CLASS_NAMES = ["brahmi", "devanagari", "tamil"]   # alphabetical — matches tf dataset order

# Path to your trained model file.
# Place "script_model.keras" (or "best_model.keras") inside a "model/" folder
# next to this file,  OR  set the MODEL_PATH environment variable.
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "model", "script_model.keras")
)

# ── App setup ────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)  # allow requests from the frontend

# ── Load model (lazy — so the server still starts even without a model) ──────
model = None

def load_model():
    """Load the Keras model from disk (called once on first prediction)."""
    global model
    try:
        import tensorflow as tf
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"[OK] Model loaded from: {MODEL_PATH}")
    except Exception as e:
        print(f"[WARNING] Could not load model: {e}")
        model = None


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Replicate the training pipeline:
      1. Open & convert to RGB
      2. Resize to IMG_SIZE×IMG_SIZE
      3. Apply CLAHE contrast enhancement
      4. Normalise to [0, 1]
    """
    import cv2

    # Open with Pillow, convert to RGB numpy array
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
    arr = np.array(img, dtype=np.uint8)

    # CLAHE (matches training notebook Cell 8)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    arr = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)

    # Normalise to float32 [0, 1]
    arr = arr.astype(np.float32) / 255.0

    # Add batch dimension → (1, 224, 224, 3)
    return np.expand_dims(arr, axis=0)


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
    global model

    # Validate file
    if "image" not in request.files:
        return jsonify({"error": "No image file provided. Send a file with key 'image'."}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    # Lazy-load model on first request
    if model is None:
        load_model()

    if model is None:
        return jsonify({
            "error": "Model not available. Place 'script_model.keras' in the model/ directory."
        }), 503

    try:
        image_bytes = file.read()
        input_tensor = preprocess_image(image_bytes)

        # Run inference
        predictions = model.predict(input_tensor, verbose=0)  # shape (1, 3)
        probs = predictions[0]  # shape (3,)

        # Build per-class scores
        all_scores = {}
        for i, name in enumerate(CLASS_NAMES):
            all_scores[name] = round(float(probs[i]) * 100, 2)

        predicted_idx = int(np.argmax(probs))
        predicted_class = CLASS_NAMES[predicted_idx].capitalize()
        confidence = round(float(probs[predicted_idx]) * 100, 2)

        return jsonify({
            "predicted_class": predicted_class,
            "confidence": confidence,
            "all_scores": all_scores,
        })

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health-check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "classes": CLASS_NAMES,
    })


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=5000, debug=True)
