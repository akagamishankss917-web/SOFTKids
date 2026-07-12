# SOFT Kids Game — Design

**Date:** 2026-07-12
**Status:** Built. Steps 1–6 of §13 are done and verified in headless Chromium;
step 7 (the real cast) is done. Remaining: a second visual pass over the house
interiors and the four venues. See `docs/HANDOFF.md`.
**Derived from:** `Barangay ni Eya` (`C:\Users\osins\Claude\Projects\Eya Game`)

---

## 1. What we are building

A toddler-friendly browser game in the same shape as *Barangay ni Eya*: a barangay
map you walk around, houses you can enter, and four venues to visit. The change is
the cast. Instead of Eya's extended family, the world is populated by the **SOFT
kids** — the children of the church — each living in their own house **with their
parents**.

The player **chooses which kid to play as** at the start. The rest of the kids stay
home as friends to visit.

### Non-goals

- No changes of any kind to the Eya game. It is read-only source material.
- No shared library, submodule, or npm package between the two games. They are
  independent forks that will diverge.
- No build step, no dependencies, no framework.

---

## 2. Constraints (from the user)

| Constraint | Decision |
| --- | --- |
| Runtime | Exactly like Eya: one self-contained `index.html`, PWA, GitHub Pages, own repo |
| Cast size | Unknown and will grow — must be data-driven, no hand-placed map coordinates |
| Protagonist | Player picks at the start (new character-select scene) |
| Faces | Hand-tuned crop fractions in `tools/make_faces.py`, same as Eya |
| Wardrobe | Gender-aware — boy items for boys, girl items for girls |
| Households | A house holds one *or more* kids plus their parent(s), or no kid at all |

---

## 2a. The real cast (settled 2026-07-12, photos supplied)

| Household | Kids (pickable) | Parents |
| --- | --- | --- |
| Eya | Eya *(girl)* | Mommy Kristine, Daddy Laurence |
| Jeya | Jeya *(boy)* | Nanay Jessa, Tatay Jeff |
| Gab | Gab *(boy)* | Mommy Danielle |
| Mommy Debs | Tia *(girl)*, Timmy *(boy)* | Mommy Debs |
| Tito Boy | — | Tito Boy |

Five pickable kids. Tito Boy's house is visitable but he is never a hero — a
household may have zero kids. Mommy Debs' house has two, so a household's `kids`
is a list, and the hero's siblings stand in the home as residents to hug.

Eya's extended family from the source game (Lola Andak, Tita Joyce, Tita Kath,
Auntie, Antle, Kuya Dylan, Tito Nidel) is **deleted** — cast, houses, props and
tasks. The venue NPCs (teacher, pastor, clerks, playground kids) are generic and
stay.

Tito Boy's headshot is `IMG_5170.JPG`, the only one of his five photos where he
is front-facing and unobstructed.

## 2b. Home vs. friend house

`State.hero` is a kid id; the household containing that kid is **home**. This is
the only switch — everything else derives from it.

- The map spawns the player in front of their own house.
- **Home** renders the wardrobe prop, the food tray, the hero's parents, and any
  siblings.
- **A friend's house** renders the same room template with toys, the friend kid
  and their parents — but no wardrobe and no food tray.
- Dress-up returns to the hero's house, not to a hard-coded `house:eya`.

## 2c. Toys must be seamless

Two defects in the source engine, found by reading it:

- `makeDraggable` sets `moved = true` on *any* pointermove, so a touch with a
  pixel of jitter registers as a drag: the prop jumps and plays a drop sound on
  what the child meant as a tap. It needs `charDrag`'s 12px threshold.
- `makeDraggable` has no `App.locked` guard, so props stay draggable during a
  door-opening or a ride animation.

Both are fixed, and every prop and toy is exercised in the headless-Chrome pass.

## 2d. Visual direction

The source art is flat fills with no depth. The overhaul keeps the same SVG rig
and silhouettes — they are legible for toddlers and hard-won — and adds soft
depth: gradient skies, drop shadows under characters and props, rounded highlight
passes on houses and toys, and a warmer, higher-contrast palette. No new
dependencies, no raster assets, still one file.

Title: **SOFT Kids Adventure**. The map jeepney's "EYA EXPRESS" sign is
neutralised.

---

## 3. Venues

