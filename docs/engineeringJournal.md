# Engineering Journal — BlueGrid Land Solutions

Append-only. Newest entry at the top.

---

## 2026-08-30 — HERO TYPING FREEZE (AUDITED, REPRODUCED, FIXED), A PRE-EXISTING INVISIBLE-HEADING BUG FOUND WHILE CHANGING #CONTACT'S COPY, AND WHAT SHIPPED IN BETWEEN THAT WAS NEVER WRITTEN UP

Three things landed since the last entry. The first is a retrospective — real,
shipped, committed work from the days after 2026-08-28 that never got a
journal entry. The other two are this session's own.

### 0. What shipped and was never journaled: the hero Call Now CTA, end to end

Commits `7dc8ba7` through `ab44558` carry a multi-round hero conversion pass
that followed the 2026-08-28 tablet-gap fix below. Summarized here because
nobody wrote it down at the time, and the mechanisms are exactly the kind of
"why is this line here" a future session would otherwise have to re-derive:

- **Call Now added to the hero**, in two stages: first only in the
  1081–1200px band (burger nav active, desktop estimate card still visible —
  a band that had a header phone chip at neither width and no hero-side call
  action), then widened to show at every width above 1080px once it became
  clear "See Transformations" alone was reading as the primary conversion
  action when it's a proof link, not a CTA. `.heroActionsCallCta`'s
  `display: none` moved to a plain base rule (shown wherever `.heroActions`
  itself is shown); the narrower band-only media query was deleted once it
  became redundant.
- **A real narrow-width (≤354px) overflow bug, found and fixed.** `.heroInner`
  collapses to a single grid column below 1080px; a bare `1fr` track defaults
  to `minmax(auto, 1fr)`, and once nothing inside could shrink further, that
  floor forced the column wider than the viewport and silently spilled content
  past its own (correctly-sized) box — clipping the right edge of the Get
  Estimate button and pushing the third proof stat out of view, with no
  horizontal scrollbar to reveal it (`overflow-x: hidden` absorbed it).
  Fixed with `minmax(0, 1fr)` — an idiom already used elsewhere in this
  stylesheet. A second, same-shape bug one level down (`.heroStats`'s own
  flex row didn't shrink below its label's full unwrapped width) needed the
  matching flex fix, `min-width: 0` on `.heroStat`.
- **Vertical distribution inside the hero was tried three different ways**
  before landing: `justify-content: space-between` on `.heroContent` (correct
  idea, but interacted awkwardly with per-child margins), then
  `margin-top: auto` on `.heroStats` alone (created one large dead gap),
  before settling on explicit `margin-bottom`/`margin-top` tuning on
  `.heroStats` and `.heroCopy` and a `.heroKicker` margin bump — small,
  boring, and it works. If a future session finds `space-between` or
  `margin-top: auto` anywhere in this block, it was tried and reverted; don't
  re-derive that path.

**None of this touched the typing animation or the JS pause/resume system** —
it's all CSS plus the one small addition to `index.html` for the Call Now
anchor.

### 1. The hero typing animation could freeze permanently — audited, reproduced, fixed

Reported independently by Aron and a real visitor: the typed headline froze
mid-word. The example given was `"TAKE BACK YOUR P"`.

**Lighthouse first, as a baseline unrelated to the bug report.** Ran against
live production (`https://bluegridlandsolutions.com`, commit `ab44558`,
mobile + desktop, full category set, real Chrome via `npx lighthouse`, not a
local server): **Performance 75 mobile / 95 desktop**, Accessibility/Best
Practices/SEO 100/100/100 both. Mobile LCP 4.6s, driven by render-blocking
Google Fonts (~813ms) and unminified `styleIndex.css` (~505ms) — matches
`technicalDebt.md` item 44's ranked findings exactly, so this is confirmation
against the real host, not a new discovery. The mobile LCP element is
`.heroCopy` (text), not an image; zero image-delivery opportunities were
flagged, so the responsive-image work from earlier sessions is holding up.
No optimization work was in scope this pass — diagnostic only.

**Then the actual audit.** Traced the complete call graph:
`runHeroDuetLoop()` → `typeHeroPhrase()` / `deleteHeroPhrase()` →
`runHeroTypedSequence()` → its `requestAnimationFrame`-driven `handleFrame`.
Checked every item the brief asked for — timers/rAF, visibility/tab changes,
resize/breakpoint handlers, competing animations, event listeners, race
conditions, reduced motion, main-thread blocking — and ruled all of them out
individually:

- Visibility/`IntersectionObserver` pause-resume is correct and wasn't
  implicated (the reported freezes happened with the hero on-screen and the
  tab foregrounded).
- Only two `resize` listeners exist site-wide; neither touches hero typing
  state.
- The before/after image sweep/dissolve already has its own hardened guard
  from a past session ("a plate that never loads must not strand the loop").
- `initializeHeroDuet()` runs exactly once, no re-entrant path.
- Reduced motion bypasses the loop entirely and writes a static complete
  phrase — cannot freeze mid-type by construction.
- Lighthouse's own TBT was 0ms on both profiles — no evidence of routine
  main-thread blocking severe enough to explain a *permanent* freeze.

**What was actually wrong: nothing in the chain could fail safely.** Zero
`try/catch`, zero `.catch()`, and no `window.onerror` / `unhandledrejection`
handler anywhere on the site. Any exception, from any cause, would silently
and permanently kill the `for (;;)` loop, freezing the last partial commit on
screen with only a console line a real visitor would never see.

**Reproduced directly**, not just argued from code reading: loaded the live
production page in real Chrome and injected one controlled exception into the
animation's own `requestAnimationFrame` callback, timed to fire only once the
typed line already had 6+ characters. Froze at `"YOUR P"` — concatenated with
the fixed "TAKE BACK" headline, `"TAKE BACK YOUR P"`, matching the reported
symptom almost verbatim, staying frozen for the full observation window.

**A second, plausible non-exception cause was also identified and defended
against**, even without a confirmed real-world trigger: browser
page-translate features and some extensions are well documented to
reparent/replace live text nodes. `writeHeroTypedText()` caches one `Text`
node and mutates it via `.nodeValue`; if something external detaches it, the
writes keep "succeeding" with nothing visible changing and **no console
output at all** — same frozen appearance, invisible to a naive check.

**The fix, two independent layers, neither touching the existing
pause/resume/hold architecture:**

1. **Per-cycle `try/catch` in `runHeroDuetLoop`.** On failure: write the
   complete current phrase (`heroPhraseIndex` hasn't advanced yet, so it's
   always known), clear the cursor's `isSolid` class so it doesn't look stuck
   solid, breathe, keep cycling.
2. **A `handleFrameOrReject` wrapper around the rAF callback in
   `runHeroTypedSequence`** — required because the first version of the fix
   (try/catch alone) **failed its own test**: an exception thrown directly
   inside a native `requestAnimationFrame` callback does not reject the
   promise awaiting it, it just orphans that promise forever. Routing the
   call through a wrapper that catches and calls `reject()` is what makes the
   exception actually visible to the `await` above it.
3. **An independent watchdog** (`checkHeroTypedWatchdog`, `setInterval` every
   2s, 7s elapsed-since-last-commit threshold) for the class of failure the
   try/catch structurally cannot see: a scheduled frame that simply never
   fires, for any reason, including the translate-tool scenario. 7s is
   comfortably clear of the longest legitimate silent gap a healthy cycle
   ever leaves (~2.7s between typing and deleting, ~2.0s between deleting and
   the next phrase). Gated on `!heroPaused` so it never misfires during a
   real, intentional pause. `writeHeroTypedText()` was also hardened to check
   `heroTypedTextNode.parentNode !== heroTypedText` and rebuild the node if
   it's drifted — same fix that would also self-heal the translate-tool case
   on the very next write, independent of the watchdog.

**Verified 21/21**, including both fault classes distinctly: an internal
exception (recovers via the try/catch with **zero** visible error — properly
absorbed as a handled rejection — and the loop keeps cycling afterward) and an
external stall matching the original reproduction (the try/catch structurally
cannot see it; the watchdog resolves it to a complete phrase within the
window and it stays correct, though the loop itself does not resume cycling
in this specific failure class — an honest trade-off, not a gap: "never
permanently incomplete" is satisfied, "always still animating" was never
promised for a failure this literally external to the page's own code).
Also re-verified: normal cycling, tab hide/show, hero scroll out/in, resize
across breakpoints, reduced motion — all unchanged.

**`js/indexJS.js` only. Uncommitted at time of writing**, per this session's
scope (implementation happened in a follow-up turn after the audit; the audit
itself was diagnostic-only, no files touched).

### 2. The final `#contact` section's new slogan, and the bug it uncovered

Requested: replace the section's heading and "24 hours" copy with three new
lines — "One Machine. One Man." / "Claim Your Territory." / "Unleash Your
Potential." — inside the existing dark/glass container, with clear hierarchy
between the eyebrow and the two-line headline.

**First attempt was wrong**, per direct correction: it removed
`.contactCaption` (the section's existing dark/glass chip) entirely and put
the new heading straight over the machine photo. Two problems followed
directly from that: the eyebrow had no backdrop and read with poor contrast
against a busy image, and — because the new heading was given its own
`data-animate="clipReveal"`, matching what the *old* heading had used — it
exposed a pre-existing bug that had apparently never been noticed.

**The bug: `.contactHeading` never revealed. Confirmed pre-existing.** Before
concluding anything about the new markup, reverted to the original,
untouched heading via `git stash` and tested that too — identical failure.
Instrumented the shared `IntersectionObserver` in `initializeAnimationEngine`
to log every entry touching this specific element: it fires exactly once, at
page load, correctly reporting `isIntersecting: false` (genuinely off-screen
at that time), and **never fires again** — confirmed both with a
`scrollIntoView()` jump and with a realistic incremental `page.mouse.wheel()`
scroll over several seconds, ruling out a headless-jump-specific artifact. An
immediately adjacent sibling using `fadeUp` reveals normally under the exact
same observer. `clipReveal` turned out to be the *only* usage of that
animate-type anywhere on the site (`grep -c` → 1), which is itself a data
point: an animation type with a single, rarely-exercised call site is exactly
where a bug like this survives unnoticed.

**Fix, once corrected to keep the container:** `.contactCaption` restored in
`index.html`, now wrapping all three new lines — `.sectionKicker` "One
Machine. One Man." above a two-line `.contactHeading` ("Claim Your
Territory." / "Unleash Your Potential.", split via a new
`.contactHeadingLine { display: block; }` rule, the same pattern
`.estimateHeadingLine` already uses for the modal heading). **The heading no
longer carries `data-animate` at all** — removing the broken `clipReveal`
attribute was the actual fix, not a workaround bolted beside it. It's now
plain content that appears the instant its parent's own (separately
confirmed-working) `fadeUp` reveal fires. Root cause of why `clipReveal`
itself doesn't work was not chased further — `technicalDebt.md` item 58 has
the full instrumentation trail and a warning against reusing it as-is.

**Verified 22/22** at 1440px and 390px with real incremental scroll: heading
and kicker nested inside the container, heading `opacity: 1` /
`clip-path: none` after scrolling to it (not stuck), container's own reveal
fires with a dark glass background behind the text, CTA button text/href and
the machine image unchanged, zero console errors both widths. Screenshots
confirm strong readable contrast at both sizes.

**`index.html` + `css/styleIndex.css` only. Uncommitted at time of writing.**

### Files Modified (this session, not yet committed)

- `js/indexJS.js` — the typing-animation failsafe (§1)
- `index.html`, `css/styleIndex.css` — the `#contact` section copy + the
  `clipReveal` fix (§2)

### Validation Performed

- Lighthouse, live production, mobile + desktop, full category set (§1)
- Fault-injection reproduction of the original freeze, live production (§1)
- 21/21 targeted failsafe tests: normal cycling, tab hide/show, hero
  scroll out/in, resize, reduced motion, internal-exception fault,
  external-stall fault (§1)
- `IntersectionObserver` instrumentation proving the `clipReveal` failure,
  on both the original and the corrected markup (§2)
- 22/22 targeted contact-section tests at 1440px/390px with real incremental
  scroll (§2)
- `node --check js/indexJS.js` — OK
- `node _qa/runAll.js` — **90/90** (56 video + 34 sitewide regression), run
  fresh at the end of the session

### Lessons Learned

- **An animation type used exactly once is a bug waiting to be found.**
  `clipReveal` had one call site on the entire site and was silently broken
  the whole time. If something is rare enough that nobody has looked at it
  recently, "it must be fine, nothing changed" is not evidence.
- **A promise that's never rejected is not the same as code that never
  fails.** The first pass at the typing-animation fix looked complete and
  failed its own test, because an exception inside a raw
  `requestAnimationFrame` callback doesn't propagate as a rejection on its
  own — it just orphans the promise. Testing the actual failure mode, not just
  the code path, caught this before it shipped.
- **Two failure classes need two mechanisms, and conflating them is a false
  economy.** A single `try/catch` cannot see a callback that never runs at
  all; a single watchdog can't distinguish "genuinely paused" from "actually
  stuck" without also tracking pause state. Building both, scoped narrowly,
  cost less than debugging one mechanism trying to do both jobs.
- **When a correction arrives, re-derive from the original, not from your own
  attempt.** Testing the *original* untouched heading (via `git stash`) before
  concluding the reveal bug was pre-existing is what kept this from being
  mis-filed as a regression in the copy change.

---

## 2026-08-28 — LAUNCH DAY: PUSHED TO NETLIFY, THEN FIXED THE CONVERSION GAP IT EXPOSED

Two things happened. `e380746` — "Prepare BlueGrid production launch", 50 files,
+3357 / −421 — carried the geographic SEO architecture, the Chase intro video
and the `_qa/` suite to `origin/main`, and Aron deployed it to **Netlify**
(project `bluegrid-land-solutions`). Then the deployed preview exposed a
conversion gap that no amount of local desktop work had made visible, and the
rest of the session was spent closing it.

**DNS has not been switched.** `bluegridlandsolutions.com` still points at
GitHub Pages.

---

### 1. The gap: 641–1200px had no conversion action at all

The nav collapses to a hamburger at **1200px**. The bottom action bar carrying
*Call Now* and *Free Estimate* only appeared at **640px**. Nobody had put those
two numbers side by side before.

So every width from **641px to 1200px** — the entire tablet and small-laptop
band — shipped a header that was logo plus hamburger, no phone number, no
estimate CTA, and no floating bar either. The only route to converting was to
open the menu first.

That is the defect. Everything below is the argument about how to close it.

### 2. The wrong fix, and why it was reverted

The first attempt put the existing `.phoneChip` back into the burger header:
`[logo] [(740) 464-2526] [☰]`, with the number collapsing to a compact "Call"
below 480px. It worked, it measured 118/118, and it was wrong.

Two reasons, and the second is the one that settled it:

- **It created a second conversion pattern.** The site would have had a header
  CTA between 641–1200px and a bottom bar below 640px — two different answers
  to the same question depending on how wide the screen was.
- **At 324px it crowded the wordmark.** Aron caught this on a real device.
  The chip, the badge, the "BLUEGRID / LAND SOLUTIONS" lockup and a 44px
  hamburger do not coexist at that width without something giving.

The instinct to shrink things to fit was explicitly rejected. The right move
was to remove the redundant element and give the brand back the space.

### 3. The fix: one pattern, the bar, everywhere

**The bar's rules moved out of the 640px block into a top-level
`@media (max-width: 1200px)`.** Not copied — moved, so there is one definition
rather than two that can drift. `.backToTopButton` deliberately stayed at
640px; a back-to-top control on a tablet is a different question.

`mobileActionMediaQuery` in `js/indexJS.js` went `640px → 1200px` to match.

**And the bar was retied to the hero.** It had been keyed to
`isHiddenMobile` — "the header hid itself on a scroll down" — which meant it
could appear over the hero's own Call Chase and Get Estimate controls while
the visitor was still looking at them. Two copies of the same two actions,
one on top of the other.

```js
const heroBounds = heroSection ? heroSection.getBoundingClientRect() : null;
const hasLeftHero = Boolean(heroBounds) && heroBounds.bottom <= 0;
```

The hero owns conversion while it is on screen. The bar takes over once it is
not, and stands down again the moment the visitor scrolls back.

### 4. The hero row: three-across became two rows

At burger widths the hero offered `[Call Chase] [address field] [Get Estimate]`
on a single flex line, which squeezed the field — the thing actually being
filled in — between two buttons.

It is a two-column grid now: the two actions share row one, the address field
spans both columns on row two.

**`display: contents` on the form is what made that possible without touching
the markup.** The `<form>` box disappears from layout so its input and button
become grid items of the container, while the form element itself — and
therefore the submit handler, the label association and the whole existing
estimate flow — is untouched. Verified in-browser that the form still owns
both controls afterwards.

### 5. The measurement that changed the design

Below 430px, "Call Chase" wrapped to two lines and the CTA pair grew from 62px
to 91px tall. The reflex is to accept the wrap or stack the buttons. Measuring
first gave a better answer:

| width | column | label needs | at `.buttonLarge` padding |
|---|---|---|---|
| 430px | 185px | 183px | just fits |
| 414px | 177px | 183px | wraps |
| 375px | 158px | 183px | wraps |
| 324px | 157px | 183px | wraps |

The padding was 33.6px a side — 67px of horizontal air the button did not
have. Cutting it to 0.85rem inside `.heroMobileActions` only frees ~40px, and
the label fits on one line at every width down to 320px. **Measured heights
after: 62px at all fourteen widths from 1080px to 320px.** The layout never
had to break; the padding did.

### 6. The bug the suite caught

The bottom-bar rules were first inserted at **brace depth 2** — nested inside
another media query, because the insertion point was found by searching
backwards for a comment banner and the search matched an *indented* banner
inside an already-open block.

Result: the bar was `display: none` at 1200px and worked everywhere below. The
targeted suite reported `call=0 est=0` at exactly one width. Without it, that
ships silently as "the bar does not work on tablets" — the same class of defect
the session had just been convened to fix.

Relocated to top level, re-verified, 216/216.

### 7. What the host change quietly invalidated

Worth recording because it is a documentation trap, not a code one.

`_qa/` is named with a leading underscore **specifically** because GitHub Pages
runs Jekyll, and Jekyll does not copy `_`-prefixed directories into the built
site. That reasoning is written down in `_qa/README.md` and in
`technicalDebt.md` item 53.

**Netlify does not run Jekyll**, and there is no `netlify.toml`, `_redirects`
or `_headers` in the repository — verified. So `_qa/` is now publicly served,
which is the exact opposite of the documented intent. Nothing in it is secret
(inert test JS; `node_modules` is gitignored) but it is crawlable, and the
sitemap is about to be submitted to Search Console.

Two other Pages behaviours the docs depended on are now assumptions rather
than facts: **`www` → apex** was handled by Pages for free and must be
configured on Netlify, and **`404.html` served at any depth without a
redirect** — the reason every path in that file is root-absolute — has not
been re-verified on the new host.

None of these were touched. All three are recorded in *Hosting* and in the
launch sequence.

### Files Modified

- `css/styleIndex.css` — chip re-hidden in burger mode; bar relocated to a
  top-level 1200px block; hero grid; sub-430px padding
- `index.html` — redundant `Get My Free Estimate` hero button removed
- `js/indexJS.js` — bar breakpoint 640→1200; visibility retied to the hero

**Uncommitted at the time of writing**, at Aron's instruction.

### Validation Performed

- `node _qa/runAll.js` → **90/90** (56 video + 34 sitewide), unchanged
- Targeted responsive suite → **216/216** across 10 burger widths and 5 narrow
  header widths
- CTA height 62px — single line — at all 14 widths from 1080px to 320px
- Wordmark-to-hamburger gap **42.9px at 324px**, **38.9px at 320px**, unclipped
- Bottom bar confirmed sitting *above* the cookie banner via the existing
  `--consentBannerOffset`
- Zero diff touching schema, meta, canonicals, geographic copy, footer, video,
  analytics, `sitemap.xml`, `robots.txt`, `docs/`, `services/`, `locations/`

### Lessons Learned

- **Deploying is a diagnostic.** The 641–1200px gap existed for weeks and was
  invisible in local desktop work. Putting the site on a real URL and looking
  at it on a tablet found it in minutes.
- **Two patterns for one job is the bug, even when both work.** The header chip
  passed every check it was given. It was still wrong, because the site then
  had two different answers to "how do I convert" depending on screen width.
- **Measure before redesigning.** "Call Chase wraps" looked like a layout
  problem and was a padding problem. Four numbers turned a redesign into a
  two-line change.
- **A migration invalidates documentation silently.** Nothing failed when the
  host changed. Three written assumptions simply stopped being true, and only
  re-reading them against the new host surfaced it.

---

## 2026-08-27 (second session) — THE OWNER VIDEO SHIPPED, AND THE FIRST VALIDATORS ENTERED THE REPOSITORY

**Uncommitted at the time of writing.** Chase's introduction video arrived and
Section 2 is live: a lossless faststart web copy, a poster cut from the video
itself, a centred play affordance, and draft captions transcribed from his own
audio. Separately, `_qa/` was created — the first validation infrastructure this
project has ever version-controlled (item 10i).

---

### 1. The rotation that wasn't

Three closeouts carried the instruction **"the file arrives rotated 180 degrees
and must be corrected before anything else is done with it."** It was wrong, and
acting on it would have shipped Chase upside down.

`ffprobe` reports a **Display Matrix side-data block with `rotation=-180`**. The
pixels *are* stored inverted, but the rotation is metadata every browser honours
on playback. Re-encoding with a rotation filter would have baked the correction
into the pixels **while leaving the matrix in place**, and the browser would then
have applied it again.

The right move was to change nothing about the picture. What the file actually
needed was a container fix, not a rotation.

**How it was proven rather than assumed.** A frame is drawn from the live
`<video>` into a canvas and compared against the same timestamp decoded by
ffmpeg, which applies the matrix by default. Mean absolute difference against
the upright reference is **4.81**; against that reference rotated 180 degrees it
is **65.43**. A second, model-free check backs it up: the top strip of the frame
is brighter than the bottom (sky above ground, 165.0 vs 115.3). Both now live in
`_qa/verifyIntroVideo.js`.

### 2. What was actually wrong with the file: `moov` at the end

The master is `ftyp -> mdat -> moov`, with the index at **offset 8,989,444** —
the very end. A browser cannot begin playback until it has the `moov` atom, so a
progressive load has to reach the tail of an 8.6MB file before the first frame
draws.

Fixed with a **stream copy, not a re-encode** — `-c copy -movflags +faststart`.
Result: `ftyp -> moov -> free -> mdat`, with `moov` at **offset 32**.

**Verified lossless three ways.** The H.264 elementary stream hashes identically
before and after (`172aaf2c...`), so does the AAC stream (`bd9cbed1...`), and so
does a `framemd5` of the fully decoded output (`e298a6b9...`). Nothing was
re-encoded; only the container was rewritten. Later, extracting the poster frame
from the master and from the web copy produced **byte-identical PNGs** — a
fourth confirmation, for free.

The file also shed **276,189 bytes** on the way through, because ffmpeg's default
stream selection dropped **six `mebx` Apple timed-metadata tracks** the master
carries. Nothing references them.

### 3. `preload="none"`, and why faststart still mattered

The section keeps `preload="none"`: **not one byte of the 8.7MB video is fetched
until a visitor presses play.** Verified — 21 requests on initial load, none of
them `.mp4`, and `readyState === 0` before interaction.

That makes faststart look pointless at first glance, and it is worth writing down
why it is not. Faststart did not buy a cheaper *preload*; it bought a faster
*start*. The moment play is pressed, the browser has the index in the opening
bytes instead of needing a second range request into the tail. The original
comment in the config justified `preload="none"` partly by "the moov atom is at
the end", and that reasoning had to be rewritten once it no longer was.

### 4. Captions, and one word left deliberately wrong-looking

No speech-to-text was available locally and this ffmpeg build has no `whisper`
filter, so a `faster-whisper` environment was built in a scratchpad venv — never
in the user's global Python — and the audio transcribed with **three** models:
`small.en`, `medium.en`, and `large-v3-turbo`.

Running three was not thoroughness for its own sake; it was how the ambiguous
words got settled by vote rather than by guess:

| heard | small | medium | turbo | shipped |
|---|---|---|---|---|
| "My name is / name's Chase" | name's | is | is | **is** (2 of 3) |
| "owner and operator / owner-operator" | and operator (`p=0.32`) | owner-operator | owner-operator | **owner-operator** |
| "the works / work's there" | works | works | work's | **works** (2 of 3) |

Two corrections were applied on top, and they are corrections rather than
inventions: all three models heard **"Blue Grid Lane Solutions"** and **"lane
clearing"**. The company is *Land* Solutions and *land clearing* is a named
service with its own page. A final `/d/` before `/s/` and `/k/` goes unreleased
in ordinary speech, which is exactly why all three made the same mistake.

**"bush hogging" was left exactly as spoken**, and this is the interesting one.
All three models heard *bush* with high confidence. The site's own copy says
**"brush hogging" 100+ times against two instances of "bush"**. Captions
transcribe speech, not house style, so the VTT records what Chase said and the
mismatch is flagged in the file's own `NOTE` header. Aron confirmed it stays.

**The track is attached but not defaulted on.** `default` would paint unapproved
wording across his face for every visitor. It is one line to enable once signed
off.

### 5. The poster: chosen by measurement, not by taste

`introVideoPoster` had been pointing at a job photograph of an excavator — a
4:3 picture of a machine standing in for a video about a person.

Candidate frames were scored on **variance of the Laplacian over a fixed
head-and-shoulders window**, so the numbers compare directly across candidates:

| t | face sharpness | reads as |
|---|---|---|
| **21.30s** | **1096** | mouth closed, square to camera — **chosen** |
| 20.43s | 1076 | near-identical, mouth slightly parted |
| 10.27s | 950 | arm sweeping across the cleared trail |
| 9.87s | 825 | same gesture, softer face |
| 1.73s | 740 | calm and pre-speech, but he is furthest away and in brim shadow |
| 22.20s | 667 | motion blur |

**A method note worth keeping.** The first attempt located his face by
background-median subtraction — the camera is locked off, so the per-pixel median
across a window is a clean plate. It works well where he moves and **fails
silently where he does not**: in the 1.0–2.2s window he is almost motionless, so
he contaminates his own background plate and the scores there are meaningless.
The fixed-window measurement above replaced it. *A segmentation trick that
depends on motion cannot be trusted on a frame chosen for stillness.*

WebP quality was then tuned against his face specifically rather than the whole
frame — the background foliage is high-frequency and would have dominated a
whole-frame metric:

| q | bytes | face SSIM | face PSNR |
|---|---|---|---|
| 85 | 48,768 | 0.9776 | 39.5 dB |
| **88** | **54,972** | **0.9818** | **40.5 dB** |
| 90 | 60,794 | 0.9845 | 41.3 dB |

q88 clears both transparency thresholds with returns flattening after. The
encoded poster retains **98.3%** of the lossless face-window sharpness, and at
**54,972 bytes it is 58% lighter than the 130,782-byte photograph it replaced** —
which matters, because a poster takes no `srcset` and is fetched in full on
first load.

It lives in `graphics/videos/`, not `graphics/images/`, because in that folder
the `-640`/`-1024` suffix means "member of a responsive set" and a poster has no
siblings.

### 6. The play affordance

Chrome on the desktop draws a control bar along the bottom and **nothing in the
middle**. With a poster of a man standing in a field, the section read as a
photograph rather than as something to press.

A real `<button>` is now injected beside the player. It covers the whole frame,
so the poster itself is the click target; it carries an accessible name and a
border-drawn triangle (no SVG, no extra request); and it listens for the **`play`
event** rather than its own click, so starting playback from the control bar or
the keyboard dismisses it too. It sits inside the slot that already owns the 16:9
box, so it reserves no new space — **CLS measured 0.0008**.

Reduced motion follows the convention the CTAs already set in this stylesheet:
the colour change survives because it is feedback, the transform goes.

### 7. THE BUG THAT WASN'T: a test server that lied

Worth recording in full, because it cost a session and looked exactly like a real
defect.

A caption assertion failed with **"no active cue at t=10.5s"**. Everything
pointed at a broken caption track.

The captions were fine. **`python -m http.server` does not implement the `Range`
header.** Chrome cannot seek inside a media file served without it: a forward
seek past the buffer makes it abort the load and restart from byte 0, and
`currentTime` silently comes back as **0.00** instead of the value that was set.

Two things confirmed it. Serving the same files from a range-capable server made
the assertion pass immediately — and the **orientation measurement simultaneously
sharpened from 25.54 to 4.81**, because that earlier seek had also been landing
on frame 0 rather than t=5.0. One broken assumption had been quietly degrading a
second, unrelated measurement.

**The fix is infrastructure, not a workaround.** `_qa/rangeServer.js` implements
`206 Partial Content`, and `verifyIntroVideo.js` now asserts *that the seek
actually landed* before drawing any conclusion from the frame — so the symptom
can never be misread the same way again.

**Lesson:** when a browser test fails, rule out the harness before the site. A
convenience one-liner is a dependency with behaviour, and here its behaviour
differed from production in a way that produced a plausible false positive.

### 8. `_qa/` — the first validators in version control (item 10i)

Item 10i has been open for weeks: 28 validator suites living in session
scratchpads, **already lost in transit twice**. This session it was addressed in
part rather than in full.

`_qa/` now holds `rangeServer.js`, `verifyIntroVideo.js` (56 checks),
`regressionPages.js` (33 pages), a shared `lib/harness.js`, and `runAll.js` as
the entry point. **90/90 passing.** Its one dependency, `puppeteer-core`, is
declared in `_qa/package.json`; `node_modules` is ignored.

Three choices made specifically because this item's history is a history of rot:

- **The page list is discovered by walking the repo, not written down.** During
  this very session a hand-typed URL produced a confident failure that was a typo
  in the test, not a defect in the site — a hardcoded list is a liability.
- **The orientation reference frame is generated by ffmpeg on demand**, not
  committed. A 170KB raw binary would go stale the moment the video changed and
  nobody would notice.
- **The folder is `_qa`, not `qa`.** This repository *is* the deployed site.
  Jekyll — which Pages runs, there being no `.nojekyll` — does not copy
  `_`-prefixed directories into the built site. Recorded as item 53 along with
  the caveat that this has not been checked against live.

