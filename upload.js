/* ===== Akshara-Drishti — Upload Script (Integrated with Flask Backend) ===== */

document.addEventListener('DOMContentLoaded', () => {

  // ── API Configuration ─────────────────────────────────────────────────────
  // When running via Flask (python app.py), relative URLs work automatically.
  // Change this if you host the API elsewhere.
  const API_BASE = '';  // '' = same origin (Flask serves both static + API)
  const PREDICT_ENDPOINT = `${API_BASE}/api/predict`;
  const HEALTH_ENDPOINT  = `${API_BASE}/api/health`;

  // ── DOM References ────────────────────────────────────────────────────────
  const uploadZone       = document.getElementById('uploadZone');
  const fileInput        = document.getElementById('fileInput');
  const browseBtn        = document.getElementById('browseBtn');
  const previewContainer = document.getElementById('uploadPreview');
  const previewImage     = document.getElementById('previewImage');
  const detectBtn        = document.getElementById('detectBtn');
  const loader           = document.getElementById('loader');
  const resultCard       = document.getElementById('resultCard');
  const resultScript     = document.getElementById('resultScript');
  const resultConfidence = document.getElementById('resultConfidence');
  const confidenceBar    = document.getElementById('confidenceBar');
  const errorToast       = document.getElementById('errorToast');
  const errorMessage     = document.getElementById('errorMessage');
  const allScoresContainer = document.getElementById('allScoresContainer');
  const statusIndicator  = document.getElementById('statusIndicator');
  const statusText       = document.getElementById('statusText');
  const resetBtn         = document.getElementById('resetBtn');

  let selectedFile = null;

  // ── Health Check ──────────────────────────────────────────────────────────
  async function checkHealth() {
    try {
      const res = await fetch(HEALTH_ENDPOINT);
      const data = await res.json();
      if (statusIndicator && statusText) {
        if (data.model_loaded) {
          statusIndicator.classList.add('online');
          statusIndicator.classList.remove('offline');
          statusText.textContent = 'Model Online';
        } else {
          statusIndicator.classList.add('offline');
          statusIndicator.classList.remove('online');
          statusText.textContent = 'Model Not Loaded';
        }
      }
    } catch {
      if (statusIndicator && statusText) {
        statusIndicator.classList.add('offline');
        statusIndicator.classList.remove('online');
        statusText.textContent = 'API Offline';
      }
    }
  }

  checkHealth();
  // Re-check every 30 seconds
  setInterval(checkHealth, 30000);

  // ── Error Toast ───────────────────────────────────────────────────────────
  function showError(msg) {
    if (errorToast && errorMessage) {
      errorMessage.textContent = msg;
      errorToast.classList.add('visible');
      gsap.fromTo(errorToast,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
      setTimeout(() => {
        gsap.to(errorToast, {
          opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
          onComplete: () => errorToast.classList.remove('visible')
        });
      }, 5000);
    } else {
      console.error('Akshara-Drishti Error:', msg);
    }
  }

  // ── Browse / Click Handlers ───────────────────────────────────────────────
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  // ── File Input Change ─────────────────────────────────────────────────────
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  // ── Handle File ───────────────────────────────────────────────────────────
  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file (PNG, JPG, JPEG).');
      return;
    }

    // Max 10 MB
    if (file.size > 10 * 1024 * 1024) {
      showError('Image too large. Maximum size is 10 MB.');
      return;
    }

    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = 'block';
      uploadZone.style.display = 'none';
      detectBtn.disabled = false;

      // Hide previous results
      resultCard.classList.remove('visible');
      if (confidenceBar) confidenceBar.style.width = '0%';
      if (allScoresContainer) allScoresContainer.innerHTML = '';
      gsap.set(resultCard, { opacity: 0, y: 20 });

      // Show reset button
      if (resetBtn) resetBtn.style.display = 'inline-flex';

      // Animate preview in
      gsap.fromTo(previewContainer,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    };
    reader.readAsDataURL(file);
  }

  // ── Reset Button ──────────────────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      previewContainer.style.display = 'none';
      uploadZone.style.display = '';
      detectBtn.disabled = true;
      resultCard.classList.remove('visible');
      if (confidenceBar) confidenceBar.style.width = '0%';
      if (allScoresContainer) allScoresContainer.innerHTML = '';
      resetBtn.style.display = 'none';
    });
  }

  // ── Detect Script (API call) ──────────────────────────────────────────────
  detectBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    detectBtn.disabled = true;
    detectBtn.textContent = 'Analyzing…';
    loader.classList.add('active');
    resultCard.classList.remove('visible');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch(PREDICT_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      // ── Display results ────────────────────────────────────────────────
      resultScript.textContent = data.predicted_class;
      resultConfidence.textContent = data.confidence + '%';

      loader.classList.remove('active');
      resultCard.classList.add('visible');

      // Staggered GSAP reveal
      const tl = gsap.timeline();

      tl.fromTo(resultCard,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      );

      // Animate main confidence bar
      if (confidenceBar) {
        tl.to(confidenceBar, {
          width: data.confidence + '%',
          duration: 1,
          ease: 'power2.out',
        }, '-=0.3');
      }

      // ── Render all-class breakdown bars ─────────────────────────────────
      if (allScoresContainer && data.all_scores) {
        allScoresContainer.innerHTML = '';

        // Sort by score descending
        const sorted = Object.entries(data.all_scores)
          .sort((a, b) => b[1] - a[1]);

        sorted.forEach(([className, score], idx) => {
          const row = document.createElement('div');
          row.className = 'score-row';

          const isPredicted = className.toLowerCase() === data.predicted_class.toLowerCase();

          row.innerHTML = `
            <div class="score-row-header">
              <span class="score-class-name ${isPredicted ? 'predicted' : ''}">${capitalize(className)}</span>
              <span class="score-value ${isPredicted ? 'predicted' : ''}">${score}%</span>
            </div>
            <div class="score-bar-track">
              <div class="score-bar-fill ${isPredicted ? 'primary' : ''}" style="width: 0%"></div>
            </div>
          `;
          allScoresContainer.appendChild(row);

          // Animate each bar
          const fill = row.querySelector('.score-bar-fill');
          tl.to(fill, {
            width: score + '%',
            duration: 0.7,
            ease: 'power2.out',
          }, `-=${idx === 0 ? 0.2 : 0.5}`);
        });
      }

    } catch (err) {
      loader.classList.remove('active');
      showError(err.message || 'Something went wrong. Check that the API server is running.');
    } finally {
      detectBtn.disabled = false;
      detectBtn.textContent = 'Detect Script';
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

});