All five requested venues **already exist in the Eya codebase** and port over
unchanged:

- **Playground** — on the map (`playgroundSVG()`)
- **School** — already generic (`Paaralan`), never branded to a specific barangay
- **SOFT Church** — Shepherds of Faith and Truth
- **S&R** — grocery + food store
- **SM** — shopping mall

---

## 4. Repository layout

```
SOFT Kids Game/
├── CLAUDE.md                     # WAT framework instructions (copied from Eya)
├── .claude/                      # settings + skills (copied from Eya)
├── households/                   # the cast, as folders — user-maintained
│   └── <Kid Name>/
│       ├── <Kid Name>.jpg        # the kid's headshot
│       └── Parents/
│           ├── <Parent 1>.jpg
│           └── <Parent 2>.jpg
├── photos-raw/                   # unsorted photos; not read by any tool
├── soft-kids-game/               # the deployable game — its own git repo
│   ├── index.html                # the entire game
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── icon-192.png / icon-512.png / apple-touch-icon.png
│   └── .nojekyll
├── tools/
│   ├── make_faces.py             # photos → base64 data-URIs → index.html
│   └── make_icons.py             # PWA icons
├── docs/superpowers/specs/
└── .tmp/
```

`households/` is the source of truth for **who exists and what they look like in
real life** (the photos). `CHARACTERS` in `index.html` is the source of truth for
**how they are drawn** (hair, skin, clothes, gender). The two are joined by the
character id. Adding a friend means touching both: create the folder and drop in
the photos, add a `FACE_CROPS` entry, add a `CHARACTERS` spec, add a `HOUSEHOLDS`
line.

---

## 5. Architecture: content / engine split

The Eya file is already cleanly sectioned by banner comments. The new file keeps
that structure but hoists everything game-specific into one **CONTENT** block near
the top. Below that line, the engine never refers to a specific person.

```js
// ============================================================ CONTENT
const GAME = { title: 'SOFT Kids', version: 'v1' };

const HOUSEHOLDS = [
  { id: 'eya', kid: 'eya', parents: ['mommy', 'daddy'], color: '#f6a8c9' },
  // add a friend = add a line here. No x/y coordinates.
];

const CHARACTERS = {
  eya: { label: 'Eya', gender: 'girl', face: 'eya', skin: '…', hair: '…', … },
  …
};
```

### The three Eya-hardcoded functions

These are the only places the engine knows a name, and they are what block a
player-chosen hero:

| Eya | Becomes |
| --- | --- |
| `effectiveEyaSpec()` | `heroSpec()` |
| `eyaGroup()` | `heroGroup()` |
| `eyaEat(food, eya, camX)` | `heroEat(food, hero, camX)` |

All three read from a single `State.hero` key (a character id). Everything
downstream — drag-to-move, the food tray, hugs, dress-up — follows automatically.

### Isolation

Each unit keeps one purpose and a clear interface:

- **Character rig** (`buildCharacter(spec)`) — takes a plain spec object, returns
  SVG. Knows nothing about who the hero is.
- **Cast** (`CHARACTERS`, `HOUSEHOLDS`) — pure data.
- **Layout** (`layoutHouses()`) — takes `HOUSEHOLDS`, returns positioned houses.
- **Scenes** — each owns `enter()` / `exit()`, routed by `App.go()`.
- **Wardrobe** (`wardrobeFor(gender)`) — takes a gender, returns available items.

---

## 6. Household auto-layout

Eya's six houses have hand-typed `x, y` coordinates and a fixed `WORLD_W = 6400`.
Because the SOFT cast will grow, `layoutHouses()` replaces this:

- Houses are spaced along the barangay road in a **near-row / far-row zig-zag**,
  which is what Eya's map already looks like by hand.
- The **world width grows** with the household count; the venues (school, church,
  S&R, SM) are anchored to the right of the last house rather than at fixed x.
- Colors cycle through a fixed, pleasing palette so a new household never needs a
  color picked by hand.

Adding the eighth friend must not require finding a gap between two palm trees.

---

## 7. Character select (new scene)

`Scenes.pick`, sitting between the title and the map.

- Draws every `kid` in `HOUSEHOLDS` in a row (wrapping to a second row if needed),
  each with their photo face and name.
