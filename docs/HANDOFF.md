# SOFT Kids Adventure — handoff

**Live:** https://akagamishankss917-web.github.io/SOFTKids/
**Repo:** https://github.com/akagamishankss917-web/SOFTKids (`main` = source, `gh-pages` = the deployed site)

Open `soft-kids-game/index.html` in any browser and it just runs. That one file
*is* the game — no build step, no server, no dependencies. On a phone, "Add to
home screen" installs it as an app that works with no signal.

---

## What it is

Title → **pick a kid** → the barangay reshapes around them.

Five pickable kids: **Eya, Jeya, Gab, Tia, Timmy.**

`State.hero` is the only switch in the game. The household containing that kid is
**home**: you spawn in front of it, it holds the wardrobe and the food tray, and
your parents are inside. Pick **Tia** and her brother **Timmy** is standing there
to hug — and the other way round. Everyone else's house is a **visit**: their
toys, their family, no wardrobe, no food tray. **Tito Boy** has a house and no
kids, so he is never pickable but always visitable.

Wardrobe is gender-split — 10 girl items, 6 boy items. Each kid **starts in their
own clothes**, taken from their real photo; the wardrobe only overrides a slot
once you pick something. Outfits save per kid.

---

## Things to play with

**Indoors** — a basketball hoop you shoot at (arc, swish, confetti), a piano that
plays a tune, a bubble jar, a bouncy ball, plus the drums, blocks, dolls, cake,
cat, robot, guitar, TV, camera, binoculars and watering can from before.

**Outdoors** — a barangay basketball court past the mall, a football to boot
across the field, a bubble machine, the tricycle you can ride, a kite, a dog, a
jump rope, and the playground (slide, swing, seesaw, sandbox, beach ball).

---

## The two bugs that mattered

Both were inherited from the source game and both are fixed and verified:

- **`makeDraggable` counted any pointer movement as a drag.** A toddler's tap with
  a pixel of jitter yanked the toy out from under their finger and played a drop
  sound. It now uses a 12px threshold — the same one characters already had. A tap
  is a tap: it wobbles and squeaks, nothing is picked up.
- **Overlap.** Props sat in a layer *under* every character and the hero drew over
  everyone, so a toy dragged onto a person vanished behind them and a resident
  standing closer still drew behind the hero. Everything that stands on the floor
  now shares one `#depthLayer`, sorted by ground Y (painter's algorithm). Sorting
  happens on drop, not every frame: what you're holding is raised to the front,
  and settles into its true depth when you let go.

---

## Design

Built to the **ui-ux-pro-max** skill's design system, which picked
**Claymorphism** for a children's game: soft 3D, chunky, toy-like. Its checklist
named the two things that made the game look cheap, and both were true:

- **Emoji as icons** → one vector icon set on a 24px grid (`ICON_PATHS`, `icon()`).
  Emoji that remain are *content* illustrations inside venues (shop goods, a
  storybook picture), not controls.
- **Comic Sans** → **Fredoka**, embedded as a woff2 data-URI so the game still
  runs offline from one file.

Every control is a `clayButton()` that squashes on press (CSS `:active` on
`.clayPress`, 140ms spring). Characters have contact shadows. Interiors have lit
walls and receding floorboards (`roomDefs()` for houses, `venueRoom()` for the
four venues). `prefers-reduced-motion` is respected — SMIL is paused by hand in
`applyMotionPreference()`, since it ignores the CSS media query.

---

## How the pieces fit

- `soft-kids-game/index.html` — the whole game. The **CONTENT** banner near the
  top holds `GAME`, `CHARACTERS`, `HOUSEHOLDS`. Below it the engine never names a
  child; it reads `State.hero`.
- `tools/make_faces.py` — walks `households/`, crops each face with a hand-tuned
  box, injects them as base64 between the `FACES:BEGIN/END` markers.
- `tools/make_icons.py` — the PWA icons.
- `households/` — the cast, as folders. **Git-ignored**: the full-resolution
  photos never leave this machine. Only the 176px crops embedded in the game ship.

### Adding a sixth kid

1. `households/<Name>/<Name>.jpg` plus a `Parents/` folder.
2. A `FACE_CROPS` line in `tools/make_faces.py`, then re-run it.
3. A `CHARACTERS` entry (needs `gender` to be pickable) and a `HOUSEHOLDS` line.

No map coordinates. `layoutHouses()` places the house, picks its colour, widens
the world and pushes the town east. The pick screen wraps to a second row.

> ⚠️ **The FACES block is generated.** If you ever bulk find-and-replace across
> `index.html`, re-run `make_faces.py` afterwards — a rename silently corrupted
> the `eya` face key once and turned her into a cartoon until it was regenerated.

> ⚠️ **Close `index.html` in VS Code before running the tools.** An open editor
> tab wrote back a stale buffer once and undid the font embed.

---

## Debug entry points

`#pick`, `#lineup`, `#map`, `#house-<id>`, `#place-<id>`, `#dressup`.
Append `=<kid>` to choose who you are: `#house-debs=timmy`, `#dressup=gab`.
House ids: `eya`, `jeya`, `gab`, `debs`, `boy`. Places: `school`, `church`,
`snr`, `sm`.

## Verifying a change

`scratchpad/shots.mjs` drives the real game in headless Chromium across all 15
scenes and asserts the semantics (friend houses have no wardrobe, the boy and
girl racks differ, siblings appear). `depth.mjs` drags a toy behind a person and
checks it draws behind her. Latest run: **no page errors**.

---

## Deploying

`main` is the source. The site is the `soft-kids-game/` folder published to the
root of `gh-pages`:

```
git subtree push --prefix soft-kids-game origin gh-pages
```

GitHub Pages serves `gh-pages` / root. `sw.js` caches aggressively — bump `CACHE`
in it when shipping, or returning phones keep the old build.

---

## Known rough edges

- Gab's cap sits slightly high over his photo face, and arms read as detached on
  the `openShirt` top (Timmy). Both live in the character rig near `drawHat` /
  `drawArms`.
- The venue interiors still use emoji for shop goods and the storybook picture.
  Fine as illustration, but they'd look better hand-drawn.
