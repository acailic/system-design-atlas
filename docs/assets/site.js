/* system-design-atlas site behaviors — generated into docs/assets/site.js by site/build.mjs
   Read-aloud (speechSynthesis), walkthrough steppers, mermaid diagrams, TOC spy, home filter. */

/* ── mermaid diagrams ─────────────────────────────────────────────
   Diagram source lives in the markdown as fenced ```mermaid blocks; the
   build emits <pre class="mermaid">. If mermaid fails to load, the raw
   source stays visible (progressive enhancement). */
function initMermaid() {
  const nodes = document.querySelectorAll('pre.mermaid');
  if (!nodes.length) return;
  if (typeof window.mermaid === 'undefined') return; // degrade: raw source stays
  window.mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    securityLevel: 'strict',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    themeVariables: {
      background: '#fdfcf9',
      primaryColor: '#f0e2c8',
      primaryBorderColor: '#8a5a00',
      primaryTextColor: '#241c0e',
      secondaryColor: '#f6f1e4',
      tertiaryColor: '#fbf8f0',
      lineColor: '#8a5a00',
      textColor: '#33302a',
      mainBkg: '#f0e2c8',
      nodeBorder: '#8a5a00',
      clusterBkg: '#f6f1e4',
      clusterBorder: '#c9b47e',
      edgeLabelBackground: '#fdfcf9',
      actorBkg: '#f0e2c8',
      actorBorder: '#8a5a00',
      actorTextColor: '#241c0e',
      signalColor: '#33302a',
      signalTextColor: '#33302a',
      noteBkgColor: '#fff8e0',
      noteBorderColor: '#c9a227',
      sequenceNumberColor: '#fdfcf9',
    },
    flowchart: { curve: 'basis', useMaxWidth: true },
    sequence: { useMaxWidth: true, wrap: true },
  });
  window.mermaid.run({ querySelector: 'pre.mermaid' }).catch(() => { /* raw source stays */ });
}

/* ── walkthrough steppers ────────────────────────────────────────
   Without JS the walkthrough reads as a normal list of steps.
   With JS it becomes an optional step-through (Next/Prev/Restart/Show all). */
function initWalkthroughs() {
  document.querySelectorAll('.walkthrough').forEach((wt) => {
    const steps = Array.from(wt.querySelectorAll('.step'));
    if (steps.length < 2) return;

    const controls = document.createElement('div');
    controls.className = 'walkthrough-controls';
    controls.innerHTML =
      '<button type="button" class="wt-prev" aria-label="Previous step">◀ Prev</button>' +
      '<span class="wt-count" aria-live="polite"></span>' +
      '<button type="button" class="wt-next" aria-label="Next step">Next ▶</button>' +
      '<button type="button" class="wt-restart" aria-label="Restart walkthrough">↺ Restart</button>' +
      '<button type="button" class="wt-all" aria-pressed="false">Show all steps</button>';
    const intro = wt.querySelector('.walkthrough-intro');
    wt.insertBefore(controls, intro ? intro.nextSibling : wt.children[1]);

    const prev = controls.querySelector('.wt-prev');
    const next = controls.querySelector('.wt-next');
    const restart = controls.querySelector('.wt-restart');
    const all = controls.querySelector('.wt-all');
    const count = controls.querySelector('.wt-count');

    let current = 0;
    let linear = false;

    function render() {
      wt.classList.toggle('stepper', !linear);
      steps.forEach((s, i) => {
        s.classList.toggle('current', !linear && i === current);
        s.setAttribute('aria-hidden', String(!linear && i !== current));
      });
      count.textContent = linear ? `${steps.length} steps` : `${current + 1} / ${steps.length}`;
      prev.disabled = linear || current === 0;
      next.disabled = linear || current === steps.length - 1;
      all.setAttribute('aria-pressed', String(linear));
      all.textContent = linear ? 'Step through instead' : 'Show all steps';
    }
    function goTo(i) { current = Math.max(0, Math.min(steps.length - 1, i)); linear = false; render(); }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));
    restart.addEventListener('click', () => goTo(0));
    all.addEventListener('click', () => { linear = !linear; render(); });
    wt.addEventListener('keydown', (e) => {
      if (linear) return;
      if (e.key === 'ArrowRight' && !next.disabled) goTo(current + 1);
      if (e.key === 'ArrowLeft' && !prev.disabled) goTo(current - 1);
    });

    steps[0].classList.add('current');
    render();
  });
}

/* ── read aloud ──────────────────────────────────────────────────
   Per-paragraph play/pause/stop with a global toolbar: voice picker,
   0.5×–2.5× speed slider, optional auto-advance. Uses only the
   browser's built-in speechSynthesis. */
