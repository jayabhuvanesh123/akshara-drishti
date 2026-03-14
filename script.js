/* ============================================
<<<<<<< HEAD
   AKSHARA-DRISHTI — GSAP Animations & Logic
=======
   AKSHARA-DRISHTI — Interactions & Animations
>>>>>>> 0a62233f757146de3acacd04416c361d287f2a65
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

<<<<<<< HEAD
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // =====================
  // SHARED: Navbar
  // =====================
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // =====================
  // SHARED: Hamburger Menu
  // =====================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // =====================
  // SHARED: Smooth Scroll
  // =====================
=======
  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  const handleScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // --- Mobile Hamburger Menu ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });

  // --- Smooth Scroll for Anchor Links ---
>>>>>>> 0a62233f757146de3acacd04416c361d287f2a65
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      e.preventDefault();
      const target = document.querySelector(targetId);
      if (target) {
<<<<<<< HEAD
        const offset = navbar ? navbar.offsetHeight : 0;
        const pos = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: pos, behavior: 'smooth' });
=======
        const navHeight = navbar.offsetHeight;
        const targetPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
>>>>>>> 0a62233f757146de3acacd04416c361d287f2a65
      }
    });
  });

<<<<<<< HEAD
  // =====================
  // GSAP: Hero Animations (index.html)
  // =====================
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTl
      .fromTo('#heroTitle',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, delay: 0.3 }
      )
      .fromTo('#heroSubtitle',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.4'
      )
      .fromTo('#heroDesc',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.3'
      )
      .fromTo('#heroButtons',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.2'
      );
  }

  // =====================
  // GSAP: Upload Page Animations
  // =====================
  const uploadTitle = document.getElementById('uploadTitle');
  if (uploadTitle) {
    const uploadTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    uploadTl
      .fromTo('#uploadTitle',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, delay: 0.2 }
      )
      .fromTo('#uploadDesc',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.3'
      )
      .fromTo('#uploadZone',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.2'
      );
  }

  // =====================
  // GSAP: Scroll Reveal (all pages)
  // =====================
  const scrollReveals = document.querySelectorAll('.gsap-reveal:not(#heroTitle):not(#heroSubtitle):not(#heroDesc):not(#heroButtons):not(#uploadTitle):not(#uploadDesc):not(#uploadZone)');

  scrollReveals.forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });

  // =====================
  // SHARED: Contact Form
  // =====================
=======
  // --- Intersection Observer: Reveal on Scroll ---
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // --- Active Nav Link Highlighting ---
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');

  const highlightNav = () => {
    const scrollPos = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navItems.forEach(link => {
          link.style.color = '';
          link.style.textShadow = '';
          if (link.getAttribute('href') === `#${id}`) {
            link.style.color = '#a3ff4f';
            link.style.textShadow = '0 0 12px rgba(163, 255, 79, 0.4)';
          }
        });
      }
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });

  // --- Contact Form Handler ---
>>>>>>> 0a62233f757146de3acacd04416c361d287f2a65
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn-submit');
<<<<<<< HEAD
      const original = btn.textContent;
      btn.textContent = 'Message Sent!';
      btn.style.background = '#22c55e';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = original;
=======
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
      btn.style.background = '#22c55e';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = originalHTML;
>>>>>>> 0a62233f757146de3acacd04416c361d287f2a65
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 3000);
    });
  }

<<<<<<< HEAD
  // =====================
  // UPLOAD PAGE LOGIC
  // =====================
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const previewArea = document.getElementById('previewArea');
  const previewImage = document.getElementById('previewImage');
  const previewName = document.getElementById('previewName');
  const detectBtn = document.getElementById('detectBtn');
  const resultsPanel = document.getElementById('resultsPanel');
  const predictedScript = document.getElementById('predictedScript');
  const confidenceBar = document.getElementById('confidenceBar');
  const confidenceValue = document.getElementById('confidenceValue');

  if (!uploadZone) return; // Not on upload page

  // Browse button
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Click on zone
  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag events
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFile(files[0]);
    }
  });

  // File input change
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewName.textContent = file.name;
      previewArea.classList.add('active');
      detectBtn.classList.add('active');
      resultsPanel.classList.remove('active');

      // Animate preview appearance
      gsap.fromTo(previewArea,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
      gsap.fromTo(detectBtn,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', delay: 0.2 }
      );
    };
    reader.readAsDataURL(file);
  }

  // Detect button — simulated prediction
  detectBtn.addEventListener('click', () => {
    const scripts = [
      { name: 'Tamil', confidence: 94 },
      { name: 'Brahmi', confidence: 87 },
      { name: 'Grantha', confidence: 91 },
      { name: 'Devanagari', confidence: 96 },
    ];

    const result = scripts[Math.floor(Math.random() * scripts.length)];
    const jitter = Math.floor(Math.random() * 7) - 3; // ±3%
    const conf = Math.min(99, Math.max(75, result.confidence + jitter));

    // Show results
    resultsPanel.classList.add('active');
    predictedScript.textContent = result.name;
    confidenceBar.style.width = '0%';
    confidenceValue.textContent = '0%';

    // Animate results
    gsap.fromTo(resultsPanel,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    // Animate confidence bar
    setTimeout(() => {
      confidenceBar.style.width = conf + '%';
      // Animate the number
      let current = 0;
      const increment = () => {
        current += 2;
        if (current > conf) current = conf;
        confidenceValue.textContent = current + '%';
        if (current < conf) {
          requestAnimationFrame(increment);
        }
      };
      requestAnimationFrame(increment);
    }, 300);
  });

=======
  // --- Parallax Glow Effect on Hero ---
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--glow-x', `${x}%`);
      hero.style.setProperty('--glow-y', `${y}%`);
    });
  }

  // --- Tilt Effect on Cards ---
  const tiltCards = document.querySelectorAll('.tech-card, .feature-card, .team-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // --- Counter Animation for Step Numbers ---
  const stepNumbers = document.querySelectorAll('.step-number');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.textContent);
        let current = 0;
        const increment = () => {
          current++;
          el.textContent = current.toString().padStart(2, '0');
          if (current < target) {
            setTimeout(increment, 150);
          }
        };
        el.textContent = '00';
        setTimeout(increment, 300);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stepNumbers.forEach(el => counterObserver.observe(el));

  // --- Typing Effect on Hero Title ---
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    heroTitle.style.borderRight = '3px solid #a3ff4f';
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        heroTitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 80);
      } else {
        // Remove cursor after typing
        setTimeout(() => {
          heroTitle.style.borderRight = 'none';
        }, 1000);
      }
    };
    // Start after a small delay
    setTimeout(typeWriter, 800);
  }

>>>>>>> 0a62233f757146de3acacd04416c361d287f2a65
});
