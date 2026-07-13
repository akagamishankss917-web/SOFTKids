import { chromium } from 'playwright';
import path from 'path';

const GAME = 'file:///' + path.resolve('c:/Users/osins/Claude/Projects/SOFT Kids Game/soft-kids-game/index.html').replace(/\\/g, '/');

// The tables exactly as the user wrote them.
const EXPECT = {
  eya: ['Daddy Laurence', 'Mommy Kristine', 'Tito Boy', 'Kuya Gab', 'Tita Danielle', 'Kuya Jeya', 'Nanay Jessa', 'Tatay Jeff', 'Ate Tia', 'Kuya Timmy', 'Tita Debs'],
  gab: ['Tito Laurence', 'Tita Kristine', 'Tito Boy', 'Eya', 'Mommy Danielle', 'Jeya', 'Tita Jessa', 'Uncle Jeff', 'Tia', 'Kuya Timmy', 'Tita Debs'],
  tia: ['Tito Laurence', 'Tita Kristine', 'Tito Boy', 'Eya', 'Tita Danielle', 'Jeya', 'Tita Jessa', 'Uncle Jeff', 'Gab', 'Kuya Timmy', 'Mommy Debs'],
  timmy: ['Tito Laurence', 'Tita Kristine', 'Tito Boy', 'Eya', 'Tita Danielle', 'Jeya', 'Tita Jessa', 'Uncle Jeff', 'Gab', 'Tia', 'Mommy Debs'],
  jeya: ['Tito Laurence', 'Tita Kristine', 'Tito Boy', 'Eya', 'Tita Danielle', 'Gab', 'Nanay Jessa', 'Tatay Jeff', 'Tia', 'Kuya Timmy', 'Tita Debs'],
};
const KEYORDER = {
  eya:   ['daddyLaurence', 'mommyKristine', 'titoBoy', 'gab', 'mommyDanielle', 'jeya', 'nanayJessa', 'tatayJeff', 'tia', 'timmy', 'mommyDebs'],
  gab:   ['daddyLaurence', 'mommyKristine', 'titoBoy', 'eya', 'mommyDanielle', 'jeya', 'nanayJessa', 'tatayJeff', 'tia', 'timmy', 'mommyDebs'],
  tia:   ['daddyLaurence', 'mommyKristine', 'titoBoy', 'eya', 'mommyDanielle', 'jeya', 'nanayJessa', 'tatayJeff', 'gab', 'timmy', 'mommyDebs'],
  timmy: ['daddyLaurence', 'mommyKristine', 'titoBoy', 'eya', 'mommyDanielle', 'jeya', 'nanayJessa', 'tatayJeff', 'gab', 'tia', 'mommyDebs'],
  jeya:  ['daddyLaurence', 'mommyKristine', 'titoBoy', 'eya', 'mommyDanielle', 'gab', 'nanayJessa', 'tatayJeff', 'tia', 'timmy', 'mommyDebs'],
};

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto(GAME + '#map=eya');
await page.reload();
await page.waitForTimeout(500);

let bad = 0;
for (const hero of Object.keys(EXPECT)) {
  const got = await page.evaluate(([h, keys]) => {
    State.hero = h;
    return { names: keys.map(k => nameOf(k)), self: nameOf(h) };
  }, [hero, KEYORDER[hero]]);
  EXPECT[hero].forEach((want, i) => {
    if (got.names[i] !== want) { console.log(`  MISMATCH ${hero}: ${KEYORDER[hero][i]} -> "${got.names[i]}" (want "${want}")`); bad++; }
  });
  const wantSelf = { eya: 'Eya', gab: 'Gab', tia: 'Tia', timmy: 'Timmy', jeya: 'Jeya' }[hero];
  if (got.self !== wantSelf) { console.log(`  MISMATCH ${hero}: self -> "${got.self}"`); bad++; }
  console.log(`${bad ? '' : 'ok '}${hero.padEnd(6)} ${got.names.join(', ')} | self: ${got.self}`);
}

// voices: every speaking character has one, and they map to the right bank
const v = await page.evaluate(() => {
  const missing = Object.keys(CHARACTERS).filter(k => !CHARACTERS[k].voice);
  return {
    missingVoice: missing,
    sample: { eya: CHARACTERS.eya.voice, jeya: CHARACTERS.jeya.voice, daddyLaurence: CHARACTERS.daddyLaurence.voice, mommyDebs: CHARACTERS.mommyDebs.voice },
  };
});
console.log('voices:', JSON.stringify(v));
console.log(bad ? `\n${bad} NAME MISMATCHES` : '\nall names match the spec');
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors');
await b.close();
process.exit(bad || errs.length ? 1 : 0);
