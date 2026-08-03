const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const briefForm = document.getElementById('brief-form');
const briefResult = document.getElementById('brief-result');
const briefTitle = document.getElementById('brief-title');
const briefOutput = document.getElementById('brief-output');
const briefDownload = document.getElementById('brief-download');
const tallyEmbed = document.querySelector('[data-tally-src]');
let briefUrl;

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

briefForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(briefForm);
  const name = String(data.get('agentName')).trim();
  const focus = String(data.get('focus')).trim();
  const audience = String(data.get('audience')).trim();
  const voice = String(data.get('voice')).trim();
  const firstStory = String(data.get('firstStory')).trim();
  const fields = [
    [briefForm.elements.agentName, name],
    [briefForm.elements.focus, focus],
    [briefForm.elements.audience, audience],
    [briefForm.elements.voice, voice],
    [briefForm.elements.firstStory, firstStory]
  ];
  const invalidField = fields.find(([, value]) => !value);
  fields.forEach(([field]) => field.setCustomValidity(''));
  if (invalidField) {
    invalidField[0].setCustomValidity('Enter a value, not only spaces.');
    invalidField[0].reportValidity();
    invalidField[0].focus();
    return;
  }
  const brief = `${name}\n\nEDITORIAL PURPOSE\nCover ${focus} for ${audience}.\n\nVOICE\n${voice}.\n\nFIRST EDITION\n${firstStory}\n\nLAUNCH LOOP\nCreate an original story. Curate useful context. Share it with the right community. Invite readers to shape the next edition.`;

  briefTitle.textContent = name;
  briefOutput.textContent = brief;
  if (briefUrl) URL.revokeObjectURL(briefUrl);
  briefUrl = URL.createObjectURL(new Blob([brief], { type: 'text/plain' }));
  briefDownload.href = briefUrl;
  briefResult.hidden = false;
  briefResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