function initReadAloud() {
  const synth = window.speechSynthesis;
  if (!synth) {
    if (document.querySelector('article, .readable')) {
      const n = document.createElement('div');
      n.className = 'read-bar-unsupported';
      n.textContent = 'Read-aloud is not supported in this browser.';
      document.body.appendChild(n);
    }
    return;
  }

  /* register every prose block (paragraphs, list items, headings) */
  const SEL = 'article p, article li, article h2, article h3, .readable p, .readable li';
  const blocks = Array.from(document.querySelectorAll(SEL)).filter(
    (el) => !el.parentElement.closest(SEL) && !el.closest('.walkthrough-controls'),
  );
  if (!blocks.length) return;

  /* One discrete button per block: click = play this paragraph,
     click again = stop. Starting a new paragraph cancels the previous
     one, and the global toolbar Stop cancels everything. */
  const PLAY = '▶', STOP = '■';
  const store = {
    get(k, d) { try { const v = localStorage.getItem('sda-' + k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sda-' + k, v); } catch { /* private mode */ } },
  };

  /* toolbar */
  const bar = document.createElement('div');
  bar.className = 'read-bar';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Read aloud controls');
  bar.innerHTML =
    '<span class="rb-title">Read aloud <span class="rb-status" aria-live="polite"></span></span>' +
    '<label for="rb-voice">Voice <select id="rb-voice" class="rb-voice" aria-label="Voice"></select></label>' +
    '<label for="rb-rate">Speed <input type="range" id="rb-rate" name="rate" class="rb-rate" min="0.5" max="2.5" step="0.05" aria-label="Reading speed">' +
    '<span class="rate-val"></span></label>' +
    '<label class="rb-auto" for="rb-advance" title="Continue to the next paragraph when this one ends">' +
    '<input type="checkbox" id="rb-advance" name="advance" class="rb-advance"> Auto-advance</label>' +
    '<button type="button" class="rb-stop" title="Stop reading (Esc)">■ Stop</button>';
  document.body.appendChild(bar);

  const voiceSel = bar.querySelector('.rb-voice');
  const rateInput = bar.querySelector('.rb-rate');
  const rateVal = bar.querySelector('.rate-val');
  const status = bar.querySelector('.rb-status');
  const stopBtn = bar.querySelector('.rb-stop');
  const advanceBox = bar.querySelector('.rb-advance');

  rateInput.value = store.get('rate', '1');
  advanceBox.checked = store.get('advance', '0') === '1';
  const rate = () => parseFloat(rateInput.value);
  function renderRate() { rateVal.textContent = Number(rateInput.value).toFixed(2).replace(/0$/, '') + '×'; }
  renderRate();
  rateInput.addEventListener('input', () => { store.set('rate', rateInput.value); renderRate(); });

  /* voices (async on some engines) */
  let voices = [];
  /* default voice: local sr/hr first, then any sr/hr, then en-US/GB,
     then any local voice, then the engine's own default. */
  const isSrHr = (v) => /^(sr|hr)([-_]|$)/i.test(v.lang);
  const isEnUSGB = (v) => /^en[-_](us|gb)\b/i.test(v.lang);
  function pickDefaultVoice() {
    const srHr = voices.filter(isSrHr);
    const enUSGB = voices.filter(isEnUSGB);
    return srHr.find((v) => v.localService)
      || srHr[0]
      || enUSGB.find((v) => v.localService)
      || enUSGB[0]
      || voices.find((v) => v.localService)
      || voices.find((v) => v.default)
      || voices[0];
  }
  function loadVoices() {
    voices = synth.getVoices();
    if (!voices.length) return;
    const prevURI = store.get('voice', '');
    voiceSel.innerHTML = '';
    /* espeak-style engines expose every voice variant ("X+Adam") as its own
       entry — thousands of options. Keep base voices (no "+") in the picker
       and sort sr/hr first, then en, then the rest; the full list still backs
       pickDefaultVoice and the stored choice. */
    let listed = voices.filter((v) => !v.name.includes('+'));
    if (!listed.length) listed = voices;
    listed = listed.slice().sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name));
    function rank(v) { return isSrHr(v) ? 2 : isEnUSGB(v) ? 1 : 0; }
    listed.forEach((v) => {
      const o = document.createElement('option');
      o.value = v.voiceURI;
      o.textContent = `${v.name} (${v.lang})${v.default ? ' — default' : ''}`;
      voiceSel.appendChild(o);
    });
    if (listed.some((v) => v.voiceURI === prevURI)) voiceSel.value = prevURI;
    else {
      const d = pickDefaultVoice();
      if (d) voiceSel.value = d.voiceURI;
    }
  }
  loadVoices();
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', loadVoices);
  else synth.onvoiceschanged = loadVoices;
  voiceSel.addEventListener('change', () => store.set('voice', voiceSel.value));
  function currentVoice() {
    return voices.find((v) => v.voiceURI === voiceSel.value) || null;
  }
  advanceBox.addEventListener('change', () => store.set('advance', advanceBox.checked ? '1' : '0'));

  /* per-paragraph controls */
  let activeEl = null;
  let activeUtter = null;
  let advanceTimer = 0;
  blocks.forEach((el, i) => {
    el.classList.add('ra-host');
    const c = document.createElement('span');
    c.className = 'ra-controls';
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'ra-btn ra-play';
    play.textContent = PLAY;
    play.setAttribute('aria-label', 'Read this paragraph aloud');
    c.append(play);
    el.prepend(c);

    play.addEventListener('click', () => {
      if (activeEl === el) { stopAll(); return; } // second click stops
      speak(el, i);                              // new paragraph interrupts previous
    });
  });

  function markPlaying() {
    if (!activeEl) return;
    activeEl.classList.add('reading');
    const b = activeEl.querySelector('.ra-btn.ra-play');
    if (b) { b.textContent = STOP; b.setAttribute('aria-label', 'Stop reading this paragraph'); }
    status.textContent = `¶ ${blocks.indexOf(activeEl) + 1}/${blocks.length}`;
  }
  function clearMark() {
    if (!activeEl) return;
    activeEl.classList.remove('reading');
    const b = activeEl.querySelector('.ra-btn.ra-play');
    if (b) { b.textContent = PLAY; b.setAttribute('aria-label', 'Read this paragraph aloud'); }
    activeEl = null;
    status.textContent = '';
  }

  function speak(el, idx) {
    stopAll();
    const text = textOf(el);
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = currentVoice();
    if (v) u.voice = v;
    u.rate = rate();
    u.pitch = 1;
    activeEl = el;
    activeUtter = u;
    u.onstart = () => {
      markPlaying();
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > innerHeight) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    };
    u.onend = () => {
      if (u !== activeUtter) return; // stale: this utterance was cancelled/replaced
      const wasEl = activeEl;
      const advance = advanceBox.checked;
      clearMark();
      activeUtter = null;
      if (advance && wasEl) {
        const nextIdx = idx + 1;
        if (nextIdx < blocks.length) advanceTimer = setTimeout(() => speak(blocks[nextIdx], nextIdx), 260);
      }
    };
    u.onerror = () => {
      if (u !== activeUtter) return; // stale: engines that emit error-on-cancel (e.g. Chrome 'interrupted')
      clearMark();
      activeUtter = null;
    };
    synth.speak(u);
    markPlaying(); // some engines fire onstart late
  }

  function textOf(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('.ra-controls, .walkthrough-controls, script, style').forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function stopAll() {
    clearTimeout(advanceTimer);
    synth.cancel();
    clearMark();
    activeUtter = null;
  }
  stopBtn.addEventListener('click', stopAll);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeEl) stopAll();
  });

  /* Chrome quirk: long utterances on some voices stall after ~15s unless
     the engine is nudged; pause+resume while speaking keeps it alive. */
  setInterval(() => {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      synth.resume();
    }
  }, 10000);
}

