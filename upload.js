/* ===== Akshara-Drishti — Upload Script (Production-Ready) ===== */

document.addEventListener('DOMContentLoaded', () => {

  // ── API Configuration ─────────────────────────────────────────────────────
  // Set API_BASE to your deployed backend URL.
  // Use '' (empty string) when Flask serves both static files and API (same origin).
  const API_BASE = '';
  const PREDICT_ENDPOINT = `${API_BASE}/api/predict`;
  const HEALTH_ENDPOINT  = `${API_BASE}/api/health`;

  // ── Constants ──────────────────────────────────────────────────────────────
  const MAX_FILE_SIZE   = 10 * 1024 * 1024; // 10 MB
  const ALLOWED_TYPES   = ['image/png', 'image/jpeg', 'image/jpg'];
  const REQUEST_TIMEOUT = 15000; // 15 seconds

  // ── Processing Flag (prevents duplicate API calls) ─────────────────────────
  let isProcessing = false;

  // ── DOM References ────────────────────────────────────────────────────────
  const uploadZone         = document.getElementById('uploadZone');
  const fileInput          = document.getElementById('fileInput');
  const browseBtn          = document.getElementById('browseBtn');
  const previewContainer   = document.getElementById('uploadPreview');
  const previewImage       = document.getElementById('previewImage');
  const detectBtn          = document.getElementById('detectBtn');
  const loader             = document.getElementById('loader');
  const resultCard         = document.getElementById('resultCard');
  const resultScript       = document.getElementById('resultScript');
  const resultConfidence   = document.getElementById('resultConfidence');
  const confidenceBar      = document.getElementById('confidenceBar');
  const errorToast         = document.getElementById('errorToast');
  const errorMessage       = document.getElementById('errorMessage');
  const allScoresContainer = document.getElementById('allScoresContainer');
  const statusIndicator    = document.getElementById('statusIndicator');
  const statusText         = document.getElementById('statusText');
  const resetBtn           = document.getElementById('resetBtn');

  let selectedFile = null;

  // ── Health Check ──────────────────────────────────────────────────────────
  async function checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(HEALTH_ENDPOINT, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Health check returned ${res.status}`);

      const data = await res.json();
      console.log('[Akshara-Drishti] Health check:', data);

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
    } catch (err) {
      console.warn('[Akshara-Drishti] Health check failed:', err.message);
      if (statusIndicator && statusText) {
        statusIndicator.classList.add('offline');
        statusIndicator.classList.remove('online');
        statusText.textContent = 'API Offline';
      }
    }
  }

  checkHealth();
  setInterval(checkHealth, 30000);

  // ── Error Toast ───────────────────────────────────────────────────────────
  function showError(msg) {
    console.error('[Akshara-Drishti] Error:', msg);
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
    }
  }

  // ── Image Validation (Strict) ─────────────────────────────────────────────
  function validateFile(file) {
    if (!file) {
      showError('No file selected.');
      return false;
    }

    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file.');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      showError('Only PNG, JPG, and JPEG images are allowed.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showError('Image must be under 10MB.');
      return false;
    }

    return true;
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
    if (!validateFile(file)) return;

    selectedFile = file;
    console.log(`[Akshara-Drishti] File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB, ${file.type})`);

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = 'block';
      uploadZone.style.display = 'none';
      detectBtn.disabled = false;

      // Reset previous results
      resetResults();

      // Show reset button
      if (resetBtn) resetBtn.style.display = 'inline-flex';

      // Animate preview in
      gsap.fromTo(previewContainer,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      );
    };
    reader.onerror = () => {
      showError('Failed to read the selected file. Please try again.');
    };
    reader.readAsDataURL(file);
  }

  // ── Reset Results ─────────────────────────────────────────────────────────
  function resetResults() {
    resultCard.classList.remove('visible');
    if (confidenceBar) confidenceBar.style.width = '0%';
    if (allScoresContainer) allScoresContainer.innerHTML = '';
    if (resultScript) resultScript.textContent = '—';
    if (resultConfidence) resultConfidence.textContent = '—';
    gsap.set(resultCard, { opacity: 0, y: 20 });
  }

  // ── Reset Button ──────────────────────────────────────────────────────────
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (isProcessing) return; // Don't reset while processing

      selectedFile = null;
      fileInput.value = '';
      previewContainer.style.display = 'none';
      uploadZone.style.display = '';
      detectBtn.disabled = true;
      resetResults();
      resetBtn.style.display = 'none';
    });
  }

  // ── Start / Stop Loading State ────────────────────────────────────────────
  function startLoading() {
    isProcessing = true;
    detectBtn.disabled = true;
    detectBtn.textContent = 'Analyzing…';
    loader.classList.add('active');
    resetResults();
  }

  function stopLoading() {
    isProcessing = false;
    loader.classList.remove('active');
    detectBtn.disabled = false;
    detectBtn.innerHTML = `
      <svg class="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      Detect Script
    `;
  }

  // ── Validate API Response ─────────────────────────────────────────────────
  function validateResponse(data) {
    if (!data || typeof data !== 'object') {
      return 'Invalid response from server.';
    }
    if (!data.predicted_class || typeof data.predicted_class !== 'string') {
      return 'Response missing predicted class.';
    }
    if (typeof data.confidence !== 'number' || isNaN(data.confidence)) {
      return 'Response missing valid confidence score.';
    }
    return null; // valid
  }

  // ── Categorise Errors ─────────────────────────────────────────────────────
  function categoriseError(err, response) {
    // Timeout / abort
    if (err.name === 'AbortError') {
      return 'Request timed out. Please try again later.';
    }

    // Network / unreachable
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      return 'Server unreachable. Please try again later.';
    }

    // HTTP status-based categorisation
    if (response) {
      switch (response.status) {
        case 400: return 'Invalid request. Please check your image and try again.';
        case 503: return 'Model is not ready. Try again shortly.';
        case 500: return 'Something went wrong on the server.';
        default:  return `Server error (${response.status}). Please try again.`;
      }
    }

    return err.message || 'Something went wrong. Please try again.';
  }

  // ── Detect Script (API call) ──────────────────────────────────────────────
  detectBtn.addEventListener('click', async () => {
    // Guard: no file selected
    if (!selectedFile) return;

    // Guard: already processing (prevents duplicate calls)
    if (isProcessing) {
      console.warn('[Akshara-Drishti] Request already in progress, ignoring click.');
      return;
    }

    // Re-validate file before sending
    if (!validateFile(selectedFile)) return;

    startLoading();
    console.log('[Akshara-Drishti] Sending prediction request to API...');

    const formData = new FormData();
    formData.append('image', selectedFile);

    // Timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    let response = null;

    try {
      response = await fetch(PREDICT_ENDPOINT, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('[Akshara-Drishti] Response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      // Validate response shape
      const validationError = validateResponse(data);
      if (validationError) {
        throw new Error(validationError);
      }

      // ── Display results ──────────────────────────────────────────────────
      const confidence = parseFloat(data.confidence.toFixed(2));

      resultScript.textContent = data.predicted_class;
      resultConfidence.textContent = confidence + '%';

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
          width: confidence + '%',
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
          const formattedScore = parseFloat(Number(score).toFixed(2));
          const row = document.createElement('div');
          row.className = 'score-row';

          const isPredicted = className.toLowerCase() === data.predicted_class.toLowerCase();

          row.innerHTML = `
            <div class="score-row-header">
              <span class="score-class-name ${isPredicted ? 'predicted' : ''}">${capitalize(className)}</span>
              <span class="score-value ${isPredicted ? 'predicted' : ''}">${formattedScore}%</span>
            </div>
            <div class="score-bar-track">
              <div class="score-bar-fill ${isPredicted ? 'primary' : ''}" style="width: 0%"></div>
            </div>
          `;
          allScoresContainer.appendChild(row);

          // Animate each bar
          const fill = row.querySelector('.score-bar-fill');
          tl.to(fill, {
            width: formattedScore + '%',
            duration: 0.7,
            ease: 'power2.out',
          }, `-=${idx === 0 ? 0.2 : 0.5}`);
        });
      }

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[Akshara-Drishti] Prediction error:', err);
      const friendlyMsg = categoriseError(err, response);
      showError(friendlyMsg);

    } finally {
      stopLoading();
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

});
