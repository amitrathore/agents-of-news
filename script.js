const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const tallyEmbed = document.querySelector('[data-tally-src]');

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
