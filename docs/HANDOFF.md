# SOFT Kids Adventure — handoff

**As of 2026-07-12.** The game is built, runs clean, and is playable end to end.
Everything below is on disk. Nothing is half-written.

## Play it right now

Open `soft-kids-game/index.html` in a browser. That single file *is* the game —
no build step, no server, no dependencies.

## What it does

Title → **pick a kid** → the barangay reshapes around them.

Five pickable kids: **Eya, Jeya, Gab, Tia, Timmy.**

The chosen kid's house becomes **home**: you spawn in front of it, it carries the
wardrobe and the food tray, and their parents are inside. Pick **Tia** and her
brother **Timmy** is standing in the house to hug — and the other way round.
Everyone else's house is a **visit**: same room, their toys, their family, but no
wardrobe and no food tray. **Tito Boy** has a house and no kids, so he is never
pickable but always visitable.

The wardrobe is gender-split: girls get 10 dress-up items, boys get 6 (new art —
cap, bucket hat, tee-and-shorts, basketball kit, barong, sneakers). Each kid
**starts in their own clothes**, taken from their real photo; the wardrobe only
overrides a slot once you pick something. Outfits are saved per kid.

## The one design call I made without asking

You picked "gender-appropriate items" and declined per-kid signature looks. Taken
literally that meant every girl booted up wearing **Eya's tiara and pink dress**,
which looked wrong the moment I saw Tia in it. So a kid now defaults to the
clothes they are drawn in, and the wardrobe changes things from there. If you
actually want every girl to start in the same default outfit, say so and it is a
two-line revert in `heroSpec()`.

## Toys

Two real bugs in the inherited engine, both fixed:

- `makeDraggable` treated **any** pointer movement as a drag, so a toddler's tap
  with a pixel of jitter yanked the toy out from under their finger and played a
  drop sound. It now uses a 12px threshold, the same one characters already used.
  A tap is now a tap: wobble and squeak, nothing picked up.
- Props stayed draggable **during** door-opening and ride animations. Every prop
  handler now respects `App.locked`.

## Verified

`node shots.mjs` drives the real game in headless Chromium across all 15 scenes.
Latest run: **no page errors**, and the semantics assert out —

| Check | Result |
| --- | --- |
| Pick screen | 5 tiles |
| Eya's house, playing Eya | wardrobe ✓, food tray ✓, 2 residents (her parents) |
| Debs' house, playing Tia | wardrobe ✓, 2 residents (Timmy + Mommy Debs) |
| Debs' house, playing Timmy | wardrobe ✓, 2 residents (Tia + Mommy Debs) |
| Tito Boy's house, playing Eya | **no wardrobe, no food tray**, 1 resident |
| Dress-up as Eya / as Gab | 10 items / 6 items |

## How the pieces fit

- `soft-kids-game/index.html` — the whole game. The **CONTENT** banner near the
  top holds `GAME`, `CHARACTERS`, `HOUSEHOLDS`. Below it the engine never names a
  child; it reads `State.hero`.
- `tools/make_faces.py` — walks `households/`, crops each face with a hand-tuned
  box, injects them as base64 between the `FACES:BEGIN/END` markers. Safe to
  re-run any time.
- `tools/make_icons.py` — the PWA icons.
- `households/` — the cast, as folders. Source of truth for who exists.

### Adding a sixth kid

1. `households/<Name>/<Name>.jpg` plus a `Parents/` folder.
2. A `FACE_CROPS` line in `tools/make_faces.py`, then re-run it.
3. A `CHARACTERS` entry (needs `gender` to be pickable) and a `HOUSEHOLDS` line.

No map coordinates. `layoutHouses()` places the house, picks its colour, widens
the world and pushes the town east. The pick screen wraps to a second row on its
own.

> ⚠️ **Careful with the FACES block.** It is generated. If you ever bulk
> find-and-replace across `index.html`, re-run `make_faces.py` afterwards — a
> rename I did silently corrupted the `eya` face key and turned her into a
> cartoon until I regenerated it.

## Debug entry points

`#pick`, `#lineup`, `#map`, `#house-<id>`, `#place-<id>`, `#dressup`.
Append `=<kid>` to choose who you are: `#house-debs=timmy`, `#dressup=gab`.
House ids: `eya`, `jeya`, `gab`, `debs`, `boy`. Places: `school`, `church`,
`snr`, `sm`.

## Where to pick up

1. **Second visual pass.** The map, title, pick screen and dress-up got the new
   treatment — sky and grass gradients, soft shadows, a lit-window glow on the
   houses, ground scatter. **The house interiors and the four venues did not.**
   They are still the original flat fills. That is the biggest remaining gap
   between this and "modern kids game with great graphics".
2. **Rig nits.** Gab's cap sits a touch high over the photo face, and the arms
   read as detached on the `openShirt` top (Timmy). Both are in the character rig
   near `drawHat` / `drawArms`.
3. **Ship it.** `soft-kids-game/` is a self-contained static site — drop it on
   GitHub Pages. The PWA manifest, service worker and icons are already
   rebranded, and `sw.js` cache is `soft-kids-v1`.
4. **Not in git yet.** The project has no repo. Worth a `git init` before the
   next round of changes.
