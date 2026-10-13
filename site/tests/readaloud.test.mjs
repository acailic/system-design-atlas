/* Gate 3 — read-aloud wiring (per-paragraph play/stop).
 *
 * The published pages are static HTML; per-paragraph buttons are injected at
 * runtime by docs/assets/site.js. These tests execute the *deployed*
 * site.js inside jsdom against every published page — no per-page skips —
 * and assert the DOM/JS wiring:
 *   - every prose block (paragraph, list item, heading) registered by the
 *     site.js selector gets exactly one play/stop toggle button
 *   - the toggle works: click = speak (button flips to ■ stop), click again
 *     = cancel (button resets to ▶ play, .reading marker cleared)
 *   - a global read-aloud toolbar with a Stop button exists on every page
 *   - starting a new paragraph cancels the previous one (one page, deep)
 *   - auto-advance chains into the next paragraph (one page, deep)
 *   - the voice picker filters espeak "+" variants and defaults to the
 *     sr/hr-first local voice (one page, deep)
 *
 * NOT automatically coverable here (documented per the brief — manual/QA
 * territory): real audio output and per-machine voice availability
 * (speechSynthesis is stubbed), the Chrome long-utterance pause/resume nudge
 * against a live engine (only that the interval doesn't throw is exercised),
 * smooth scrolling (scrollIntoView stubbed), mermaid CDN rendering
 * (progressive enhancement — raw source stays), and localStorage voice/rate
 * persistence across real browser sessions.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { DOCS, discoverPages, siteBase, pageUrl } from './helpers.mjs';

/* the exact selector site.js registers prose blocks with — keep in sync */
const SEL = 'article p, article li, article h2, article h3, .readable p, .readable li';

const siteJs = readFileSync(join(DOCS, 'assets/site.js'), 'utf8');

/* Fake voices: sr/hr local + en-US local + an espeak-style "+variant" the
 * picker must filter out. */
const VOICES = [
  { name: 'English US Voice', lang: 'en-US', voiceURI: 'en-us-1', localService: true, default: true },
  { name: 'Serbian Voice', lang: 'sr', voiceURI: 'sr-1', localService: true, default: false },
  { name: 'Serbian Voice +Adam', lang: 'sr', voiceURI: 'sr-adam', localService: false, default: false },
];

async function loadPage(p) {
  const html = readFileSync(p.file, 'utf8');
  const dom = new JSDOM(html, {
    url: pageUrl(siteBase(), p.urlDir),
    runScripts: 'outside-only', // we eval the deployed site.js ourselves
  });
  const w = dom.window;

  const spoken = [];
  let cancelled = 0;
  w.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
    constructor(text) { this.text = text; }
  };
  w.speechSynthesis = {
    getVoices: () => VOICES,
    speak: (u) => spoken.push(u),
    cancel: () => { cancelled += 1; },
    pause() {}, resume() {},
    speaking: false, paused: false,
    addEventListener() {},
  };
  w.HTMLElement.prototype.scrollIntoView = () => {};

  /* let jsdom finish its document lifecycle, then run the deployed script */
  await new Promise((r) => setTimeout(r, 0));
  if (w.document.readyState === 'loading') {
    await new Promise((r) => w.document.addEventListener('DOMContentLoaded', r, { once: true }));
  }
  w.eval(siteJs);
  return { dom, spoken, cancelled: () => cancelled };
}

/* replicate site.js's block registration exactly (same selector, same filter) */
function registeredBlocks(w) {
  return Array.from(w.document.querySelectorAll(SEL)).filter(
    (el) => !el.parentElement.closest(SEL) && !el.closest('.walkthrough-controls'),
  );
}

async function waitFor(fn, ms = 4000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 25));
  }
  return fn();
}