**Deliberately not preserved:** the frame-scoring scripts, the transcription
harness, the poster previews, the screenshot generators. They answered questions
that are now answered; their conclusions are in this entry. Committing them would
have been committing rot.

**Item 10i is not closed.** The 28 scratchpad suites were not carried into this
session and were not run. `validateAssets` — still the only guard against a
casing-mismatch 404 that Windows hides and GitHub Pages punishes — remains in no
repository anywhere.

### 9. The master is out of the repository

`IntroVideoFromChase.mp4` is 9MB, nothing on the site loads it, and this repo is
served by GitHub Pages. Committing it would have put it permanently in Git
history *and* made it publicly downloadable, to serve a file no page references.

Archived to `ClientSites/_archive/client_BluegridLandSolutions/video/` and
verified byte-identical **before** the ignore rule was added, then excluded.
`git log --all -- <path>` returns zero commits, so no history rewrite is needed.
The ignore rule names the single file and carries a warning against widening it
to `graphics/videos/`, which would break the section.

**The trade-off is now recorded as item 52:** the one irreplaceable artifact in
the project is the one artifact version control is no longer looking after, and
the archive is on the same disk as the working copy.

### Files Created

- `graphics/videos/chaseIntro.web.mp4` — 8,742,071 B faststart remux
- `graphics/videos/chaseIntro.poster.webp` — 640x360, 54,972 B
- `graphics/videos/chaseIntro.en.vtt` — 13 cues
- `_qa/runAll.js`, `_qa/rangeServer.js`, `_qa/verifyIntroVideo.js`,
  `_qa/regressionPages.js`, `_qa/lib/harness.js`, `_qa/package.json`,
  `_qa/README.md`
- `ClientSites/_archive/client_BluegridLandSolutions/` (outside the repo)

### Files Modified

- `js/indexJS.js` — poster/source/captions config, caption `<track>` injection,
  play affordance injection, `preload` rationale rewritten
- `css/styleIndex.css` — play affordance, reduced-motion guard, corrected the
  `object-fit: cover` comment whose stated reason (a 4:3 stand-in) no longer held
- `.gitignore` — master excluded, `_qa/node_modules/` excluded
- `index.html` — **unchanged this session.** The injector did the whole job, as
  item 13 predicted it would.

### Validation Performed

- `node _qa/runAll.js` -> **90/90** (56 video + 34 sitewide)
- All **33 pages** load 200, one `h1` each, zero console/page errors, and
  **every asset every page requests resolves** — checked by recording each 404
  the server serves rather than by trusting `fs.existsSync`
- No `.mp4` **or** `.vtt` request on initial load, at 1440/768/390
- Playback started by a genuine `page.click()` with **no autoplay-policy
  override**
- `node --check` clean on `js/indexJS.js`; CSS braces balanced **679/679**
- Master re-verified byte-identical (MD5 `63f9fa5255a4840db6abbd29d5dfd950`)

**Not run:** the 28 scratchpad validator suites. They were not carried into this
session. This is the third consecutive session in which item 10i has cost
something.

### Lessons Learned

- **A carried-forward instruction is a hypothesis, not a fact.** "It arrives
  rotated 180 degrees" survived three closeouts and was wrong. Ninety seconds of
  `ffprobe` beat three sessions of notes.
- **Rule out the harness before the site.** A test server without `Range` support
  produced a failure indistinguishable from a broken caption track, and quietly
  corrupted a second measurement at the same time.
- **Measure on the thing you care about.** Whole-frame sharpness and whole-frame
  SSIM are both dominated by background foliage; every decision that mattered
  here came from measuring *his face*.
- **A clever automatic method can fail silently on exactly the input you chose it
  for.** Background-median subtraction needs motion; the calmest candidate frames
  are the ones with none.
- **Preserve what catches regressions; discard what answered a question.** The
  poster-scoring scripts did their job and would only rot. The range server will
  be needed every single time anyone tests media again.

---

## 2026-08-27 — THE FOOTER LEGAL ROW, THE FAVICON DECISION, AND TWO TOOLCHAIN LESSONS

**Committed by Aron as `2080723` "Footer links and devCredit fix"** — 34 files,
+702 / −542: the 33 pages plus `css/styleIndex.css`. Pushed.

**The Google-side work is finished**, reported by Aron and recorded as his
report because none of it is checkable from here: both `config` tab emails
confirmed as the real BlueGrid Gmail account, `config.gs` and `validation.gs`
pasted into Apps Script, and the existing deployment updated with **New
version** — the path that preserves the `/exec` URL all 33 forms post to. The
repository and production now run the same backend code for the first time
since 2026-08-15.

---

### 1. The footer legal row — a grid track that could not give ground

**The report:** at narrower desktop and tablet widths the legal links were
eating the footer and pushing the Nulo developer credit toward, and eventually
past, the right edge.

**The mechanism, measured rather than guessed.** `.footerBottomInner` was a
three-zone grid, `1fr auto 1fr`: copyright left, legal links centre, credit
right. The two `1fr` tracks are equal *regardless of their content*, which is
exactly why that grid was chosen — it is the only way to centre the middle zone
against two outer blocks of different widths. But it also means the centre
track can only grow by taking from both outer tracks equally, and the credit is
the wider of the two, so it is the one that visibly suffers. Driven in real
Chrome at 1024px:

| | before | after |
|---|---|---|
| legal row width | 603.7px in the centre track | 976px, its own row |
| `.devCredit` | **162.2px, compressed** | 176.1px, its natural width |
| `.footerCopyright` | **3 lines** (66.5px tall) | 1 line (22.2px) |

**The fix is structural, not cosmetic.** The nav moved out of
`.footerBottomInner` into `.footerLegalBar`, a row of its own placed
immediately *before* `.footerBottomBar` — which is the element carrying the
`border-top` that *is* the divider. Below the divider only two zones remain, on
`1fr auto`: the `auto` track sizes to the credit and nothing else, so the
credit is flush right and cannot be squeezed by the copyright beside it.

**The nav was moved, not rebuilt.** Same element, same `aria-label`, same four
hrefs at whatever depth each page uses (`privacy/`, `../privacy/`, and
`/privacy/` on `404.html`), same `data-animate` attributes, same consent
button. Only its indentation changed, by one level. The script planned all 33
pages first and refused to write unless every plan was clean — a half-applied
chrome edit across 33 files is worse than no edit — and guarded href identity,
visible-text identity, DOM order, and the file's own line-ending counts.

**Wrapping was measured across 14 widths, not assumed.** One line down to
700px, two to 430px, three at 390px and below, and **no wrapped line ever
begins with a separator**, which would read as a stray dot. That last property
is now asserted rather than hoped for.

**A new suite, `validateFooterLegalRow`**, drives 40 page/viewport combinations
in real Chrome — 5 page shapes across the 8 widths the brief named. It asserts
the row paints above the divider *measured against the divider's real painted
position*, that `.footerBottomInner` holds exactly the copyright and the credit
in that order, that nothing in the footer paints past either viewport edge,
that the two zones do not overlap, that the credit's logo actually decoded,
that every control is hit-testable, and that Cookie Settings still reopens the
consent banner. **Injection-proven:** pushing the row below the divider and the
credit past the right edge produced 95 failures naming exactly those two
defects.

**Two traps worth recording.** First, the consent banner is pinned to the
bottom of the viewport on a first visit and covers the bottom of the footer, so
hit-testing reported every control as dead when a real visitor can click all of
them; the suite now answers the banner before measuring. Second, the site has
**pre-existing horizontal overflow of 8 to 10px** on the homepage from
unrevealed `[data-animate]` transforms — harmless, invisible, since `html` is
`overflow-x: hidden` — but it means a global scrollWidth-versus-clientWidth
assertion fails for reasons that have nothing to do with the footer. The
overflow check is scoped to the footer subtree on purpose.

---

### 2. The favicon question, settled on measurement

A second favicon package was generated from the circular BLUEGRID wordmark logo
and put beside the deployed one. The audit answered a specific worry — that the
new mark looked too small or too padded in tabs and Google results — and the
answer turned out to be neither.

**Neither package has any transparent padding.** Both are a disc inscribed
edge to edge: opaque area 78.5% of canvas, which is pi/4, the signature of a
circle in a square; content bounding box the full canvas; margin to the canvas
edge 0px, at every size in both packages. The apparent padding is *internal
layout* — the wordmark lockup occupies 19.9% of the icon's height — plus what
Google's SERP container and Android's maskable crop add downstream.

**The real failure is feature scale.** Median stroke width in each 512 master,
projected to real render sizes:

| Feature | at 512 | at 16px | canvas needed for a 2px stroke |
|---|---|---|---|
| Mountain/tree, main trees | 95px | **2.97px** | **11px** |
| Wordmark, BLUEGRID | 20px | 0.63px | 51px |
| Wordmark, LAND SOLUTIONS | 5px | **0.16px** | **205px** |

A 0.16px stroke cannot be drawn; it becomes a 16% grey tint of one pixel row.
Detail survival — downscale, restore, RMSE against the master — is 2.3x worse
for the wordmark at every size: **it loses more at 96px than the tree mark
loses at 16px**. Contrast does not rescue it. The wordmark's ink is 18.78:1
against its disc while the tree mark's white-on-sky is only 1.92:1, and the
tree mark wins anyway, because shapes at 3px beat contrast at sub-pixel.

**It also fails the maskable safe zone.** The wordmark spans 96.1% of the
canvas width; Android's safe zone is a circle of 80% diameter. Under the crop
that `site.webmanifest` invites with a maskable purpose, BLUEGRID is clipped at
both ends. The tree mark's finest detail sits at x 158 to 434 of 512 and
degrades gracefully.

**A mixed strategy was offered and declined.** The wordmark was measurably
better in exactly one place — Apple Touch and the manifest icons at 180 to
512px, where it is fully legible and reads as a genuine app icon. Aron chose
one artwork everywhere. Recorded in `technicalDebt.md` item 39 with the
numbers, so this does not get re-litigated from memory.

**Restoring, not copying.** Every referenced favicon had been deleted from the
working tree during the comparison, so a local serve rendered none. They were
restored with a checkout from HEAD, which returns the **exact deployed bytes
that have already passed `validateFavicons`** — the `oldFavicons` package was a
re-encode with identical pixels but different bytes, and copying it would have
churned the repo for no visual change.

**One file in that package was not a re-encode at all.** Its
`apple-touch-icon.png` was a bleed-to-edge transparent circle, RMSE **0.464**
against the deployed file, having lost the opaque 10%-margin treatment the
deployed icon carries: 100% opaque, 18px inset, 144x144 ink box. Copying the
folder wholesale would have regressed iOS the same way the 2026-08-19 incident
regressed browser tabs. The comparison folders were then deleted — 14 files,
1,290 KB, zero references, never tracked.

`graphics/logos/masterFavicon_BG.png` is the rejected wordmark master, kept
deliberately as an alternate *logo* concept to show Chase. It is not an
approved favicon.

---

### 3. Two toolchain lessons, both predicted by item 10i

**The transit failure happened again, and differently.** The scratchpad was
carried forward by copying the `.js` files only, which left `fonts/` behind.
`validateHeader`, `validateInsightsSection` and `validateMegaMenus` all died on
a missing `inter600.extracted.ttf`. Nothing was wrong with the site. The
previous incident was a *lost suite*; this one was a lost *dependency*, which
is quieter — the suites were present and simply could not run. **Copy the whole
directory.**

**A validator drifted out of sync with the code it guards.**
`validateAnalytics` asserted the footer's three-zone grid, `1fr auto 1fr`, and
a DOM order of copyright then legal then credit — precisely the architecture
this session replaced. It was rewritten to assert the new contract rather than
relaxed or worked around, because a validator that has stopped describing the
code is worse than no validator. This is item 10i's second failure mode, and it
was caught only because the suite failed loudly.

**A line-endings correction.** `docs/technicalDebt.md` is **LF**, while
`projectState.md` and `engineeringJournal.md` are **CRLF**. A first scripted
edit asserted CRLF and aborted before writing, which is the guard working as
intended. The check that produced the wrong belief was a `grep -c` for a
carriage return, which matched every line rather than every CR — **verify a
line-ending claim by counting bytes, not by grepping.** `projectState.md`'s
line-endings table covers source files but not docs.

---

## 2026-08-21 — THE BACKLOG SHIPPED, AND WHAT WENT INTO IT

**Committed and pushed by Aron as `90f10ec` "Complete"** — 85 files,
+10,007 / −1,143, the entire working tree in one commit. Everything three
previous closeouts described as "finished but uncommitted" is now live: the
mobile UX pass, WebP migration, production hardening, hero estimate UX, the
699px process breakpoint, the favicon structural fixes, `404.html`, the four
legal pages, and this session's work below.

**The Apps Script backend did NOT ship with it and cannot.** `config.gs`
changed in this commit and `validation.gs` in `c4cef24`; both are pasted by
hand into Google. A commit never reaches Apps Script.

---

### 1. A local performance audit, and separating the server from the site

Served the working tree with the project's own `serveSite.js` and drove
Lighthouse 13.4.1 against real Chrome, mobile and desktop.

**The first thing worth recording is a measurement error avoided.** A stale
server from an earlier session was still running on port 8899 serving an OLDER
copy of the site — 137,898 bytes for `/` against the current 176,020. Anything
measured against it would have been quietly wrong. Always check what the port
is actually serving.

**The second is that `serveSite.js` is the wrong server for this job.** It
sends no compression and no cache headers, which is correct for correctness
testing and misleading for performance testing: Lighthouse invents a "text
compression, 115 KiB" opportunity that GitHub Pages already takes. Built
`serveSiteProduction.js` (gzip + `Cache-Control: max-age=600`, what Pages
sends) and re-ran everything. The picture changed materially:

    raw server      mobile 66   desktop 87   1,738 KiB
    gzip + cache    mobile 75   desktop 91   1,307 KiB

Minification savings collapsed with it — 71 KiB to 16 KiB for CSS, 71 to 19 for
JS — which is why minification is NOT recommended despite what the raw run
says. **Report the number the host will actually produce.**

**Baseline (gzip server, median of 4 mobile / 2 desktop runs):**

| | Mobile | Desktop |
|---|---|---|
| Performance | 75 | 91 |
| LCP | **7.7 s** (identical in 4/4 runs) | 1.8–2.0 s |
| FCP | 1.6 s | 0.8 s |
| CLS | 0.013 | 0.004 |
| TBT | 0–20 ms | 0 ms |
| Transferred | 1,307 KiB | 2,269 KiB |

Accessibility, Best Practices and SEO were 100/100/100 on all five page types
tested. Run-to-run FCP/SI variance swung the score 70 to 75 on its own; LCP was
the only rock-stable metric, which is why the findings are argued on LCP.

### 2. Where the homepage LCP went — a model that was wrong twice

Lighthouse said the LCP element is hero **text** and that essentially all of
its time is "element render delay". Direct CDP probing confirmed ~2.5s against
a ~0.4s first paint, on every viewport.

**First model: the opacity gate.** `[data-heroanimate]` elements start at
`opacity: 0`, so the reasoning was that the headline and copy are simply not
painted until the entrance runs. Five CSS-only treatments were measured:
forcing headline and copy to `opacity: 1`, releasing `will-change` on them,
removing their `transition-delay`, and combinations. **Not one moved LCP.**
All still landed at 2.50–2.59s.

**Second model, and the right one: the teardown.** The 2200ms
`heroSequenceComplete` timer was the only thing that stripped
`data-heroanimate` from the elements — and stripping the attribute is what
drops the `transition` and `will-change` declarations together and releases
the compositing layer. Chrome withholds the LCP entry for text held in a
compositor-animated layer until that happens. Firing the timer at 400ms
instead moved LCP to ~1.5s; `prefers-reduced-motion`, which tears down
immediately, moved it to ~0.41s.

So the fix is a per-element release on that element's own `transitionend`,
doing exactly what the timer did, only sooner. Measured after:

    mobile 390 dpr3    2708ms -> 1448ms
    mobile 412 dpr2.6  2496ms -> 1536ms
    desktop 1350       2520ms -> 1512ms

**The 2200ms timer stays** — it is the entrance's choreography anchor
(`heroEntranceComplete`, which the typing loop waits on) and the backstop for
an element whose `transitionend` never arrives.

**The half of the brief that was not implemented, and why.** The task also
asked to stop the H1/hero copy being opacity-gated. Measurement says that lever
does nothing (see above), it would change the hero's visual character —
headline and copy sliding without fading while the kicker, buttons and stats
still fade — and it would *cost* the real win, because those elements would no
longer fire the opacity `transitionend` the release is keyed to. Reported
rather than applied.

**Safety check before writing it.** `waitForHeroHookEntrance()` holds the
typing loop on the headline's opacity `transitionend`, and the stat counters
start on `.heroStat`'s. Both capture their element at init (line 5075),
synchronously, before any transition starts — so a later teardown cannot
strand either. Verified by observing the counters reach 200+/24hr/12 after the
change.

### 3. H1 and H2

**H1 — `favicon.svg` is 307KB and was fetched at priority High on every first
visit.** Not a vector: a RealFaviconGenerator wrapper around one base64 512px
raster, and it barely compresses (226 KiB on the wire after gzip). It was the
largest single resource on every interior page — larger than their LCP image —
downloaded to paint a 16px tab icon, because Chrome prefers an SVG icon when
one is offered. Removing the `<link>` from 33 pages took mobile LCP 7.7s to
6.3s and −226 KiB. **The artwork was not touched** and the file stays on disk;
the `.ico` already carries 48/32/16 frames.

**H2 — the homepage downloaded two full-bleed hero photographs before the
fold.** The AFTER plate rests fully masked and is not revealed until the
entrance plus the first typed phrase, ~2.5–3.5s in, yet loaded at default
priority alongside the BEFORE plate: 511 KiB on a phone, 724 at DPR 3, 832 on
desktop. `fetchpriority="low"` — one attribute, no visual change, and
`fireHeroForwardSweepAndWait()` already waits on `load`/`error`. Explicitly NOT
`loading="lazy"`: the plate is in the viewport, so lazy defers little and risks
a visible pop.

**Result, same gzip server:** mobile 75 to **79** at matched FCP, LCP 7.7 to
**5.6 s**, 1,307 to **1,082 KiB**, 16 to 15 requests. Desktop 91 to **95**, LCP
2.0 to **1.4 s**, 2,269 to **2,045 KiB**.

### 4. Representative browser QA — 56 combinations, and five findings that were all my own harness

Eight pages by seven viewports, plus 18 breakpoint widths and a functional pass.

**Structurally clean across all 56:** zero pages scroll sideways (tested by
attempting it, not by reading `scrollWidth`), `body` is never a scroll
container and `document.scrollingElement` is always `<html>`, zero broken
images, zero aspect mismatches, CLS 0–0.0075, **zero console errors**.

**All three recently-moved boundaries flip exactly where documented:** 1200px
nav switch, 1080px hero estimate handover (exactly one estimate system at every
width), 699px process board.

**The first functional pass reported five failures and every one was the
harness.** Recorded because the discipline is the point: I dispatched
`mouseenter` AND `click` on the mega toggle, opening the panel then toggling it
shut before measuring; clicked the form's submit when progression is driven by
`#modalNextButton`; matched 57 assorted elements instead of `.faqToggle`;
measured the hero after scrolling to the process board, where the loop pauses
BY DESIGN; and treated `window.gtag` as proof GA had loaded when it is a
deliberate Consent Mode shim defined before any consent. I also guessed
`.heroCompactEstimate` when the class is `.heroMobileActions`, which briefly
made the 1080px boundary look broken. **A validator reporting a failure has not
found a bug; it has found a disagreement.**

Notably, the modal "failure" was the site being right: Step 1 asks Full Name,
Phone, Service Needed AND Property Address — all four required — despite a
heading that reads "Where's the property?". It refused to advance on a
partially filled step, exactly as it should. That heading is `technicalDebt`
item 10m, now confirmed in a real browser to actually mislead.

**Two real defects survived correction**, both LOW, both fixed the same day.

### 5. The consent banner's privacy link dead-ended on deep 404s

`resolvePrivacyHref()` derived the link from `location.pathname` and could only
ever emit ONE `../`. Right for every real page — none is more than one folder
deep — and wrong on `404.html`, which GitHub Pages serves AT the missing URL
without redirecting:

    /no-such-page/deeper/still-missing
      -> ../privacy/index.html
      -> /no-such-page/privacy/index.html   404

**Nothing caught it because the link does not exist in any file.** It is
injected at runtime, so `validateAssets` and `validateSeo` cannot see it, and
`validate404Page` was checking layout rather than injected links.

**The fix takes the path the page already has** rather than deriving one:
every page carries a correctly-pathed privacy link in its own footer, written
by the generators — relative on real pages, root-absolute on `404.html`.
Delegating inherits the right form everywhere, keeps `file://` working, and
cannot drift if the generators change convention. The old derivation is
retained as a fallback for a page with no footer.

Also found while writing the guard: **the count in my own report was wrong.**
The detail string hardcoded "0 relative" while the condition correctly read 1 —
the defect nearly hid behind my own summary text.

### 6. The footer social tap target, and a measurement taken at the wrong moment

`.footerFacebookLink` was an `inline-flex` wrapper with no padding around a
17px icon: a 17x17 target, under WCAG 2.5.8's 24x24 for a standalone control.

Fixed with padding (which enlarges the hit area AND the focus ring, unlike a
positioned overlay) plus a matching negative margin so the icon and the
footer's spacing do not move.

**The first attempt shipped 44x44 and was wrong.** The clearance above the icon
was measured at 36px — but measured *before* the footer's `[data-animate]`
reveal ran, when the block still rests 24px lower. At rest the clearance is
12.2px, identical at all seven viewports, and 13.5px of vertical padding
overlapped the email link above by 1.3px. The Facebook link, painting later,
would have swallowed the bottom sliver of the email link's target — trading a
too-small target for a stolen one. **The new suite caught it.** Final geometry
is **44x39**: 11px vertical padding, 1.2px of air.

The same "measure at rest" lesson the process-board work recorded on
2026-08-19: forcing a layout is only honest if you force all of it.

**A second harness trap, worth knowing:** hit-testing in the same task as a
programmatic scroll reads a stale hit-test tree. `getBoundingClientRect()`
reports the new geometry while `elementFromPoint` still answers for the old
scroll offset, so every corner comes back as an ancestor and a perfectly
clickable target looks dead. Confirmed with `Input.dispatchMouseEvent`, which
landed on all four corners. The suite now scrolls and measures in separate
evaluates with retries across frames.

### 7. Two new suites, both injection-proven where it matters

`validateConsentPrivacyLink` drives real Chrome across 7 real pages and 5
missing URLs up to six folders deep, then **fetches** the target and checks the
status — because the link is injected at runtime. It also asserts real pages
keep a *relative* href, so the `file://` property cannot be silently lost in
the other direction. Its self-test forces the old derivation, observes
`/no-such-page/privacy/index.html` returning 404, and confirms the suite
rejects it.

`validateFooterSocialTarget` checks 12 page/viewport combinations for a 44x39
target, a 17x17 icon, a 17px row, hit-testability at centre and four corners,
and no overlap with a neighbouring control.

`browserSession.js` gained a `send` passthrough so a suite can install a script
before page scripts run. Additive; nothing that existed before uses it.

### 8. Marketing assets, and a near-miss the .gitignore caught

Six GBP tile PNGs (~9MB) appeared at the repository ROOT as `marketingAssets/`,
where nothing ignored them — a broad `git add -A` would have committed all of
them. That is the exact mistake `technicalDebt` item 22 records from last time
(2.6MB swept in by a broad add). Moved to `graphics/marketingAssets/` and the
ignore rule rewritten to cover the whole tree rather than one GBP folder, so
the next batch is covered without anyone remembering. **Verified at closeout:
zero marketing PNGs are in `90f10ec` and all six are still on disk.**

The obsolete `graphics/GBP - Services/` rule was removed; the empty directory
it pointed at still exists on disk and is harmless, since Git does not track
empty directories.

### 9. Dev credit logo

`nuloStudioCredit.webp` (220x135) to `masterLogoTP240.webp` (240x124), a web
derivative cut from `graphics/logos/devCredit/MasterLogoTP.png`.

**Why a derivative and not the file.** The master is 1200x1200 / 435KB for a
slot displayed at 78px, and it is a landscape mark (1130x584, 1.94:1) centred
in a square canvas with the top and bottom fifths empty. Referencing it
directly would have shipped 435KB — heavier than the favicon just removed — to
render the mark at 40% of its slot. Trimmed at fuzz 2%, where the trim
stabilises; below that it picks up alpha noise around 1e-5 and reports the full
canvas. Lossless per the established convention for alpha logos. Renders 78x40
against the previous 78x48.

**`width`/`height` moved with the file.** A 220x135 declaration on a 240x124
image would have reserved a 1.63:1 box for a 1.94:1 picture and recreated
`technicalDebt` item 34 exactly.

**Found by the guard:** `privacy/index.html` was still pointing at
`nuloStudioCredit.png` while the other 32 pages used the `.webp` — a page the
WebP migration missed. Both existed and resolved, which is why nothing ever
flagged it. All 33 now use one asset.

### Validation at closeout

**29/29 — 28 suites plus the Apps Script harness at 180/180. Zero failures.**
`git diff --check` clean, `node --check` clean on both browser JS files, CSS
braces balanced 667/667 and 126/126, working tree clean.

---

## 2026-08-19 — PROCESS BOARD: HORIZONTAL DOWN TO 700px, NOT 1167px

**Still uncommitted.**

### The old breakpoint answered the wrong question

The five-step process handed over to the vertical timeline at **1167px**. That
number was derived honestly — the board is `max-width: 1120px` inside
`.sectionInner`'s 1.5rem padding, so 1168px is the narrowest viewport at which
it renders at its designed width — but the question it answered was "when does
the board stop fitting at full size", not "when do five columns stop reading".

The board only "stopped fitting" because its padding, gaps, discs and type were
fixed. Everything from 700px to 1167px — every tablet — was being handed the
phone timeline with room to spare.

### Scaling first, breakpoint second

Every `clamp()` added to `.processBoard` and its children has its **upper bound
set to the existing value, reached at 1200px**. So the desktop design is
untouched by construction, not by inspection — and `validateProcessLayout`
asserts the computed padding, gap, disc, icon and type sizes at ≥1280px still
equal the pre-change values to within 0.5px.

Below 1200px they interpolate down, which is what buys the horizontal layout
another 468px of viewport.

### Finding the real floor

`measureProcessFloor.js` walks the viewport down and reports the narrowest step
column, the line counts, and — the useful one — the widest single title word
measured against the column that has to hold it. `overflow-wrap: break-word` is
on, so a column that is too narrow does not overflow visibly, it breaks a word
mid-word and says nothing.

    768px   column 112px, titles 2 lines, copy 5
    730px   column 107px, titles 2 lines, copy 5
    700px   column 102px, titles 2 lines, copy 5   <- chosen
    680px   column  98px, titles 2 lines, copy 5
    660px   column  94px, titles 2 lines, copy 5
    645px   column  91px, titles 3 LINES, copy 6

The visual failure is the titles ceasing to be uniform two-line blocks at
~645px — well before anything technically breaks.

**A first pass got this wrong and is worth recording.** The initial measurement
forced the horizontal layout on with script but did not override the vertical
block's board padding, so columns below 768px measured ~20px narrower than they
really would be, and a word-break appeared at 700px that does not exist. That
produced a proposed breakpoint of 768px. Re-measuring with the breakpoint
temporarily lowered — so the real scaled padding applied — moved the floor down
to ~660px. Forcing a layout in the browser is only honest if you force *all* of
it.

### Why 700 and not 660

Two reasons that have nothing to do with the type:

1. **The 640px block owns vertical-timeline rules** — `.processSteps::before`,
   `.processStep` as a grid, `.processStepNumber` positioning. Handing over at
   660px would leave 20px between two layout systems whose rules contradict
   each other. 700px keeps 60px of clear air.
2. **Fallback-font headroom.** The widest title word is 83px in the display
   face; the project's own metric work records a fallback about 6% wider,
   ~88px during the swap. Against 94px at 660px that is 6px; against 102px at
   700px it is 14px.

### A comment that broke three validators

The new breakpoint comment explains why it keeps clear of the 640px block, and
in doing so contains the literal string `@media (max-width: 640px)`.

Three suites located their blocks with a plain `indexOf` on that string, so
they began slicing from the **comment** rather than the declaration and
reported five confident, entirely wrong failures about blocks they were not
reading. `validateFloatingCta` complained about safe-area insets that had not
changed.

The documentation was legitimate; the parsing was fragile. All three now find a
query by scanning for a declaration at the **start of a line**, which a comment
mention never is.

### Preserved

