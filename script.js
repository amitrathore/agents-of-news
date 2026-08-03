const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const tallyEmbed = document.querySelector('[data-tally-src]');
const investorSlideshow = document.querySelector('[data-investor-slideshow]');

if (investorSlideshow) {
  const slideImage = investorSlideshow.querySelector('.investor-slide-stage img');
  const slideStage = investorSlideshow.querySelector('.investor-slide-stage');
  const currentSlide = investorSlideshow.querySelector('[data-slide-current]');
  const previousButton = investorSlideshow.querySelector('[data-slide-previous]');
  const nextButton = investorSlideshow.querySelector('[data-slide-next]');
  const fullscreenButton = investorSlideshow.querySelector('[data-slide-fullscreen]');
  const slideCount = Number.parseInt(investorSlideshow.dataset.slideCount, 10);
  const slideTitles = [
    'Every point of view can become a newsroom.',
    'News becomes a platform when a perspective can operate like a business.',
    'Legacy news rents attention. Networked news compounds relationships.',
    'One human-in-the-loop agent turns expertise into a living newsroom.',
    'AI production economics and creator trust are converging now.',
    'The operating system connects creation, distribution, community, and commerce.',
    'The network already spans eight distinct editorial identities.',
    'Every edition opens four earning paths for the operator and community.',
    'The product already maps to three recurring monthly entry points.',
    'Distribution becomes the acquisition loop.',
    'The moat is the relationship between voice, workflow, community, and commerce.',
    'Scale comes from deepening the loop before widening the network.',
    'The venture is built at the intersection of innovation and digital media.',
    'Build the next media network with us.',
  ];
  let slideIndex = 0;

  const showSlide = (nextIndex) => {
    slideIndex = (nextIndex + slideCount) % slideCount;
    const slideNumber = String(slideIndex + 1).padStart(2, '0');
    slideImage.src = `assets/presentations/slides/slide-${slideNumber}.png`;
    slideImage.alt = `Slide ${slideIndex + 1} of ${slideCount}: ${slideTitles[slideIndex]}`;
    currentSlide.textContent = slideNumber;

    const preloadIndex = (slideIndex + 1) % slideCount;
    const preload = new Image();
    preload.src = `assets/presentations/slides/slide-${String(preloadIndex + 1).padStart(2, '0')}.png`;
  };

  previousButton.addEventListener('click', () => showSlide(slideIndex - 1));
  nextButton.addEventListener('click', () => showSlide(slideIndex + 1));
  slideStage.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showSlide(slideIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  fullscreenButton.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      investorSlideshow.requestFullscreen();
    }
  });
}

if (tallyEmbed) {
  let fallbackTimer;
  let heightObserver;

  const isTallySized = () => Number.parseFloat(tallyEmbed.style.height) > 200;

  const showTallyFallback = () => {
    if (!tallyEmbed.dataset.tallySrc) return;
    clearTimeout(fallbackTimer);
    heightObserver?.disconnect();
    const fallbackUrl = new URL(tallyEmbed.dataset.tallySrc);
    fallbackUrl.searchParams.delete('dynamicHeight');
    tallyEmbed.src = fallbackUrl.toString();
    tallyEmbed.removeAttribute('data-tally-src');
    tallyEmbed.height = '1600';
    tallyEmbed.scrolling = 'auto';
  };

  const loadTallyEmbed = () => {
    if (!tallyEmbed.dataset.tallySrc) return;
    try {
      if (!window.Tally?.loadEmbeds) throw new Error('Tally embed API unavailable');
      window.Tally.loadEmbeds();
    } catch {
      showTallyFallback();
    }
  };

  const initializeTally = () => {
    if (isTallySized()) return;

    heightObserver = new MutationObserver(() => {
      if (!isTallySized()) return;
      clearTimeout(fallbackTimer);
      heightObserver.disconnect();
    });
    heightObserver.observe(tallyEmbed, { attributes: true, attributeFilter: ['style'] });
    fallbackTimer = window.setTimeout(showTallyFallback, 30000);

    if (window.Tally) {
      loadTallyEmbed();
    } else {
      const tallyScript = document.createElement('script');
      tallyScript.src = 'https://tally.so/widgets/embed.js';
      tallyScript.async = true;
      tallyScript.onload = loadTallyEmbed;
      tallyScript.onerror = showTallyFallback;
      document.head.appendChild(tallyScript);
    }
  };

  initializeTally();
}

if (menuButton && navigation) {
  document.documentElement.classList.add('menu-ready');
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('is-open');
    });
  });
}

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