test('every page: every prose block has a working play/stop toggle and a global Stop bar', async () => {
  for (const p of discoverPages()) {
    const { dom, spoken, cancelled } = await loadPage(p);
    try {
      const w = dom.window;
      const blocks = registeredBlocks(w);
      assert.ok(blocks.length > 0, `${p.rel}: no prose blocks matched the read-aloud selector`);

      /* the static page references the script that provides the wiring */
      assert.match(
        readFileSync(p.file, 'utf8'),
        /<script src="[^"]*assets\/site\.js" defer><\/script>/,
        `${p.rel}: site.js not referenced with defer`,
      );

      /* one .ra-host + exactly one play button per registered block */
      assert.equal(w.document.querySelectorAll('.ra-host').length, blocks.length,
        `${p.rel}: .ra-host count differs from registered blocks`);
      assert.equal(w.document.querySelectorAll('.ra-btn.ra-play').length, blocks.length,
        `${p.rel}: expected exactly one play button per block`);
      for (const el of blocks) {
        const btn = el.querySelector(':scope > .ra-controls > .ra-btn.ra-play');
        assert.ok(btn, `${p.rel}: a prose block has no play toggle`);
        assert.equal(btn.getAttribute('aria-label'), 'Read this paragraph aloud',
          `${p.rel}: play button has wrong aria-label`);
      }

      /* global toolbar with Stop */
      const bar = w.document.querySelector('.read-bar');
      assert.ok(bar, `${p.rel}: read-aloud toolbar missing`);
      assert.ok(bar.querySelector('button.rb-stop'), `${p.rel}: global Stop button missing`);

      /* toggle round-trip on the first block of every page */
      const first = blocks[0];
      const btn = first.querySelector(':scope > .ra-controls > .ra-btn.ra-play');
      btn.click();
      assert.equal(spoken.length, 1, `${p.rel}: clicking play did not speak`);
      assert.ok(spoken[0].text.trim().length > 0, `${p.rel}: spoke empty text`);
      assert.equal(btn.textContent, '■', `${p.rel}: button did not flip to the stop glyph`);
      assert.equal(btn.getAttribute('aria-label'), 'Stop reading this paragraph',
        `${p.rel}: active button aria-label wrong`);
      assert.ok(first.classList.contains('reading'), `${p.rel}: active block not marked .reading`);
      spoken[0].onstart?.(); // exercises the onstart handler too (scroll stubbed)
      btn.click();
      assert.ok(cancelled() >= 1, `${p.rel}: clicking again did not cancel`);
      assert.equal(btn.textContent, '▶', `${p.rel}: button did not reset to the play glyph`);
      assert.ok(!first.classList.contains('reading'), `${p.rel}: .reading marker not cleared`);
    } finally {
      dom.window.close();
    }
  }
});

test('deep wiring: interrupt, auto-advance, sr/hr default voice (representative page)', async () => {
  const page = discoverPages().find((p) => p.urlDir === 'dive/redis/');
  assert.ok(page, 'dive/redis/ page not found');
  const { dom, spoken, cancelled } = await loadPage(page);
  try {
    const w = dom.window;
    const blocks = registeredBlocks(w);
    const bar = w.document.querySelector('.read-bar');
    const voiceSel = bar.querySelector('.rb-voice');
    const advanceBox = bar.querySelector('.rb-advance');
    assert.ok(blocks.length >= 3, 'expected at least 3 blocks on the representative page');

    /* voice picker: no espeak "+" variants; defaults to the sr/hr local voice */
    const optionTexts = [...voiceSel.options].map((o) => o.textContent);
    assert.ok(optionTexts.every((t) => !t.includes('+')), 'voice picker lists espeak +variants');
    assert.equal(voiceSel.value, 'sr-1', 'default voice is not the sr/hr local voice');

    /* starting block B while A is active cancels A and resets its button */
    const btnA = blocks[0].querySelector(':scope > .ra-controls > .ra-btn.ra-play');
    const btnB = blocks[1].querySelector(':scope > .ra-controls > .ra-btn.ra-play');
    btnA.click();
    btnB.click();
    assert.equal(spoken.length, 2, 'second click did not speak');
    assert.ok(cancelled() >= 1, 'switching paragraphs did not cancel the previous utterance');
    assert.equal(btnA.textContent, '▶', 'previous paragraph button did not reset');
    assert.equal(btnB.textContent, '■', 'new paragraph button did not flip to stop');
    assert.ok(blocks[1].classList.contains('reading'), 'new paragraph not marked .reading');

    /* auto-advance: when B ends, the next block starts after the timer */
    advanceBox.checked = true;
    spoken[1].onend();
    const advanced = await waitFor(() => (spoken.length === 3 ? blocks[2] : null));
    assert.ok(advanced, 'auto-advance did not start the next paragraph');
    assert.equal(blocks[2].querySelector(':scope > .ra-controls > .ra-btn.ra-play').textContent, '■',
      'auto-advanced paragraph button did not flip to stop');

    /* global Stop cancels everything and clears the mark */
    bar.querySelector('.rb-stop').click();
    assert.ok(cancelled() >= 2, 'global Stop did not cancel');
    assert.equal(blocks[2].querySelector(':scope > .ra-controls > .ra-btn.ra-play').textContent, '▶',
      'global Stop did not reset the active button');
    assert.ok(!blocks[2].classList.contains('reading'), 'global Stop did not clear .reading');
  } finally {
    dom.window.close();
  }
});