Desktop design (asserted, not assumed), the vertical timeline rules unchanged
with a lower trigger, step content and 1→2→3→4→5 order, the CTA beneath the
board, and the reveal sequencer — checked by driving it and confirming 5/5
steps reveal. Service pages run the same component with four steps and gain
wider columns still (133px at 700px against the homepage's 102px).

---

## 2026-08-19 — FAVICON AUDIT, AND THE UNAUTHORISED ARTWORK CHANGE IT CAUSED

**Still uncommitted.** The audit's structural findings were sound and are kept.
Its artwork change was not, was rejected by Aron, and has been reverted. Both
halves are recorded because the mistake is the more useful half.

### What went wrong

The audit judged the approved favicon "illegible at 16px" — the circular mark
bleeds to the canvas edge, so at tab size it has no hard silhouette — and
regenerated `favicon.ico`, `favicon-96x96.png` and `favicon.svg` from
`apple-touch-icon.png`, which was the only asset in the set showing a fully
contained circle.

`apple-touch-icon.png` is fully contained **because it has an opaque black fill
baked in.** iOS home-screen icons cannot be transparent, so the generator that
produced the approved set composited a background into that one file on
purpose. Deriving the tab icons from it inherited that fill and put a **black
square behind the BlueGrid mark** in browser tabs and in Google's small icon.

Two failures, and the second is the one worth remembering:

1. **A design opinion was acted on as if it were a defect.** "This would read
   better with a silhouette" is a matter for the person who owns the brand. The
   audit was asked to verify a favicon system, not to re-cut the artwork.
2. **Every other check still passed.** The files were square, ≥48px, resolved
   at every depth, served 200 with the right content-type, and appeared in the
   correct `<link>` on all 33 pages. Nothing in the suite noticed that the
   picture had changed. A validator that checks plumbing will happily certify
   the wrong image.

### The revert

`favicon.ico`, `favicon-96x96.png` and `favicon.svg` were restored to their
**exact pre-audit bytes** from the session backups — md5-verified, and `git
status` now shows all three as unmodified against `HEAD`. No re-encoding, so
there is no generation loss and no question of a near-match.

**The approved master is `graphics/favicons/Bluegrid_Favicon1.png`** — 512×512,
transparent, and pixel-identical to the untouched `web-app-manifest-512x512.png`
(compare AE 0.22px). It had been sitting unreferenced in the favicons folder,
which is why an earlier pass nearly pruned it as a spare. It is the design
master and should be treated as such. `New folder/Bluegrid_Favicon.png` is a
flattened-on-white export, **not** the master.

The approved `.ico` already carried 48/32/16 frames, so Google's ≥48px
requirement was met by the original artwork all along. Nothing about the
artwork ever needed rebuilding.

### What now guards it

`validateFavicons` checks that the icons which should be transparent still have
fully transparent corners and a mean alpha below 0.95, with
`apple-touch-icon.png` explicitly exempt because opaque is correct there.
Injection-proven: compositing the black-square version back in fails the suite
with a message naming the cause.

`rebuildFavicons.js` has been retired to a tombstone that refuses to run and
explains why, because the toolchain is carried forward by hand and a script
that silently re-breaks the brand is worse than no script.

### The structural findings, which stand

- **`mask-icon` removed.** `index.html` pointed it at `favicon.svg`; Safari's
  pinned-tab mask takes a *monochrome vector* and fills it with the link's
  `color`. A full-colour raster does not do what that markup implies, and
  Safari 13+ uses the standard icons anyway.
- **Root `/favicon.ico` added**, byte-identical to the linked file. Browsers,
  crawlers and a long tail of tools probe that path directly regardless of
  `<link>` tags, and it is the one favicon URL that cannot break when a page
  changes directory depth.
- **Coverage verified**: 33/33 pages declare an `.ico`, a PNG icon, an
  apple-touch-icon and a manifest, resolving with exact casing in all three
  path forms (root, `../`, and root-absolute on 404.html).
- **Manifest icons resolve relative to the manifest**, not to the page linking
  it — checked, because that is a classic silent break.
- **Nothing blocked by robots.txt.**

### `favicon.svg` is 300KB, and that is now a known trade-off

It is not a vector: it is a RealFaviconGenerator wrapper around a single base64
512px raster, and Chrome prefers `type="image/svg+xml"` when a page offers it.
The audit rebuilt it at 192px for an 87% saving — but that rebuild also
re-encoded the artwork, so it went back with the rest of the revert.

**Left as the approved file.** Shrinking it means re-encoding Aron's artwork,
which is his call, not a compatibility fix. Recorded as debt item 41.

One thing learned in passing and worth keeping: the first small rebuild used
the SVG 2 `href` attribute on `<image>`, which renders in browsers and **blank**
in every SVG 1.1 consumer, while `magick identify` still reports the declared
canvas size. `validateFavicons` now rasterises SVG icons and fails on a blank
result.

### `mask-icon` was promising something it could not deliver

`index.html` pointed `rel="mask-icon"` at that same raster-in-SVG. Safari's
pinned-tab mask takes a **monochrome vector** and fills it with the link's
`color`. Handing it a full-colour raster does not do what the markup implies.
Safari 13+ uses the standard icons anyway, so it was removed rather than
replaced.

### A stable root URL, which did not exist

Every page linked `graphics/favicons/favicon.ico` in three different relative
forms depending on depth. All resolved — but there was **no `/favicon.ico`**,
which browsers, crawlers and a long tail of tools probe directly whether or not
a `<link>` exists. Added at the root, byte-identical to the linked file, and
the validator asserts they stay identical so the two stable URLs can never
serve different marks.

### Schema branding

One `LocalBusiness` node on the homepage. Its `image` was **relative**
(`graphics/images/excavator.webp`) — Google reads these literally and cannot
resolve a relative path — and there was no `logo` at all. Both fixed with
absolute URLs; `logo` points at the square 290×290 brand lockup.

Naming was already consistent ("BlueGrid Land Solutions", single declaration)
and nothing else was touched. **There is no `WebSite` or `Organization` node on
the site** — recorded as an observation, not invented, since the audit brief
said not to change valid schema unnecessarily.

---

## 2026-08-19 — TABLET/MOBILE HERO ESTIMATE UX

**Still uncommitted**, on top of the hardening pass below.

### The gap between two numbers

`.heroInner` stops being a two-column grid at **1080px**. The compact hero
estimate system switched on at **640px**. Everything between those two numbers
— 641px to 1080px, which is most tablets — got the *desktop* hero CTAs while
the estimate card they point at had already stacked underneath the copy.

Measured: at 768, 960 and 1024 the card's top edge landed on exactly 800 in an
800px viewport. Not one pixel of it was on screen, and the CTA above it said
"Get My Free Estimate".

**The fix is one idea:** the moment the side-by-side composition stops being
possible, the compact system takes over. The switch moved from the 640px block
to the 1080px block, and 640px now only changes the compact row's *shape*
(stacked instead of side by side). The switch is declared in exactly one place,
and `validateMobileLayout` now fails if anyone re-adds it at 640 — duplicating
it is what made the original defect hard to see, because 640 looked like where
the system began.

### The ZIP field that was never a ZIP field

The compact field asked for "Property address or ZIP" with
`autocomplete="postal-code"`, then wrote whatever it got into the modal's
**Property Address**. It invited a five-digit answer to a question the modal
asks properly. Now labelled and autocompleted as an address, placeholder
"Enter property address". No new field, no schema change, no second submission
path — the transfer into `#propertyAddress` was already correct and is
untouched.

### `size="1"` is load-bearing

Fixing the breakpoint exposed a **pre-existing** defect at 375px, proven
pre-existing by measuring the hero with the old rules force-restored in the
browser: identical 380.2px either way.

An `<input>` carries an intrinsic width of ~20 characters — 218px here. That is
what the hero's grid track uses as its automatic minimum, so `.heroContent` was
floored at **380px inside a 375px viewport** and 29px of hero was clipped out
of sight by `.heroSection`'s `overflow: hidden`. Real 375/390px phones were
losing the right edge of the copy, the Get Estimate button and a stat column.

**CSS cannot reach it.** `min-width: 0` and `flex-basis: 0` were both tried and
both measured no change — they govern flex layout, not the intrinsic size the
outer grid measures. Only the `size` attribute moves it. Flex still sets the
rendered width, so nothing else changed.

Trimming the button's horizontal padding on phones then lifted the address
field from 50% of its row to 56–63%, which is what "the majority of the row"
required.

### Breakpoint behaviour, measured in Chrome

| Width | Before | After |
|---|---|---|
| 375 / 430 | compact, hero clipped 29px | compact, nothing clipped, input 56–63% |
| 768 / 960 / 1024 | **desktop CTAs, card below the fold** | **compact, one row, all above the fold** |
| 1200 / 1440 | desktop, card beside the copy | unchanged |

`validateHeroEstimateUx.js` drives all seven widths in a real browser and
asserts exactly one estimate system is visible at each, that the typed address
reaches the modal, and that the page never gains a horizontal scrollbar.

---

## 2026-08-18 — FINAL PRODUCTION HARDENING (resumed after an interrupted session)

**Still uncommitted.** HEAD is `db750b8`, level with `origin/main`. This entry
covers two sessions: the hardening pass that was cut off mid-task by repeated
API errors, and the resumed session that finished it. Nothing has been
deployed.

### Recovering the interrupted session

The previous session left no doc trail — `projectState.md`, this file and
`technicalDebt.md` were all written at 10:53–10:59, *before* the hardening
work began at 11:08. State had to be reconstructed from the repository and
from generator-script timestamps in the session scratchpad.

What that reconstruction found, and it is worth recording because the same
technique will be needed again: the scratchpad's `.js` mtimes are an accurate
minute-by-minute log of what a session actually did. `swapPublicEmail.js` at
11:10, legal pages at 11:38–11:50, `fixContrast.js` at 11:52,
`stripProductionTodos.js` at 11:56, `cleanGbpLink.js` at 12:11, and
`build404Page.js` at **12:25 with no `404.html` on disk** — which located the
interruption exactly, at the 404 page, without guessing.

**Completed by the interrupted session** (verified against the repo, not its
own claims): the public email swap to `bluegridls@gmail.com`, the Insights
section rebuild, Facebook embed removal, intro-media CSS, the four legal pages
(privacy / terms / cookies / accessibility) with footer links, sitemap and
robots regeneration, the three contrast-token fixes, TODO stripping from HTML,
and the GBP link cleanup.

**Two things it broke and did not notice**, both from ordering:

- `buildSitemap.js` *added* a "confirm the production domain" TODO to
  `robots.txt` at 11:48; `stripProductionTodos.js` ran at 11:56 but only
  covers HTML. The site was shipping a TODO to crawlers in both `robots.txt`
  and `sitemap.xml`, about a domain that has been confirmed since 2026-08-15.
- `validateFollowTheWork.js` did not survive into the carried-forward
  toolchain, and when restored it failed — because the section it validates
  had been deliberately deleted.

### The double scrollbar: measured, not guessed

Reported symptom: two vertical scrollbars on normal pages.

There is no browser in this toolchain — every other suite is static arithmetic
or a mocked DOM, and neither can answer a question about the viewport. So one
was added: `browserSession.js` drives the installed Chrome over CDP using
Node's built-in `WebSocket`, with **no dependencies** — deliberate, because a
validator that needs an `npm install` in a repo with no build step is a
validator that stops being run. `serveSite.js` serves the repo the way GitHub
Pages does, which is also the only way `404.html` can be tested at all.

**Root cause.** `styleIndex.css` carried `overflow-x: hidden` on **both** `html`
and `body`. Once the root's overflow is not `visible`, body stops propagating
its overflow to the viewport and keeps it — and a hidden value on one axis
forces the other axis to compute to `auto`. The duplicate declaration quietly
made body a second scroll container inside the viewport's.

It then only needed something to overflow, and this site supplies that on every
page: every `[data-animate]` element rests at `translateY(24px)` until it is
revealed, and the last one in the document pushes 24px past the footer's 19.2px
of bottom padding. **24 − 19.2 = 4.8px**, and body measured exactly 5px of
scrollable slack. That is what the second bar was scrolling, which is why it
appeared while reading and vanished at the bottom of the page.

**Fix:** remove `overflow-x: hidden` from `body` entirely. It was redundant for
clipping — `html`'s declaration is the viewport's, verified at 390px where the
page genuinely does have ~10px of horizontal overflow — and harmful for scroll
containment. `overflow-x: clip` was considered and rejected as the more complex
answer to the same problem, with a Safari <16 caveat that removal does not have.

**Verified after:** 11 pages × 3 viewports, body never becomes a scroll
container and `document.scrollingElement` is always `html`. Both scroll locks
re-tested and still hold — that was the regression risk and it did not fire.

**One false alarm, recorded so nobody re-chases it.** An intermediate
measurement showed the footer credit at `opacity: 0` after scrolling to the
bottom, which looked like an invisible footer. It was an artefact of
`scroll-behavior: smooth` leaving the programmatic scroll 20px short. With
smooth scrolling disabled the whole footer bottom bar reveals correctly and
body slack drops to 0. The footer is fine.

### Responsive images: the ladder is evidence, not convention

`sizes` was **measured**, not guessed — `measureImageSlots.js` reads the widest
CSS width every image slot actually renders at 1440 / 820 / 390 in real Chrome
against the shipped stylesheets. Full-bleed slots got `100vw`; contained slots
got explicit pixel widths, because they stop growing at the 1220px container
cap and a `vw` figure would keep over-promising past it.

**The ladder rejected two rungs on measurement.** Every source here is already
quality 92, progressive, 2×2-subsampled. Re-encoding at 1536 at that same
quality produced files **1% to 65% larger** than the 2048 originals, on WebP
and JPEG alike — so the original *is* the better 1536 candidate. A 1280 rung
pays 10–29% on the WebP sources and loses 15–19% on the six JPEG holdouts, so a
flat "≥10% smaller or it is discarded" rule keeps it only where it helps.
Nothing is hand-selected per file.

This is the same pathology the WebP pass hit on those six holdouts and the same
conclusion: these photographs are at their compression floor, and the only
remaining win is fewer pixels.

**Quality is matched exactly at 92**, with the JPEG sampling and progressive
settings copied from the sources. Dropping to q82 would have saved considerably
more and been a quality regression.

**1280 nearly got missed.** The first ladder stopped at 1024, which looks fine
at DPR 1 — but real phones are DPR 2–3, and a 390px phone at DPR 3 asks for
~1170px, skips the 1024 rung and lands straight back on the 2048 original. The
validator now measures at 1×, 2× and 3× for exactly this reason.

**Result, against the true baseline** (the same page with every slot served the
original, which is what shipped until now): **41% lighter across every page and
viewport measured** — 72–82% at 1×, 32–53% at 2×, 12–27% at 3×.

### Three images were declaring dimensions they did not have

Found by the responsive work, and a real pre-existing defect: `faq/index.html`
and `insights/index.html` declared `width="2048" height="1536"` for photographs
that are 1536×1024, and a Minford location page declared 2048×1536 for a
512×384 file. Those are different aspect ratios — the browser was holding a 4:3
box open for a 3:2 image, which is precisely the layout shift explicit
dimensions exist to prevent.

It surfaced because the first version of the installer trusted the width
attribute when building `srcset` descriptors, and a wrong descriptor is a lie
the browser acts on. The installer now reads the real width off the file with
ImageMagick and never from the markup. `fixImageDimensions.js` corrected all
three and guards that every declaration still matches its file.

### Validators taught about the error page, not worked around

`404.html` must be root-absolute — GitHub Pages renders it for a miss at any
depth *without redirecting*, so the browser's base URL is still the missing
directory and any relative path resolves against it. Four suites did not model
that and failed on a correct page: `validateAssets`, `validateSeo`,
`validateMegaMenus`, `validateEstimateCtas`. Each was fixed to understand
root-absolute paths and, for `validateSeo`, to exempt a `noindex` page from
breadcrumb and `BreadcrumbList` requirements — an error page has no position in
the hierarchy, and declaring one would feed a search engine a path to a page it
is being told not to index.

The page itself was verified the honest way: served over HTTP, requested at a
deep URL, and checked in Chrome for a styled three-column grid, 48px touch
targets, no horizontal overflow at 360/390/820, and a working estimate modal.

### `validateFollowTheWork` rewritten rather than deleted

Its subject — the Facebook Page Plugin section — was removed outright by the
interrupted session, so the suite failed on a repository that was correct. A
validator that fails when the code is right is worse than none, because people
learn to ignore it.

Deleting it was rejected: a half-removal is a real regression risk. It now
proves the removal *stayed* complete (no embed markers, no orphaned CSS, no
dead `facebookPageConfigured` gate, no anchor to the removed section) and that
what was deliberately kept — the Facebook profile link — is still wired on all
33 pages.

### Apps Script config, and a fallback worth stating out loud

`DEFAULT_PHOTO_VIEWER_EMAIL` is now `bluegridls@gmail.com` and
`DEFAULT_NOTIFICATION_EMAIL` is lowercased to match. They remain **two
independent keys that happen to hold the same address** — the owner both
receives the leads and opens the photographs. Collapsing them would have to be
undone the day lead mail forwards elsewhere, or a bookkeeper needs photo access
without receiving estimates.

**The behavioural consequence, which is easy to miss:** `getConfig()` applies a
sheet value only `if (key && value)`, so a **blank** `photoViewerEmail` cell now
falls through to the constant and resolves to the owner. A cell still holding a
**test account does not** — a non-blank cell wins, and it must be edited by
hand. Both cases are now asserted in the harness rather than left to be
discovered in production.

Four harness assertions had encoded the old configuration as permanent rules
and were re-expressed rather than deleted — notably the blank-refusal guard,
which can no longer be reached by blanking the cell and now forces the resolved
config blank instead, so the safety behaviour stays under test. 178 → **180
checks**.

### Titles: two, not four

The audit's "four over-length titles" counted raw HTML, where `&amp;` is five
characters. Decoded, `index.html` renders at 55 and `locations/index.html` at
58 — both already inside budget. Only Chillicothe (62) and Portsmouth (61) were
genuinely over, and both were fixed by dropping the word "in", which keeps the
head term, the city, the state and the brand. Trimming the two compliant titles
would have weakened them for nothing.

### Asset prune: 6.35 MB unreferenced, 4.34 MB removed

The old figure of ~16.2 MB no longer holds — the originals are still referenced
as `srcset` fallbacks and as `og:image`/`twitter:image` targets. A fresh audit
classifies rather than just lists, because "unreferenced" and "safe to delete"
are not the same thing:

- **Removed:** `graphics/logos/oldLogo/` — 3 files, 4.34 MB, superseded by the
  completed primary-logo migration, tracked (so recoverable from history).
- **Kept:** both 512×512 favicon masters. They are distinct source artwork for
  the generated favicon set, and source art was explicitly out of scope for
  pruning. The directory literally named `New folder` is recorded as debt
  rather than silently renamed.
- **Kept, no action needed:** `graphics/GBP - Services/` is gitignored and
  therefore never deployed in the first place.

---

## 2026-08-18 — PRE-LAUNCH AUDIT, MOBILE UX PASS, WebP OPTIMIZATION

**Everything in this entry except the audit is sitting uncommitted in the
working tree.** 31 modified tracked files, 12 new `.webp` files. HEAD is
`db750b8` and level with `origin/main`. Nothing here has been deployed.

### The audit corrected two false premises before it found anything

The brief described a pre-deployment audit. Two checks contradicted it:

- **The site was already live.** `curl -I` returned 200 on the apex, a 301
  from `www`, a real 404 on a bad path, and 200 on `/sitemap.xml`. The custom
  domain was already connected via `CNAME`.
- **The repo is GitHub Pages, not Netlify.** No `netlify.toml`, no
  `_redirects`, no `_headers` — but a `CNAME`, which is the Pages mechanism.
  The brief's Netlify section did not describe this repository.

Recording both because a pre-launch checklist written against the wrong
premise produces confident, wrong recommendations.

### What the audit cleared, with the check that cleared it

Not assumptions — each was measured. 0 broken internal links (97 internal
hrefs per page resolved against disk), 0 broken or case-mismatched assets,
0 missing `alt` across 196 images, 0 missing `width`/`height`, sitemap 29/29
with no orphans or duplicates, every canonical on the apex, no `noindex`
anywhere, all 29 pages `lang="en"` with a skip link and landmarks, all 17 form
controls labelled, all JSON-LD parsing. **The lead endpoint answered
`?action=ping` with `{"success":true,...}`** — the pipeline is live, not
merely configured.

**Two audit checks were themselves wrong and were fixed before reporting.**
A bare `/href="/` regex matched `data-confighref="phoneHref"` and produced
300+ phantom broken links. A form-label check reported three unlabelled
radios that are in fact wrapped in `<label>` inside a `fieldset`/`legend` —
exemplary markup. A check that fails loudly on correct code is worse than no
check; both were corrected and re-run before anything was written down.

### The contrast failures are the real finding

Computed, not eyeballed, using the WCAG relative-luminance formula:

| Token | On | Ratio | Verdict |
|---|---|---|---|
| `--colorSteel #7C8894` | `#F7F9FB` | **3.43:1** | fails AA |
| `--colorSteel #7C8894` | `#FFFFFF` | **3.62:1** | fails AA |
| `--colorSkyDeep #3E7CB8` | `#F7F9FB` | **4.16:1** | fails AA |
| `.footerBottomBar p` 0.45 alpha | `#101214` | **4.35:1** | fails AA |

`--colorSteel` carries `.sectionLede`, `.serviceCardCopy`, `.whyItemCopy`,
`.whyStat dt`, `.faqPanel p`, `.serviceAreaTownsLabel`,
`.reviewsPendingCopy` — the primary body copy on every light section across
all 29 pages. This is the largest accessibility defect on the site and it is
three one-line token changes: `#68737E` (4.58:1) or `#616C77` (5.08:1),
`#356CA3` (5.20:1), and alpha `0.5` (5.10:1).

### TODO comments are being served to the public

Confirmed in the **live** HTML, not just locally: 4–5 per page, including
`TODO: Replace with the real business email address` and
`TODO: Confirm phone number with the owner`. The phone one is **stale** — the
number was confirmed 2026-08-13 from Chase's own flyer. Anyone viewing source
currently reads that the published email is a placeholder.

### Mobile UX pass — what it changed and why

- **Inline estimate card hidden below 640px**, not deleted. The markup, the
  single `#estimateForm`, and every validator contract stay intact.
- **Hero gains a mobile-only action row**: `Call Chase` (tel:) plus a
  one-field address/ZIP starter. It is a *shortcut into* the existing modal —
  it pre-fills the modal's own `#propertyAddress` and opens it. No second
  estimate system, no second submission path.
- The starter **only fills a blank field**, so a part-completed modal is never
  overwritten by a ZIP; it trims input; empty input still opens the flow; and
  the modal still refuses a ZIP alone.
- **Owner intro lifted above the trust bar by CSS `order`**, not a DOM move,
  so desktop sequence is byte-identical. Safe because these sections space
  with padding — there is no margin collapsing for flex to break.
- **Process section is CSS-only**: five steps onto a rail, chevrons stood
  down, `01`–`05` via `::before`. Copy, icons and numbering untouched.
- **Story cards gained empty `data-casestudyurl` slots.** The link renders
  only when a slot is filled — the same configure-and-it-appears pattern the
  intro video and GBP link already use. No dead links, no filler articles.

Desktop hero CTAs were deliberately left alone: desktop still shows the
estimate card, and three estimate entry points side by side would be worse
than one.

### WebP — quality 80 was wrong for this photo set

The established convention (`client_HesterAsphalt/tools/optimizeImages.ps1`)
is `-strip -quality 80`. Applied here it made **6 of 16 photos larger**, some
by 40–69%.

Cause: measured entropy **0.95–0.98**, near maximum — dense foliage and fresh
mulch, the worst case for WebP's intra-prediction against JPEG's DCT. Six of
them are already JPEG Q=92, so q80 WebP was adding data.

**Verified it was the content, not the tool**, by re-encoding through
ffmpeg's libwebp independently: 702.7 KB against ImageMagick's 700.4 KB on
the same file. Two encoders, same answer.

Replaced with an adaptive pass — `-define webp:method=6`, quality stepped
82→60 until the output beat its source by ≥10%, DSSIM measured on every
result. **12 of 18 converted**, 11–21% each, all DSSIM ≤0.016. Six kept as
JPEG because nothing beat them.

**The logos needed a different method entirely.** DSSIM initially rated
*lossless* worse than lossy on the alpha PNGs, which is impossible — it was
scoring undefined colour in fully-transparent pixels. Re-measured by
compositing over white then diffing: lossless gives **0 differing pixels,
RMSE 0**. Both logos shipped lossless — byte-perfect brand marks at −41% and
−36%, alpha confirmed intact (`alpha=Blend`, mean alpha 0.785 and 0.169).

183 references rewritten across 30 files, including `introVideoPoster` in
`js/indexJS.js`. Originals retained as masters — needed for the resize work
still outstanding, and `docs/` cites `whatTheyDo2.jpg` as the phone-number
evidence. Favicons and manifest icons deliberately excluded: iOS and PWA
consumers need PNG.

Served image library **6.51 MB → 5.89 MB**.

### Validation

19/19 validator suites, Apps Script harness 178/178, `node --check` clean on
both browser JS files and all 8 `.gs`, CSS braces balanced. Re-run after the
WebP reference migration with 0 broken or case-mismatched assets.

Two suites were added earlier in the session and are injection-proven:
`validateMobileLayout` (paired invariants — card hidden *and* replacement
shown, reorder *and* the flex container that makes it work) and the
`validateAnalytics` extensions. `simulateEstimateFlow` gained **PATH D**,
which drives the real hero starter against the DOM mock.

---

## 2026-08-15 — PRODUCTION ACCEPTANCE + UPLOAD SECURITY CLOSEOUT

### The acceptance test passed on the live domain

Performed manually by Aron against **bluegridlandsolutions.com**, not a local
copy and not the admin account. Recorded here because most of it is not
verifiable from the repository and would otherwise be lost:

- A public visitor submitted an estimate **from an incognito browser on the
  production domain**.
- **Five photos uploaded**, stored, and viewable.
- Attempting a **sixth photo produced the five-photo limit warning** — the
  client-side half of the policy confirmed in a real browser.
- **Open all photos** works from the owner email.
- **Individual photo links** work from the owner email.

### The permission boundary was tested from the outside, which matters

Every previous "the links work" observation was made from
`admin@nulostudio.com`, which **owns** the files — so it proved storage and
link generation and nothing at all about authorization. This time:

- A **separate real Google account** was used.
- Signed into an **unauthorized** account, **Google denied access**.
- Signed into the **explicitly authorized** account, the same folder and photo
  links opened.

That is the first genuine external verification of the `rootInherited` model.
Both halves were exercised — the deny and the allow — which is the pair that
actually demonstrates a boundary. Attribute this to Aron's manual test; the
repository cannot prove it.

### A test that had been passing was measuring nothing

The harness's `Utilities.formatDate` mock was `function (date) { return
date.toISOString(); }` — it ignored both the timezone and the pattern it was
handed. The upload throttle keys its cache on
`formatDate(now, 'Etc/UTC', 'yyyyMMddHH')`, so under that mock **every call
produced a different millisecond-precision key**, the counter never
incremented, and nothing was ever throttled.

The test still passed about half the time, because several uploads in a tight
loop occasionally landed inside the same millisecond and collided into one
bucket. That is why it read as flaky rather than broken: 8 runs gave 177, 177,
176, 176, 177, 176, 176, 177.

**Production was always correct** — real Apps Script returns `2026081519` for
that call. The defect was entirely in the mock, and its effect was to make a
security control look tested when it was not. Fixed by making `formatDate`
honour its pattern in UTC. Ten consecutive runs now give 177/177.

Worth stating plainly: a green test whose mock does not model the thing under
test is worse than no test, because it stops anyone looking.

### HEIC removed from the accepted formats

Accepted until today. Removed, and the reasoning is worth keeping because the
obvious objection — "you will break iPhone uploads" — turns out to be mostly
wrong:

1. **iOS already converts.** With the default *Automatic* / *Most Compatible*
   camera setting, an iPhone hands a file input a JPEG. HEIC arrives only from
   the non-default *Current* setting or a Files-app pick.
2. **It was the one format bypassing our own downscaling.** Canvas cannot
   decode HEIC, so the browser fell back to the original bytes and it uploaded
   full size while every other format arrived reduced to 1600px.
3. **Its signature was the weakest rule we had.** HEIC is ISO-BMFF — the same
   container as MP4 and MOV — so it needed a *brand allowlist* at offset 8
   rather than an exact magic number. Dropping it removed the only
   non-exact-match entry in `PHOTO_CONTENT_SIGNATURES`.

The container signature was **kept, moved to the rejected list**, so an iPhone
photo is logged as `HEIC/HEIF or MP4/MOV container` rather than `unrecognised
binary`. The front end detects it separately and tells the customer how to fix
it — *Settings › Camera › Formats › Most Compatible* — instead of refusing
without explanation. A refusal a real customer can act on is worth more than a
correct one they cannot.

Reversible in two lines if real submissions show iPhone users being turned
away. **That is the thing to watch in the first weeks of live traffic.**

### The audit, run rather than reasoned about

Twenty-three threats posted straight at `doPost`, bypassing the browser
entirely, because the browser is not a control. All 23 mitigated: executable
renamed `.jpg`, HTML+JS renamed `.jpg`, SVG carrying script, spoofed MIME in
both directions, malformed base64, oversized single file, nine photos on one
estimate, 5×7MB aggregate, six flavours of path-traversal filename, replayed
upload, expired/malformed/far-future references, a 25-request flood on 25
fresh referenceIds, missing payload fields, and a formula-injection filename.

Two results worth recording:

- **The aggregate cap works across requests**, which is the only interesting
  case: each photo is its own POST, so no single request can see the total.
  Three of five 7MB files stored, 21MB, fourth refused.
- **A formula-injection filename is inert twice over.** It survives as a Drive
  filename, where nothing evaluates it, and reaches the sheet only inside a
  `JSON.stringify` array — so the cell begins with `[`, not `=`.

### Retention is still an open decision

Unchanged and deliberately unimplemented. These folders accumulate customer
photographs and names indefinitely; nothing deletes them. How long they are
kept, whether deletion is manual or scheduled, and what the customer was told
at submission are all still unanswered. **Do not add automatic deletion until
that is decided with the client.**

---

## 2026-08-15 — HOMEPAGE GEOGRAPHIC TARGET: AUDIT ONLY, NO CODE CHANGES

Aron asked whether the homepage should target Wheelersburg, Portsmouth, another
market, or stay regional. Audit only — nothing was modified. Recorded here
because the finding matters more than the recommendation.

**There is no search-volume, keyword-difficulty or competitor data in this
repository.** `projectState.md`'s Remaining Launch Work item 9 —
*"Competitor and search-intent research"* — has never been done. The only
prioritisation rationale ever written down is one unquantified line in
`seoPlan.md`: *"priority = market size + proximity to home base."* So the
decision was being taken without the research scheduled to inform it, and no
volume figures were invented to fill the gap.

What the repo does prove:

- The homepage carries **no city-level signal anywhere** — title, description,
  H1, eyebrow, hero copy, OG and schema are all region- or county-level. That
  is deliberate: the intent map assigns it "region-wide", and `LocalBusiness`
  declares 12 counties with no address and no coordinates.
- **There is no Wheelersburg page.** Six mentions exist, none of them a page.
- **Portsmouth already claims Wheelersburg**, in rendered copy *and* FAQ
  schema: *"Do you cover Wheelersburg, Lucasville, and Minford?" — "Yes."*
- `validateSeo`'s `intentKey()` strips only **state**-level geography, so a
  city on the homepage H1 would collide with nothing and the build would stay
  green. **The mechanical anti-cannibalisation guard does not cover this
  decision** — worth knowing before trusting it.
- Photograph provenance, the only hard local-relevance evidence: Minford 11,
  Jackson 2, Piketon 1, **Wheelersburg 0**, Portsmouth 0.

Recommendation given: keep the homepage regional; leave the nine town pages
owning their cities; leave Wheelersburg absorbed inside Portsmouth until it
earns a page the way Minford, Piketon and Jackson did — with completed work
and photographs. The proposed eyebrow was rejected, the proposed supporting
copy approved for adding "land clearing" (the site's second money term, absent
from the eyebrow today).

**Aron has not accepted or rejected this yet.** Open decision, carried in
`projectState.md`.

---

## 2026-08-15 — UPLOAD HARDENING: CONTENT SIGNATURES, CAPS, THROTTLE

**Commit `1358b6a`** — 12 files, 2,444 insertions.

### The vulnerability was that mimeType was a claim

`validatePhotoPayload` checked `payload.mimeType` against an allowlist. That
string comes from the browser, and `leads.addPhotos` is public and anonymous —
so a direct POST could declare `image/jpeg` and send base64 of anything. An
executable, an SVG carrying script, an HTML page, a ZIP: all stored in Drive
under a `.jpg` name. SVG and HTML were "blocked" only by an allowlist the
attacker controls.

Not a website XSS vector — nothing is served from the site — but it made the
studio's Drive an anonymous dropbox and put a payload one click from Chase.

**The fix is to read the bytes.** `PHOTO_CONTENT_SIGNATURES` matches leading
bytes; `REJECTED_CONTENT_SIGNATURES` names fourteen threat classes so a
rejection is logged as what it actually was rather than a shrug.

Three nuances that took thought:

- **A missing `mimeType` is not fatal** when the bytes are a real image.
  Android pickers and drag-and-drop routinely send none.
- **A wrong-but-still-image type** (PNG announced as JPEG) is stored as what
  the bytes are, and the disagreement logged. Rejecting it would invent a way
  for honest uploads to fail without stopping an attacker, who would simply
  claim `image/jpeg`.
- **A non-image type** is refused outright even over valid photo bytes.
  Nothing legitimate does that.

### The aggregate cap had to come from Drive

Each photo is its own POST, so no single request can see the total and a
client-reported running total is worth nothing. `summarizeFolderContents()`
sums what the lead folder already holds. An unreadable file size charges the
per-photo maximum rather than counting as zero — otherwise one unreadable file
silently raises the ceiling.

### The throttle bounds damage, not attackers

Apps Script gives a web app **no client IP**, so per-caller limiting is
impossible. A `referenceId` is just `BG-<timestamp>`, trivially minted, so the
per-lead caps bound one lead and not one attacker. The residual risk is filling
the owning account's Drive. `photoUploadsPerHour` is a blunt global ceiling
that fails **open** — a cache outage must not stop a real customer, and every
per-lead cap still applies.

### What the tests proved, and one that didn't

Every threat was posted straight at `doPost`. One test I wrote was wrong and
the code was right: a leak check searching for `"at "` to catch stack frames
failed on the word **"That"** in a clean message. A test that rejects correct
behaviour is worse than no test.

The throttle test looked like it passed. It did not — see the 2026-08-15
acceptance entry.

---

## 2026-08-15 — DRIVE ACCESS: rootInherited + THE OAUTH MANIFEST

Same commit as above; separated here because it is a different decision.

### Photo upload failed in production while leads succeeded

Symptom: the lead arrived, the owner email said *"1 attached, but the upload
did not complete."* The cause was **three layers each swallowing the Drive
exception** — `handleAddPhoto` caught it, the frontend discarded the returned
reason entirely, and `resolveLeadPhotos` returned an empty result
*indistinguishable from "the customer attached nothing"*.

`runSelfTest` reported 8/8 throughout, because it contained **zero Drive
references**. Both test layers were structurally blind to it.

### The actual fault was an OAuth scope, and the manifest is the fix

`photoStorage.gs` was the file that first introduced `DriveApp`. Deploying a
new web-app *version* does not re-prompt for newly required scopes, so the
deployment kept its older scope set: Sheets and Mail worked, every `DriveApp`
call threw.

**Declaring `oauthScopes` explicitly replaces the auto-derived set rather than
adding to it**, so the manifest had to name every scope, not just the missing
one. Audited from the code — three, each taken from the relevant Apps Script
reference page rather than memory:

| Scope | Why the narrower option does not work |
|---|---|
| `.../auth/drive` | `drive.readonly` is the only narrower scope `DriveApp` accepts, and every operation here writes |
| `.../auth/spreadsheets` | `spreadsheets.currentonly` would break `getSpreadsheet()`'s `openById` fallback |
| `.../auth/script.send_mail` | already the narrow one; `GmailApp` would have forced `mail.google.com` |

Nothing else needs a scope. `Session.getScriptTimeZone()` — the only `Session`
call — requires none; had it been `getActiveUser()` this would also need
`userinfo.email`.

### rootInherited replaced per-lead sharing

The old model called `addViewer()` on **every lead folder**: a sharing
operation per estimate, a potential Drive notification per customer, one
*Shared with me* entry per lead forever, and one more thing to fail silently on
the submission path. One Viewer grant on the root replaces all of it, and
inheritance does the rest.

The security boundary is identical either way — Drive permissions apply to one
item and inherit **downward only**, so the root grant exposes that folder and
its descendants and nothing above or beside it. What changes is the number of
moving parts.

`photoViewerEmail` is deliberately **separate from `notificationEmail`**: they
answer different questions, and during acceptance testing they were genuinely
different addresses.

### A correction worth recording

The three admin helpers were first written into `photoStorage.gs` and did not
appear in the Apps Script Run dropdown. The code was fine — all three were
top-level, the file parsed, braces balanced. **The editor lists the functions
of the file currently open, and skips functions that declare parameters.** They
moved to `Code.gs` beside every other editor-run function, and
`revokeRootFolderViewer` became zero-argument. My error, not a platform quirk.

---

## 2026-08-14 — TARGETED VISUAL QA CORRECTION PASS

**Commit `1012f44`** — 29 files, +363/−769. Corrections from Aron's own browser
inspection; no SEO architecture touched.

**"Talk to the Owner" now dials.** It pointed at the estimate form, duplicating
"Free Estimate". Now a `tel:` link bound to `businessConfig`, with the header's
existing phone glyph reused through a new `.buttonIcon` primitive.

**The Follow the Work defect had a precise cause.** `.postMeta` carried
`flex: 1` — flex-basis `0` — so it volunteered to shrink to nothing while the
`nowrap` tag never wrapped. Modelling the pre-fix CSS with real Inter metrics
showed the meta column getting **6.2px against a 47px date**, which is why
"July 8" broke into "July" over "8". Three declarations fixed it; verified
across 13 viewports.

**Two factual defects found while working, both fixed.** The third
transformation card claimed *"Dusk in Greenup County, KY"* over a daylight
photograph the filename places in **Minford, Ohio**. And the mobile drawer
still routed Jackson to an anchor while omitting Minford and Piketon entirely
— three P0 SEO pages unreachable from mobile navigation on all 28 pages.

**Company dropdown reduced 6 rows to 4.** "Areas We Serve" and "Questions &
Answers" each duplicated a dedicated top-level destination. The guarded script
initially refused to write because the Company *page* also carries a body
"Questions & Answers" card linking to the FAQ — in-body internal linking, not
navigation, and correctly left alone. The guard earning its keep.

**`validateMegaMenus` failed and was updated rather than weakened**: it hard-
codes the Company panel's row count as a design contract. 6 → 4, with the
reason written in. Panel height spread moved 24% → 36% against a 45% gate.

---

## 2026-08-13 — P0 SEO IMPLEMENTATION

**Commit `4b3df59`** — 33 files, 8,786 insertions.

### What the inventory changed about the plan

The brief assumed a site that needed an SEO pass. The site had already had one on 2026-08-11: unique titles and descriptions on all 24 pages, canonicals, OG, per-page-kind schema, breadcrumbs, an intent map enforced by `validateSeo`, and zero H1 intent collisions. Re-doing that would have been churn.

So the work went where the gaps actually were, and the inventory found five:

- **No `robots.txt` and no `sitemap.xml`.** Neither had ever existed.
- **No service-area hub.** `locations/` had nine town pages and no index. They were reachable only from the header panel and the footer, which is chrome — so every one of them was a content orphan, and nothing on the site answered "do you come out to where I am?"
- **No pages for Minford, Piketon or Jackson**, the three places with photograph-verified provenance.
- **No tree page**, which the brief assumed existed and audited. It does not.
- **The Service Areas panel's featured card said "View All Service Areas" and pointed at a homepage anchor.** It had nowhere else to point.

### The claims audit found evidence nobody had opened

The brief listed claims not to invent — insurance, pricing, response times, capability limits. Before touching any of them I checked what the repository could actually prove, and the answer was sitting in `graphics/images/` the whole time: three of those files are **Chase's own advertisements**, not job photos.

They settle a lot. "FULLY INSURED" is a badge on two of them. "LOCALLY OWNED & OPERATED" is on one. The phone number the debt file has called an unconfirmed placeholder since Phase 1 is printed across the middle of `whatTheyDo2.jpg` — **the flyer was the evidence, and it had never been looked at.** The "1–2 days" claim is the headline of `BeforeandAfter.jpg`. The service list on `whatTheyDo.jpg` includes tree and brush cleanup, which is the one service with first-party backing and no page.

What the adverts do *not* mention is any response time. So "Free estimates within 24 hours." — stated flat in three homepage descriptions while the on-page copy hedged it as "*most* quotes" — was brought into line with the hedged version rather than deleted, and flagged. Same reasoning retired "storm cleanup jumps the line … machine on site within days": Chase's own storm advert says "when the storm clears, we're just getting started", which is restoration, not emergency dispatch. Priority scheduling stayed, because that is his call to make; the on-site timeframe went, because the site cannot promise it on his behalf.

Nothing else needed touching. No pricing figure exists anywhere on the site, no coverage amount, no diameter limit, and no schema block carries an address, coordinates or a `priceRange`.

### Three location pages, written rather than templated

Minford, Piketon and Jackson were built from the existing location architecture — same URL convention, same donor chrome spliced in byte-identically and proven so by diffing two donors before writing. What is *not* shared is the content: each page has its own terrain writing, its own landowner problems, its own five FAQs and its own nearby list. Swapping a city name through one template is the specific thing the brief forbade and the thing `validateSite`'s pairwise-overlap check would have caught anyway.

**The restraint rule got its own section in the content data.** A location-coded filename proves where a photo was taken and nothing else. So the proof blocks say BlueGrid has completed *land-service work* in that place, the captions describe only what is visible in the frame, and no page calls its photographed project forestry mulching, pasture restoration, hunting work or reclamation. The H1s still say "Forestry Mulching in Minford, OH" because that is a statement of service availability — which is what a location page is for — not a claim about the job in the photograph.

Four of the five orphaned photos from the rename session found their home here; one, `afterForestryMulching_minfordOH.jpg`, is now doing real work on the Minford page.

### The hub, and two validators that had to learn about it

`locations/index.html` answers the availability question, lists both regions county by county, links all nine town pages, and states plainly that there is no branch office in any of these towns. Its schema is an `ItemList` of the location pages — deliberately **not** a `LocalBusiness` per city, which would be a fabricated address nine times over.

Two existing checks failed it, and both were right to on their own terms:

- `validateSite` forbids a location page linking sideways to another location page. The hub does nothing but that. Exempted by path, with the reasoning written into the check: the rule exists to stop town pages cannibalising each other, and the hub is what stops them being orphans.
- `validateSeo` requires `Service` schema on anything under `locations/`. The hub describes a territory, not one service in one place, so it became its own page kind.

`validateMegaMenus` also failed, for the most useful reason of all: it asserts the Service Areas panel has exactly 13 rows, and adding Minford and Piketon made it 15. The contract was updated with a note saying why. That check earned its keep.

### The sitemap generates from the canonicals

`sitemap.xml` is built by reading the canonical tag off each page rather than from file paths, so the two cannot drift — if a canonical is wrong the sitemap is wrong identically, which is visible instead of hidden. It refuses to write if the canonicals span more than one origin, and it skips anything carrying `noindex`. The production domain is still undecided, so the generator inherits whatever origin the pages declare and both files carry a TODO; when the domain is settled, the canonicals get swept and this regenerates.

### The lead path was not touched

`js/indexJS.js` and every file under `appsScript/` are byte-identical to where they started — confirmed with `git diff --stat`. The estimate form section on the new pages is lifted verbatim from the donor rather than regenerated, behind a guard that refuses to write if the extracted block is missing the form or the honeypot. All 28 pages carry `estimateForm`, `estimateModal` and `companyWebsite`.

The one edit inside that block was deliberate: the donor's "Most quotes answered within 24 hours by the owner" bullet became "Answered by the owner, not a call centre" on new pages, so the P0 work did not propagate an unevidenced claim onto four fresh URLs.

### Validation

13/13 validator suites, 116/116 Apps Script harness, `node --check` clean, 331 asset references resolving with exact casing. Nothing has been seen in a browser.

### One thing this session broke and the closeout caught

Writing these journal and debt entries through scripts that emitted `\n` left **mixed line endings** in `engineeringJournal.md` (1607 CRLF + 59 bare LF) and `technicalDebt.md` (373 + 30). It bit immediately: the next scripted edit detected CRLF from the file as a whole, built its search string with `\r\n`, and failed to match a heading that happened to sit in an LF region.

Normalised both files back to uniform CRLF at closeout. **`git diff` confirmed zero content change** from the normalisation — `core.autocrlf` is `true`, so the committed bytes were always LF either way, and this only ever affected the working tree.

Worth knowing because the mitigation already exists and was not followed: every guarded assembler in this project detects the line ending per file and restores it, precisely so scripted edits stay reliable. The one-off doc scripts did not, and that is the whole lesson.

---

## 2026-08-13 — PROJECT PHOTOS RENAMED WITH LOCATIONS; ASSET REFERENCES REPAIRED

**Commit `8fadfe0`.**

### Brief

Aron renamed the real project photos in `graphics/images/` to carry their confirmed locations, which broke references across the site. Repair every one. Do not redesign, do not move imagery, do not rename anything again.

### Establishing the mapping by content, not by name

The obvious approach — match `work.jpg` to `workJacksonOH.jpg` because the names look alike — is exactly what the brief warned against, and it would have been wrong at least once: `after.JPG`, `hero_after.jpg` and `afterForestryMulching_minfordOH.jpg` are three different photographs whose names all contain "after".

So the mapping came from bytes. `git ls-tree HEAD` gives the ten filenames the repository knew about; hashing each blob with `git cat-file blob HEAD:<path> | sha256sum` and comparing against a hash of every file now on disk produced ten exact matches and no ambiguity at all. Sizes agreed too. **Every replacement is provably the same physical image**, which is the only basis on which this task could be done without a human eyeballing eighteen photographs.

That also separated the renames from the additions: four files on disk match no blob in `HEAD`, so they are new photos Aron dropped in rather than anything that needed repointing.

| Renamed (content-verified) | | New, unreferenced |
|---|---|---|
| `after.JPG` → `after_minfordOH.JPG` | `overGrowth.JPG` → `overGrowth_minfordOH.JPG` | `B4MulchingJob_minfordOH.jpg` |
| `cleanCut.JPG` → `cleanCut_minfordOH.JPG` | `overGrowthCleanedup.JPG` → `overGrowthCleanedup_minfordOH.JPG` | `mulchingJob_minfordOH.jpg` |
| `excavator2.jpg` → `excavator2_PiketonOH.jpg` | `work.jpg` → `workJacksonOH.jpg` | `b4ForestryMulch_minfordOH.jpg` |
| `freshMulching.JPG` → `freshMulching_minfordOH.JPG` | `work2.jpg` → `work2JacksonOH.jpg` | `afterForestryMulching_minfordOH.jpg` |
| `hero_after.jpg` → `hero_after_minfordOH.jpg` | `hero_b4.JPG` → `hero_b4_minfordOH.JPG` | |

`BeforeandAfter.jpg`, `excavator.jpg`, `whatTheyDo.jpg` and `whatTheyDo2.jpg` were not renamed and were left alone.

### The repair

**75 references across 24 files.** Only basenames were replaced, so the two relative-path forms this site uses — `graphics/images/…` from root pages and `../graphics/images/…` from every one-level folder — were preserved without the script needing to know about either.

The replacement script refused to write unless its guards passed: every target had to exist on disk, and no old name could survive in a file it had rewritten. It also checked that no old name was a substring of any other old *or new* name, since a plain replace would corrupt a neighbouring reference.

**That guard had a gap worth recording.** `after.JPG` *is* a substring of `hero_after.JPG` — but `hero_after.JPG` was not in the map (the tracked file was lowercase `hero_after.jpg`), so the guard never compared them. It happened to be harmless: had an uppercase `hero_after.JPG` existed anywhere, the `after.JPG` rule would have rewritten it to `hero_after_minfordOH.JPG`, which is the correct name anyway. Harmless by luck, not by design. What actually caught it was resolving every reference against the filesystem afterwards, which is the check that does not depend on reasoning about string overlap being right.

Docs were treated differently on purpose. `heroSpecification.md` names the two source plates used to manufacture the hero, and `technicalDebt.md` item 22 names the orphan file — both operational, both updated, both carrying a short "renamed from" note so the provenance survives. **`engineeringJournal.md` and `projectState.md` were deliberately left alone**: their mentions are narrative about past renames ("the single rename is the Phase 2C `hero_after.JPG → after.JPG` casing fix"), and rewriting those would falsify the record of what happened.

### `validateAssets.js` — and what validateSite was missing

Verification found the repair clean, but writing the check exposed that the existing coverage was thinner than the phrase "24 pages, zero broken" in `projectState.md` suggested. `validateSite` reads `href=` and `src=` only, and it resolves with `fs.existsSync`. Two consequences:

- **Every location page points `og:image` and `twitter:image` at a relative path inside a `content=` attribute.** Ten such references existed and nothing had ever checked them.
- **`fs.existsSync` is case-insensitive on Windows.** A reference to `hero_b4.jpg` when the file is `hero_b4.JPG` passes locally and 404s on GitHub Pages. **This project has already shipped that exact bug once** — see the entry below about `hero_after.JPG` arriving on disk as `hero_after.jpg` while git kept tracking the uppercase name.

So `validateAssets.js` compares against the real directory listing rather than asking the filesystem, and reports a case-only difference as its own distinct failure with the actual casing named. It covers `src`/`href`, meta image `content` in both attribute orders, `srcset` and inline `url()` (neither exists today — they are there so that adding one cannot escape the check), CSS `url()`, and the asset paths held in `js/indexJS.js`. **284 references checked**, against the ~90 the old sweep saw.

Proven by injection, one at a time: a missing file in an `og:image`, a case-only mismatch, and a stale old filename in an `img src`. The new validator caught all three; `validateSite` caught only the third.

It also reports orphans. That found six unreferenced project photos — the four new ones, the long-known `after_minfordOH.JPG`, and **`whatTheyDo.jpg`, which nothing has ever referenced** and which no previous session had noticed. `whatTheyDo2.jpg` is on the site; its sibling never was. Reported, not fixed: which photo belongs on which page is an editorial call, and this project deliberately does not put every image it owns onto the site.

### One note the validator emits rather than fails on

`js/indexJS.js` holds `introVideoPoster: 'graphics/images/excavator2_PiketonOH.jpg'`. That is a page-relative path in a script shared by all 24 pages, so it resolves on root pages and would 404 from any one-level folder. It is correct today because the intro-video section exists only on `index.html` and is gated off by `introVideoConfigured: false`. Left exactly as it was — pre-existing, inert, and outside a brief that said not to redesign — but the validator now says so out loud every run instead of leaving it to be rediscovered.

### Validation

**13/13 validator suites** (twelve existing plus the new one), 116/116 Apps Script harness, `node --check` clean. Zero stale references in any HTML, CSS or JS; every one of the 284 asset references resolves with exact casing.

---

## 2026-08-13 — LEAD PIPELINE FINALIZATION: PHOTO STORAGE + IDENTIFIER SPLIT

**Commits `18c8845` and `9990055`.** Repo-side only — not deployed.

### Brief

Finalize the lead pipeline after the live test. Two defects: submitted photos were recognized but not accessible to the owner, and the single long lead identifier needed splitting into an internal `leadId` and a customer-facing `referenceId`. Explicitly: do not rebuild the working lead system, make the smallest robust changes, stop before touching the live deployment or Sheet.

### Photo root cause — the bytes never left the browser

The trace took one pass and the answer was worse than "the upload endpoint is missing".

`addPhotoFiles()` put each `File` object into an in-memory `photoFiles` array and made a local `blob:` preview URL. `buildEstimatePayload()` then sent `photoCount` and `photoNames` — the filename strings, nothing else. Server-side, `handleCreateLead()` hardcoded `photoUrls: []` and `notifications.gs` told the owner in as many words that "photos are not uploaded yet". So the owner's email named a file that existed nowhere but on the customer's phone. That much was already documented as item 24.

**What was not documented is the part that makes it a defect rather than a known limitation.** `simulateUploadProgress()` ran a 160ms timer that filled each preview's progress bar to 100%, with a random increment to make it look like network jitter. Nothing was being sent. The visitor watched their photos "upload", saw every bar complete, and submitted — which is precisely why the first real lead produced a confused owner rather than a shrug. A missing feature is a gap; a progress bar that lies about a missing feature is a defect, and it is the reason this was found by a person instead of by a checklist.

### Photos: upload before create, and never trust the client for a URL

The ordering question decided the architecture. The owner's notification is sent inside `handleCreateLead()`, so for it to carry links the photos have to already exist. Uploading afterwards would mean either a second "your photos arrived" email or delaying the notification until the browser says it is finished — and a lead notification that depends on the browser staying open is worse than one with no photo links. So: **photos upload first, one request each, then the lead is created.**

One request per photo rather than one big payload, because this is a rural trade whose customers are regularly on one bar of signal. Twelve photos in a single 7MB POST is one thing to lose; twelve small ones are twelve things to retry, and only the failures need retrying. Sequential rather than parallel for the same reason.

**`leads.create` does not accept photo URLs from the client.** It was tempting — the browser already has them back from `addPhotos` — and it would have been an injection hole straight into the owner's inbox: a hand-crafted POST could have put any link at all in front of him under his own website's name. Instead each photo is filed under the `referenceId`, and `resolveLeadPhotos()` reads that folder itself. The client sends nothing about photos except what it always sent. That also made the security question disappear rather than needing to be defended, which is the better kind of answer.

Being public, `leads.addPhotos` is bounded by a well-formed `referenceId` no older than 24 hours, an allowed MIME type, 8MB per file, and 12 files per lead — the caps enforced server-side because the browser's own limits are a courtesy, not a control. Uploads are idempotent by filename, so a retry returns the stored file rather than a second copy. Recorded honestly as debt 24b: bounded is not closed.

### Identifiers: only the client can dedupe, only the server can sequence

The split fell out of one observation. A retry is only recognisable as a retry by the browser that sent both requests, so the dedupe key has to be client-minted — that is the long `referenceId`, and it keeps working exactly as the old `leadId` did. A sequential number cannot be handed out by a client without racing, so `leadId` has to be server-assigned, inside the `LockService` section that already serialises every write for exactly this reason.

The ordering inside the lock is the part worth remembering: **dedupe first, allocate second.** Reversed, every double-tap would burn a lead number and the owner's list would grow gaps. There is a test for it, and the test survives because the design makes the property structural.

Numbering derives from the sheet rather than a stored counter. That costs one column read — the read dedupe already pays — and buys two things: the numbering cannot drift out of step with the rows it describes, and **clearing the test rows before launch is the entire reset**, with no Script Property left holding a stale count. That directly serves the requirement that the first production lead be `BG-0001`.

**The trap this created, and the guard for it.** Pre-split rows hold `BG-1786635839698` in the `leadId` column. Read naively as a sequence number that is 1.7 trillion, and the next real lead would be `BG-1786635839699` — permanently, for the life of the spreadsheet, from a single unmigrated row. `parseLeadNumber()` returns 0 for anything above `MAX_SEQUENTIAL_LEAD_NUMBER`, so an unmigrated sheet still numbers correctly instead of silently exploding. Verified by deleting the guard and confirming four checks fail, including the migration's own.

Both new columns were **appended** after `lastUpdated` rather than slotted beside the fields they belong with. `referenceId` reads better next to `leadId` and sits in column AB instead; the append-only rule in `LEADS_HEADERS`' own header comment is what keeps every pre-existing row readable, and it was written down precisely so a later session would not talk itself out of it.

### Migration: preview, then apply, and never invent a reference

`migrateLeadIdentifiers()` moves each legacy long id into `referenceId` and assigns a sequential `leadId` in sheet order. It deletes no rows, removes no columns, touches no other cell, and is idempotent — someone will run it twice.

`previewLeadIdentifierMigration()` reports the identical plan without writing, and both call one `planLeadIdentifierMigration()` so the preview and the run cannot disagree about what will happen. Rows it cannot interpret — a sequential id with no reference, say — are **reported rather than guessed at**: the customer was quoted some number, and this code does not know what it was.

Nothing destructive is automated. The pre-launch reset is documented in `appsScript/README.md` as manual steps, because a function that deletes lead rows is a function that can delete the wrong lead rows.

### What the tests are worth

The harness went 64 → **116 checks**, which needed a DriveApp mock with real `hasNext()/next()` iterators rather than arrays, because the production code is written against that shape and a friendlier mock would not have proven anything.

Nine regressions were injected one at a time and every one was caught: `photoUrls` reverted to `[]`; the dedupe check removed; dedupe keyed on the wrong column; the allocator ignoring the sheet; the legacy-id guard deleted; the email falling back to filenames; folder sharing skipped; uploads made non-idempotent; a column inserted mid-contract instead of appended. Three more on the client — photos never uploaded, `leadId` sent in the payload, `referenceId` minted per attempt — were caught by `simulateEstimateFlow` and `validateLeadFlow`.

**One injection was not caught, and it turned out not to be a defect.** Allocating a lead number before the dedupe check changed nothing, because allocation is a pure function of the sheet: with no counter, there is nothing to consume. The test asserting "a duplicate consumes no sequence number" is still worth keeping — it is a real requirement — but the design is what makes it true, not the ordering.

`simulateEstimateFlow` needed restructuring: `submitEstimateRequest()` now defers its request behind `uploadPendingPhotos()`, so reading the captured payload synchronously saw `null` and reported a submission that had simply not happened yet. Wrapped in an async main with a `settle()` drain, then given a third path that drives the real uploader against a mocked `File` and asserts the thing that was false before — that photo bytes are transmitted, and transmitted **before** the lead is created.

`validateLeadFlow` had to be told the truth about two fetch call sites. The rule it was really protecting was never "one fetch" but "one endpoint constant", so it now asserts that every call site builds its URL from `businessConfig.estimateEndpoint` — which keeps a redeploy a one-line edit, the thing that actually matters.

### Deliberately not done

- **The owner's HTML email still interpolates several field values unescaped.** Pre-existing, found while adding the photo links, and genuinely unrelated to photos or identifiers — the brief said not to change unrelated functionality. Values added by this session are escaped. Recorded as item 24e with the reason the array mixes escaped and deliberately-HTML cells, since that is what makes the fix easy to get wrong.
- **No orphan-folder cleanup.** A scheduled job that deletes Drive folders is a job that can delete a customer's photos when its "has no lead" test is wrong. Item 24c.
- **Nothing deployed, nothing in the live Sheet touched.**

### Files touched

`appsScript/photoStorage.gs` (new), `leads.gs`, `validation.gs`, `config.gs`, `notifications.gs`, `routes.gs`, `Code.gs`, `localTestRunner.js`, `README.md`; `js/indexJS.js`; `docs/forestryModuleSchema.md`, `docs/googleSheetArchitecture.md`, and the three continuity docs. The scratchpad's `validateLeadFlow` and `simulateEstimateFlow` were updated in place and remain outside the repository (item 10i).

### Validation

**12/12 validator suites, 116/116 Apps Script harness, `node --check` clean on `indexJS.js` and `localTestRunner.js`, all eight `.gs` modules parse.** No behaviour is proven in a browser — see item 4g, which is now the largest untested-by-eye item on the site.

---

## 2026-08-13 — SESSION CLOSEOUT SOP + CLOSEOUT

### Brief

Two things: create a permanent, local, gitignored SOP (`docs/sessionCloseout.md`) that any future session can execute on request without needing the full instructions re-typed, then immediately use it to close out this session.

### The SOP itself

Written to `docs/sessionCloseout.md`, opening with the exact sentence requested so a future session recognizes it as self-executing on request rather than needing re-briefing. Core discipline it encodes: inspect the actual repository before writing anything, never trust a prior session's docs over `git` output, keep the three continuity files' responsibilities distinct (state / history / debt), never claim something is verified when it wasn't checked, and never push a closeout commit without being asked.

**Verified four independent ways before touching anything else**, because "add to `.gitignore`" is exactly the kind of thing that's easy to get wrong silently: `git status --short` doesn't list the file, `git ls-files --error-unmatch` confirms it was never tracked (so there was nothing to `git rm --cached`), `git check-ignore -v` resolves it to the new rule by name and line number, and `git status --ignored` shows it with the `!!` marker. All four agreed.

### What "inspect before trusting the docs" caught immediately

The previous session's closeout left `projectState.md` saying `main` was 12 ahead of `origin/main`, with explicit instructions across several sessions not to push. Running `git status -sb` at the start of this session showed **no ahead/behind at all** — `git rev-list --left-right --count origin/main...HEAD` returned `0 0`. `origin/main` had moved to match local `HEAD` (`ab802b9`) since the last session closed. Nothing in this repository's history explains who pushed or when; it happened outside every session recorded here.

Same pattern, second instance: `git remote -v` showed `origin` already pointing at `https://github.com/ArxnAlley/client_BluegridLandSolutions.git` — the corrected URL `technicalDebt.md` item 10h had been asking for since 2026-08-07. Also fixed outside any recorded session.

Neither of these was hard to check. The point of writing them up is that a closeout that trusted the carried-forward numbers instead of running two `git` commands would have shipped a wrong header for a second time in a row — which is exactly the failure mode the SOP exists to prevent, demonstrated on itself on the first run.

### The live lead test — recorded, not verified

Aron reported a real end-to-end submission: reached the Sheet, owner notification reached a temporary test recipient, field data arrived correctly. This session has no access to the Sheet, the inbox, or the Apps Script execution log, so none of that is independently confirmed here — it's recorded as reported, attributed, per the SOP's own rule about claims this repository cannot check.

One part of it *is* checkable, and checking it changed the project's priorities: the notification named an uploaded photo's filename, and the owner could not open the photo. That is not a new defect — `appsScript/leads.gs` has hard-coded `photoUrls: []` since Phase 1, and the owner email says outright that photos aren't uploaded yet. What changed is that a real person just hit it in a real test, which is why it moved from `technicalDebt.md`'s Low Priority section to the top of the next session's queue rather than staying a documented-but-quiet gap.

### Lead id / reference id — captured as a design problem, not implemented

Read `handleCreateLead()` in full to understand exactly what "split the id" would touch, since the brief was explicit that this is next-session work and closeout should describe it accurately rather than start it. The current `leadId` (`'BG-' + Date.now()`) is client-generated and is the *entire* idempotency mechanism — `LockService` serializes the critical section, then `findLeadById()` checks for that exact value before writing. Moving to a sequential internal id means moving generation server-side, inside that same lock, which is a real design decision (how far to scan, whether to use a Script Property counter, what happens to a lock timeout mid-assignment) — not something to sketch in a documentation pass. `LEADS_HEADERS`' own comment forbids renaming columns or inserting mid-contract, which narrows the safe migration shape without picking it. Wrote this up in both `technicalDebt.md` (new item 24a) and `projectState.md` in enough detail that the next session can start designing immediately rather than re-deriving the constraints.

### Files touched

- `docs/sessionCloseout.md` — new, gitignored, never committed
- `.gitignore` — one rule added
- `docs/projectState.md`, `docs/technicalDebt.md` — this entry's findings, plus stale header/remote/sync corrections
- No site or Apps Script code touched this session

### Validation

Twelve suites green (`validateSite`, `validateNav`, `validateHeader`, `validateHero`, `validateLeadFlow`, `validateMegaMenus`, `validateProcessSequence`, `validateSeo`, `validateFloatingCta`, `validateEstimateCtas`, `heroLoopHarness`, `simulateEstimateFlow`), Apps Script harness 64/64, `node --check` clean. Run in full despite no code changing this session, because "nothing changed" is exactly the kind of claim the SOP says to verify rather than assume.

### Left for next session

The lead pipeline finalization — photo accessibility and the leadId/referenceId split — is the resume task, detailed in `projectState.md`. Confirm whether `config!notificationEmail` has been restored to Chase's address before treating the pipeline as production-safe.

---

## 2026-08-11 — ESTIMATE CTAs OPEN THE MODAL DIRECTLY  (supersedes the arrival-focus fix)

### Brief

The previous fix (scroll to the mini-form, focus its first field) did not solve the reported problem — real browser QA confirmed the page still scrolls and repositions. The actual requirement, stated plainly this time: every true estimate CTA should open the existing multi-step modal directly, starting at Step 1, with no anchor jump at all.

### What "open the modal directly" actually required

Audited `openEstimateModal()` and the modal's markup before touching anything, per instruction. Finding: **the modal's 5 steps never ask for Full Name, Phone, or Service Needed.** Step 1 is "Where's the property?" (address, acres). Step 3 is "How do we reach you?" (email, contact preference, best time). Those three fields exist in exactly one place — the hero mini-form (`#estimateForm`) — and `buildEstimatePayload()` read them straight from that form's DOM elements.

`appsScript/config.gs` hard-requires all three server-side (`REQUIRED_CREATE_FIELDS`). Traced `showSubmissionError()`'s field-mapping too: a server rejection on `fullName`/`phone`/`serviceNeeded` reveals the error on `#fullNameError`/`#phoneError`/`#serviceNeededError` — elements that live in the mini-form, not anywhere inside the modal. So the literal implementation of "open the modal directly, skip the mini-form" produced a specific, verifiable failure mode: a visitor completes all 5 steps, clicks Submit, and gets "please check the highlighted details" pointing at nothing they can see, every single time. No lead is created through any CTA that took this path.

That is a direct conflict between two things both explicitly required — "open the modal directly" and "preserve all existing modal validation/submission behavior" / "do not redesign anything." Rather than guess which one gives, surfaced the finding and three concrete resolutions (add the fields to the modal; keep the scroll-focus architecture; ship it broken as literally specified) and asked. The chosen path: add the three fields to the modal.

### What changed

Modal Step 1 gained three fields — same labels, same copy, same validators, same `serviceNeeded` enum order as the mini-form (verified against `appsScript/config.gs` programmatically before writing anything) — at new ids: `modalFullName`, `modalPhone`, `modalServiceNeeded`. The step heading, "Where's the property?", was left exactly as it reads today, per instruction not to touch copy — it now describes only two of the step's five fields. Recorded as a known, deliberate trade-off, not an oversight.

The mini-form is completely untouched: same three fields at their original ids, same `validateMiniForm()`, Continue is still a plain `type="submit"` button. It now calls one new function, `copyMiniFormIntoModal()`, immediately before `openEstimateModal()` — copying whatever was just typed into the modal's new fields, so "Continue... with the entered data" is literally true rather than asking twice.

Every `a[href="#estimateForm"]` — 131 of them, wired once in the shared script — now has a click handler that calls `preventDefault()` and `openEstimateModal()`. The mini-form's Continue button was never one of these anchors (it is a `<button>` inside the form, not an `<a>`), so it needed no change to stay excluded.

**The change that mattered most:** `buildEstimatePayload()`, `validateModalStep(1)`, `buildReviewSummary()`, and `showSubmissionError()` all had to be repointed at the modal's own fields. Leaving even one of them reading the mini-form's ids would have shipped a silent, hard-to-notice defect — the modal would look and behave correctly right up until the payload left the browser with a blank `fullName` or `phone` for anyone who used a direct CTA. This is exactly the failure class the whole investigation started by ruling out; the fix had to not reintroduce it through a missed reference.

`openEstimateModal()` itself was deliberately left alone. `currentModalStep` already starts at 1, so a first-time visitor lands on Step 1 regardless of which CTA opened it — the requirement is satisfied without touching the function. The existing "closing and reopening keeps every value and the current step" behavior (an intentional, documented feature — "nothing is ever re-entered") was preserved rather than force-reset, since resetting it on every CTA click would have discarded a visitor's in-progress fill the moment they clicked a second CTA by mistake.

### Validation had to prove behavior, not just presence

The static validator from the previous session (`validateEstimateCtas.js`) asserted the *opposite* of the new architecture — no `preventDefault`, focus the mini-form — and would have reported a green build on a completely broken implementation if left as-is. Rewrote it: mini-form untouched, modal Step 1 carries the three fields with the right enum order, no duplicate ids anywhere, the CTA listener calls `preventDefault()` + `openEstimateModal()`, and — the load-bearing checks — `buildEstimatePayload()` reads `fullName`/`phone`/`serviceNeeded` from the modal's ids and explicitly does *not* read them from the mini-form's.

Static checks confirm the right strings are in the right functions; they don't prove the code actually behaves correctly when run. Built `simulateEstimateFlow.js` to close that gap: it loads the real `js/indexJS.js` into a hand-built DOM mock (no new dependency — same `vm.runInContext` pattern `localTestRunner.js` and `validateProcessSequence.js` already use) and actually drives both real paths:

- **Direct CTA** — dispatch a click on a mocked header/hero/footer anchor, confirm `preventDefault` fired and the modal opened with the mini-form untouched, confirm Step 1 genuinely rejects an empty submission (not just that error markup exists), fill all five fields, submit, and inspect the captured (never sent) network payload.
- **Mini-form Continue** — fill the three mini-form fields, confirm `validateMiniForm()` passes, call the same handoff the real submit event triggers, confirm Step 1 arrives pre-filled with exactly those values and still correctly blocks on the two fields Continue can't know (address, acres), complete it, submit, and inspect that payload too.

25 functional assertions, all passing against the real script. Both this harness and the rewritten static validator were proven to have teeth the same way: reverted `buildEstimatePayload()`'s `fullName` read to the mini-form's id, confirmed each caught it independently with a precise failure message, then restored the file.

### Files touched

- `js/indexJS.js` — CTA listener, `copyMiniFormIntoModal()` (new), `validateModalStep(1)`, `buildEstimatePayload()`, `buildReviewSummary()`, `showSubmissionError()`
- **24 HTML pages** — three new fields in modal Step 1, by one guarded assembler that matched the existing Step 1 markup byte-for-byte on every page before writing

### Validation

12 suites green (the eleven standing plus the new `simulateEstimateFlow`), Apps Script harness 64/64 — unchanged, since nothing on the backend was touched — `node --check`, CSS brace balance.

### Left for a browser

The actual click-through: does Step 1 read reasonably with five fields under a heading that only names one of them? Does the modal feel like it opened *instead of* the page moving, with no visible scroll or flash of the old anchor behavior? Confirm close/reopen still resumes correctly, and that the mini-form's Continue path — now carrying data across into a modal step that was blank before — doesn't feel like a jump.

---

## 2026-08-11 — ESTIMATE CTA ARRIVAL FIX + NOTIFICATION CONFIG RESTORE

### Brief

Two items from real browser QA. First: clicking "Get My Free Estimate" "only moves/slides slightly and leaves me around the hero area" — trace the actual estimate flow and fix the underlying cause, not the symptom. Second: reconcile a discrepancy between a previous session's report (`DEFAULT_NOTIFICATION_EMAIL = 'Bluegridls@gmail.com'`) and what the repository currently showed (`admin@nulostudio.com`).

### There is no "estimateForm page" — and that's correct

Audited every anchor on all 24 pages whose label matched `estimate|quote` (227 anchors). Every single "Free Estimate" / "Get My Free Estimate" / "Request Your Free Estimate" / "Get an Estimate" CTA resolves to the bare fragment `#estimateForm` — never a cross-page href, never a path-prefixed one. `id="estimateForm"` exists exactly once on every page: a self-contained mini-form (name, phone, service) embedded on that same page, which on submit opens the five-step `#estimateModal` for the rest. Interior pages carry it in a `pageFormSection` near the bottom; the homepage carries it inside the hero itself.

**This means Issue 1, as originally framed — "make CTAs navigate there consistently using the correct relative path for each page depth" — describes a bug that does not exist.** There is nothing for page depth to get wrong: a same-page fragment needs no prefix at any depth, and none of the 227 anchors had one. The architecture is already exactly what a self-contained, no-orphan-pages site should look like.

### The real cause: the CTA and its target already share one screen

`.heroSection` is `min-height: 100svh` — the whole hero, including both grid columns, is designed to fit in one viewport. `.heroInner` is a two-column grid (`1.15fr 0.85fr`) holding `.heroContent` (kicker, headline, lede, the "Get My Free Estimate" button, then stats) beside `.estimateFormCard` (`align-self: end`, so its bottom pins to the bottom of that same row — landing it low, near where the CTA button and stats already sit).

On a typical desktop viewport, that means the click origin and the anchor target are **both already on screen at the same time**. The browser's anchor navigation is completely correct — it scrolls exactly as far as `scroll-padding-top` requires, which on the homepage is often a handful of pixels. Under `prefers-reduced-motion` (`scroll-behavior: auto` in that block, confirmed at `styleIndex.css:7602`) that handful of pixels happens as an instant jump with no animation at all. Either condition reads, correctly, as "nothing happened."

Interior pages don't have this problem — their mini form sits in a `pageFormSection` far down a long page, so the scroll is large and obvious. The symptom is specific to the homepage hero, which is also the first place anyone testing the site would click "Get My Free Estimate."

### The fix adds arrival, not distance

Rewriting the hero to force a bigger scroll would be a redesign of an intentional, already-approved layout, for a problem that isn't really about distance — it's that a correct, tiny scroll gives no confirmation that anything happened. So `js/indexJS.js` (single file, shared by all 24 pages, confirmed via script-tag audit at both `js/indexJS.js` and `../js/indexJS.js` depths) now wires every `a[href="#estimateForm"]` — 131 of them — to focus `#fullName` on click:

```js
estimateFormCtas.forEach(function (cta)
{
    cta.addEventListener('click', function ()
    {
        const firstField = document.getElementById('fullName');
        if (firstField) { firstField.focus({ preventScroll: true }); }
    });
});
```

No `preventDefault()` — the native anchor navigation, its scroll, and its history entry are completely untouched, so back-navigation behaves exactly as it always has. `preventScroll: true` on the `focus()` call stops the focus itself from triggering a second, competing scroll; the anchor's own navigation remains the only thing that moves the viewport. `#fullName` was confirmed to lead every mini form on every page, ahead of `#phone`, with the honeypot excluded from the tab order it precedes it in.

This resolves the actual complaint — arrival is now unmistakable, keyboard caret lands in the form, mobile keyboards open ready to type — without touching layout, without redesigning the hero, and without changing what the CTA has always correctly done.

### Issue 2: the discrepancy was real, and the test suite already knew

`appsScript/config.gs` currently read `DEFAULT_NOTIFICATION_EMAIL = 'admin@nulostudio.com'` in the working tree. `git log --all -p` on that file shows only one value was ever committed: `'Bluegridls@gmail.com'`, from the original commit. `git diff` confirmed the `admin@nulostudio.com` value was **uncommitted, working-tree-only drift** — not a change I or any prior recorded session made, and not reflected in any documentation (`googleSheetArchitecture.md`, `appsScript/README.md`, and the Sheet itself, per the user, all agree on `Bluegridls@gmail.com`).

`appsScript/localTestRunner.js` — the project's own committed test harness — already asserts `no recipient anywhere is admin@nulostudio.com` in its self-test. Running it against the corrupted file **failed exactly that check**: `owner email goes to Bluegridls@gmail.com  ->  to=admin@nulostudio.com`. Concrete, reproducible proof, not a guess. Since `notifications.gs` only reaches this constant when the Sheet's `config.notificationEmail` is blank or missing, the practical exposure was narrow but real — a blank config cell would have sent lead notifications to Nulo Studio, which `notifications.gs`'s own header comment says must never happen ("the studio must not sit in the customer's email thread").

Reverted the single line to the committed, documented value. `git diff` on the file is now empty — it matches `HEAD` exactly, so there is nothing new to commit for it; the fix is a cleanup of stray local drift, not a shipped change. Apps Script harness returns to 64/64.

**Important caveat, stated plainly:** the live Apps Script deployment is a manually pasted copy (`appsScript/README.md`: "this folder is not itself deployed"). This fix corrects the repository, which is the source of truth for the *next* deployment or copy-paste — it does not and cannot reach whatever is currently pasted into the Apps Script editor. Because the Sheet's `notificationEmail` value takes precedence whenever it is present, and the user confirmed it currently reads `Bluegridls@gmail.com`, normal live submissions are unaffected by whatever the live deployment's own fallback constant currently says. The fallback only matters if that Sheet cell goes blank.

### New validator

`validateEstimateCtas` (scratchpad, not committed — see `technicalDebt.md` item 10i) encodes what this investigation established, so none of it can silently regress: every page owns exactly one `#estimateForm` with `#fullName` leading it; every CTA resolves to the bare `#estimateForm` fragment at any depth; the shared script's click listener targets `#fullName`, passes `preventScroll: true`, and never calls `preventDefault`; the script tag resolves at the correct depth on all 24 pages; and the two facts the root-cause explanation depends on (`.heroSection { min-height: 100svh }`, `.estimateFormCard { align-self: end }`) are still true, so a future layout change doesn't leave this journal entry describing a hero that no longer exists. Verified the `preventDefault` and wrong-target guards by injecting each defect and confirming the validator caught it before restoring the file.

### Files touched

- `js/indexJS.js` — one selector, one listener block, 42 lines
- `appsScript/config.gs` — one line, reverted to match `HEAD`

### Validation

11 suites green (the ten standing suites plus the new `validateEstimateCtas`), Apps Script harness 64/64, `node --check`, CSS brace balance.

### Left for a browser

Click "Get My Free Estimate" on the homepage at a real desktop width and confirm the field visibly receives focus (a focus ring, or the caret blinking in "Full Name") even though the scroll is short. Then confirm the same on an interior page, where the scroll is large — focus should land the same way, just less noticeably needed. And confirm back-navigation after either still returns to the exact prior scroll position, unchanged from before this fix.

---

## 2026-08-11 — LOGO MIGRATION, COPY CLEANUP, ON-PAGE SEO SWEEP

### Brief

Three passes in one session: retire the old primary logo for one of two newer assets, strip the dashes that were making the copy read as machine-written, and audit every indexable page for search intent.

### The logo decision was made by measurement, not by looking

Two candidates. The one with the fuller lockup lost on a single number.

```
  circleBG_logo.png    290x290    alpha mean 0.785
  newBG_logo.png      1200x1200   alpha mean 1.000
```

**0.785 is π/4** — the alpha coverage of a circle inscribed in a square. `circleBG_logo.png` is a transparent circular badge with exactly the silhouette of the asset it replaces, which made it a drop-in. **1.000 means fully opaque**: `newBG_logo.png` has white corners and would render as a white box on the header. Its content also occupies only the middle band of a 1200px square, so at the header's 69px slot its tagline would land near 4px.

Rendered at the real header size, the old badge's arc text is an unreadable smear and the new mark is clean. That arc is also where the **FORESTRV** misspelling lives, so the migration retires a debt item that had been open since 2026-08-02 without anyone touching the artwork.

76 references, 24 pages, one 45KB file replacing 215KB + 57KB. Both marks are 1:1 and every rendered size is CSS-driven, so layout could not shift. `newBG_logo.png` is kept for Open Graph, GBP and print, where a white background and room for the tagline are exactly what it wants.

Favicons were checked and left alone: they are a **different mark entirely**, a simplified tree circle, not a small badge.

### 447 em dashes

That was the tell. Not the word choice — the punctuation. The site leaned on the em dash for asides, appositives, definitions, and dramatic pauses, several times per paragraph.

Surveying first was worth it. Of 447, only **213 were unique strings**, because the shared chrome repeats across 24 pages. That turned an intractable edit into 215 hand-written rules.

**Two things the survey got wrong before it got them right:**

- The first extractor split text nodes on newlines, so a sentence that wrapped across three source lines arrived as three fragments and half the rules matched nothing. Rewritten to normalise whole text nodes and re-wrap them at their original indentation afterwards.
- My first `MAINTENANCE`-style measurement mistake repeated in a new form: an unanchored `href="..."` match read `data-confighref="phoneHref"` as a link and reported nine broken files.

**The structured data was the real trap.** The copy pass protected every `<script>` block, which is correct for JavaScript and wrong for `application/ld+json` — the FAQ answers and service descriptions live there too. Protecting them left schema disagreeing with the visible copy, and Google requires FAQPage answers to match the rendered text. 61 further replacements, every block re-parsed and its key set compared before writing.

Kept deliberately: compound words, numeric ranges, and one en dash in `1–2 day`. It is the only dash left in prose on the site.

Also found while reading every sentence: **British spellings mixed with American ones**, sometimes in neighbouring paragraphs, on an Ohio/Kentucky local business site.

### The site was already good at SEO, and failing its own rule

The audit found 24 of 24 pages with exactly one non-empty H1, no skipped heading levels, unique titles and descriptions, descriptive anchor text, and zero intent collisions. The location pages in particular are strong: exact-match H1s over genuinely local content.

What it also found: the **service pages were breaking the site's own Content Guideline 2** — "Every H2 is a real search intent. If it isn't searchable, it's a design element, not an H2." Their H2s were `Marked, Cleared, Walked`, `Thickets Back to Clean Ground`, `Precise Where It Has to Be`. Good writing sitting exactly where a topic needed to be.

The fix was available because of how the pages are already built: **every section carries a `.sectionKicker` above its heading** ("How It Runs", "Real Jobs", "Straight Answers"). The voice lives there. So the topic could move into the H2 without flattening anything. 36 headings rewritten, each page's set covering distinct subtopics rather than the repetitive "X Services / Best X Services" pattern that a keyword pass produces.

### The homepage H1 was broken in a way only a crawler would see

```html
<span class="heroHeadlineFixed">Take Back</span>
<span class="heroTypedWrap"> ...animated, aria-hidden... </span>
<span class="visuallyHidden">Take back your property.</span>
```

Rendered: "Take Back" plus a typed phrase. Crawled: **"Take Back Take back your property."** Duplicated, and carrying no service and no geography on the most important page of the site.

**The first fix was wrong.** I added `aria-hidden="true"` to the fixed span, which cleaned the accessibility tree and changed nothing about indexing — `aria-hidden` is not `display: none`. Reverted. The correct fix was to make the hidden fallback *complete* the visible phrase instead of repeating it:

```
Take Back your property. Forestry mulching and land clearing in
Southern Ohio and Eastern Kentucky.
```

Which is now what both a screen reader and a crawler get, and it matches what a sighted visitor sees.

### Three FAQ schema mismatches, all pre-existing

`validateSeo` compares every `FAQPage` question against the rendered text. Three did not match, on three different service pages. In all three the schema carried the longer, better-targeted phrasing and the page carried a shortened version, so the **rendered question moved to match the schema** rather than the reverse. That fixes a guidelines violation and improves the heading at the same time.

### The floating CTA was cropped by 1.44px, and the cause was arithmetic

Reported as the sticky Call Now / Free Estimate bar being cut off along its bottom edge on mobile, with the rounded corners not rendering cleanly.

Everything that usually causes this was already right. The bar is `position: fixed` directly on `<body>`, so `overflow-x: hidden` on `html`/`body` cannot reach it and there is no transformed ancestor. The insets already read `bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px))` and `left`/`right: max(1rem, env(safe-area-inset-*, 0px))`, which is both safe-area aware and incapable of causing horizontal overflow.

The bug was in the box:

```
  <=640px   height 60px - padding 13.44 - border 2 = 44.56px content
            buttons 46px  ->  1.44px too tall
  <=360px   height 58px - padding 13.44 - border 2 = 42.56px content
            buttons 44px  ->  1.44px too tall
```

`box-sizing: border-box` is global, so the declared height is the outer box and the buttons had less room than the number suggested. `align-items: center` split the surplus, putting each button **0.72px past the top and bottom**. Nothing clips the bar, so the buttons simply painted over its 1px border — and being 999px pills on a 24px-radius container, at the bottom corners their edge crossed the border on a different curve. Hence "cropped by a few pixels".

The fix is to delete the fixed heights. The bar then measures its buttons plus its own padding and border, which is 61.44px and 59.44px: 1.44px taller than before, invisible, and structurally unable to disagree with itself again. Radius, shadow, colours and the scroll trigger are untouched.

Worth noting what was *not* done: adding a pixel or two of bottom offset would have moved the bar down and left the buttons still crossing the border. The symptom would have looked fixed at one size.

`validateFloatingCta` encodes the rule rather than the number: it fails if the bar declares a height at all, and if one is ever reintroduced it recomputes the content box and fails when the buttons do not fit. It also checks the 44px touch-target minimum, the safe-area insets, and that the bar sits outside `<main>` and `<footer>` on all 24 pages. Verified by reintroducing `height: 60px` and watching it report the 1.44px overflow, then reverting.

### Files touched

- `graphics/logos/web/bluegridMark290.png` — new, plus the two client source assets committed
- **24 HTML pages** — logo references, 440 copy rewrites, 61 schema rewrites, 36 H2s, 4 H1s, 4 metadata fixes, 3 editorial links
- `docs/seoPlan.md` — the intent map
- `docs/` — the other three

### Validation

Eleven suites green, plus `node --check` and CSS brace balance. **New: `validateFloatingCta`** (box model, touch targets, safe areas, clipping ancestors) and **`validateSeo`** — one H1 per page, heading hierarchy, title and description uniqueness and budget, canonicals, breadcrumbs, per-page-kind schema, FAQ schema matching rendered questions, alt coverage, anchor text quality, content-level inbound links (chrome links do not count), and H1 intent collision.

### Left for a browser

The new header mark at every breakpoint, and the footer badge at 120px where a 290px source is doing the most work. Whether the rewritten H2s still read like the same site — that is a judgement about voice, and 36 of them changed. And the floating CTA bar on a real handset with a home indicator, where `env(safe-area-inset-bottom)` finally has a non-zero value to contribute.

---

## 2026-08-09 — OUR COMPANY MEGA MENU, COMPANY PAGE, TWO-PHASE PROCESS ANIMATION

### Brief

Two objectives. Add an **Our Company** primary nav item built on the existing shared mega-menu system rather than a fourth dropdown architecture; and refine the process animation into a one-time step reveal followed by a permanent arrow-only loop, fixing the responsive clipping reported from browser QA along the way.

### The header could not absorb a fifth item where it stood

Measured from the real Inter/Rokkitt files, as every header decision on this project has been. `Our Company` costs **144px including its gap**, taking the compact header from 988px to **1131px** and the full-spacing header from 1080px to **1236px**.

At the shipped 1150px switch that left **+20px** on Inter and **−22px** on the wider `'Segoe UI'` fallback — the bar would have wrapped on first paint for anyone whose cache was cold, which is the exact failure the breakpoint's ~45px design margin exists to prevent. The switch moved to **1200px**: +70px on Inter, +11px on the fallback. 1176px was the arithmetic minimum and left 4px, which is not a margin.

**The more interesting finding was above the fold, not below it.** With five items the *full-spacing* band became the tightest point on the entire sweep: at 1281px the bar cleared by only 45px, so the widest band was the one under most pressure — the wrong shape for a responsive header. The compact band therefore moved from 1280px to **1360px**, which is `.headerInner`'s own `max-width`, and that is the whole argument for the number. Above 1360px the inner is capped, so available width never changes and full spacing always clears by 124px; below it every pixel of viewport is a pixel of header, which is exactly where compact tokens belong. Crossing 1360px downward still makes the bar roomier (+124px → +229px).

No typography, phone chip, CTA padding or spacing token was touched to make any of this fit.

### Our Company, on the existing system

Four panels now, one architecture. The new panel is `class="megaPanel" id="companyMegaPanel"`, opened by a `.megaFeature`, with six rows in two labelled `.megaGroup`s, every row on `.megaRow`.

**Zero JavaScript.** `indexJS.js` drives `.navItem.hasMegaMenu` generically, so the hover bridge, keyboard handling, `aria-expanded` toggling, outside-click and Escape all applied to the fourth panel the moment it existed.

**Zero new CSS rules.** The company rows are the same icon-plus-text shape the services rows use, so rather than copying declarations the company classes **joined the existing selector groups** — `.megaServicesList, .megaCompanyList`, `.megaServiceLink, .megaCompanyLink`, and so on down to the reduced-motion block. One declaration, two names: the two panels cannot drift apart, and nothing renders differently. The two-column group grid joined `.megaAreasGroups`, which was already exactly that.

Panel content points at whoever owns the answer, which is the rule the FAQ panel already follows: *About BlueGrid* and the featured card go to the new company page; *Why Choose BlueGrid*, *Our Work*, *How It Works* and *Areas We Serve* go to the homepage sections that already hold that material; *Questions & Answers* goes to the FAQ hub.

Measured against its siblings: **414px** tall against services and areas at 392px and FAQ at 486px, so the family spread stays at 24% against a 45% gate.

### A company page, because the alternative was a table of contents

Six rows pointing at five homepage anchors would have made the menu a homepage index — and would have thrown a visitor reading a service page back to the homepage for every one of them. The site also had **no About page of any kind**, which for an owner-operated local business is a real gap rather than a stylistic one.

`company/index.html` is the 24th page. Built from `faq/index.html` as the donor because it sits at the same depth, so every relative path in the shared chrome is already correct and was carried across **byte for byte** — the assembler asserts that, comparing the chrome outside the head and `<main>` against the donor and refusing to write on any difference. 865 words, and **it needed no new CSS**: `pageHero`, `breadcrumbNav`, `intentSection`, `benefitGrid`, `localServiceList`, `localFactGrid`, `relatedGrid` and `pageFormSection` already covered every section.

Schema is `AboutPage` plus a breadcrumb. **Deliberately no second `LocalBusiness`** — the homepage carries the canonical one, and repeating it here would have two URLs competing to *be* the business rather than one describing it.

**Every factual claim on the page already appears somewhere on the site.** Owner-operated and locally based, fully insured with a certificate before work starts, the New Holland C337 with a Fecon head, estimates within 24 hours, one-to-two-day typical projects, 200+ acres reclaimed, mulch stays on site. Nothing about history, years in business, crew size, certifications or awards was written, and the owner is still not named.

### The process animation is a state machine now, not a loop that pauses

The old sequencer completed, held 2.6s, called `resetBoard()`, and told the whole story again. The requirement is not a slower loop — it is that the steps are told **once** and then stop being animated at all.

```
'idle'  ->  'revealing'  ->  'looping'
```

Those states only move forward. There is no transition back to `'idle'`, which is what makes "Phase A runs once" a property of the machine rather than of its timing. `resetBoard()` is gone entirely, and the assembler guards that it did not survive.

- **Phase A** — the reveal, 6.08s at five steps. A travelling flash: each arrow brightens, dims, and only then does the next step land, revealed from *inside* its arrow's dim callback.
- **Phase B** — arrows only, 3.56s per pass, and **cumulative**: arrow 1 lights and stays lit, then 1+2, then 1+2+3, then all four; a 1400ms hold with the row full; all four clear on a single tick; 900ms of dark; repeat. It cannot touch a step because it never references one.

The two phases deliberately **do not share a beat function**. `flashArrow()` dims an arrow before moving on, which is right for the reveal and wrong for the loop — the whole point of the loop is that nothing dims until the row is full. `lightArrow()` is its own beat, and the peak of four lit arrows is what proves the difference: if any arrow dimmed on the way across, the row could never reach four.

**One defect this refactor created and the design caught before it shipped.** `.processArrow.isActive` and `.isResting` carry equal specificity, so an arrow holding both renders as whichever is declared later — `isResting`, meaning it never appears to light. Phase A never hit this because it flashed each arrow exactly once, from nothing. Phase B lights arrows that are **already resting**, so the entire loop would have been invisible. Both `flashArrow()` and `lightArrow()` remove one class before adding the other and are the only two places that touch them; the JS, the CSS and the validator all say so.

**A smaller one, found by the validator rather than by reading.** The first cut of `lightArrow()` lit the last arrow and then scheduled one more step before handing to the hold, so the hold a visitor would actually see was `loopStepMs + loopHoldMs` — 1520ms against a config that said 1100. The recursion now ends when the last arrow lights. The config value is the hold.

Phase A is deliberately **uninterruptible** once started: it is seven seconds, it happens once, and stopping it half way would mean either losing the steps already up or replaying them. Only the endless phase answers to visibility — Phase B pauses off screen and on a hidden tab, and resumes without disturbing a single step.

### The reported clipping did not reproduce — and the number that explained it was wrong

The handoff located a pressure point: **"MAINTENANCE" at 143px against a 147px step column at 1081px.** Re-measuring reproduced the 143px exactly, and then found the pairing was wrong. "MAINTENANCE" is on `services/brushRemoval.html`, a **four**-step board, whose column at 1081px is **197px**, not 147px. It has 54px of clearance. The widest word on the five-step homepage board is "COMPLETE" at 104px against 147px.

Checked properly — every rendered title on all eight boards, uppercased as `text-transform` actually renders them, against its own board's column, at every width from 1081px to 1440px, with a 6% fallback-face inflation — **nothing overflows anywhere.** (My first pass measured the markup text rather than the uppercase render and understated every title; that is how a defect like this hides.)

The box model agrees: `.processStep` is `flex: 1 1 0` with `min-width: 0`, `box-sizing: border-box` is global, and there is no `100vw` anywhere in the process chain. **The board provably cannot overflow its container at any width in the band.**

So the fix is not a patch for a mechanism I cannot find. It is that **the horizontal row should never run compressed in the first place.** The board is `max-width: 1120px` inside `.sectionInner`'s 1.5rem padding, so **1120 + 48 = 1168px** is the narrowest viewport at which it can render at the width it was designed for. Below that it was being squeezed — 147px columns against a design value of 164px — and a squeezed five-across row is what browser QA was looking at.

The handover moved from 1080px to **1167px**, and out of the shared 1080px query into its own, because 1080px also drives the hero, the services grid and several section layouts that had no reason to move with it. The vertical layout itself is unchanged. `.processStepTitle` also gained `overflow-wrap: break-word` — a guard for the next title someone writes, not a fix for a current overflow, and recorded as such.

### Line endings: the documented split was stale

`projectState.md` said `index.html`, `js/indexJS.js` and `css/styleIndex.css` were CRLF while `faq/*`, `locations/*`, `insights/*` and `css/stylePages.css` were LF, and that scripted edits must detect per file.

Audited: **all 26 source files are CRLF in the working tree and LF in the index.** `core.autocrlf` is `true`, so Git normalises on commit and converts on checkout — there is no mixture to preserve. The detect-and-restore habit stays in every script here because it is free and correct, but the table was describing something that is not true.

### Two defects in my own tooling

- **The chrome-comparison guard read `data-confighref="phoneHref"` as a link.** An unanchored `href="..."` match caught the tail of the config attribute and reported nine broken links to files named `phoneHref` and `facebookUrl`. Anchored on whitespace.
- **A CSS anchor matched twice.** `.megaServiceIcon\n{` appears both as its own rule and as the tail of `.megaServiceLink:focus-visible .megaServiceIcon\n{`. The guard refused to write rather than editing the wrong one.

### Files touched

- `js/indexJS.js` — the whole `PROCESS SEQUENCE` section rewritten: `processSequenceConfig`, `initializeProcessSequences()`, `setupProcessBoard()`
- `css/styleIndex.css` — header breakpoints 1280→1360 and 1150→1200; a new 1167px process query with the vertical rules moved out of the 1080px query; company classes joined seven services selector groups; `overflow-wrap` on the step title; the arrow-state exclusivity note
- **24 HTML pages** — the Our Company nav item and panel, the mobile drawer link, and the footer Quick Links entry, by one guarded assembler
- `company/index.html` — new
- `docs/` — all three

### Validation

Nine suites, all green: `validateSite` (24 pages, 2,696 links), `validateNav`, `validateHeader`, `validateHero`, `validateLeadFlow`, `validateMegaMenus`, `validateProcessSequence`, `heroLoopHarness` (91 cycles), the Apps Script harness (64/64), plus `node --check` and CSS brace balance.

`validateProcessSequence` was rebuilt against the two-phase model and is **stricter than what it replaced**: the old suite proved a loop closed, the new one proves the loop cannot reach the steps. Over two minutes of virtual time with the board entering and leaving the viewport repeatedly it asserts five reveals and no repeats, **zero un-reveals ever**, and zero step events after the reveal.

Phase B is checked by **replaying the timeline into discrete passes** rather than sampling it. A pass opens when the first arrow lights on an empty row and closes when the row clears, and each of the 25 observed passes has to fill in the order 1, 1+2, 1+2+3, 1+2+3+4, **peak at exactly four**, hold at least 500ms, and clear every arrow on a single tick. The peak is the load-bearing assertion: if any arrow dimmed on the way across, four could never be lit at once, so a travelling flash cannot pass a cumulative test. The old "never more than one arrow bright" check was not deleted — it was narrowed to Phase A, where it is still true.

The VM harness underneath was kept verbatim through both rewrites.

`validateHeader` gained a **fallback-face sweep** — the criterion the new breakpoint was chosen on now has a test — and `measureHeader` now **reads the primary nav out of `index.html`** instead of carrying its own copy, which is what let the model describe a four-item bar while the site shipped five.

### Left for a browser

The Our Company panel next to its three siblings, and the shield-with-a-check featured icon, which was drawn blind like the pin and the question mark before it. The company page top to bottom. And the process section at 1168px and just below it, where the horizontal row now hands over to the vertical one — that boundary is the thing this session changed and cannot see.

The cumulative sweep also needs an eye on it. The simulation proves the row fills in order and empties as one gesture; it says nothing about whether four lit arrows at once reads as the progression completing or just as four bright arrows, or whether 3.56s per pass is a pulse or a fidget. Those are the two constants most likely to want a tuning pass: `loopStepMs` and `loopHoldMs`.

---

## 2026-08-07 — MERGE TO MAIN, PUSH, REPOSITORY HOUSEKEEPING, SESSION CLOSEOUT

### Merge

`phase2a-lead-capture` → `main`. Verified before touching anything: `main` was an exact ancestor of the feature branch, so the merge was a **fast-forward** and no conflict was possible. `main` was already identical to `origin/main` (0 ahead / 0 behind), so nothing needed pulling and no history was rewritten. The feature branch was 8 ahead of its own remote and 0 behind — the amends made earlier in the session were all on unpushed commits, so no published history had been rewritten either.

`git merge --ff-only` was used deliberately: it refuses to do anything except a fast-forward, so it cannot silently produce a merge commit or a conflict.

```
8108f94..bc4021d   17 commits   42 files   52,050 insertions   0 deletions
```

The only rename is the Phase 2C `hero_after.JPG → after.JPG` casing fix. Confirmed with `--diff-filter=D` that the merge deleted nothing.

Full validation re-run **on `main` after the merge** — 12/12 — before pushing. Then `main → origin/main` only; no feature branches, no force, and `phase2a-lead-capture` was not deleted.

### The remote has moved

The push succeeded but GitHub answered:

```
remote: This repository moved. Please use the new location:
remote:   https://github.com/ArxnAlley/client_BluegridLandSolutions.git
```

`origin` still points at the old URL and pushes work **via redirect only** — which stops working if anyone ever creates a new repository under the old name. Updating it was requested, then superseded by the housekeeping task before it ran. Still outstanding; recorded under *Waiting on Aron*.

### Repository housekeeping — the GBP asset decision

Two related decisions, both the owner's:

**`graphics/images/GBP_ForestryMulchingService.png` deleted.** Verified it had genuinely been tracked (`git ls-files --error-unmatch`), and found it entered the repository in `235a4a3` — swept in by a broad `git add -A` in the mega-menu commit rather than added deliberately. That is worth recording as a lesson: `add -A` put 2.6MB into the repository for a file the site never loaded. Verified zero references to it across the whole working tree and at `HEAD` before staging the deletion.

**`graphics/GBP - Services/` is intentionally local and now ignored.** It holds Google Business Profile marketing collateral, not website assets. Added the repository's **first** `.gitignore` — a no-build static site has no dependency or artifact directories to exclude, so the file carries exactly one rule and a comment explaining why. Deliberately no speculative boilerplate (`node_modules`, `dist`, …): nothing here produces any of it.

Verified after: `git check-ignore` traces the file to `.gitignore:18`, `git ls-files` returns nothing for the folder, and the folder and its contents are untouched on disk.

Commit `9237e53`, pushed.

### Closeout

All three project docs rewritten against the repository rather than carried forward. `projectState.md` in particular had gone stale in a way that would have actively misled a cold session — it still read *"Branch: phase2a-lead-capture — not merged, nothing pushed"* after the merge and push had happened.

Two pieces of next-session work were specified and recorded as **planned, not implemented**: an *Our Company* mega menu, and a two-phase refactor of the process animation. Both were measured or located at closeout so the next session starts with numbers rather than a survey:

- **Header capacity for a fifth nav item.** Measured from the real font metrics: `Our Company` adds **149px** (156px with its gap). The compact header goes 988px → **1131px**. At the current 1150px switch that leaves **+20px** — it fits, but the breakpoint was tuned to hold ~45px so the wider `'Segoe UI'` fallback could not wrap the bar before Inter loads. Recorded the expectation that the switch will need to move to roughly 1200px.
- **Process clipping report.** Located the suspect band (**1081–1280px**, where the horizontal layout applies) and the mechanism (`html { overflow-x: hidden }` clips rather than scrolls, which matches "disappears offscreen" instead of producing a scrollbar). Measured the pressure point: the longest unbreakable uppercase title word is **"MAINTENANCE" at 143px** against a **147px** text column at 1081px — 4px of clearance, with a wider fallback face behind it.

  **Recorded honestly that the arithmetic does not reproduce the reported defect.** By calculation the board fits at every width in the band, so the model is missing something real. The handoff says to reproduce it in a browser before changing layout, rather than letting the next session act on either my numbers or the report alone.

---

## 2026-08-07 — MEGA MENU DESIGN SYSTEM: SERVICE AREAS + FAQ

### Brief

The redesigned Services panel is the benchmark. Bring Service Areas and FAQ onto the same shell and design language without making the three identical — each keeps an internal architecture suited to its content.

### What was actually shared before, and what wasn't

Studying the three panels first was the point of the brief, and it paid: the shell was **almost** shared already, and the exceptions were the whole problem.

| | Services | Service Areas | FAQ |
|---|---|---|---|
| Width | 760px | `min-width: 420px` only | 760px |
| Top-edge highlight | yes | no | no |
| Featured panel | yes | none | none |
| Row treatment | `.megaServiceLink` + accent rule | bare `a` in a list | `.megaFaqLink`, no accent |
| CTA | inside the feature | none | separate footer |
| Heading | `.megaGroupHeading`, muted | `.megaAreasHeading`, sky display face | `.megaPanelHeading`, sky |

Three panels, three heading treatments, three row treatments, two CTA patterns, and Service Areas at roughly half the width of its siblings. That is what "separate/older components" was describing.

### The system

Extracted, each declared once and asserted to be declared once:

- **`.megaPanel`** now carries the width, padding, radius, surface, border, shadow **and** the top-edge highlight. The per-panel `.megaPanelServices` / `.megaPanelFaq` / `.megaPanelAreas` modifiers are retired — the panels are `class="megaPanel"` with unique `id`s, which is what `aria-controls` already used.
- **`.megaFeature`** — the featured card, unchanged from Services, now opening all three panels. Icon, eyebrow, display-face title, supporting line, cue with a sliding arrow. Zero new CSS; the Areas and FAQ cards are the same component with different content.
- **`.megaBody`** — the region under the feature: the divider and the rhythm, once.
- **`.megaRow`** — the row primitive. Padding, radius, hover tint, and the sky rule that grows down the leading edge. A service row adds an icon column; a town row adds a colour; an FAQ row adds question/answer type. The accent rule was previously Services-only, so hovering a town or a question now behaves like hovering a service.
- **`.megaGroup`** / **`.megaGroupHeading`** / **`.megaGroupIcon`** — one labelled-group treatment. Areas headings dropped the sky display face for the shared muted label.

Nine `--mega*` tokens from the previous session already carried surface, shadow, edge, rule, radius, tint, label and copy colours; nothing new was needed.

### Positioning: the panels stopped moving

The brief listed "inconsistent horizontal positioning" and "menus jumping around unnecessarily" as things to avoid. Panels were absolutely positioned against `.navItem`, so each opened centred on its own toggle and moving along the nav slid a different rectangle into place each time.

`position: relative` moved from `.navItem` to `.primaryNav`. All three panels now resolve against the nav and land on **exactly the same rectangle** — moving between Services, Service Areas and FAQ swaps the contents of one panel rather than shuffling three.

It also bought a lot of clearance. Centred per item, the Services panel sat **62px** from the left edge at 1151px; centred on the nav it sits at **214px**, and the worst margin at any tested width is 177px.

`.navItem` keeps its hover/open behaviour and stays the panel's DOM parent, which is all `indexJS.js` needs — it only ever queries `.navItem.hasMegaMenu`.

### A hover defect found on the way

The 14px gap between toggle and panel is not over the nav item, so crossing it fired `mouseleave` and closed the menu before the pointer arrived — the panel then reopened on `mouseenter`, a flicker on every single use. Pre-existing, and invisible in the source. Fixed with a transparent `::before` band on `.megaPanel` that bridges the gap and belongs to the item; it inherits `visibility: hidden` so it only exists while the panel is open.

### Service Areas

Featured card: *Where We Work* / **Southern Ohio & Eastern Kentucky**, with copy adapted from the site's own answer to "What areas do you serve?" rather than the generic line in the brief, and a **View All Service Areas** cue pointing at the existing `#serviceAreas` block.

Below it, two regions side by side. Each region's towns flow down a **two-column multi-column list** rather than a single-column stack: seven and six towns become four rows instead of seven, which is what keeps this panel the same height as Services. Multi-column rather than grid on purpose — columns balance an odd count themselves while still reading top-to-bottom, which a row-flowed grid does not.

A pin sits on each **region heading**, not on all thirteen towns. All 13 links preserved exactly.

### FAQ

Featured card: *Common Questions* / **Questions We Get Every Week** — the panel's own former heading, promoted, rather than the brief's suggested line — and **View All FAQs**. The separate footer CTA is gone, which is where a chunk of the height went.

Nine previews became **six**, the highest purchase-intent questions, exactly as listed in the brief. The three dropped ("Do you haul the debris away?", "What do you need from me first?", "What areas do you serve?") are informational rather than decision-making and all remain on the FAQ page.

Answers were cut to **one sentence** — the real opening sentence of the real answer, not a rewrite. With two-sentence previews the panel measured **34% taller** than the other two; the brief asked that FAQ not be dramatically taller than everything else, and this is where that height was.

### Measured balance

Heights are estimated from the real font metrics and the shipped CSS values:

```
  services   392px
  areas      392px
  faq        486px      spread 24%   (gate 45%)
```

Services and Areas land on the same height by construction. FAQ carries more words per row and stays 24% taller, which the brief allows explicitly — "they do not need mathematically identical dimensions if their content requires otherwise".

### Path handling simplified

The Services panel had been the site's one exception to the two-variant path rule, linking to bare siblings from inside `services/` while the FAQ panel on the same pages used `../services/…`. Both resolve to the same file; only one is worth remembering. The exception is retired — every panel now uses root-canonical hrefs rewritten with `../` for one-level pages, and `projectState.md`'s architecture note is back to two variants.

The rebuild's guard compares **resolved targets** rather than href strings, so re-spelling a path is allowed while inventing a destination is not. That is stricter than the string comparison it replaced: it would catch a typo that still looked plausible.

### Three defects in my own tooling

- **`validateNav` located the FAQ panel by the retired modifier class** and asserted 8–10 questions. Model and assertions updated to six; the genuinely useful check it feeds — that every `faq/index.html#anchor` the menu points at exists — was kept.
- **The class-coverage check matched by substring**, so `.megaGroup` passed on the strength of `.megaGroups` — exactly the typo the check exists to catch. Now word-boundary matched.
- **The "declared once" check was line-ending blind.** It matched a selector followed by `\n` against a CRLF stylesheet and found zero of everything, reporting all four shared rules as missing.

### Files touched

- `css/styleIndex.css` — shared shell, `.megaBody`, `.megaRow`, `.megaGroup`, `.megaGroupIcon`, Areas rebuilt, FAQ trimmed, positioning moved, reduced-motion coverage for the whole mega system
- **23 HTML pages** — all three panels, rebuilt by one guarded assembler
- `docs/` — all three

### Validation

New `validateMegaMenus` replaces `validateServicesMega` and covers the family: shared shell on all three, featured architecture complete, every row built on `.megaRow`, links resolving to real files with the right relative form for each page depth, no duplicate ids, toggles still wired via `aria-controls` and shipping collapsed, decorative SVGs out of the accessibility tree, retired classes gone from both stylesheet and markup, on-screen fit 1151–1600px, and the height spread gated at 45%.

All seven other suites pass, plus `node --check` and CSS brace balance.

### Left for a browser

The look. Panel proportions against each other, the two new featured icons (a pin and a question mark, both filled and both drawn blind), whether the muted region headings read as deliberate rather than washed out, and the hover-bridge fix.

---

## 2026-08-07 — PROCESS SECTION: SEQUENTIAL STEP REVEAL

### Brief

Turn the "how it works" process block into a sequence that walks the visitor through it — step reveals, arrow flashes, arrow dims, next step — looping while on screen. One reusable architecture across every page that has a process block, not seven copies.

### The brief described a section that did not exist

The request described the change as animation-only, on top of an established visual: a centred free-floating dark rectangle, arrowheads between steps, no connecting lines, CTA below. **None of that was in the repository.** What shipped was a white section with a horizontal gradient rule (`.processTrack`), numbered discs, and no arrowheads or container. Nothing in git had the described version — no branch, no stash, no commit — and no other client site under `ClientSites/` matched either.

So this entry covers both: the visual the brief assumed, and the sequencing it asked for.

### Two facts that shaped the architecture

**Step counts differ.** The homepage runs five steps; all seven service pages run four. The brief was written for five. Nothing in the CSS or the JS assumes a count — arrows are simply however many sit between the steps, and the validator exercises both a five-step and a four-step board.

**The old grid was hardcoded to five columns** (`repeat(5, 1fr)`) while seven of the eight pages had four steps, so those pages had been rendering with an empty fifth column. Replaced with flex, which also removes the need for a template that would have had to change per page.

### Layout

A `.processBoard` — dark gradient rectangle, `max-width: 1120px`, centred, floating on the white section, with the heading above it and the CTA below. Step type inverted for the dark surface. `.processSteps` became flex: steps `flex: 1 1 0`, arrows `flex: 0 0 auto`, interleaved in DOM order so reading order and animation order are the same list.

Arrows are chevrons only — no shaft, no connecting rule — nudged down `1.05rem` so they sit on the centre line of the numbered discs rather than floating above the copy.

### Responsive

Vertical from 1080px down, with the arrows rotated to point at the next step.

The old design switched to a **two-up grid** at that width, which cannot work with directional arrows: the arrow ending a row points right, into the edge of the board, rather than at the step that follows. The breakpoint itself did not move — 1080px is where this design already gave up on the horizontal row — only what it switches to.

The rotation is a custom property, `--processArrowTurn`, composed into every state's transform rather than restated per state. That was not tidiness: the reduced-motion block sits *later* in the stylesheet than the 1080px block, so a bare `transform: none` there would have straightened every arrow in the vertical layout. One token, and the reset cannot reach it.

### Sequencing

`initializeProcessSequences()` drives any element carrying `data-processsequence`. Per board: read the steps and arrows once, then a small state machine with a single pending timer.

The arrow is movement *into* the next step, so the next step is revealed from **inside** the arrow's dim callback rather than alongside it. It is structurally impossible for a step to appear before its preceding arrow has finished.

```
  step reveal        480ms
  pause after step   380ms
  arrow flash        420ms
  arrow dim          240ms
  completed hold    2600ms
  reset fade + gap   640ms
                          -> 10.18s per cycle at five steps, 8.7s at four
```

`setTimeout` here, deliberately, where the hero typing needed `requestAnimationFrame`. The distinction is what the timer is for: the hero committed a DOM write that had to land inside a specific frame, twelve times a second. This schedules roughly a dozen class toggles per ten-second cycle and lets CSS animate between them. Sub-frame precision would buy nothing.

### Viewport behaviour

`IntersectionObserver` with **asymmetric** enter and exit conditions. Entering needs a meaningful arrival — 40% ratio, or the board's top past the middle of the screen. Leaving needs the board to go completely off screen.

A single predicate for both would put start and stop on the same boundary, and a visitor parked there would restart the story on every scroll tremor. The positional fallback exists because a board taller than the viewport — the vertical mobile layout — can never reach a 40% ratio at all; the extra thresholds give that check callbacks to run in as a tall board scrolls up.

Leaving resets and clears the timer; returning replays from step one, because half a story is worse than none. A hidden tab pauses the same way — timers would otherwise spend the sequence where nobody is watching.

### Performance

The only DOM work is a class toggle on one element per beat. Nothing is created, removed, measured, or re-written; every property those classes touch is `opacity`, `transform`, or `filter`. Steps and arrows hold their space from the first paint — this is an opacity reveal, never `display`, so the board cannot resize as the story plays.

The hero typing profile was re-run afterwards and is unchanged to three decimal places: 10.015ms cadence jitter, 80.625ms mean, 0 characters swallowed, 0ms write-to-paint.

### Two defects found and fixed mid-implementation

- **Both assemblers were double-indenting.** They sliced from the opening tag, which left that line's existing indentation in the file and then added their own on top, so every generated block opened 16–20 spaces deeper than its own children. Present in the services mega panel committed the day before, too. Fixed in both by consuming the line's indentation as part of the replaced range, and the mega panel was regenerated.
- **The validator's own CSS block bound was wrong.** It sliced from the section banner to `indexOf('PARALLAX')` — a marker that exists in the JavaScript, not the stylesheet. `indexOf` returned −1, `slice(start, -1)` ran to end of file, and the check reported a `display:none` and a `height` transition it had no business looking at. Now bounded by the next banner, with an assertion on the block's own length.

### Files touched

- `js/indexJS.js` — `processSequenceConfig`, `initializeProcessSequences()`, `setupProcessBoard()`
- `css/styleIndex.css` — `.processBoard`, flex `.processSteps`, `.processArrow` and its three states, `.processCta`, inverted step type, the vertical layout, reduced-motion finished state; removed `.processTrack` and the orphaned `drawLine` primitive that existed only to animate it
- **8 HTML pages** — `index.html` and all 7 service pages, rebuilt by a guarded assembler that carries step content across untouched

### Validation

New `validateProcessSequence` runs the real `indexJS.js` in a VM with a virtual clock, drives the observer by hand, and asserts against a recording of every class change: 13 beats in exact order, never more than one arrow bright, no step hidden mid-cycle, reset clearing the board in one tick, the loop restarting, zero class changes while off screen or with the tab hidden, and reduced motion registering no observer and no timers at all. The four-step board is checked separately.

All eight prior suites still pass.

### Left for a browser

Everything about how it *looks*: the dark board on the white section, the flash brightness, whether 10.18s reads as deliberate or slow, and the vertical layout below 1080px.

---

## 2026-08-06 — LAUNCH POLISH: SERVICES MEGA MENU, HERO TYPING PERFORMANCE

### Brief

Two tasks, explicitly not feature work. Redesign the **visual presentation only** of the services mega menu — keeping every link, destination and behaviour — toward something more premium, with better hierarchy, whitespace, alignment, balance, grouping and a stronger visual entry point; consistent with the BlueGrid system, taking the Austin Ervin panel as inspiration rather than a template. Then **profile** the hero typing animation, find the actual bottleneck rather than guessing at one, fix it, re-measure, and stop when further work stops paying.

---

### Part 1 — Services mega menu

#### The problem with the old panel

Seven services in a two-column grid. Seven is odd, so the last row was always a hole — that lopsidedness is what reads as unfinished. There was no heading, no hierarchy between the flagship service and the rest, and no reason for the eye to land anywhere in particular.

#### What was built

A **featured band** across the top carrying Forestry Mulching: a 52px sky-tinted icon tile, a "Start Here" eyebrow, the title in the display face rather than the body face, one line of promise, and a "See how it works" cue whose arrow slides 4px on hover. It is the only *filled* surface in any mega panel on the site, so it wins the eye without needing to be loud.

Below a hairline, the remaining six sit in **three equal labelled groups of two**:

| Group | Services |
|---|---|
| Clearing & Site Prep | Land Clearing, Brush Removal |
| Access & Habitat | Trail Cutting, Hunting Property Prep |
| Cleanup & Recovery | Property Cleanup, Storm Cleanup |

Three-by-two has no hole, the columns are the same height by construction, and each label is honest about what its pair has in common. An earlier 3/2/1 split (*Clearing & Site Prep* / *Access & Habitat* / *Storm Response*) was discarded: it balanced on paper only because the extra heading in the second column happened to make up the height, and "Storm Response" as a group of one is a label pretending to be a category.

#### Why the panel is 760px and still centred

The instinct was to left-anchor a wide panel to its toggle, on the assumption that the nav sits next to the brand lockup. It does not: `.brandLockup` carries `margin-right: auto`, which pushes the nav and the actions to the **right** of the bar. So the Services toggle is much further right than it looks in the markup, and the existing centred positioning has more room than expected — no override was needed at all, which also keeps this panel positioned exactly like the other two.

760px matches the FAQ panel deliberately, so the site's two large panels are the same object at the same size.

Fit was measured rather than eyeballed, reusing the TrueType parser built for the header audit:

```
   1600px   panel  329 -> 1089    margins  329 /  511   ok
   1440px   panel  249 -> 1009    margins  249 /  431   ok
   1280px   panel  191 ->  951    margins  191 /  329   ok
   1151px   panel   62 ->  822    margins   62 /  329   ok
```

1151px is the narrowest viewport the desktop nav survives to, and the panel still clears the left edge by 62px. Inside the panel the tightest group title, *Hunting Property Prep*, needs 155px against 172px of column — 16px of slack, enough to absorb the wider Segoe UI fallback if Inter has not loaded.

#### Tokenized, because the brief said "design language"

Nine `--mega*` properties in `:root` now carry the panel surface, shadow, top edge, rule, row radius, hover tint, label colour and copy colour. **Every value is the one the panels already shipped with**, and the FAQ panel was repointed at them — so it renders identically while sharing the vocabulary, and a panel added for a future section inherits the surface for free. This is the part that makes the pattern portable to the next Nulo Studio site; the featured-band structure is the part that makes it BlueGrid's.

#### The guard earned its keep

The rebuild script refused to write anything on its first run:

```
services\forestryMulching.html: link set differs —
  missing [services/forestryMulching.html, ...]
  extra   [forestryMulching.html, ...]
```

Pages inside `services/` link to their siblings **bare** — `forestryMulching.html` — not `../services/forestryMulching.html`. So service links have **three** path forms, not the two the rest of the chrome uses. The two-variant rule in `projectState.md` was not wrong, it was just not the whole rule, and it has now been corrected there. Had the script trusted it, seven links on seven pages would have shipped broken.

---

### Part 2 — Hero typing performance

#### Method

No browser is available on this project, so the animation was profiled by running the **real shipped `indexJS.js`** in a VM against a virtual clock that models the browser's rendering lifecycle rather than just its timers: callbacks fire when scheduled, but a DOM change only becomes visible at a vsync tick. Both builds were driven from the same seeded random stream, so the comparison measures the change and not luck. Two scenarios: an idle main thread (assumption-free) and a contended one (a declared model, used only to check that the fix degrades better).

#### Finding 1 — the schedule asked for cadences the screen cannot show

`typeHeroPhrase()` scheduled one `setTimeout` per character, each writing straight into `.textContent`. Measured over three simulated minutes at 60Hz:

```
                  count     mean    stdev      min      max   spread
  scheduled         399     82.2      9.5     68.0    111.5     43.5
  rendered          400     82.1     11.8     66.7    116.7     50.0

  jitter added by the render step   +2.29ms stdev  (24%)
```

The design asks for restrained variation; the visitor gets a quarter more than that, because a timer fires at an arbitrary point inside a frame and the character waits out the rest of it — **8.5ms on average, 16.7ms at worst**. Under load two timers can land in one frame and the second write erases the first before it is ever painted.

#### Finding 2 — the layer is torn down mid-phrase

`.heroHeadline` gets `will-change: opacity, transform` from `html.jsEnabled [data-heroanimate]`, and `indexJS.js:757-768` **removes that attribute at t=2200ms**. Typing starts around t=900ms, so the de-promotion lands at roughly the **sixteenth character of the first phrase**. From that moment the typed line paints into the same layer as the hero photograph and the overlay gradient:

```
  invalid rect per character   926 x 125 px   (glyphs + the 24px text-shadow)
  tiles re-rastered                     10
  pixels redrawn per character        655k
  photo pixels resampled              655k    -> 8.0 megapixels/second
```

Every keystroke was resampling the photograph, for a change that only ever touches the glyphs.

#### What shipped

1. **Commits happen inside `requestAnimationFrame`.** Write-to-paint goes to zero, and one frame can only serve one commit, so a swallowed character is structurally impossible rather than merely unlikely.
2. **Deadlines chain from the frame that served the previous commit**, so exactly one rounding sits between any two characters and none of it accumulates.
3. **A cached `Text` node**, mutated via `nodeValue`, replaces re-assigning `.textContent` — 873 node teardowns in three minutes became 18.
4. **Strings are pre-computed** outside the frame callback, so nothing allocates inside it.
5. **`.heroTypedLine` holds its own compositing layer** for the life of the loop, zeroed under `prefers-reduced-motion` where nothing types.

```
                                   before     after
  jitter added by the render step    +24%        0%
  write -> paint                    8.5ms       0ms
  text nodes rebuilt (3 min)          873        18
  setTimeout allocated (3 min)        939       139
  characters swallowed                  0         0
```

Scheduled and rendered cadence are now **identical** — the schedule only asks for things the screen can actually show. Mean interval moved 82.1ms → 80.6ms, i.e. onto the 80ms the config always specified. `heroDuetConfig` was not edited.

#### Two wrong turns, both caught by measuring

- **An off-by-one in the frame counter** ran every interval one frame long: mean 82ms → **97ms**, an 18% slowdown that would have read as sluggish. The profile caught it immediately; no amount of reading the code would have.
- **A pure deadline chain** — chaining from the abstract deadline rather than from the serving frame — measured **11.95ms stdev against the baseline's 11.78ms**, i.e. no better than the timers it replaced. Two independent roundings, one at each end of every interval. Predicting it would help was wrong, and the measurement said so.

#### Why frames are not counted

Counting frames is the obvious way to express "wait five frames", and it measured very slightly smoother at 60Hz (10.0ms stdev against 10.1ms). It was rejected and the rejection verified:

```
  120Hz   frame-counted   mean 40.5ms      <- double speed
  120Hz   shipped         mean 81.8ms
```

A tenth of a millisecond is not worth an animation that runs at double speed on the panels in most current laptops and phones.

#### What was deliberately left alone

The `text-shadow: 0 3px 24px` on the typed line is the remaining per-character cost — a 24px blur over ~115k pixels of 73.6px display type, every keystroke. It is irreducible without changing how the hero looks, and the brief said not to. Logged as debt rather than quietly softened.

---

### Files touched

- `js/indexJS.js` — `heroTimingIsHeld()`, `writeHeroTypedText()`, `runHeroTypedSequence()`, rewritten `typeHeroPhrase()` / `deleteHeroPhrase()` as step builders
- `css/styleIndex.css` — nine `--mega*` tokens, the services panel and its featured band, group headings, restyled rows, `will-change` on `.heroTypedLine` and its reduced-motion opt-out
- All **23 HTML pages** — services mega panel markup, rebuilt by a guarded assembler
- `docs/projectState.md`, `docs/engineeringJournal.md`, `docs/technicalDebt.md`

### Validation

`validateSite`, `validateNav`, `validateHeader`, `validateHero`, `validateLeadFlow`, `heroLoopHarness` (91 cycles alternating, 6.16–7.01s), the Apps Script harness (**64/64**), `node --check`, and a new `validateServicesMega` covering all 23 pages — structure, links resolving to files that exist on disk, styling coverage in **both** directions (no unstyled class, no dead `.mega*` rule), decorative SVGs kept out of the accessibility tree, and on-screen fit from 1151px to 1600px. All pass.

---

## 2026-08-04 — SESSION SUMMARY (2026-08-02 → 2026-08-04)

> Session-level compaction. Each phase below has a detailed entry further down this file — this is the fast path for a session resuming cold.

### Summary

One continuous session covering six pieces of work: **Phase 2B** (first-wave service area pages), **Phase 2C** (hero mobile refinement), **Phase 2D** (connecting the live Apps Script backend), a **header navigation polish** and its **tokenization follow-up**, and a **navigation restructure with two new content sections**.

The site went from **8 pages with a form that silently discarded every submission** to **23 pages with live lead capture**, a location tier, an FAQ hub, and a resource centre.

### Files Created

**Location pages (6)** — `locations/forestry-mulching-{ashland-ky, portsmouth-oh, ironton-oh, chillicothe-oh, grayson-ky, morehead-ky}.html`

**FAQ hub (1)** — `faq/index.html`

**Insights (8)** — `insights/index.html` plus `benefits-of-forestry-mulching`, `brush-hogging-vs-forestry-mulching`, `when-to-clear-overgrown-property`, `preparing-land-for-building`, `storm-cleanup-best-practices`, `fence-line-clearing-tips`, `signs-your-property-needs-land-management`

### Files Modified

- `index.html` — service-area link wiring, town-by-town block, Rowan County in schema/map/FAQ, nav restructure, `hero_after` casing
- `services/*.html` (7) — service-area link wiring, nav restructure; `forestryMulching.html` additionally gained the "Where We Work" block
- `locations/*.html` (6) — nav restructure (after being created earlier in the session)
- `js/indexJS.js` — `rowan` service region; hero dissolve made awaitable + forward-sweep `error` fallback; production `/exec` endpoint; double-submit guard and stable `leadId`
- `css/styleIndex.css` — hero media decoupling, estimate band, overlay fade; header anti-wrap guards, compact band, 1150px switch, twelve `:root` tokens, unified `--headerTransition`; `.megaPanelFaq` and contents; `.serviceAreaTowns*`
- `css/stylePages.css` — location-page components (`.localSection`, `.localProse`, `.localProblemGrid`, `.nearbyList`), FAQ page components, Insights components
- `graphics/images/hero_after.JPG` → `hero_after.jpg` (git rename)
- All three `docs/` files

### Architecture Decisions

1. **Six location pages, not thirteen.** `seoPlan.md` rows 1–6 with genuinely local content over 13 doorway pages. The 7 cities without pages still point at the `#serviceAreas` anchor.
2. **Location pages link up, never sideways** — parent service page, homepage, all 7 services. Nearby towns are plain text, which is why `.nearbyList` styles `li` not `a`. Sitewide chrome *does* link to them; `seoPlan.md` rule 4 blesses that explicitly.
3. **Hero media decoupled from section height** rather than shrunk. An `inset: 0` layer is coupled to its container's content; every fix that is not decoupling is a workaround.
4. **The hero fade lives on `.heroOverlay`, not `.heroPlate`** — a bottom `mask-image` on the plates would overwrite `.heroPlateAfter`'s mask, which *is* the sweep animation.
5. **One endpoint, one call site.** Already true; this session verified it rather than assuming, and added checks so it stays true.
6. **`leadId` is stable for the page load** so the server's dedupe can collapse a retry into the original row.
7. **Header compact band starts at 1280px, above the 1207px wrap point**, so crossing it makes the bar roomier rather than snapping tighter.
8. **The mobile-nav switch is a header-only media query** — the existing 1080px query also drives the hero and services grid, and retargeting it would have been a redesign of sections nobody asked about.
9. **Header dimensions are `:root` tokens** with a single `--headerTransition`; reduced motion zeroes the whole morph in one declaration.
10. **New pages live one level deep** (`faq/index.html`, `insights/*`) so they reuse the proven one-level chrome instead of needing a third path variant.
11. **The FAQ hub carries only new questions.** The site had 75; `seoPlan.md` bans duplicates; the hub took the 28 that were left.
12. **The FAQ mega menu links to whoever owns the answer** — several items point at service pages rather than the FAQ page.
13. **Generators stay in the scratchpad.** Phase 13 owns the real one; shipping a half-generator would create two competing sources of truth.

### Validation Performed

- **23 pages, 2,407 internal links and assets, zero broken.** Every same-page and cross-page anchor resolves.
- Location-page uniqueness: worst pairwise 5-word-phrase overlap **14.7%** (gate 25%), 1,133–1,283 body words.
- Insights uniqueness: worst pairwise overlap **0.3%**, 550–900 body words.
- **Zero duplicate FAQ questions introduced** — the hub's 28 cross-referenced against every question elsewhere on the site. The check also surfaced one *pre-existing* duplicate between `index.html` and `services/landClearing.html` (technicalDebt item 10a).
- Nav order parsed from rendered markup on all 23 pages; mega-menu structure, `aria-expanded`/`aria-controls` wiring, and preview length checked per page; mobile drawer confirmed to carry exactly two items and no mega markup.
- Header: **every integer width 900–1600px** re-measured against the real Inter/Rokkitt metrics — zero wrapping, tightest desktop 1151px.
- Hero seam geometry exact (0px error) with 24px card overlap at 360×640, 390×844, 430×932, 768×1024, 1024×1366.
- Titles and meta descriptions unique sitewide; every JSON-LD block parses; every schema FAQ question verified to render.

### Tests Executed

| Harness | Result |
|---|---|
| `appsScript/localTestRunner.js` | **64/64**, `runSelfTest` 6/6 |
| Hero duet loop simulation (10 min page time) | **92/92 alternating**, 6.13–6.94s cadence — *and fails on the pre-fix code, 90 of 108 reveals clipped* |
| Sitewide link/structure validator | 23 pages, 2,407 references, 0 broken |
| Navigation & new-page validator | PASS |
| Header width sweep 900–1600px | PASS |
| Hero layout validator (5 viewports) | PASS |
| Lead-flow contract validator | PASS |
| Live endpoint probes (`ping`, unknown action, unauthorized, honeypot POST) | All correct, zero side effects |
| `node --check js/indexJS.js` | clean |

### Bugs Found

**Pre-existing, fixed**
1. Hero before/after loop desynced — stale cleanup timer stripped the next cycle's `isRevealed`.
2. `fireHeroForwardSweepAndWait()` could hang forever if the AFTER plate failed to load.
3. `hero_after` filename casing mismatch between disk and git — a 404 waiting on case-sensitive hosting.
4. Desktop header wrapped across a 126px band (1081–1207px).
5. **No double-submit guard on the estimate form** — harmless while the endpoint was empty, a data-integrity defect the moment it went live.
6. Rowan County absent from all four places the site lists counties, while Morehead was advertised in the nav.

**Pre-existing, found and logged (not fixed)**
7. Current service is not highlighted in the mega menu, contrary to `servicePageArchitecture.md`.
8. Orphan asset `graphics/images/after.JPG`, referenced nowhere.

**Mine, caught by guards before shipping**
9. Generated location pages had mixed line endings (CRLF from template literals, LF from spliced chrome).
10. Chrome splice left seven mega-menu service links resolving inside `insights/` — the location builder had a repointing step the new builder initially lacked.
11. Two unescaped ampersands (category labels, one `og:title`).
12. One Insights article under the thin-content word floor.
13. `.nearbyList` top margin stacked with the lede's bottom margin.

**In validators, not the product** — a harness that started two concurrent hero loops; a mega-panel slice that stopped at the first `</li>`; an article-uniqueness check measuring shared boilerplate; a "no dates" check matching its own explanatory comment; an enum comparison tripping on line endings.

### Bugs Fixed

All of 1–6 and 9–13. Items 7 and 8 are logged in `technicalDebt.md` (18 and 15b).

### Performance Improvements

- Header spacing tightened by **101px**, and the nav restructure removed a further **127px** — the header now needs 1080px of viewport where it once needed 1207px.
- No regressions introduced: no new external hotlinks, no new render-blocking resources, no new fonts. Insights images reuse existing repo assets.
- **Not done:** the Lighthouse pass. Hero images remain `2048×1536` with no `srcset`, and Google Fonts still loads render-blocking.

### UX Improvements

- Mobile hero no longer runs hundreds of pixels past the fold; the estimate card sits on its own band with a deliberate 24px overlap.
- The before/after transition now alternates indefinitely at a consistent 6.1–6.9s cadence instead of stalling every few cycles.
- Desktop nav no longer wraps at any width; transitions between desktop, compact desktop, and mobile are animated on one shared curve, and respect `prefers-reduced-motion`.
- A double-tap on the estimate submit button can no longer produce duplicate leads or a permanently locked form.
- The FAQ mega menu answers common questions in the nav itself; mobile deliberately stays a short list.

### SEO Improvements

- **15 new indexable pages**: 6 location, 1 FAQ hub, 8 Insights.
- Location pages target the money keyword per city with genuinely local content that fails the city-swap test by design.
- New structured data: `Service` ×6 and `FAQPage` ×6 on location pages, `FAQPage` on the hub, `Article` ×7, `ItemList`, and `BreadcrumbList` on every new page.
- `LocalBusiness` `areaServed` extended with Rowan County so schema matches the advertised coverage.
- Internal linking materially strengthened: mega menu → FAQ hub and service pages; "Where We Work" → location tier; every Insights article → its parent service page and the FAQ; the FAQ hub → all seven service pages.
- Titles and meta descriptions verified unique across all 23 pages.
- **No duplicate FAQ questions introduced**, enforced by a check rather than by memory. The same check surfaced one pre-existing duplicate from Phase 1 (technicalDebt item 10a).

### Lessons Learned

- **A passing test proves nothing until it has failed.** The hero-loop harness only earned trust once it reproduced the reported symptom against the pre-fix code.
- **Wiring an endpoint changes which bugs are real.** The double-submit hole existed all along and cost nothing until the URL was set.
- **Measure instead of estimating when the answer is a number.** Parsing the real font files turned the breakpoint from a judgement call into arithmetic.
- **A rule is only real if something checks it.** `seoPlan.md` had banned duplicate questions since day one; writing the cross-reference check is what turned that into a constraint that shaped the FAQ page.
- **Validators fail in both directions.** Roughly a third of this session's "bugs" were in the checking code; every failure needed reading before acting.
- **The same splice bug twice means the splice needs a home.** `repointServiceLinks()` has now been written twice in two one-shot generators.

### Important Decisions

- **Committed to `phase2a-lead-capture`, never pushed**, so all of this can be reviewed before it reaches `main`.
- **No dollar figures anywhere.** No pricing has been approved; inventing ranges would be a commitment the site cannot honour. Logged as the highest-value client ask.
- **No fabricated publication dates** on Insights — none visible, none in schema, with a comment explaining the omission.
- **Placeholder imagery is marked, not disguised** — real BlueGrid photos standing in, each `TODO:`-commented, and no new external hotlinks added.
- **Before & After was removed from the primary nav** on a literal reading of the brief's four-item order. Flagged for confirmation; it remains reachable from the hero CTA and the footer.
- **The 1150px header breakpoint was left alone** even though the nav restructure gave it 163px of slack, because moving it was outside that request.

---

## Next Session Should Continue Here

**Everything through Phase 2D is complete and committed at `863842c`. The working tree is clean and all eight validation suites pass.**

1. **Read `docs/projectState.md` first.** It carries the repository status, the ordered task list, and who owes what.
2. **The only outright launch blocker is the production domain.** Canonicals say `www.bluegridlandsolutions.com`; `CNAME` says `bluegridlandsolutions.nulostudio.com`. It gates `robots.txt`, `sitemap.xml`, canonical finalization, and Open Graph across **23 pages** — all already `TODO:`-marked so one sweep closes them.
3. **Two zero-engineering checks are outstanding:** one real lead submission from the live site (it emails the owner and the customer, so it was not triggered unilaterally), and **a real browser pass — no session on this project has ever had one.**
4. **Before editing any page programmatically:** line endings are mixed per file (see *Current Repository Status*), and chrome spliced from `services/` needs its seven service links repointed to `../services/…`.
5. **Before adding a nav item:** re-run the header width sweep. There is 163px of slack at 1151px today, and a new label consumes it.
6. **After any `.gs` change:** `node appsScript/localTestRunner.js`, expect `passed: 64  failed: 0`.
7. **New content must clear the uniqueness gate** — under 25% pairwise 5-word-phrase overlap, and no FAQ question may duplicate one already on the site. Current totals: **103 rendered FAQ questions, 102 unique** — the gap is one pre-existing duplicate between `index.html` and `services/landClearing.html`, logged as `technicalDebt.md` item 10a.

---

## 2026-08-04 — Navigation restructure, FAQ hub, and Insights

### Summary

Replaced Reviews with Insights in the primary nav, turned FAQ into a desktop mega menu, and built two new sections: a dedicated FAQ hub and an Insights resource centre with seven launch articles. The site went from 14 pages to **23**.

### Files Created

- `faq/index.html` — 28 questions across 6 categories
- `insights/index.html` — the resource centre landing page
- `insights/{benefits-of-forestry-mulching, brush-hogging-vs-forestry-mulching, when-to-clear-overgrown-property, preparing-land-for-building, storm-cleanup-best-practices, fence-line-clearing-tips, signs-your-property-needs-land-management}.html`

### Files Modified

- All 14 existing pages — nav tail replaced, mobile drawer simplified, footer FAQ link retargeted with Insights added
- `css/styleIndex.css` — `.megaPanelFaq` and its contents
- `css/stylePages.css` — FAQ page and Insights components

### Navigation

Final order is **Services · Service Areas · FAQ · Insights**.

**A judgement call worth flagging:** the brief said to remove Reviews and replace it with Insights, then gave the resulting order as a four-item list that does not include *Before & After*. Read literally that is a complete specification, so Before & After came out of the primary nav. It remains reachable from the homepage hero CTA ("See Transformations") and from the footer Quick Links, so nothing is orphaned — but if the intent was a five-item nav, putting it back is a one-line change.

### FAQ Mega Menu

Nine questions, each a bold question plus a two-sentence preview, two-up in a 760px panel capped against the viewport so it cannot overhang at the narrowest desktop width. A "View All FAQs" CTA sits under a divider.

**The nine items do not all point at the FAQ page.** Several of the most common questions were already answered elsewhere — "What is forestry mulching?" on the homepage and the mulching service page, "Do you remove stumps?" on land clearing, "Do you haul debris away?" on property cleanup. Those link to the page that owns the answer; the rest link to `faq/index.html#anchor`. That keeps the mega menu genuinely useful without restating answers that already exist, which `seoPlan.md` forbids.

Mobile is deliberately two plain links. A mega menu inside a full-screen drawer is worse than a short list, and the brief asked for it to stay simple. A check fails if mega-menu markup ever leaks into the drawer.

### FAQ Page

Six categories — Estimates & Getting Started, Choosing the Right Service, On Your Property, Equipment & Conditions, After the Job, Payment & Paperwork — with a jump-link card grid at the top and the existing accordion component for the answers. Every question anchors individually so the mega menu can deep-link to it. It carries the `FAQPage` schema and links out to all seven service pages.

**All 28 questions are new.** The site already had 75 FAQs across the homepage, service pages, and location pages, and `seoPlan.md` bans duplicate questions across pages. Rather than build a hub that restates and competes with the service pages, the hub took the territory nobody had covered: insurance, deposits, 811 locates, property lines, livestock and gates, ground pressure, weather delays, what the ground looks like afterward, whether the mulch attracts pests. A validator now cross-references all 74 questions elsewhere on the site and fails on any collision.

### Insights

Seven articles, 550–900 body words each, worst pairwise 5-word-phrase overlap **0.3%**. Each has an `Article` schema, a breadcrumb, related-reading cards, a link to its parent service page, and a link back to the FAQ.

**No dates anywhere**, as instructed — no visible date, no `datePublished`, no `dateModified`, no `<time>` element. The schema comment explains why rather than leaving a future reader guessing. A check enforces it.

**Hero and card images are real BlueGrid job photos standing in for topic-specific photography**, each marked with a `TODO: PLACEHOLDER IMAGE` comment in the markup. No new external hotlinks were introduced — `technicalDebt.md` item 6 already complains about the Unsplash ones on the homepage and adding more would have made that worse.

### Validation Performed

- **23 pages, 2,407 internal links and assets, zero broken.** Every same-page and cross-page anchor resolves.
- Nav order verified on all 23 pages by parsing the rendered markup, not by trusting the generator. Reviews confirmed absent from every primary nav.
- Mega menu: 9 questions and 9 previews on every page, CTA present, `aria-expanded` / `aria-controls` / panel id wiring intact, every preview ≤3 sentences.
- Mobile drawer: exactly two items, no mega markup, on all 23 pages.
- FAQ page: all 6 category sections and jump links present, all 28 question anchors present, 28 accordions rendered, every mega-menu deep link resolves, all 7 service cross-links present.
- **Zero duplicate questions** against the 74 elsewhere on the site.
- Insights: every article linked from the landing page, word counts above the thin-content floor, no dates, placeholder images marked, service and FAQ links present.
- Regression suite unchanged: hero seam exact on five viewports, hero loop 92/92 alternating, lead flow contract clean on all 23 pages, header sweep 900–1600 with zero wrapping, `node --check` clean, Apps Script 64/64.

### A Consequence Worth Recording

The new nav is **127px narrower** than the old one (450px vs 577px) — FAQ and Insights are shorter labels than Before & After plus Reviews plus FAQ. The header now needs **1080px** of viewport rather than 1207px, so at 1151px there is **163px of slack** instead of 45px.

The 1150px mobile breakpoint was therefore left alone but is now more conservative than it needs to be: the desktop nav would survive comfortably to roughly 1105px. Moving it was not part of this request and the previous session chose 1150 partly for webfont-fallback margin, so the headroom is recorded in `technicalDebt.md` rather than spent unilaterally.

### Bugs Found

**Mine, caught by the guards**

1. The chrome was spliced from `services/forestryMulching.html`, where the seven mega-menu service links are relative to that folder — so every new page linked to `insights/forestryMulching.html`. The location-page builder had a `repointServiceLinks()` step for exactly this; I forgot it. The link validator caught all 63 instances.
2. Two genuinely unescaped ampersands: the category labels ("Payment & Paperwork") and one `og:title`. The ampersand guard caught both.
3. `when-to-clear-overgrown-property` came in at 537 body words, under the thin-content floor. Added a section on what waiting actually costs.

**In the validator, not the product**

4. The mega-panel check sliced to the first `</li>`, which closes the first question rather than the panel — it reported 1 question on every page.
5. The article uniqueness check measured `<main>`, which includes the shared hero, breadcrumb, related cards, and estimate form. That reported 26.1% overlap for what is almost entirely template. Measuring the prose only gives 0.3%.
6. The "no dates" check matched the schema comment explaining why dates are absent.

### Lessons Learned

- **The same splice bug twice means the splice needs a home.** `repointServiceLinks()` has now been written twice in two different one-shot generators. Phase 13's real generator should own it rather than each script rediscovering it.
- **A duplicate-content rule is only real if something checks it.** `seoPlan.md` has banned duplicate questions since the start; writing the cross-reference check is what turned that from an intention into a constraint, and it shaped the whole FAQ page — the 28 questions are the ones that were left after subtracting 75.
- **Validators fail in both directions.** Three of this session's six "bugs" were in the checking code. A failing check is a hypothesis, not a verdict; each one needed reading before acting.

---

## 2026-08-03 — Header navigation polish

### Summary

The desktop header wrapped between roughly 1100px and 1200px. Tightened the spacing to buy 101px, then moved the mobile-nav switch from 1080px to 1150px, because even fully optimized the bar still could not fit at 1100px.

Measured rather than eyeballed: this session pulled the real Inter and Rokkitt font files and wrote a minimal TrueType metrics parser, so every number below is an advance-width measurement, not an estimate.

### Files Modified

- `css/styleIndex.css` — anti-wrap guards on the base header rules; new `@media (max-width: 1280px)` compact band; new `@media (max-width: 1150px)` mobile-nav switch; the six header rules that used to live in the `1080px` query moved into it

### The Audit

`.headerInner` is a flex row whose items shrink before anything else gives, and nothing in the header carried `white-space: nowrap` — so once the content stopped fitting, the nav links and the phone number broke onto a second line inside a fixed-height bar.

Measured, the full-spacing header needs **1207px** of viewport:

| Part | Width |
|---|---|
| Brand lockup (badge 69 + gap 16 + text 118) | 203px |
| Primary nav — Services 112, Service Areas 150, Before & After 135, Reviews 92, FAQ 62, plus gaps | 577px |
| Phone chip | 171px |
| Free Estimate | 142px |
| Two 25.6px header gaps + 48px padding | 99px |
| **Viewport required** | **1207px** |

The mobile switch sat at 1080px, so **1081–1207px was a 126px-wide band where the desktop nav was live and could not fit.** That is exactly the reported symptom.

### Optimization First

Every requested lever, applied cumulatively and measured:

| Change | Saved |
|---|---|
| Nav link padding `0.95rem` → `0.7rem` | 40px |
| Header gap `1.6rem` → `1.1rem` | 16px |
| Nav list gap `0.4rem` → `0.25rem` | 10px |
| Brand badge `69px` → `60px` | 9px |
| Header padding `1.5rem` → `1.25rem` | 8px |
| Phone chip padding `1rem` → `0.75rem` | 8px |
| Brand lockup gap `1rem` → `0.75rem` | 4px |
| Nav chevron gap `0.4rem` → `0.3rem` | 3px |
| Header actions gap `0.9rem` → `0.7rem` | 3px |
| **Total** | **101px** |

**The `Free Estimate` CTA padding was deliberately left alone.** Shrinking the primary CTA is what makes a header read as cramped rather than tidy, so everything else gave ground first. Nav, phone, and CTA font sizes were also untouched — that would be changing typography. The only type change is the brand mark, which the brief explicitly allowed to shrink and which the stylesheet already shrank at smaller widths.

### The Breakpoint Did Move — and Optimization Alone Was Not Enough

Optimized, the header needs **1106px**. At a 1100px viewport that is still **6px short**. Leaving the switch at 1080px would have left a small but real broken band at 1081–1106px, so the switch moved to **1150px**.

Why 1150 and not 1100 or 1200:

- **1100px fails outright** — 6px of overflow.
- **1130px** is the bare minimum for 24px of slack, with nothing spare.
- **1150px** leaves **45px of slack** at 1151px, the last desktop width. That margin matters because `--fontBody` falls back to `'Segoe UI'`, which is wider than Inter; without headroom the header would wrap during the brief window before the webfont loads.
- **1200px** would work but drops the desktop nav earlier than it needs to, against the instruction to keep it active as long as it stays clean.

1150px keeps the desktop nav on every common laptop width (1280, 1366, 1440, 1600) and on iPad-class landscape viewports of 1180–1194px.

### Two Deliberate Structural Choices

1. **The compact band starts at 1280px, not at the 1207px wrap point.** Crossing 1280 downward therefore makes the bar *roomier* (74px slack → 174px), never tighter. A band that began at the wrap point would have produced a visible snap exactly where the layout was already under strain. Above 1280px nothing changed at all.

2. **The switch is a header-only media query.** The existing `1080px` query also drives the hero, the services grid, and other section layouts. Retargeting the whole query to 1150px would have moved all of that — a redesign of sections nobody asked about. The six header rules were moved out into the new `1150px` query and the `1080px` query kept everything else. A check now fails if a header rule reappears in the `1080px` block.

### Validation Performed

- Downloaded the real **Inter 600/700 and Rokkitt 700** from Google Fonts (legacy UA → EOT, TTF payload extracted from the wrapper) and wrote a `head`/`hhea`/`hmtx`/`cmap`-format-4 parser. Kerning is ignored on purpose: it almost always subtracts width, so omitting it errs wide, which is the safe direction for a fit question.
- **Swept every integer width from 900 to 1600px**, resolving which tokens apply at each and re-measuring. **Zero widths wrap.** The tightest desktop width is **1151px with 45px of slack**.
- All ten requested widths verified: 1600/1440/1366 clean at +153px, 1280 at +174px, 1200 at +94px; 1100/1024/992/900/768 on the hamburger.
- Transition continuity asserted — the compact band must not reduce slack at its own boundary.
- Structural checks: `white-space: nowrap` on `.navLink`, `.phoneChip`, `.headerCta`, `.brandName`, `.brandNameSub`; `flex-wrap: nowrap` on `.navList`; `flex-shrink: 0` on `.primaryNav` and `.headerActions`; the CTA's padding absent from the compact band; the `1150px` query genuinely hiding the nav/phone/CTA and showing the hamburger; no header rule left behind in the `1080px` query.
- Regression suite unchanged: 14 pages / 1,372 links and assets / zero broken; hero seam exact on five viewports; hero loop 92/92 alternating; lead flow contract clean on all 14 pages; `node --check` clean; Apps Script 64/64.

### Not Verified

Still no browser. The arithmetic is measured from the real fonts and the real stylesheet, but nothing was rendered — the mega-panel drop shadows, the hamburger's optical alignment at 1150px, and the general feel of the compact band have not been seen. Covered by `technicalDebt.md` item 18a.

### Follow-up refactor — tokens and a unified morph

Requested after the first commit; no visual change, every measured width reports identical slack.

**Twelve `:root` tokens** replaced the duplicated layout rules: `--headerPadX`, `--headerGap`, `--headerBrandGap`, `--headerBadgeSize`, `--headerBrandNameSize`, `--headerNavGap`, `--headerNavLinkPadX`, `--headerNavChevronGap`, `--headerActionsGap`, `--headerPhonePadX`, `--headerCtaPadX`, `--headerTransition`. The `1280px` and `1150px` queries became **token overrides only**, and the `.brandBadge` / `.brandName` rules that were duplicated in the `1150px` and `640px` queries are gone — both sizes now come from tokens, so all four header states are described in one vocabulary. Only header variables were added; nothing existing was refactored.

`--headerCtaPadX` exists specifically so the CTA's constancy is explicit rather than incidental. A check fails if any breakpoint overrides it.

**One shared timing.** Every dimension that differs between states animates on `--headerTransition` (`0.35s var(--easePremium)`), matching what `.siteHeader` already used for its scrolled background: `.headerInner` gap/height/padding, `.brandLockup` gap, `.brandBadge` width/height, `.brandName` font-size, `.navList` gap, `.navLink` gap/padding, `.headerActions` gap, `.phoneChip` padding. Hover colour keeps its quicker 0.25s timing — only layout properties ride the shared curve.

The switch itself cannot animate: `display` is not interpolable and there is no honest tween from a five-item nav to a hamburger. But the bar's height, logo, and padding still ease across it, so 1150px reads as the header resolving into its compact form rather than a jump cut.

`prefers-reduced-motion` sets `--headerTransition: 0s`, which kills the entire morph in **one declaration** because every rule shares the token.

New checks: every token is actually consumed by a header rule (an orphaned token is worse than a hardcoded value); no breakpoint overrides `--headerCtaPadX`; all eight rules animate their layout properties on `var(--headerTransition)`; reduced motion zeroes it; no `.brandBadge`/`.brandName` rule survives in the `1150px` or `640px` queries.

Verified at 1600/1440/1366/1280/1200/**1151**/**1150**/1100/1024/992/900/768 — desktop widths clean at +153/+153/+153/+174/+94/+45, hamburger below. Sweep of every integer width 900–1600 still reports zero wrapping and the same 45px tightest slack.

### Lessons Learned

- **A token nothing reads is worse than a hardcoded value.** The refactor's first check verifies each custom property is actually consumed, because the failure mode of "tokenize everything" is a variable that silently does nothing while looking authoritative.
- **"Reduce the spacing" and "move the breakpoint" were not alternatives.** The brief framed them as a fallback chain, and measuring showed both were needed: optimization alone still left a 6px deficit at 1100px. Without numbers it would have been easy to ship the tightening, feel that it looked better, and leave a narrow broken band behind.
- **Font files are gettable, so text width is measurable.** Guessing average character widths would have put the answer off by enough to pick the wrong breakpoint. An hour of TrueType parsing turned a judgement call into arithmetic.
- **Start a compact band above the point where it is needed.** Putting the boundary at 1280 rather than 1207 means the adjustment lands where there is still slack, so it reads as a smooth change rather than a rescue.

---

## 2026-08-03 — Phase 2D: live Apps Script backend connected

### Summary

The production Web App URL is wired into `businessConfig.estimateEndpoint` and lead capture is live. **This closes the project's oldest and largest launch blocker** — since Phase 1 the form had been showing visitors a confirmation while discarding their request.

The endpoint was already architected as a single shared value, so no refactor was needed; the audit below proves that rather than assuming it. The code review that followed the wiring found one real defect, which is fixed.

### Files Modified

- `js/indexJS.js` — production `/exec` URL set in `businessConfig`; double-submit guard added (`estimateSubmissionInFlight`, `endEstimateSubmission()`); `leadId` held stable for the page load via `currentEstimateLeadId`

### Single Source of Truth — audited, not assumed

The endpoint appears **exactly once** in shipped code. All 14 pages load the same `js/indexJS.js`, and there is **exactly one `fetch()` call site**, which builds its URL from `businessConfig.estimateEndpoint + '?action=leads.create'`. No page inlines a handler; every `<form>` carries `action="#"` and is JS-handled. A future redeployment is a one-line change.

Checks now enforce this: one live URL in shipped code, one `fetch()` call site, no hardcoded endpoint in any HTML/CSS, every page loading the shared script, and no form posting anywhere.

### Defect Found and Fixed — duplicate leads on a double-tap

`submitEstimateRequest()` had no in-flight guard. `isLoading` was a cosmetic class; the button was never `disabled` and nothing checked whether a request was already running. Worse, `buildEstimatePayload()` minted `leadId: 'BG-' + Date.now()` **on every call**, so two taps produced two *different* leadIds — and the API's dedupe is keyed on `leadId`, so it could not collapse them.

Result, had this shipped: one visitor double-tapping the submit button (on mobile, under a thumb) produces **two rows in the client's sheet, two owner emails, two customer auto-replies**, and burns double the MailApp quota — which is only ~100 recipients/day on consumer Gmail.

This was harmless while the endpoint was empty, because the unconfigured branch never made a request. **Wiring the endpoint is what made it real**, which is exactly why the review was worth doing after the wiring rather than before.

Fix:
- `estimateSubmissionInFlight` short-circuits a second call.
- The button is genuinely `disabled` for the duration, so Enter cannot re-trigger it either.
- `endEstimateSubmission()` releases the lock, and is called on **all three** terminal paths — unconfigured, resolved, rejected — so a failed attempt can still be retried rather than locking the form forever.
- `currentEstimateLeadId` holds the id steady for the page load, so a retry after a network failure carries the *same* id and the server's dedupe collapses it into the original row. Holding it for the page load is correct because the flow allows one submission per load: once the success panel shows, reopening the modal shows the panel again, not a blank form.

### Validation Performed

**Live, against the production endpoint** (zero side effects on the client's sheet or inbox):

- `GET ?action=ping` → `200` `{"success":true,"data":{"module":"forestryModule","clientId":"bluegrid","version":"1.0.0",…}}`. The identity triple matches `config.gs` exactly, confirming the deployed script is the code in this repo.
- `GET ?action=leads.explode` → `UNKNOWN_ACTION`
- `GET ?action=leads.list` with no key → `UNAUTHORIZED`
- `POST ?action=leads.create` with the honeypot filled → `200` `{"success":true,"data":{"lead":{"leadId":"BG-…"},"honeypot":true}}`. This exercises the **entire real transport chain** — `text/plain` body, no CORS preflight, Apps Script's 302 to `script.googleusercontent.com`, JSON envelope — while `handleCreateLead` short-circuits before writing a row or sending mail. A genuine end-to-end test with nothing to clean up afterward.

**Static contract check** (`validateLeadFlow.js`), covering all 14 pages:

- 20 payload keys, every one mapping to a `LEADS_HEADERS` column except the honeypot; **no server-owned column** (`photoUrls`, `propertySize`, `terrainType`, `status`, `estimateAmount`, `assignedTo`, `internalNotes`, `lastUpdated`) is ever sent by the client
- All 5 `REQUIRED_CREATE_FIELDS` present
- `HONEYPOT_FIELD` in `config.gs` matches the input's `id` **and** `name` on all 14 pages, each wrapped in an `aria-hidden` container with `tabindex="-1"` and `autocomplete="off"`, exactly one per page
- Every `serviceNeeded`, `preferredTime`, and `preferredContactMethod` value offered in HTML is in `ENUM_VALUES`; the `preferredContactMethod` fallback is itself a legal enum
- All 9 element ids `buildEstimatePayload()` reads exist on all 14 pages — it calls `getElementById(...).value` without null guards, so a missing one would throw at submit
- All 6 field-error targets referenced by `showSubmissionError()` exist on all 14 pages
- Transport stays `POST` + `text/plain`; `routes.gs` registers `leads.create` as POST with no auth
- Response handling covers non-200, the success envelope, the error envelope, and network rejection; `VALIDATION_ERROR` matches `ERROR_CODES.validation`
- The client honeypot check runs **before** the fetch
- `leadId` format satisfies the server's own `isValidLeadId` regex, extracted from `validation.gs` rather than hardcoded

Regression suite unchanged: 14 pages / 1,372 links and assets / zero broken; hero loop 92/92 alternating; hero seam exact on five viewports; `node --check` clean; Apps Script harness 64/64.

### Not Verified

- **A real lead was never created.** That path writes a row and emails both the owner and the customer, so it is not mine to trigger unilaterally. The deployment reportedly passed it during setup; it should be re-run once from the live site as the final pre-launch check.
- **Whether `MODULE_API_KEY` is actually set** cannot be determined from outside — `leads.list` returns `UNAUTHORIZED` identically whether the key is missing or simply not supplied. Only `leads.list`/`leads.update` (the Phase 2 dashboard) depend on it; the public form does not.
- **Still no browser.** Same limitation as Phase 2C: no rendered check of the form UI on a real device.

### Lessons Learned

- **Wiring an endpoint changes which bugs are real.** The double-submit hole existed for the whole project and cost nothing, because the unconfigured branch never issued a request. It became a live data-integrity defect the moment the URL was set. Reviewing the flow *after* the wiring, as instructed, is what surfaced it.
- **The honeypot path is a free production smoke test.** It exercises the complete transport — content type, preflight avoidance, redirect, envelope — and by design writes nothing and sends nothing. Worth remembering for any Apps Script backend that has one.
- **"Single source of truth" is a claim to verify, not to assert.** The endpoint really was already in one place, but the check that proves it is what keeps it in one place through the next change.

---

## 2026-08-03 — Phase 2C: hero mobile refinement

### Summary

Three defects in the homepage hero, all fixed at the cause. The hero background no longer grows with the estimate form on mobile; the before/after transition alternates forever instead of desyncing after a few cycles; and the updated `hero_after` asset's filename casing was normalized so it cannot break on a case-sensitive host.

No redesign, no typography change, and the typing animation was not touched.

### Files Modified

- `css/styleIndex.css` — hero media layer decoupled from section height in the `1080px` query; new `.heroSection::after` estimate band; `.heroOverlay` now lands on solid `--colorNearBlack` at the seam; `.heroContent` given the `min-height` that used to sit on `.heroSection`; `.estimateFormCard` rides up over the seam. The `640px` query's `.heroContent` min-height tracks its tighter top padding
- `js/indexJS.js` — `fireHeroReverseDissolve()` became `fireHeroReverseDissolveAndWait()` and is now awaited; `fireHeroForwardSweepAndWait()` gained an `error` fallback
- `index.html`, `locations/forestry-mulching-ashland-ky.html` — `hero_after.JPG` → `hero_after.jpg` (3 references)
- `graphics/images/hero_after.JPG` → `graphics/images/hero_after.jpg` (git rename)

### Issue 1 — hero background ran past the fold on mobile

**Cause.** `.heroMedia` was `position: absolute; inset: 0`, so its height was the *section's* height. At `1080px` and below `.heroInner` collapses to one column and the estimate card stacks beneath the hero copy, roughly doubling the section. The photograph faithfully stretched to cover all of it. Reducing the hero height would not have fixed this — the coupling was the defect.

**Fix.** Stop letting section height drive the picture:

1. `.heroMedia` is pinned top-only (`inset: 0 0 auto`) with an explicit `height: var(--heroMediaHeight)`.
2. `--heroMediaHeight` is declared once on `.heroSection` as `100vh` then `100lvh` (cascade fallback for browsers without `lvh`). `lvh` keeps the picture covering the viewport in every browser-chrome state. One number drives the media band, the copy block, and the estimate band.
3. `.heroContent` carries `min-height: calc(var(--heroMediaHeight) - var(--headerHeight) - 3rem)` — this is the `min-height` that used to live on `.heroSection`, moved onto the block it actually describes. It makes the copy end exactly on the seam whatever it measures, so the card always arrives at the fold.
4. `.heroSection::after` paints the estimate band from `var(--heroMediaHeight)` to the section bottom, opening in `--colorNearBlack` and settling into `--colorCharcoal` — its own background, starting in the exact colour the photograph fades into.
5. `.estimateFormCard` gets `margin-top: -4.5rem` against the `3rem` grid gap, so it rides 24px up over the seam for the layered edge.

**The fade is on `.heroOverlay`, not on `.heroPlate`.** The obvious approach — a bottom `mask-image` on the plates — would have overwritten `.heroPlateAfter`'s `mask-image`, which *is* the sweep animation. Putting the fade in the overlay's existing 180deg gradient (final stop `var(--colorNearBlack) 100%`) reaches the same result, improves contrast under the stats, and leaves the sweep alone. A validator check now asserts no mobile `.heroPlate` rule sets `mask-image`.

Desktop is untouched: every one of these rules lives inside the `1080px` query, and `--heroMediaHeight` does not exist above it.

### Issue 2 — before/after stopped alternating

**Cause.** `fireHeroReverseDissolve()` was fire-and-forget. It set `isDissolving`, then scheduled cleanup — remove `isRevealed`, remove `isDissolving`, under `isResetting` so nothing transitions — on a `1800ms` timer. The loop, however, only waited `emptyBreathMs` (220ms) before starting the next phrase.

So the cleanup timer from cycle N could fire *during* cycle N+1. When it did, it stripped the `isRevealed` that N+1 had just added: the AFTER plate snapped away mid-sweep and the next reveal had to wait a full phrase. That is exactly the reported "Before → After → Before → long pause → starts again". Whether a given cycle collided depended on phrase length, which is why it looked intermittent.

**Fix.** The dissolve now returns a promise that resolves only once the plate is fully back to BEFORE with its classes clean, and the loop awaits it. The cycle is strictly sequential and no timer can outlive the cycle that created it.

The dissolve's own timer stays deliberately unpaused. The CSS opacity transition cannot pause either, so an in-flight dissolve always finishes — which is the etiquette the existing comment describes. The loop takes its pause at the breath that follows.

Also hardened `fireHeroForwardSweepAndWait()`: it waited on the AFTER plate's `load` event when the image was not ready, so an image that failed to load would leave the promise unresolved and the hero dead forever. It now resolves on `error` too, degrading to a BEFORE-only hero rather than stopping.

### Issue 3 — hero image

`graphics/images/hero_after.JPG` was replaced with a new 549KB image in `fb15070`, but it arrived on disk as `hero_after.jpg`. Windows is case-insensitive so git kept tracking the uppercase name while the working tree held the lowercase one. Nothing was broken today, but GitHub Pages is case-sensitive and the mismatch was one careless `git add` away from a 404 on the homepage hero.

Normalized via a two-step `git mv` and updated all 3 references. Both plates are `2048x1536` and both declare `width="2048" height="1536"`, so the swap is ratio-identical — no distortion, no layout shift.

### Validation Performed

- **Hero loop harness** — loaded the real `js/indexJS.js` into a VM with mocked DOM and a virtual clock, ran the actual `runHeroDuetLoop()` for **10 minutes of page time**, and recorded every class mutation on the AFTER plate.
  - Fixed code: **92 complete cycles, perfectly alternating**, cadence **6.13s min / 6.50s avg / 6.94s max**, zero clipped reveals. The sub-second spread is the randomized per-character typing speed, which is the intended human feel.
  - **The same harness run against the pre-fix code from `HEAD` fails**: 90 of 108 reveals cut short by a stale reset (the worst held the AFTER plate for 58ms), cadence swinging 4.32s–9.74s. The test demonstrably catches the bug it claims to fix.
- **Hero layout validator** — parses the real stylesheet, extracts the placement declarations, and computes the seam on five viewports. At 360×640, 390×844, 430×932, 768×1024, and 1024×1366 the copy block ends **exactly** on the media seam (0px error) and the card overlaps it by **24px** every time. Also asserts desktop is untouched, the media layer is bounded, the band opens in the seam colour, and no mobile rule overwrites the plate mask.
- Sitewide validator unchanged: 14 pages, **1,372 links and assets, zero broken**.
- `node --check js/indexJS.js` clean; `styleIndex.css` braces balanced; Apps Script harness still **64/64**.

### Honest Limitation

**No browser was run.** This environment has no Playwright or Chrome DevTools MCP, so there are no screenshots and no real rendered measurement. Everything above is static analysis plus a faithful simulation of the shipped JavaScript. The geometry and the loop are verified; the *look* of the seam on a real device is not. Someone should open the homepage on a phone before launch — that check is listed in `technicalDebt.md`.

### Lessons Learned

- **A passing test proves nothing until it has failed.** The loop harness was worth writing only because running it against the old code reproduced the exact reported symptom. Before that it was decoration.
- **The first harness run found my own bug, not the product's.** It reported two concurrent loops; `indexJS.js` already calls `initializeHeroDuet()` at module scope, and the harness called it again. Reading the trace rather than trusting the summary is what caught it.
- **When a layer's size is wrong, look at what is driving it.** The instruction not to simply reduce the hero height was the right call: an absolutely-positioned `inset: 0` layer is coupled to its container's content, and every fix that is not decoupling is a workaround.

---

## 2026-08-02 (session 2) — Phase 2A verification + Phase 2B service area pages

### Summary

Verified Phase 2A was genuinely finished rather than trusting the previous entry, then built Phase 2B's first wave: **six forestry mulching location pages** covering the cities `seoPlan.md` stages as the Phase 7 build set, and wired every service-area link on the site to them.

Phase 2A needed no code. The harness still reports 64/64, the deployment runbook is complete, and `estimateEndpoint` is still empty — exactly the state the previous session described. The only remaining 2A work is the Google Apps Script deployment, which requires credentials no engineering session has.

The site went from "13 cities advertised in the nav, all 13 pointing at one anchor" to "6 real, locally specific landing pages that a competitor cannot produce by find-and-replace."

### Files Created

**Location pages** (`locations/`)
- `forestry-mulching-ashland-ky.html`
- `forestry-mulching-portsmouth-oh.html`
- `forestry-mulching-ironton-oh.html`
- `forestry-mulching-chillicothe-oh.html`
- `forestry-mulching-grayson-ky.html`
- `forestry-mulching-morehead-ky.html`

### Files Modified

- `index.html` — 6 mega-menu cities and 6 mobile-menu cities repointed at their pages; 6 footer cities became links; new "Forestry mulching, town by town" block added inside `#serviceAreas`; Rowan County added to `LocalBusiness` `areaServed`, the static map panel list, and both copies of the "Do you travel to my county?" answer
- `services/forestryMulching.html` — same 18 chrome link changes, plus a new **"Where We Work"** section linking all 6 location pages. This is the parent page for the location tier and the only place body content links down to it
- `services/{landClearing,brushRemoval,trailCutting,stormCleanup,propertyCleanup,huntingPropertyPrep}.html` — 18 chrome link changes each
- `css/stylePages.css` — activated the dormant `SERVICE AREA PAGES (locations/)` block; added `.localSection`, `.localProse`, `.localProblemGrid`; changed `.nearbyList` from styling `a` to styling `li`
- `css/styleIndex.css` — `.serviceAreaTowns` / `.serviceAreaTownsLabel` / `.serviceAreaTownList` for the new homepage block
- `js/indexJS.js` — `rowan` added to `serviceRegions`, TODO-marked for client confirmation

### Architecture Decisions

1. **Six pages, not thirteen.** `seoPlan.md` rows 1–6 with genuinely local content, over 13 pages that would read as doorway pages. The nav advertises 13 cities; the 7 without pages still point at the `#serviceAreas` anchor rather than getting a shell.
2. **Reused the existing tier, added nothing structural.** `css/stylePages.css` already carried an unused `.localFactGrid` / `.localServiceList` / `.nearbyList` block, and `getSourcePage()` in `js/indexJS.js` already special-cased a `locations/` folder — the previous session pre-wired for this. Three new CSS rules were all the tier needed.
3. **Location pages link up, never sideways.** Per `seoPlan.md`'s Internal Linking Map: each page links to its parent service page, the homepage, and all 7 services. Nearby towns are rendered as plain text pills, which is why `.nearbyList` was changed from styling `a` to styling `li`. A validator check enforces this on the `<main>` content of every location page.
4. **Sitewide chrome does link to location pages, deliberately.** `seoPlan.md` rule 4 explicitly blesses "an inbound link from the mega menu", and making the shared header page-type-dependent across 14 files would be a maintenance trap. The no-sideways-links rule is enforced where it matters — body content.
5. **Breadcrumb is Home › Forestry Mulching › City,** not the `seoPlan.md` sketch of Home › Locations › Page. There is no `locations/` hub page yet (that is Phase 13), so a "Locations" crumb would have pointed at nothing. Every crumb in the shipped version resolves.
6. **No dollar figures.** `seoPlan.md` content rule 5 asks for real cost ranges, and no pricing has been approved by the client — the 7 existing service pages quote none either. Each cost FAQ instead answers with the factors that move the price on that county's specific ground, which is honest and still locally unique. Logged as a client ask, because supplying ranges is the single strongest upgrade available to these pages.
7. **No galleries on location pages.** 13 photos exist for 14 pages and none can be honestly captioned to a named town. Consistent with the Phase 1 decision on `stormCleanup` and `huntingPropertyPrep`.
8. **The assembler stays in the scratchpad.** Pages were generated once from a guarded splice of `services/forestryMulching.html` plus a content data file, then committed as plain static HTML — the same technique the previous session used. It is deliberately **not** checked in: Phase 13 (`phasePrompts/phase13ServiceAreaExpansion.md`) builds the real generator, and shipping a half-generator now would leave two competing sources of truth.
9. **Rowan County added to the coverage data.** Morehead was advertised in the nav on all 8 pages but Rowan County appeared in none of the four places the site lists counties. Publishing a Morehead page while the schema denied coverage would be worse. Added and TODO-marked rather than silently expanded.

### Validation Performed

- **14 pages, 1,372 internal links and assets checked, zero broken.** Every same-page anchor resolves to an id on that page; every cross-page anchor resolves to an id on the target page
- One `<h1>` per page; zero duplicate IDs; tag balance verified across 16 element types
- Every JSON-LD block parses; every `FAQPage` question is verified to actually render in the markup
- Titles and meta descriptions **unique across all 14 pages**
- `serviceNeeded` enum identical across all 14 pages and `appsScript/config.gs` (compared on values, since the homepage uses CRLF and interior pages LF)
- Every location page preselects `Forestry Mulching` in the embedded form
- Each built city has at least 3 links per page (mega menu, mobile menu, footer); no built city still points at `#serviceAreas`; all 6 are reachable from the parent service page
- **Uniqueness gate:** worst pairwise 5-word-phrase overlap between location pages is **14.7%** against a 25% threshold; body copy 1,133–1,283 words per page
- CSS braces balanced in both stylesheets; every class used in new markup exists in a stylesheet
- `node --check js/indexJS.js` clean
- `node appsScript/localTestRunner.js` — **64/64**, `runSelfTest` 6/6, unchanged
- CTA destinations enumerated on a finished page and confirmed: hero and floating estimate → `#estimateForm` (present), phone → `tel:` with `data-confighref`, footer "View Our Work" → `../index.html#beforeAfter`, Facebook → the real page

### Bugs Found

**Introduced by me during this session, caught by the guards**

1. Generated pages shipped **mixed line endings** — CRLF from the template literals in the generator, LF from the chrome spliced out of `services/forestryMulching.html`. Normalized to LF to match the sibling `services/*.html` files.
2. The first build aborted on an unescaped-ampersand guard that was matching `META & SEO` inside HTML comments. The guard was wrong, not the output — fixed to strip comments before checking.
3. The `serviceNeeded` drift check compared raw text and flagged all 13 interior pages. The enum values were identical; only indentation and line endings differed. Fixed to compare normalized values.
4. `.nearbyList` carried a `2rem` top margin from the previous session, which stacked with the `3.2rem` bottom margin of the `.sectionLede` above it. Changed to `0 0 2.4rem`.

**Pre-existing, found but not in scope**

5. `servicePageArchitecture.md` says the current service should be highlighted in the mega menu on its own page. It is not — the header block is byte-identical across all 7 service pages. Logged in `technicalDebt.md`.

### Important Decisions Made

- **Morehead was kept in the first wave** even though Rowan County sat outside the documented coverage map, because `seoPlan.md` lists it as row 6 and the nav has always advertised it. The coverage data was corrected to match rather than the page being dropped.
- **West Union, OH and Flatwoods, KY are advertised in the nav but appear nowhere in `seoPlan.md`'s 11-city table.** Not resolved this session — flagged in `projectState.md` as a decision: give them pages or take them out of the nav.
- **`locations/` was the only new folder created**, and it is the folder `servicePageArchitecture.md` and `seoPlan.md` both specify.

### Lessons Learned

- **A dormant CSS block is a design decision left in the repo.** `stylePages.css` had `.localFactGrid`, `.localServiceList`, and `.nearbyList` written and unused. Reading them first shaped the page anatomy and meant three new rules instead of a new stylesheet.
- **Write the uniqueness test before writing the pages.** A 5-word-shingle overlap check turns "don't build doorway pages" from an intention into a number. 14.7% against a 25% gate is a fact; "these feel different" is not.
- **Guards catch your own mistakes, not other people's.** All four bugs this session were mine, and three were caught by assertions written before the code ran. The mixed-line-endings one was caught by an audit added only because the enum comparison failed for an unrelated whitespace reason — worth remembering that a false positive can still point at something real.
- **A validator that only checks the new work is worth half as much.** Running the link and structure checks across all 14 pages, not just the 6 new ones, is what confirmed the chrome rewiring landed identically everywhere.

---

## 2026-08-02 — Website completion + lead capture infrastructure

### Summary

Two phases in one session. **Phase 1** completed the website: built the 7 missing service pages that fixed 28 broken links, removed the fabricated review carousel, and repurposed the homepage's second section into a video-ready owner introduction. **Phase 2A** built the entire lead capture backend: a modular Apps Script web app, an `errorLog` sheet, owner-only email notification, and a Node test harness proving the pipeline works before deployment.

The site went from "every Learn More link 404s and the contact form fakes success" to "code-complete, pending one deployment URL."

### Files Created

**Website**
- `services/forestryMulching.html`
- `services/landClearing.html`
- `services/brushRemoval.html`
- `services/trailCutting.html`
- `services/stormCleanup.html`
- `services/propertyCleanup.html`
- `services/huntingPropertyPrep.html`
- `css/stylePages.css`

**Apps Script**
- `appsScript/Code.gs` — entry points, `setupSpreadsheet()`, `removeObsoleteConfigKeys()`, `runSelfTest()`
- `appsScript/routes.gs` — action registry
- `appsScript/leads.gs` — `LEADS_HEADERS`, create/list/update
- `appsScript/validation.gs` — sanitization, validators, honeypot, formula-injection defense
- `appsScript/notifications.gs` — owner email, auto-reply
- `appsScript/utilities.gs` — sheet access, header enforcement, config, envelopes, auth, error logging
- `appsScript/config.gs` — constants, enums, limits, error codes
- `appsScript/localTestRunner.js` — Node mock harness (dev tool; not pasted into Apps Script)
- `appsScript/README.md`

**Docs**
- `docs/googleSheetArchitecture.md`
- `docs/projectState.md`
- `docs/engineeringJournal.md`
- `docs/technicalDebt.md`

### Files Modified

- `index.html` — reviews section replaced and relocated; second section repurposed to `#meetTheOwner`; divider added between Facebook and Reviews
- `css/styleIndex.css` — marquee CSS removed (102 lines); intro-section and reviews-placeholder styles added; `.introLayout` responsive rule
- `js/indexJS.js` — intro video config + `buildVideoEmbedSource()` + `initializeIntroVideo()`; null guards on every page-specific listener; `getSourcePage()` folder fix; `companyWebsite` added to payload; `showSubmissionError()`; endpoint TODO promoted to a blocker note; Google link hidden when unconfigured

### Architecture Decisions

1. **Static duplication of shared chrome across pages.** No build step exists, so header/modal/footer/floating actions are duplicated into each service page. Mitigated by generating them from `index.html` via a guarded assembler rather than hand-copying, and by `applyBusinessConfig()` driving phone/email/social from one place at runtime.
2. **Each service page embeds the full estimate form + modal** rather than deep-linking to the homepage form. Follows `servicePageArchitecture.md` and preserves in-page conversion.
3. **Sheet-first lead capture.** The `leads` row is the audit trail; a submission succeeds the moment it commits. Notifications run after, wrapped independently, and cannot un-succeed a saved lead.
4. **`errorLog` only, no ActivityLog.** The `leads` sheet already records every success; a second log of successful traffic would add noise and quota cost without adding information.
5. **Owner-only notification.** Nulo Studio is not copied and does not sit in the customer's email thread. Operational problems surface in `errorLog` instead of an inbox.
6. **`text/plain` transport retained.** Apps Script web apps cannot answer a CORS preflight; `application/json` would trigger one and fail from the browser. Encoded the constraint rather than fighting it.
7. **Apps Script lives inside this repo** at `appsScript/`, not the external `C:\Dev\NuloWorkspace\BlueGridAPI\` path named in `phase10AppsScriptApi.md` — that path is outside the writable workspace.

### Validation Performed

- All 7 `.gs` files parse cleanly; **72 globals, zero collisions** (Apps Script shares one global scope, so this matters)
- `js/indexJS.js` passes `node --check`
- `css/styleIndex.css` braces balanced 523/523
- All 8 HTML pages: tags balanced across 12 element types, exactly one `<h1>` each, **zero duplicate IDs**, zero leftover build tokens
- **Zero broken internal links or missing assets** sitewide
- `serviceNeeded` enum **byte-identical** across all 8 pages and `config.gs`
- All 20 payload keys map to columns; all 8 server-authoritative fields correctly excluded from client input
- `LEADS_HEADERS` = 27 columns, matching `forestryModuleSchema.md` exactly
- **`localTestRunner.js`: 64/64 passing**, including built-in `runSelfTest` 6/6 — covers setup idempotency (3 runs), create, dedupe, honeypot, every validation rule, error logging, formula injection, header self-heal, auth, update, `NOT_FOUND`, `UNKNOWN_ACTION`
- Two guarantees explicitly tested: **email failure still saves the lead**, and **no Nulo Studio address appears in any sent message**

### Bugs Found

**Pre-existing**
1. 28 broken links — every service link sitewide 404'd
2. Contact form silently faked success; leads went nowhere
3. Footer Google icon was a live `href="#"` with `target="_blank"` — opened a blank tab
4. `getSourcePage()` collapsed folders, so all service-page leads would have reported ambiguous source pages
5. Unguarded JS listeners would throw on any page without the modal
6. `viewWorkButton` called `.scrollIntoView()` on a null `#beforeAfter` on subpages
7. 102 lines of dead marquee CSS
8. Badge artwork reads **"FORESTRV"** instead of "FORESTRY" (verified against `bluegridBadge400.png`)

**Introduced by me during this session, caught in review**
9. `<figcaption>` nested inside a `<div>` instead of being a direct child of `<figure>` — invalid HTML
10. `sanitizeText()` control-character regex was written with **literal raw control bytes** (0, 8, 11, 12, 31, 127) embedded in the source, producing a malformed character class
11. Notification failures could fall through to the outer catch and report **failure for a lead that was already written**
12. `setupSpreadsheet()` did not create the `dashboardMetrics` tab
13. After generalising `enforceCanonicalHeaders(sheet, headers)`, two lines still referenced `LEADS_HEADERS` — the `errorLog` sheet would have had its headers rewritten on **every single access**
14. Referenced `.introAside` / `.introCta` classes that were never styled
15. Unused `failNextSheetWrite` left in the test runner

### Bugs Fixed

All fifteen above, except **#8 (FORESTRV typo)**, which requires corrected artwork from the client and is logged in `technicalDebt.md`.

### Important Decisions Made

- **Reviews placeholder placed after the Facebook section** (user-approved from three options), with a `dividerFadeUp` added — this also fixed a pre-existing abrupt dark→light transition
- **Client supplied the reviews copy** mid-session; used verbatim, with brand spelling normalised to "BlueGrid" for sitewide consistency
- **Section slot preserved, not deleted** — the second section was repurposed into the video section; only the 24 fabricated review cards were removed
- **Nulo Studio notification removed** after initially being implemented as a `cc` (client direction)
- **Committed to branch `phase2a-lead-capture`, not `main`**, so the work can be reviewed before merging. Nothing pushed
- **Single commit covering both phases** — `js/indexJS.js` contains changes from both, and splitting would have required interactive hunk staging

### Lessons Learned

- **Boundary guards are worth the extra step.** After a user request, every removal/replacement over 50 lines asserted expected content at each boundary and threw on mismatch. This caught nothing silently and made a 406-line deletion and a 278-line CSS replacement safe.
- **Refactoring a function signature demands re-reading the body.** Bug #13 (`enforceCanonicalHeaders`) parsed fine, passed a syntax check, and would have quietly corrupted the `errorLog` headers forever. Only reading the refactored body caught it.
- **Write literal control characters as escapes.** Bug #10 survived a file write and looked plausible; only a byte dump revealed raw control bytes in the regex.
- **Verify before asserting.** The "FORESTRV" typo came from prior project notes; it was confirmed by opening the actual PNG rather than repeating the claim.
- **A mock harness pays for itself immediately.** Being able to run the real `.gs` modules on Node found real defects and proved both client-mandated guarantees without a Google account.
- **Shell command length is a real limit.** A single large PowerShell here-string failed with `ENAMETOOLONG`; the fix was a token-based approach — write the page with the file tool, then splice shared chrome with a short reusable command.
- **VM contexts don't expose top-level `const`.** Function declarations become properties of the sandbox; `const` does not. Needed an explicit re-export bootstrap in the test runner.

---

## Superseded Handoff (2026-08-02)

The handoff block that stood here described Phase 2A as the frontier and the
endpoint as unwired. Both are long since done. **The current handoff is the
"Next Session Should Continue Here" block at the top of this file**, under the
2026-08-04 session summary. Kept as a marker so a reader who scrolls to the
bottom is not misled by stale instructions.
