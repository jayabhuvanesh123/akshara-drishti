/* ===== Akshara-Drishti — Shared Script ===== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Mobile Hamburger Menu --- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  /* --- GSAP Animations --- */
  gsap.registerPlugin(ScrollTrigger);

  // Hero timeline (index.html)
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const heroDesc = document.getElementById('heroDesc');
  const heroCta = document.getElementById('heroCta');

  if (heroTitle) {
    const heroTl = gsap.timeline({ defaults: { duration: 0.8, ease: 'power3.out' } });

    heroTl
      .to(heroTitle, { opacity: 1, y: 0, duration: 0.9 })
      .to(heroSubtitle, { opacity: 1, y: 0 }, '-=0.5')
      .to(heroDesc, { opacity: 1, y: 0 }, '-=0.45')
      .to(heroCta, { opacity: 1, y: 0 }, '-=0.35');
  }

  // Scroll-triggered fade-in for all gsap-hidden elements (except hero)
  const hiddenElements = document.querySelectorAll('.gsap-hidden');
  hiddenElements.forEach(el => {
    // Skip hero elements – they animate via the hero timeline
    if (el.id && el.id.startsWith('hero')) return;

    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
    });
  });

});
