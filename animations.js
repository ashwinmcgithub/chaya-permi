/* =========================================================
   ANIMATIONS.JS
   GSAP + ScrollTrigger + Lenis + tsParticles
   ========================================================= */

gsap.registerPlugin(ScrollTrigger);

/* ── Lenis smooth scroll ──────────────────────────────────── */
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/* ── Split text into per-character <span>s ────────────────── */
function splitChars(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) textNodes.push(n);

  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    const frag = document.createDocumentFragment();
    textNode.textContent.split("").forEach((char) => {
      if (char === " " || char === "\u00A0") {
        frag.appendChild(document.createTextNode("\u00A0"));
      } else {
        const s = document.createElement("span");
        s.className = "char";
        s.textContent = char;
        frag.appendChild(s);
      }
    });
    parent.replaceChild(frag, textNode);
  });

  return element.querySelectorAll(".char");
}

/* ── Preloader GSAP timeline ──────────────────────────────── */
function initPreloader() {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  // Set initial hidden states (GSAP controls entrance)
  gsap.set(".loader-logo", { scale: 0, opacity: 0 });
  gsap.set(".loader-ring", { opacity: 0 }); // CSS handles spin, GSAP handles fade
  gsap.set(".cup-body, .cup-handle, .cup-saucer", { y: 24, opacity: 0 });
  gsap.set(".steam span", { opacity: 0 });
  gsap.set(".loader-brand", { y: 28, opacity: 0 });
  gsap.set(".loader-text", { y: 16, opacity: 0 });

  const tl = gsap.timeline();

  tl
    // Logo scales in with bounce
    .to(".loader-logo", {
      scale: 1, opacity: 1,
      duration: 0.6, ease: "back.out(1.8)",
    })
    // Ring fades in while already spinning
    .to(".loader-ring", { opacity: 1, duration: 0.5 }, "-=0.3")
    // Cup body, handle, saucer slide up
    .to(".cup-body", { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }, "-=0.1")
    .to(".cup-handle", { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.25")
    .to(".cup-saucer", { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, "-=0.2")
    // Steam wisps fade in one by one
    .to(".steam span", { opacity: 1, duration: 0.25, stagger: 0.06 }, "-=0.1")
    // Brand name rises in
    .to(".loader-brand", { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, "-=0.05")
    .to(".loader-text", { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, "-=0.3")
    // Hold so it's readable
    .to({}, { duration: 0.9 })
    // ── EXIT ──
    // Cup + logo fly up
    .to(".loader-logo", { y: -30, opacity: 0, duration: 0.4, ease: "power2.in" })
    .to(".loader-cup-wrap", { y: -20, opacity: 0, duration: 0.4, ease: "power2.in" }, "<+=0.05")
    .to(".loader-ring", { opacity: 0, scale: 1.5, duration: 0.35 }, "<")
    // Brand fades down
    .to(".loader-brand, .loader-text", {
      y: 20, opacity: 0, duration: 0.35, ease: "power2.in",
    }, "<+=0.05")
    // Full screen fades away
    .to(preloader, {
      opacity: 0, duration: 0.45, ease: "power2.in",
      onComplete() {
        preloader.classList.add("hidden");
        initHeroEnter();
      },
    }, "-=0.15");
}

/* ── Hero entrance (runs after preloader exits) ───────────── */
function initHeroEnter() {
  const tl = gsap.timeline();

  // Logo pops in
  tl.from(".hero-logo", {
    scale: 0.5, opacity: 0, duration: 0.6, ease: "back.out(1.8)",
  });

  // Char-split h1 animation
  const h1 = document.querySelector(".hero h1");
  if (h1) {
    const chars = splitChars(h1);
    tl.from(chars, {
      y: 90,
      opacity: 0,
      rotateX: -80,
      stagger: 0.022,
      duration: 0.6,
      ease: "back.out(1.5)",
      transformOrigin: "50% 50% -20px",
    }, "-=0.25");
  }

  // Subtitle slides up
  tl.from(".hero-sub", {
    y: 36, opacity: 0, duration: 0.65, ease: "power3.out",
  }, "-=0.3");

  // Buttons pop in with elastic feel
  tl.from(".hero-actions .btn", {
    y: 22, opacity: 0, scale: 0.9,
    duration: 0.55, stagger: 0.12,
    ease: "back.out(1.6)",
  }, "-=0.35");

  // Animated tea cup (desktop only)
  if (window.innerWidth >= 1060) {
    tl.from(".hero-tea", {
      x: 80, opacity: 0, scale: 0.7,
      duration: 1.0, ease: "back.out(1.5)",
    }, "-=0.7");

    // Continuous float up/down
    gsap.to(".hero-tea", {
      y: -20,
      duration: 3.8,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.2,
    });

    // Very subtle tilt on liquid
    gsap.to(".htea-liquid", {
      rotation: 1.5,
      duration: 2.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
}

/* ── Hero parallax on scroll ──────────────────────────────── */
function initHeroParallax() {
  // Content drifts up slower than scroll
  gsap.to(".hero-content", {
    yPercent: -22,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1.2,
    },
  });

  // Video background drifts down (opposite direction = depth)
  gsap.to(".hero-video", {
    yPercent: 18,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: 1.5,
    },
  });
}

/* ── Scroll progress bar ──────────────────────────────────── */
function initScrollProgress() {
  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate: (self) => {
      const bar = document.getElementById("scroll-progress");
      if (bar) bar.style.width = (self.progress * 100) + "%";
    },
  });
}

/* ── Active nav link on scroll ────────────────────────────── */
function initActiveNav() {
  const links = document.querySelectorAll(".bottom-nav a");
  links.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top 55%",
      end: "bottom 45%",
      onToggle: (self) => {
        if (self.isActive) {
          links.forEach((l) => l.classList.remove("active"));
          link.classList.add("active");
        }
      },
    });
  });
}