/* ── TOC scroll spy ─────────────────────────────────────────────── */
function initTocSpy() {
  const toc = document.querySelector('.toc a');
  if (!toc) return;
  const links = Array.from(document.querySelectorAll('.toc a'));
  const targets = links
    .map((l) => document.getElementById(l.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (!targets.length) return;
  const setActive = () => {
    let best = 0;
    targets.forEach((t, i) => { if (t.getBoundingClientRect().top < 120) best = i; });
    links.forEach((l, i) => l.classList.toggle('active', i === best));
  };
  addEventListener('scroll', setActive, { passive: true });
  setActive();
}

/* ── home: domain filter ───────────────────────────────────────── */
function initFilter() {
  const cards = document.querySelectorAll('.dive-card');
  const domainChips = document.querySelectorAll('.filter-chip[data-domain]');
  const allChip = document.querySelector('.filter-chip:not([data-domain])');
  if (!domainChips.length || !cards.length) return;
  let active = null;
  const apply = () => {
    domainChips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.domain === active)));
    if (allChip) allChip.setAttribute('aria-pressed', String(active === null));
    cards.forEach((card) => {
      const domains = (card.dataset.domains || '').split(' ');
      card.style.display = !active || domains.includes(active) ? '' : 'none';
    });
  };
  domainChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const d = chip.dataset.domain;
      active = active === d ? null : d;
      apply();
    });
  });
  if (allChip) allChip.addEventListener('click', () => {
    active = null;
    apply();
  });
}

/* ── boot ───────────────────────────────────────────────────────── */
const boot = () => {
  initMermaid();
  initWalkthroughs();
  initReadAloud();
  initTocSpy();
  initFilter();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
