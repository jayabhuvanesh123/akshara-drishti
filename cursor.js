/* ===== Akshara-Drishti — Custom Cursor System ===== */

(function () {
  // Skip on touch / mobile devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
  if (window.matchMedia('(max-width: 768px)').matches) return;

  // Create cursor elements
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(ring);

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);

  // Position tracking
  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let dotX = -100, dotY = -100;

  // Easing factors (lower = more delay)
  const ringSpeed = 0.15;
  const dotSpeed = 0.08;

  // Track mouse position
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Animation loop using requestAnimationFrame
  function animate() {
    // Lerp (linear interpolation) for smooth following
    ringX += (mouseX - ringX) * ringSpeed;
    ringY += (mouseY - ringY) * ringSpeed;
    dotX += (mouseX - dotX) * dotSpeed;
    dotY += (mouseY - dotY) * dotSpeed;

    ring.style.left = ringX + 'px';
    ring.style.top = ringY + 'px';
    dot.style.left = dotX + 'px';
    dot.style.top = dotY + 'px';

    requestAnimationFrame(animate);
  }

  animate();

  // Hover detection on interactive elements
  const hoverTargets = 'a, button, .card, .feature-card, .tech-block, .team-card, .step-card, .btn-primary, .btn-secondary, .upload-zone, .hamburger, .nav-logo, input, textarea';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.add('hover');
      dot.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) {
      ring.classList.remove('hover');
      dot.classList.remove('hover');
    }
  });

  // Click effect
  document.addEventListener('mousedown', () => {
    ring.classList.add('click');
  });

  document.addEventListener('mouseup', () => {
    ring.classList.remove('click');
  });

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    ring.style.opacity = '0';
    dot.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    ring.style.opacity = '';
    dot.style.opacity = '';
  });
})();