- Tapping one sets `State.hero` and goes to the map.
- Persisted to `localStorage` so it survives a reload.
- A small "change kid" affordance returns to the pick screen.
- The chosen kid gets the wardrobe, dress-up, and food tray. The others stand in
  their houses as friends to visit and hug.

---

## 8. Gender-aware wardrobe

Every character spec gains a `gender: 'boy' | 'girl'` field.

`WARDROBE` splits into shared items and gendered items — dresses and tiaras for
girls, and boy-appropriate tops/shorts/caps for boys, with neutral items (shirts,
shoes, sandals) offered to both. `wardrobeFor(gender)` returns what the dress-up
screen renders, and `DEFAULT_OUTFIT` becomes a per-gender default.

Boy art assets not present in Eya's rig (Eya's wardrobe is girl-oriented) must be
drawn: at minimum a cap, a boy's shirt, and shorts.

---

## 9. Face pipeline

Unchanged in mechanism from Eya. `tools/make_faces.py`:

1. Walks `households/` to discover characters (kid folder + `Parents/` subfolder).
2. Looks up a hand-tuned crop box `(left, top, right, bottom)` per character, kept
   in the `FACE_CROPS` dict in the script.
3. Squares the box, crops, resizes to 176×176, JPEG-encodes at quality 72.
4. Re-injects the whole `FACES` block into `index.html` between the
   `FACES:BEGIN` / `FACES:END` markers.

Safe to re-run any time. Adding a kid = add a `FACE_CROPS` line and re-run.

The seeded `households/Eya/` reuses Eya's existing photos and known-good crop
fractions, so the game boots with one real household from day one.

---

## 10. What carries over untouched

The bulk of the 3,584-line file, and none of it needs to change:

- WebAudio synth (no audio files) and Taglish speech synthesis
- The character rig — hair, glasses, mouths, hats, tops, bottoms, shoes, arms
- Drag movement (`makeWalker`, `charDrag`, `makeCharMovable`)
- The food tray and eating animation
- House interiors: draggable props, tasks, confetti, cheers
- All four venue interiors + the playground
- `App.go()` scene router with its toddler double-tap guard
- `fitStage()` portrait 90° rotation
- `toStage()` — the iPad/iPhone touch-drag fix that avoids `getScreenCTM`
- Service worker / offline support, `#hash` debug entry points

These were earned through real debugging on real devices. They are ported verbatim.

---

## 11. Error handling

Follows Eya's established posture: **degrade to silence, never to a crash.** Audio
and speech are fully guarded (a device with no `AudioContext` simply plays nothing).
Service-worker registration is a no-op off `http(s)`. `App.go()` refuses re-entry
while a scene transition is running.

New failure modes introduced by this design:

- **A household with a missing face photo** — the character renders with the
  cartoon face fallback (`cartoonFaceLayer`) that already exists in the rig,
  rather than a broken image.
- **No hero chosen** (fresh `localStorage`) — the pick scene is shown; the map is
  unreachable without a hero.
- **A `HOUSEHOLDS` entry naming a character id that does not exist in
  `CHARACTERS`** — `make_faces.py` fails loudly at build time with the offending
  id, rather than the game rendering an empty house.

---

## 12. Testing

Per the project's established practice: drive the built game in headless Chrome
over CDP and assert on the live DOM. The `#hash` debug entry points make each scene
directly reachable (`#pick`, `#map`, `#house-<id>`, `#place-<id>`, `#dressup`,
`#lineup`).

Checks that matter:

- `#lineup` renders every character in `CHARACTERS` with a photo face.
- `#pick` renders exactly one tile per household kid.
- `layoutHouses()` produces no overlapping houses for counts of 1, 6, and 12.
- Choosing a hero, then reloading, keeps that hero.
- The dress-up screen offers girl items for a girl hero and boy items for a boy.

---

## 13. Build order

1. Scaffold + verbatim copy of the engine (**done**).
2. New git repo, new PWA branding, deploy an untouched-but-renamed game to Pages —
   proves the deploy path works before any refactor.
3. Content/engine split: extract `CONTENT`, de-Eya the three hardcoded functions.
4. `layoutHouses()` — remove hand-typed coordinates.
5. `Scenes.pick` — character select.
6. Gender-aware wardrobe + new boy art.
7. Real cast: user supplies photos, crops tuned, households filled in.
