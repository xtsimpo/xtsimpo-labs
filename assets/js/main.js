(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  if (!hasGsap || reduceMotion) root.classList.add("no-motion");

  /* =========================================================
     SMOOTH SCROLL (Lenis)
  ========================================================= */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollToTarget(hash) {
    const target = hash === "#top" ? 0 : $(hash);
    if (target === null) return;
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */
  const header = $("#header");
  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobile-menu");
  const navLinks = $$(".nav-links a");
  const indicator = $(".nav-indicator");
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    hamburger.classList.toggle("is-open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    header.classList.remove("is-hidden");
    if (lenis) open ? lenis.stop() : lenis.start();
  }

  hamburger.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) setMenu(false);
  });

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const hash = a.getAttribute("href");
      if (hash.length < 2) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      scrollToTarget(hash);
    });
  });

  // header state + scroll progress
  const progress = $(".scroll-progress span");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 40);
    if (!menuOpen) header.classList.toggle("is-hidden", y > lastY && y > 500);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // active link indicator
  function moveIndicator(link) {
    if (!indicator) return;
    if (!link) { indicator.style.opacity = "0"; return; }
    indicator.style.opacity = "1";
    indicator.style.width = link.offsetWidth + "px";
    indicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = "#" + entry.target.id;
      let active = null;
      navLinks.forEach((l) => {
        const on = l.getAttribute("href") === id;
        l.classList.toggle("is-active", on);
        if (on) active = l;
      });
      moveIndicator(active);
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  $$("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* =========================================================
     POINTER EFFECTS
  ========================================================= */
  // spotlight position on cards
  $$(".spot").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  if (canHover && hasGsap && !reduceMotion) {
    // 3D tilt
    $$(".tilt").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotationY: x * 7,
          rotationX: -y * 7,
          transformPerspective: 1100,
          duration: 0.6,
          ease: "power3.out"
        });
      });
      card.addEventListener("pointerleave", () => {
        gsap.to(card, { rotationY: 0, rotationX: 0, duration: 1, ease: "elastic.out(1, 0.5)" });
      });
    });

    // magnetic buttons
    $$(".magnetic").forEach((el) => {
      const strength = el.classList.contains("cta-orb") ? 0.4 : 0.25;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength,
          duration: 0.6,
          ease: "power3.out"
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.4)" });
      });
    });

    // ambient cursor glow
    const glow = $(".cursor-glow");
    if (glow) {
      const xTo = gsap.quickTo(glow, "x", { duration: 0.9, ease: "power3.out" });
      const yTo = gsap.quickTo(glow, "y", { duration: 0.9, ease: "power3.out" });
      window.addEventListener("pointermove", (e) => {
        glow.classList.add("is-visible");
        xTo(e.clientX);
        yTo(e.clientY);
      }, { passive: true });
      document.addEventListener("pointerleave", () => glow.classList.remove("is-visible"));
    }
  }

  /* =========================================================
     WORK ROWS (tap to expand on touch)
  ========================================================= */
  $$(".work-row").forEach((row) => {
    const toggle = () => {
      const open = !row.classList.contains("is-open");
      $$(".work-row.is-open").forEach((r) => r.classList.remove("is-open"));
      row.classList.toggle("is-open", open);
      if (hasGsap) setTimeout(() => ScrollTrigger.refresh(), 750);
    };
    row.addEventListener("click", () => { if (!canHover) toggle(); });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });

  /* =========================================================
     INSIGHTS SLIDER
  ========================================================= */
  const track = $(".slider-track");
  if (track) {
    const prev = $(".slider-btn.prev");
    const next = $(".slider-btn.next");
    const bar = $(".slider-progress span");

    const step = () => {
      const card = $(".insight", track);
      return card ? card.offsetWidth + 20 : 400;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const ratio = track.scrollWidth ? (track.scrollLeft + track.clientWidth) / track.scrollWidth : 1;
      if (bar) bar.style.transform = `scaleX(${Math.min(1, ratio)})`;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= max - 4;
    };

    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    // mouse drag
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        track.classList.add("is-dragging");
      }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      // snap to nearest card after drag
      const s = step();
      const targetLeft = Math.round(track.scrollLeft / s) * s;
      track.classList.remove("is-dragging");
      track.scrollTo({ left: targetLeft, behavior: "smooth" });
    });
  }

  /* =========================================================
     SCROLL ANIMATIONS (GSAP)
  ========================================================= */
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // split statement into words
  const statement = $("[data-words]");
  if (statement) {
    const frag = document.createDocumentFragment();
    Array.from(statement.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          w.className = "word";
          w.textContent = part;
          frag.appendChild(w);
        });
      } else {
        const w = document.createElement("span");
        w.className = "word";
        w.appendChild(node.cloneNode(true));
        frag.appendChild(w);
      }
    });
    statement.innerHTML = "";
    statement.appendChild(frag);
  }

  if (reduceMotion) {
    // Static but functional: just mark the first principle and stop.
    return;
  }

  // ---------- Hero intro ----------
  const heroLines = $$("[data-hero-line]");
  const heroBits = $$("[data-hero]");
  gsap.set(heroLines, { yPercent: 115, rotate: 3 });
  gsap.set(heroBits, { opacity: 0, y: 24 });

  const intro = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.15 });
  intro
    .to(heroBits[0], { opacity: 1, y: 0, duration: 1 })
    .to(heroLines, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.12 }, "-=0.8")
    .to(heroBits.slice(1), { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, "-=1.1");

  gsap.to(".hero-inner", {
    yPercent: -12,
    opacity: 0.15,
    scale: 0.96,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  // ---------- Marquee skew on scroll velocity ----------
  const marqueeItems = $$(".marquee span");
  const skewTo = gsap.quickTo(marqueeItems, "skewX", { duration: 0.6, ease: "power3.out" });
  ScrollTrigger.create({
    onUpdate: (self) => {
      const v = gsap.utils.clamp(-12, 12, self.getVelocity() / -250);
      skewTo(v);
    }
  });
  ScrollTrigger.addEventListener("scrollEnd", () => skewTo(0));

  // ---------- Section titles ----------
  $$(".sec-title, .contact-title").forEach((title) => {
    const lines = $$(".mask > span", title);
    gsap.from(lines, {
      yPercent: 115,
      rotate: 2.5,
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: { trigger: title, start: "top 88%" }
    });
  });

  $$(".sec-head .eyebrow, .manifesto-sticky .eyebrow, .framework-intro .eyebrow, .contact-inner > .eyebrow, .sec-sub, .framework-intro p, .slider-controls").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 20,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%" }
    });
  });

  // ---------- Generic reveal ----------
  const reveals = $$("[data-reveal]");
  gsap.set(reveals, { opacity: 0, y: 60 });
  ScrollTrigger.batch(reveals, {
    start: "top 90%",
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1,
      y: 0,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.09,
      overwrite: true
    })
  });

  // ---------- Statement word scrub ----------
  if (statement) {
    gsap.fromTo($$(".word", statement), { opacity: 0.12 }, {
      opacity: 1,
      ease: "none",
      stagger: 0.1,
      scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 45%", scrub: true }
    });
  }

  // ---------- Principles ----------
  const counter = $(".counter-current");
  const principles = $$(".principle");
  principles.forEach((p, i) => {
    ScrollTrigger.create({
      trigger: p,
      start: "top 62%",
      end: "bottom 62%",
      toggleClass: "is-active",
      onToggle: (self) => {
        if (!self.isActive || !counter) return;
        const label = String(i + 1).padStart(2, "0");
        if (counter.textContent === label) return;
        gsap.to(counter, {
          yPercent: -40, opacity: 0, duration: 0.2, ease: "power2.in",
          onComplete: () => {
            counter.textContent = label;
            gsap.fromTo(counter, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
          }
        });
      }
    });
  });

  gsap.to(".principles-rail span", {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: ".principles", start: "top 62%", end: "bottom 62%", scrub: true }
  });

  // ---------- Metric counters ----------
  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    if (end < 5) return;
    const obj = { v: 0 };
    el.textContent = "0";
    gsap.to(obj, {
      v: end,
      duration: 2.2,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => { el.textContent = Math.round(obj.v); }
    });
  });

  // ---------- Framework: pinned horizontal scroll ----------
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px) and (min-height: 621px)", () => {
    const fwTrack = $(".framework-track");
    const fpBar = $(".fp-bar span");
    const distance = () => fwTrack.scrollWidth - window.innerWidth;

    const horizontal = gsap.to(fwTrack, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".framework",
        start: "top top",
        end: () => "+=" + distance(),
        pin: ".framework-pin",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => { if (fpBar) fpBar.style.transform = `scaleX(${self.progress})`; }
      }
    });

    $$(".fw-card").forEach((card) => {
      gsap.fromTo(card, { opacity: 0.25, scale: 0.88, rotate: 2 }, {
        opacity: 1,
        scale: 1,
        rotate: 0,
        ease: "none",
        scrollTrigger: {
          trigger: card,
          containerAnimation: horizontal,
          start: "left 100%",
          end: "left 60%",
          scrub: true
        }
      });
    });
  });

  mm.add("(max-width: 900px), (max-height: 620px)", () => {
    $$(".fw-card").forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: 60,
        duration: 1.1,
        ease: "expo.out",
        scrollTrigger: { trigger: card, start: "top 90%" }
      });
    });
  });

  // refresh once fonts are ready so measurements are correct
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
