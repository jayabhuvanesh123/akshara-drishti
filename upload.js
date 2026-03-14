/* ===== Akshara-Drishti — Upload Page Script ===== */

document.addEventListener('DOMContentLoaded', () => {

  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const previewContainer = document.getElementById('uploadPreview');
  const previewImage = document.getElementById('previewImage');
  const detectBtn = document.getElementById('detectBtn');
  const loader = document.getElementById('loader');
  const resultCard = document.getElementById('resultCard');
  const resultScript = document.getElementById('resultScript');
  const resultConfidence = document.getElementById('resultConfidence');

  let selectedFile = null;

  /* --- Browse Button --- */
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  /* --- File Input Change --- */
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  /* --- Drag and Drop --- */
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

  /* --- Handle File --- */
  function handleFile(file) {
    if (!file.type.startsWith('image/')) return;
    selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = 'block';
      uploadZone.style.display = 'none';
      detectBtn.disabled = false;

      // Hide previous results
      resultCard.classList.remove('visible');
      gsap.set(resultCard, { opacity: 0, y: 16 });
    };
    reader.readAsDataURL(file);
  }

  /* --- Detect Script --- */
  detectBtn.addEventListener('click', () => {
    if (!selectedFile) return;

    detectBtn.disabled = true;
    loader.classList.add('active');
    resultCard.classList.remove('visible');

    // Simulate AI processing delay
    setTimeout(() => {
      const scripts = ['Tamil', 'Brahmi', 'Grantha', 'Devanagari'];
      const predicted = scripts[Math.floor(Math.random() * scripts.length)];
      const confidence = (85 + Math.random() * 14).toFixed(1);

      resultScript.textContent = predicted;
      resultConfidence.textContent = confidence + '%';

      loader.classList.remove('active');
      resultCard.classList.add('visible');

      // GSAP reveal animation
      gsap.fromTo(resultCard,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );

      detectBtn.disabled = false;
    }, 1500);
  });

});
