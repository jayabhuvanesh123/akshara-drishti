import os
import urllib.request
import zipfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import tensorflow as tf

# =========================================================================
# 1. SETUP & CONFIG
# =========================================================================
IMG_SIZE = 96
FONTS_DIR = "fonts"
DATASET_DIR = "synthetic_dataset"
MODEL_PATH = "model/final_model.keras"

CLASSES = {
    "brahmi": {"url": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBrahmi/NotoSansBrahmi-Regular.ttf", "range": (0x11000, 0x1104D)},
    "devanagari": {"url": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf", "range": (0x0900, 0x097F)},
    "kannada": {"url": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansKannada/NotoSansKannada-Regular.ttf", "range": (0x0C80, 0x0CFF)},
    "malayalam": {"url": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansMalayalam/NotoSansMalayalam-Regular.ttf", "range": (0x0D00, 0x0D7F)},
    "tamil": {"url": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf", "range": (0x0B80, 0x0BFF)},
    "telugu": {"url": "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf", "range": (0x0C00, 0x0C7F)}
}

os.makedirs(FONTS_DIR, exist_ok=True)
os.makedirs(DATASET_DIR, exist_ok=True)

# =========================================================================
# 2. DOWNLOAD FONTS
# =========================================================================
print("Downloading Google Noto Fonts...")
for cls, info in CLASSES.items():
    font_path = os.path.join(FONTS_DIR, f"{cls}.ttf")
    if not os.path.exists(font_path):
        try:
            print(f"Downloading {cls} font...")
            urllib.request.urlretrieve(info["url"], font_path)
        except Exception as e:
            print(f"Failed to download {cls}: {e}")

# =========================================================================
# 3. GENERATE SYNTHETIC INSCRIPTION DATASET
# =========================================================================
print("Generating Synthetic Inscription Dataset...")
NUM_IMAGES_PER_CLASS = 200  # Kept small for fast local training

def generate_background():
    # Create a noisy stone-like background
    bg = np.random.randint(100, 200, (IMG_SIZE, IMG_SIZE, 3), dtype=np.uint8)
    bg = Image.fromarray(bg).filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 2.0)))
    return bg

for cls, info in CLASSES.items():
    cls_dir = os.path.join(DATASET_DIR, cls)
    os.makedirs(cls_dir, exist_ok=True)
    font_path = os.path.join(FONTS_DIR, f"{cls}.ttf")
    
    if not os.path.exists(font_path):
        continue
        
    font = ImageFont.truetype(font_path, size=random.randint(40, 60))
    start_hex, end_hex = info["range"]
    
    # Pre-select valid unicode chars
    valid_chars = [chr(i) for i in range(start_hex, end_hex+1) if chr(i).isprintable()]
    if not valid_chars:
        valid_chars = ["?"]
        
    for i in range(NUM_IMAGES_PER_CLASS):
        img = generate_background()
        draw = ImageDraw.Draw(img)
        
        # Pick 1-3 random characters to simulate an inscription patch
        text = "".join(random.choices(valid_chars, k=random.randint(1, 3)))
        
        # Random text color (dark gray/brown to simulate carving)
        text_color = (random.randint(20, 80), random.randint(20, 60), random.randint(20, 50))
        
        # Draw text at random slightly offset position
        w = random.randint(10, 30)
        h = random.randint(10, 30)
        draw.text((w, h), text, font=font, fill=text_color)
        
        # Add blur to simulate weathering
        img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0, 1.0)))
        
        img.save(os.path.join(cls_dir, f"{cls}_{i}.jpg"))

# =========================================================================
# 4. TRAIN MOBILENETv2 MODEL
# =========================================================================
print("Setting up TensorFlow Dataset...")
batch_size = 32

train_ds = tf.keras.preprocessing.image_dataset_from_directory(
    DATASET_DIR, validation_split=0.2, subset="training", seed=42,
    image_size=(IMG_SIZE, IMG_SIZE), batch_size=batch_size, label_mode='categorical'
)
val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    DATASET_DIR, validation_split=0.2, subset="validation", seed=42,
    image_size=(IMG_SIZE, IMG_SIZE), batch_size=batch_size, label_mode='categorical'
)

# Normalize [0, 1]
train_ds = train_ds.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y))
val_ds = val_ds.map(lambda x, y: (tf.cast(x, tf.float32) / 255.0, y))

print("Building MobileNetV2 Architecture...")
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights='imagenet'
)
base_model.trainable = False

inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x = base_model(inputs, training=False)
x = tf.keras.layers.GlobalAveragePooling2D()(x)
x = tf.keras.layers.Dense(128, activation='relu')(x)
x = tf.keras.layers.Dropout(0.3)(x)
outputs = tf.keras.layers.Dense(6, activation='softmax')(x)

model = tf.keras.Model(inputs, outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss=tf.keras.losses.CategoricalCrossentropy(),
    metrics=['accuracy']
)

print("Training Model for 5 Epochs (Fast Mode)...")
model.fit(train_ds, validation_data=val_ds, epochs=5)

# Unfreeze top layers for fine-tuning
print("Fine-Tuning System...")
base_model.trainable = True
for layer in base_model.layers[:-20]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-4),
    loss=tf.keras.losses.CategoricalCrossentropy(),
    metrics=['accuracy']
)

model.fit(train_ds, validation_data=val_ds, epochs=3)

# =========================================================================
# 5. SAVE MODEL
# =========================================================================
os.makedirs("model", exist_ok=True)
model.save(MODEL_PATH)
print(f"✅ Training Complete! Model rigorously saved to: {MODEL_PATH}")
