import { chromium } from 'playwright';
import path from 'path';

const GAME = 'file:///' + path.resolve('c:/Users/osins/Claude/Projects/SOFT Kids Game/soft-kids-game/index.html').replace(/\\/g, '/');
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
const out = {};

// --- map: day/night toggle
await page.goto(GAME + '#map=eya');
await page.reload();
await page.waitForTimeout(600);
out.sun = await page.evaluate(() => !!document.getElementById('dayNight'));
await page.evaluate(() => document.getElementById('dayNight').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
await page.waitForTimeout(1200);
out.nightOn = await page.evaluate(() => State.night === true && !!document.getElementById('dayNight'));
await page.screenshot({ path: 'night.png' });

// --- house: bed + tuck-in + camera-in-boy-house
await page.goto(GAME + '#house-eya=eya');
await page.reload();
await page.waitForTimeout(600);
out.bed = await page.evaluate(() => !!document.querySelector('.prop[data-id="bed"]'));
await page.evaluate(() => document.querySelector('.prop[data-id="bed"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
await page.waitForTimeout(4200);
out.bedDone = await page.evaluate(() => !App.locked && Stickers.count() >= 1);
await page.screenshot({ path: 'house-bed.png' });

// friend's house must NOT have a bed
await page.goto(GAME + '#house-jeya=eya');
await page.reload();
await page.waitForTimeout(500);
out.noBedAway = await page.evaluate(() => !document.querySelector('.prop[data-id="bed"]'));

// --- camera: snapshot into album
await page.goto(GAME + '#house-boy=eya');
await page.reload();
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('.prop[data-id="camera"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
await page.waitForTimeout(1500);
out.album = await page.evaluate(() => Album.load().length);
out.albumIsJpeg = await page.evaluate(() => (Album.load()[0] || '').startsWith('data:image/jpeg'));
await page.evaluate(() => Stickers.openAlbum());
await page.waitForTimeout(300);
out.albumUI = await page.evaluate(() => !!document.getElementById('photoAlbum') && !!document.querySelector('#photoAlbum image'));
await page.screenshot({ path: 'album.png' });

// --- school: shape sorter
await page.goto(GAME + '#place-school=eya');
await page.reload();
await page.waitForTimeout(600);
out.shapes = await page.evaluate(() => document.querySelectorAll('.shapePiece').length);
out.shapesSorted = await page.evaluate(() => new Promise(res => {
  const HOLES = { circle: { x: 1085, y: 202 }, triangle: { x: 1085, y: 278 }, square: { x: 1085, y: 342 } };
  const svg = document.getElementById('stage');
  const pt = (x, y) => {
    const r = svg.getBoundingClientRect();
    return { clientX: r.left + x / 1600 * r.width, clientY: r.top + y / 900 * r.height };
  };
  let done = 0;
  [...document.querySelectorAll('.shapePiece')].forEach((pc, i) => {
    setTimeout(() => {
      const h = HOLES[pc.dataset.shape];
      const from = pt(+pc.dataset.x, +pc.dataset.y), to = pt(h.x, h.y);
      pc.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, ...from }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: (from.clientX + to.clientX) / 2, clientY: to.clientY }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, ...to }));
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, ...to }));
      if (++done === 3) setTimeout(() => res([...document.querySelectorAll('.shapePiece')].filter(x => x.dataset.done).length), 400);
    }, i * 250);
  });
}));
await page.screenshot({ path: 'school-shapes.png' });

// --- church: handbells
await page.goto(GAME + '#place-church=eya');
await page.reload();
await page.waitForTimeout(700);
out.bells = await page.evaluate(() => document.querySelectorAll('.hbell').length);
await page.evaluate(() => document.querySelectorAll('.hbell').forEach(b => b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))));
await page.waitForTimeout(900);
await page.screenshot({ path: 'church.png' });

// --- S&R: checkout scan x3 -> shop sticker
await page.goto(GAME + '#place-snr=eya');
await page.reload();
await page.waitForTimeout(600);
out.snrScan = await page.evaluate(() => new Promise(res => {
  const svg = document.getElementById('stage');
  const pt = (x, y) => {
    const r = svg.getBoundingClientRect();
    return { clientX: r.left + x / 1600 * r.width, clientY: r.top + y / 900 * r.height };
  };
  const props = [...document.querySelectorAll('#propLayer .prop, #depthLayer .prop')].filter(p => p.dataset.id && p.dataset.id.startsWith('grocery')).slice(0, 3);
  props.forEach((el, i) => {
    setTimeout(() => {
      const from = pt(+el.dataset.x, +el.dataset.y), to = pt(1300, 790);
      el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, ...from }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: (from.clientX + to.clientX) / 2, clientY: to.clientY }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, ...to }));
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, ...to }));
    }, i * 600);
  });
  setTimeout(() => {
    const o = JSON.parse(localStorage.getItem('soft-stickers-eya') || '{}');
    res({ groceryProps: props.length, shopSticker: !!o.shop });
  }, 2600);
}));
await page.screenshot({ path: 'snr.png' });

// --- SM drawn art present, no emoji in venue content
await page.goto(GAME + '#place-sm=eya');
await page.reload();
await page.waitForTimeout(600);
out.smEmoji = await page.evaluate(() => {
  const t = [...document.querySelectorAll('#stage text')].map(x => x.textContent).join('');
  return /[\u{1F300}-\u{1FAFF}\u{2B00}-\u{2BFF}]/u.test(t);
});
await page.screenshot({ path: 'sm.png' });

console.log(JSON.stringify(out, null, 1));
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
await b.close();
process.exit(errs.length ? 1 : 0);