/* ── Scroll-triggered section animations ─────────────────── */
function initScrollAnimations() {
  // Eyebrow labels slide in from left
  gsap.utils.toArray(".eyebrow").forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: "top 88%" },
      x: -35, opacity: 0, duration: 0.65, ease: "power3.out",
    });
  });

  // Section headings clip-reveal from bottom
  gsap.utils.toArray(".section-header h2").forEach((h2) => {
    gsap.from(h2, {
      scrollTrigger: { trigger: h2, start: "top 88%" },
      y: 55, opacity: 0, duration: 1, ease: "power4.out",
    });
  });

  // About cards stagger in
  const aboutCards = gsap.utils.toArray(".about-card");
  if (aboutCards.length) {
    gsap.from(aboutCards, {
      scrollTrigger: { trigger: ".about-grid", start: "top 78%" },
      y: 80, opacity: 0, stagger: 0.15, duration: 0.85, ease: "power3.out",
    });
  }

  // Gram profile header
  gsap.from(".gram-avatar-wrap", {
    scrollTrigger: { trigger: ".gram-profile", start: "top 85%" },
    scale: 0, opacity: 0, duration: 0.6, ease: "back.out(1.8)",
  });

  gsap.from(".gram-profile-info > *", {
    scrollTrigger: { trigger: ".gram-profile", start: "top 85%" },
    x: 30, opacity: 0, stagger: 0.1, duration: 0.55, ease: "power3.out",
  });

  gsap.from(".gram-tabs", {
    scrollTrigger: { trigger: ".gram-tabs", start: "top 90%" },
    y: 20, opacity: 0, duration: 0.5, ease: "power2.out",
  });

  // Video grid — Instagram-style cascade (row by row, 3 cols)
  gsap.utils.toArray(".gram-item").forEach((item, i) => {
    const col = i % 3;
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: "top 95%" },
      scale: 0.85, opacity: 0,
      duration: 0.5,
      delay: col * 0.07,
      ease: "power3.out",
    });
  });

  // Reviews slider
  gsap.from(".reviews-slider", {
    scrollTrigger: { trigger: ".reviews-slider", start: "top 85%" },
    y: 45, opacity: 0, duration: 0.8, ease: "power3.out",
  });

  gsap.from(".google-badge", {
    scrollTrigger: { trigger: ".google-badge", start: "top 88%" },
    x: 30, opacity: 0, duration: 0.6, ease: "power3.out",
  });

  // Location cards — stagger with 3D tilt entrance
  gsap.utils.toArray(".location-card").forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: "top 85%" },
      y: 70, opacity: 0, rotateY: i === 0 ? 8 : -8,
      duration: 0.85, delay: i * 0.18,
      ease: "power3.out",
    });
  });

  // Footer
  gsap.from(".footer", {
    scrollTrigger: { trigger: ".footer", start: "top 90%" },
    y: 40, opacity: 0, duration: 0.8, ease: "power3.out",
  });
}

/* ── Magnetic button effect ───────────────────────────────── */
function initMagneticButtons() {
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.38,
        y: y * 0.38,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, {
        x: 0, y: 0,
        duration: 0.75,
        ease: "elastic.out(1, 0.45)",
        overwrite: "auto",
      });
    });
  });

  // Slider buttons slight scale
  document.querySelectorAll(".slider-btn").forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      gsap.to(btn, { scale: 1.12, duration: 0.3, ease: "power2.out" });
    });
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* ── tsParticles hero particles (steam effect) ────────────── */
function initParticles() {
  if (typeof tsParticles === "undefined") return;

  tsParticles.load("hero-particles", {
    fullScreen: { enable: false },
    background: { color: "transparent" },
    particles: {
      number: { value: 45, density: { enable: true, area: 900 } },
      color: { value: ["#FF5500", "#FF7A30", "#FF9055", "#FFD234"] },
      shape: { type: "circle" },
      opacity: {
        value: { min: 0.04, max: 0.5 },
        animation: { enable: true, speed: 0.7, sync: false },
      },
      size: {
        value: { min: 2, max: 8 },
        animation: { enable: true, speed: 1.2, sync: false },
      },
      move: {
        enable: true,
        speed: { min: 0.4, max: 1.8 },
        direction: "top",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
      links: { enable: false },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
      },
      modes: {
        repulse: { distance: 110, duration: 0.4 },
      },
    },
    detectRetina: true,
  });
}

/* ── Bootstrap ────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  initLenis();
  initParticles();
  initScrollProgress();
  initHeroParallax();
  initScrollAnimations();
  initMagneticButtons();
  initActiveNav();
  initPreloader(); // calls initHeroEnter() after exit
});
