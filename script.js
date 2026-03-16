/* ===== Akshara-Drishti — Enhanced Shared Script ===== */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Mobile Hamburger Menu --- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  /* --- GSAP Init --- */
  gsap.registerPlugin(ScrollTrigger);

  /* --- Hero Timeline --- */
  const heroBadge = document.getElementById('heroBadge');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  const heroDesc = document.getElementById('heroDesc');
  const heroCta = document.getElementById('heroCta');

  if (heroTitle) {
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' }
    });

    if (heroBadge) {
      tl.to(heroBadge, { opacity: 1, y: 0, duration: 0.6 });
    }

    tl.to(heroTitle, { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, heroBadge ? '-=0.3' : 0)
      .to(heroSubtitle, { opacity: 1, y: 0, duration: 0.7 }, '-=0.6')
      .to(heroDesc, { opacity: 1, y: 0, duration: 0.7 }, '-=0.45')
      .to(heroCta, { opacity: 1, y: 0, duration: 0.7 }, '-=0.35');
  }

  /* --- Stats Bar Animation --- */
  const statsBar = document.getElementById('statsBar');
  if (statsBar) {
    gsap.to(statsBar, {
      scrollTrigger: {
        trigger: statsBar,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
    });
  }

  /* --- Scroll-triggered fade-in with stagger for grids --- */
  const staggerGroups = document.querySelectorAll('.features-grid, .tech-grid, .team-grid, .steps-grid');
  staggerGroups.forEach(group => {
    const children = group.querySelectorAll('.gsap-hidden');
    if (children.length > 0) {
      gsap.to(children, {
        scrollTrigger: {
          trigger: group,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power2.out',
      });
    }
  });

  /* --- Individual element fade-ins (non-grid, non-hero) --- */
  const hiddenElements = document.querySelectorAll('.gsap-hidden');
  hiddenElements.forEach(el => {
    // Skip hero elements
    if (el.id && (el.id.startsWith('hero') || el.id === 'statsBar')) return;

    // Skip elements inside stagger groups
    if (el.closest('.features-grid, .tech-grid, .team-grid, .steps-grid')) return;

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
