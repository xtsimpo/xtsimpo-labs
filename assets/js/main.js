document.addEventListener("DOMContentLoaded", function () {

  const reveals = document.querySelectorAll(".reveal");

  function revealOnScroll() {
    reveals.forEach(el => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight - 100) {
        el.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", revealOnScroll);


  /* ========================
     CAROUSEL
  ======================== */

  const track = document.querySelector('.carousel-track');
const nextBtn = document.querySelector('.carousel-btn.next');
const prevBtn = document.querySelector('.carousel-btn.prev');

if (track && nextBtn && prevBtn) {

  let visibleCards = window.innerWidth <= 900 ? 1 : 3;
  let cards = Array.from(track.children);
  let index = visibleCards;

  /* ==========================
     CLONE CARDS FOR INFINITE LOOP
  ========================== */

  function setupClones() {
    visibleCards = window.innerWidth <= 900 ? 1 : 3;

    track.innerHTML = "";
    cards.forEach(card => track.appendChild(card));

    const firstClones = cards.slice(0, visibleCards).map(card => card.cloneNode(true));
    const lastClones = cards.slice(-visibleCards).map(card => card.cloneNode(true));

    lastClones.forEach(clone => track.prepend(clone));
    firstClones.forEach(clone => track.appendChild(clone));

    index = visibleCards;
    updateCarousel(true);
  }

  function getGap() {
    return window.innerWidth <= 900 ? 20 : 40;
  }

  function updateCarousel(skipAnimation = false) {
    const cardWidth = track.children[0].offsetWidth + getGap();

    if (skipAnimation) {
      track.style.transition = "none";
    } else {
      track.style.transition = "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    }

    track.style.transform = `translateX(-${index * cardWidth}px)`;
  }

  nextBtn.addEventListener('click', () => {
    index++;
    updateCarousel();

    setTimeout(() => {
      if (index >= track.children.length - visibleCards) {
        index = visibleCards;
        updateCarousel(true);
      }
    }, 600);
  });

  prevBtn.addEventListener('click', () => {
    index--;
    updateCarousel();

    setTimeout(() => {
      if (index < visibleCards) {
        index = track.children.length - (visibleCards * 2);
        updateCarousel(true);
      }
    }, 600);
  });

  window.addEventListener('resize', () => {
    cards = Array.from(track.querySelectorAll('.thought-card')).slice(visibleCards, -visibleCards);
    setupClones();
  });

  setupClones();
}



  /* ========================
     NAVIGATION
  ======================== */

  document.querySelectorAll('.nav-links a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const target = document.querySelector(this.getAttribute('href'));

      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }

      closeMenu();
    });
  });

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  function closeMenu() {
    if (navLinks) {
      navLinks.classList.remove('active');
    }
  }

});
