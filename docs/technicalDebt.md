# Technical Debt — BlueGrid Land Solutions

**Last updated:** 2026-08-27 (session closeout — footer legal row, favicon decision and restore, Apps Script deployment confirmed)

**Resolved 2026-08-27:** the standing P0 (Sheet `notificationEmail` and `photoViewerEmail` both confirmed as the real BlueGrid account) and the repo/production Apps Script gap (`config.gs` and `validation.gs` pasted, deployment updated with New version). Both reported by Aron; neither is verifiable from this repository.

**Sharpened 2026-08-27:** item 10i (a second transit failure, this time a lost *dependency* rather than a lost suite, plus a validator that drifted out of sync with the code it guards), item 13 (the intro video is coming, and arrives rotated 180 degrees).

**Decided 2026-08-27:** item 39 — the **original mountain/tree favicon artwork is approved for every favicon context**. A second package built on the circular BLUEGRID wordmark logo was measured against it and rejected. The deployed set was restored from `HEAD` and the two comparison folders removed.

**Resolved 2026-08-21:** items 41 (`favicon.svg` — resolved by unlinking it, artwork untouched), 45 (after hero plate priority), 46 (hero entrance LCP gate), 47 (consent privacy link on deep 404s), 48 (footer social tap target).

**Newly opened 2026-08-21:** 44 (performance baseline — measured, top three fixed, remainder ranked; **do not re-audit from scratch**), 49 (`nuloStudioCredit.*` now unreferenced), 50 (`graphics/logos/devCredit/` ships ~2.6 MB the site never loads), 51 (`validateFavicons` prints a note it no longer earns).

**Corrected 2026-08-21:** item 10 (**two** Unsplash hotlinks, not three), item 4 (a real browser HAS now checked the site — 56 page/viewport combinations — but never on real hardware, and 25 of 33 pages remain unseen), item 10i (**28 suites**).

**Also corrected, in `projectState.md`:** the claim that all source files are CRLF. `js/consent.js`, `css/styleIndex.css` and `css/stylePages.css` are **LF** on disk; the HTML and `js/indexJS.js` are CRLF. Scripted edits must detect and preserve per file, never assume.

**Resolved by the hardening pass (2026-08-18):** items 3 (email — swapped to `bluegridls@gmail.com`), 22 (unreferenced assets — re-audited and pruned), 25 (responsive image delivery — shipped), 28 (contrast — all three tokens fixed), 29 (TODOs — stripped from HTML *and* from `robots.txt`/`sitemap.xml`), 30 (custom 404 — built), 31 (host — confirmed GitHub Pages and recorded in `projectState.md`).

**Earlier on 2026-08-18:** items 12 (`og:image` absolute), 12a (apex vs `www` verified).

**Newly opened by the hardening pass:** 33 (the second scrollbar — fixed, recorded so it is not reintroduced), 34 (three `<img>` tags declared dimensions their files did not have — fixed), 35 (`graphics/favicons/New folder/` — kept deliberately, needs an owner decision), 36 (high-DPR phones still pull the full-size JPEG holdouts — a compression floor, not a bug).

**Newly opened 2026-08-19:** 37 (tablet hero estimate gap — fixed), 38 (`size="1"` on the hero address input is load-bearing), 39 (favicon artwork is approved and must not be recomposed), 40 (no `WebSite`/`Organization` schema node), 41 (`favicon.svg` is 300KB — Aron's call), 42 (process breakpoint 699px is measured), 43 (validators located media queries by `indexOf` — fixed).

**Sharpened:** 10i (validator toolchain now **28 suites** outside the repo, and **it has already lost a suite in transit once**).

Known debt, deferred work, and intentional trade-offs. Items are ordered by launch impact, not by effort.

---

## High Priority

### 1. ~~Production domain undecided~~ — **RESOLVED 2026-08-15**
`bluegridlandsolutions.com` is live and serving. `robots.txt` and `sitemap.xml` both exist (**28 URLs**, matching the 28 tracked HTML pages).

**What may still be outstanding inside this item:** the canonical / `og:url` / `og:image` sweep was TODO-marked across every page head when the domain was undecided. Whether those TODOs were cleared during the production deployment is **not verifiable from this repository** — the deployment happened outside any recorded session. **Next session: grep for `TODO: Replace canonical` and `TODO: Swap og:url` and confirm.** See items 10k and 12, which were both explicitly deferred *to* this sweep.

### 2. ~~Badge artwork typo — "FORESTRV"~~ — OFF THE WEBSITE 2026-08-11
The old badge (`bluegridBadge400.png`, `bluegridBadge192.png`) reads **"FORESTRV MULCHING & LAND CLEARING"** on its bottom arc, a V where the Y should be. Verified 2026-08-02 against the actual PNG.

**The website no longer uses that artwork.** The primary mark is now `bluegridMark290.png`, derived from the client's `circleBG_logo.png`, which carries no arc text at all — so the misspelling cannot appear on any page. All 76 references migrated.

**Still open outside the website:** the misspelled badge files remain on disk, and if the client has that artwork on a truck wrap, signage, business cards, or a GBP profile photo, it is still wrong there. `newBG_logo.png` spells **FORESTRY** correctly and is the asset to hand anyone who asks for print artwork.

### 3. ~~Placeholder contact details~~ — **FULLY RESOLVED 2026-08-18**
**The email swap is done.** `bluegridls@gmail.com` is in `businessConfig`, and `estimates@bluegridlandsolutions.com` appears **nowhere** in the working tree. The accompanying TODO went with it.

`DEFAULT_NOTIFICATION_EMAIL` in `appsScript/config.gs` was lowercased to match the site (it read `Bluegridls@`). Gmail is case-insensitive so nothing was broken, but the two now agree.

Original detail kept below.


- Phone `(740) 464-2526` — **confirmed.** It is printed on Chase's own advertisement, `graphics/images/whatTheyDo2.jpg`, which is first-party marketing material sitting in this repository. Previous sessions recorded it as an unconfirmed flyer number; the flyer *is* the evidence, and nobody had opened it.
- Email `estimates@bluegridlandsolutions.com` — **must be removed. The confirmed public business email is `bluegridls@gmail.com`** (confirmed by Aron 2026-08-18). `estimates@…` is not a confirmed mailbox, appears on no client artwork, and currently ships in **29 `mailto:` links / 60 occurrences** across the live site. An unrouted address loses leads silently.
  **The fix is one token:** `businessConfig.email` and `businessConfig.emailHref` in `js/indexJS.js` drive every page. Delete the accompanying `// TODO: Replace with the real business email address.` in the same edit — it is currently being served to the public (item 29). **Not yet done.**

Wired through `businessConfig`, so the email is a one-line fix once confirmed.

### 3a. Claims audit — what the client's own advertising does and does not support

Run 2026-08-13 during the P0 SEO pass. The three client artwork files in `graphics/images/` are first-party marketing material and had never been opened by any session. They settle several claims that were being treated as unverified, and fail to support two that were on the site.

**Verified by Chase's own advertising — keep:**

| Claim | Evidence |
|---|---|
| **Fully insured** | "FULLY INSURED" badge on both `whatTheyDo2.jpg` and `whatTheyDo.jpg` |
| **Locally owned and operated** | "LOCALLY OWNED & OPERATED" on `whatTheyDo.jpg` |
| **Phone (740) 464-2526** | Printed on `whatTheyDo2.jpg` |
| **Cleared in 1–2 days** | "…or have it cleared in 1-2 days?" on `BeforeandAfter.jpg` |
| **Free estimates** | "Call for a Free Estimate!" / "MESSAGE US TODAY FOR A FREE ESTIMATE!" |
| **Serving Ohio and surrounding areas** | Footer strip of `whatTheyDo.jpg` |
| **Tree and brush cleanup, debris removal and mulching, trail and access restoration** | The four service tiles on `whatTheyDo.jpg` |

**Not supported by anything in the repository — softened, and needs Chase to confirm or correct:**

- **"Free estimates within 24 hours."** No response time appears on any client artwork. The on-page copy hedges this ("*most* quotes go out within 24 hours"); three homepage meta/social descriptions stated it flat. Those three were brought into line with the hedged wording. **The hedged instances were left alone** — they are a soft claim, not a guarantee, and removing every mention would be over-correction. Ask Chase what he can actually commit to.
- **"Storm cleanup jumps the line … machine on site within days, not weeks."** An emergency-dispatch promise. Chase's own storm advert says "when the storm clears, we're just getting started", which is post-storm restoration, not emergency response. Reworded on `index.html` and `services/stormCleanup.html` to keep the priority-scheduling claim (his decision to make) and drop the on-site timeframe (a promise the site cannot keep for him).

**Checked and clean — nothing to fix:** no dollar figures anywhere on the site, no per-acre or hourly pricing, no insurance coverage amount, no tree-diameter or capability limit, no guaranteed-quote or zero-haul-off language, no invented reviews or ratings, and no street address, latitude, longitude or `priceRange` in any schema block.

**Still open:** "we send a certificate of insurance before the machine leaves the shop" is a specific operational promise that goes beyond the "FULLY INSURED" badge. Retained, because the underlying insurance claim is verified, but worth one sentence of confirmation from Chase.

### 3b. There is no tree-service page, and the P0 brief assumed there was one
The SEO brief called for an audit of a tree removal / tree cutting page. **No such page exists** — the site has seven service pages and tree work is not one of them.

Chase's own advertising does list "TREE & BRUSH CLEANUP" as a service tile, so there is a real, first-party-supported service here with no page behind it. That is a genuine P1 content opportunity rather than a defect. **Do not build it as a residential arborist page:** nothing verifies climbing, crane work, stump grinding, hazardous-tree capability, or any maximum diameter. The honest framing is tree and brush clearing for land improvement, which is what the advert actually claims.

### 4. ~~Nothing has ever been checked in a real browser~~ — **LARGELY ADDRESSED 2026-08-20. Read what is still true.**

**A real browser has been part of the toolchain since 2026-08-18** (`browserSession.js`, Chrome over CDP), and on 2026-08-20 a representative QA pass covered **8 pages x 7 viewports = 56 combinations**, plus 18 breakpoint widths and a functional pass over the mega menus, mobile drawer, estimate modal and its five-step progression, address prefill, FAQ accordion, consent controls, process board, hero typing and sweep, and 404 recovery. Result: zero horizontal scroll, zero broken images, zero console errors, CLS 0-0.0075, all three documented breakpoints flipping where they should.

**Added 2026-08-27:** the footer bottom bar has now been driven in real Chrome at 1440/1024/820/768/600/430/390/375 across 5 page shapes — 40 combinations — by `validateFooterLegalRow`. That covers geometry, wrapping, hit-testing and the consent round trip. It does **not** cover whether the two-row footer *looks* right to a human, which is still an item-4 question. Also measured and worth knowing: the homepage carries **8 to 10px of pre-existing horizontal overflow** from unrevealed `[data-animate]` transforms. It is invisible because `html` is `overflow-x: hidden`, and it is not a footer defect, but it means a naive global overflow assertion will fail on this site for reasons unrelated to whatever is being tested.

**What is STILL true, and is the part that matters:**

- **Every one of those viewports is Chrome device emulation, not a phone in someone's hand.** Nothing on this site has been seen on real hardware.
- **25 of the 33 pages have never been looked at**, only the 8 representative ones.
- **Chase has never seen the site end to end.**
- Specific things below that were called out as "measured but never seen" have now been seen; the list is kept because it records what to look at on real hardware.

Original note follows.

No session on this project has had Playwright or Chrome DevTools available, so **every validation to date is static analysis or simulation.** That is strong for links, structure, schema, geometry, and the hero loop's state machine — and it says nothing about how anything *looks*.
Before launch: open the homepage on a real phone and confirm the hero photo ends at the fold, the seam into the estimate band is invisible, and the card overlap reads as intentional. Then a tablet and desktop pass covering the FAQ mega panel, the header morph across 1280px and 1150px, and the FAQ/Insights layouts.
**Added 2026-08-06:** the redesigned **services mega panel** has been measured but never seen — open it at 1440px and again at 1151px, where the calculation leaves only 62px between the panel and the left edge. And confirm the **hero typing** reads as intended now that it commits on the frame boundary; the profiler proves the cadence is regular, not that it looks right.
**Added 2026-08-07 (mega menus):** the two new featured icons — a map pin and a question mark — were drawn blind as SVG path data and have never been rendered. Check they read cleanly at 26px. Also confirm the muted region headings in Service Areas look deliberate rather than washed out, and that the hover bridge removed the flicker rather than making the panel sticky.

**Added 2026-08-07:** the **process sequence** is the largest untested-by-eye item on the site. The simulation proves the order and the viewport behaviour exactly; it says nothing about whether the dark board sits well on the white section, or whether the arrow flash is bright enough to read as a flash without being gaudy. Expect the timing constants in `processSequenceConfig` to need one tuning pass against a real screen.

**Added 2026-08-09 — the current list, in priority order:**

1. **The process handover at 1168px.** Load the homepage at 1200px, then 1170px, then 1160px. Above 1168px the board is horizontal at its full 1120px; below it, vertical. That boundary is what this session changed and is the direct answer to the clipping report — confirm the vertical layout is the better presentation there, and that nothing is cut off at any width.
2. **Phase A then Phase B.** Scroll the process section in and watch once: five steps reveal, then only the arrows should ever move again. Confirm **the arrows light at all during Phase B** — they are lit from a resting state, and an equal-specificity CSS collision there would leave the whole loop invisible. `lightArrow()` removes `isResting` first to prevent exactly that, but it has never been seen.
3. **Does the cumulative sweep read as intended?** The row should fill 1 → 1+2 → 1+2+3 → 1+2+3+4, hold with all four lit, then clear together. The open question is whether four simultaneously lit arrows read as *the progression completing* or just as four bright arrows — and whether the accumulation is legible at all at the arrow's 16px size and 0.26 → 1.0 opacity range. If it is not, the flash is the thing to strengthen, not the timing.
4. **Is 3.56s per pass right?** Phase B runs forever in the corner of the page: 420ms between arrows, a 1400ms hold, a 900ms pause. Too fast reads as a fidget. `loopStepMs` and `loopHoldMs` in `processSequenceConfig` are the two to tune.
5. **The Our Company panel** beside its three siblings at 1440px and again at 1201px, and the **shield-with-a-check featured icon**, drawn blind at 26px like the pin and question mark before it.

4b. **The new header mark at every breakpoint** (69px / 60px / 56px / 50px), and the **footer badge at 120px**, where a 290px source is doing the most work it will ever do. Also confirm the white circle reads correctly against the dark scrolled header.

4d. **The floating CTA bar on a real handset**, ideally one with a home indicator so `env(safe-area-inset-bottom)` contributes something. Confirm both bottom corners render cleanly now and the bar keeps its breathing room above the indicator.

4c. **Whether the rewritten H2s still sound like the same site.** 36 headings moved from brand voice to topic on 2026-08-11. The reasoning is sound and the kickers still carry the rhythm, but that is a judgement about tone and it has not been read on a screen.

4e. ~~"Get My Free Estimate" arrival focus~~ — **superseded.** The scroll-and-focus fix this item described was replaced the same day: estimate CTAs now open the modal directly (see below), so there is no scroll to confirm. See 4f.

4f. **Every "Get My Free Estimate" CTA, opening the modal directly.** Click one from the header, then the hero, then the mobile floating bar, then a footer/mega-menu link, on both the homepage and an interior page. Confirm: no visible scroll or page movement before the modal appears; Step 1 shows all five fields (Name, Phone, Service, Address, Acres) under the heading "Where's the property?" — check whether that heading reads oddly now that it asks for more than the property, since it was deliberately left unedited; close and reopen the modal mid-fill and confirm it resumes rather than resets; and that the mini-form's own Continue button (still on the page, now feeding the modal instead of asking twice) carries its three fields into Step 1 pre-filled, not blank.

4h. **The four pages created on 2026-08-13, on a real screen.** `locations/index.html` and the Minford, Piketon and Jackson pages have never been rendered. They reuse only existing components and every validator passes, so the risk is presentation rather than breakage — but two things are worth a specific look.

   The **service-area hub** puts town links inside `benefitTitle` headings within `localProblemGrid` cards, which is a combination no existing page uses: check the links read as links and the cards still balance. The **local-proof gallery** on the three town pages uses `gallerySection`/`galleryGrid` lifted from the service pages, but Piketon has only **one** figure where that grid has only ever held three or four — confirm a single figure does not stretch oddly across the row.

   Also confirm the Service Areas mega panel still fits now that it carries 15 rows rather than 13. `validateMegaMenus` measures it and passes, but it has never been seen at that height.

4g. **The photo uploader, on a real phone, over a real mobile connection.** This is the largest untested-by-eye item on the site as of 2026-08-13, because the whole path is new and none of it can be proven from Node.
   Attach two or three photos straight from a phone camera roll and watch the bars: each should sit at **zero until Submit is pressed**, then fill one at a time as its photo actually uploads. A bar that races to full the moment a file is chosen means the old fake-progress code is back.
   Then confirm: **portrait photos arrive the right way up** (EXIF orientation is handled by `createImageBitmap(..., { imageOrientation: 'from-image' })` with an `<img>` fallback, and neither path has ever been run in a browser); a HEIC photo from an iPhone either uploads or fails cleanly rather than hanging; the submission still completes on a deliberately terrible connection; and the whole thing takes an acceptable amount of time with a dozen photos, since uploads are sequential by design.
   Finally, open the owner email on a phone and confirm the photo links are tappable and open the image rather than a Drive permission wall — that is item 24d, and a real device is the only place it can be settled.

6. **The company page** top to bottom — it reuses eight existing interior-page components in a combination none of them have been seen in.
7. **The header at 1361px and 1360px**, where the compact band now starts, and at 1201px, the last desktop width.

### 5. ~~No real lead has been created from the live site~~ — DONE 2026-08-13 (Aron), and now needs redoing
A genuine submission reached the sheet and the owner notification reached a test recipient. That test is what surfaced the photo defect, which has since been fixed — **so the pipeline it validated is no longer the pipeline that is deployed.**
**Rerun it after the Apps Script redeploy**, against the outcomes in `appsScript/README.md` step 10, which now include photos. The run that matters for launch is the final one with Chase restored as the recipient.

### 6. Service area pages: 6 of 13 cities have one
The `seoPlan.md` first wave shipped — Ashland, Portsmouth, Ironton, Chillicothe, Grayson, and Morehead.
Outstanding:
- **Rows 7–11** (Jackson OH, Gallipolis OH, Waverly OH, Greenup KY, Louisa KY) — staged for after the first six index. Their nav links still point at `#serviceAreas`, which resolves.
- **West Union, OH and Flatwoods, KY are advertised in the nav but appear nowhere in `seoPlan.md`'s 11-city table.** Either they get pages or they come out of the nav.

---

## Medium Priority

### 7. Location pages quote no prices
`seoPlan.md` content rule 5 asks location pages to answer cost directly with real ranges, and calls it the biggest opening in this trade because most competitors dodge it. **No page names a dollar figure** — no pricing has been approved, and inventing one would be a commitment the site cannot honour.
Each cost FAQ instead answers with the factors that move the price on that county's ground. Honest and locally unique, but the weaker answer.
**Fix: get rough per-acre or per-day ranges from Chase.** The single highest-value upgrade available, and it costs one conversation.

### 8. Thin photo library
13 images total for **28 pages**. Several are reused across service pages, location heroes, Insights heroes, and galleries.
Consequences already visible: two service pages (`stormCleanup`, `huntingPropertyPrep`) and **all 6 location pages** ship with no gallery, because no photo can be honestly captioned to a named town; and all 8 Insights pages use stand-in imagery (item 9).
Needs a real photo drop — ideally before/after pairs per service, **tagged by where they were taken**.

### 9. Insights imagery is placeholder
All eight Insights pages (landing + 7 articles) use existing BlueGrid job photos as stand-ins, each marked `TODO: PLACEHOLDER IMAGE` in the markup. They are real work photos so nothing is dishonest — but none was shot for its article and several repeat across pages.
The single biggest visual upgrade available to the section. Feeds directly off item 8.

### 10. TWO homepage service cards hotlink Unsplash stock photos — **count corrected 2026-08-20**
**It is two, not three.** Counted at 2026-08-20: exactly two `images.unsplash.com` references remain, both in `index.html` (lines ~1585 and ~1685) — Trail Cutting and Hunting Property Prep. Property Cleanup no longer hotlinks. The heading said three for several closeouts.

**Measured cost, 2026-08-20:** 260.3 KiB + 222.4 KiB = **482.7 KiB on desktop**, for slots that render at 372×248 and 491×328. They are 1200×800 files with no `srcset`, so the browser downloads roughly 8× the pixels it displays. Both are `loading="lazy"` and below the fold, so they do not affect LCP — but they are the single largest recoverable payload left on the homepage.

**Cheap interim fix that needs no client approval and no repo assets:** append `w=600` to the two Unsplash URLs, cutting roughly 60%. It leaves the third-party dependency in place, which is the other half of the problem.

Original note follows.

Trail Cutting, Property Cleanup, and Hunting Property Prep load from `images.unsplash.com`. Two problems: a runtime dependency on a third party, and stock imagery on a site whose credibility rests on real work photos.
Deferred because replacing imagery needs client approval. Real unused photos exist (`cleanCut`, `freshMulching`, `overGrowth`, `whatTheyDo2`, `BeforeandAfter`).
**No new external hotlinks have been added since** — the Insights build deliberately used repo assets rather than making this worse.

### 10a. One duplicate FAQ question predates this session
**"Do I need a permit to clear land in Ohio or Kentucky?"** is rendered on **both `index.html` and `services/landClearing.html`**, with near-identical answers, and appears in both pages' `FAQPage` schema.
That violates `seoPlan.md`'s own rule ("No cross-page duplicate questions") and means two pages compete for the same query. Both were built in Phase 1, so it predates this session — it was found by the duplicate check written for the FAQ hub, which is the first thing that ever looked.
**Fix: decide which page owns it.** The permitting answer is service-agnostic, so the homepage or the new FAQ hub is the better home; `landClearing.html` would then drop the question and link across. Not done at closeout because it changes rendered content and schema on two pages and deserves a deliberate call rather than a rushed one.
Sitewide totals for reference: **103 rendered FAQ questions, 102 unique.**

### 10c. The hero typed line's `text-shadow` is the remaining per-character paint cost
`text-shadow: 0 3px 24px rgba(0, 0, 0, 0.55)` on `.heroTypedText` means every keystroke re-rasters the whole string with a 24px blur: a **926×125px** rect at 1440px, ~115k pixels, roughly twelve times a second while a phrase types.
The 2026-08-06 pass removed everything around it — the write now lands on a frame boundary, and `.heroTypedLine` holds its own compositing layer so the hero photograph underneath is no longer resampled (**8.0 megapixels/second** saved). The blur itself is irreducible without changing how the hero looks, and the brief said not to.
**Only worth revisiting if a real device shows the hero dropping frames.** Softening the blur to ~12px would roughly halve the raster cost, and it is a visible change that needs sign-off, not a quiet optimization.

### 10d. `.heroTypedLine` holds a compositing layer for the life of the page
`will-change: transform` is set permanently, not toggled, because the typing loop never ends. Costs one layer of roughly 926×125px — well under a megabyte, and zeroed under `prefers-reduced-motion` where nothing types.
One consequence worth knowing before someone "fixes" it: text in a promoted layer gets grayscale rather than subpixel antialiasing. **The line was already promoted for the first 2.2 seconds** via the `[data-heroanimate]` entrance, so this makes the rendering consistent rather than introducing something new — and at 41–74px display type the difference is not expected to be visible. Unverified, like everything else in item 4.

### 10e. ~~The process section's visual was built from a description~~ — the design is now APPROVED
Kept as a pointer, not as debt: the floating dark rectangle, five steps, four arrowheads and CTA-below were confirmed by Aron on 2026-08-07 and **must not be redesigned.** The animation behaviour was rewritten on 2026-08-09 (one-time reveal, then an arrow-only loop) without touching any of it. Original note follows.

### 10e-context. How that visual came to exist
The 2026-08-07 brief framed the work as animation-only on top of an established visual — a centred free-floating dark rectangle, arrowheads between steps, no connecting line, CTA below. **That visual did not exist in this repository.** What shipped was a white section with a horizontal gradient rule and no arrowheads, and no branch, stash, commit, or other client site under `ClientSites/` had the described version.
It was therefore built to the description rather than matched to a reference. Everything the brief specified is present, but proportions, board darkness, and arrow weight are this build's interpretation.
**Fix: one look in a browser.** If it does not match what was pictured, the visual lives entirely in `.processBoard` / `.processArrow` and can be retuned without touching the sequencer.

### 10f. Process CTA duplicates a destination already on the page
`.processCta` adds `Get My Free Estimate` → `#estimateForm` below the board on all 8 pages. The service pages already carry that same anchor in the page hero, so those pages now offer it twice.
That is normal for a long page — a CTA at the top and another after the explainer is standard — but it was added because the brief called for a CTA below the container, not because a gap was measured. Worth a glance when the section is reviewed; removing it is one line in the markup on 8 pages.

### 10g. ~~Process board clipping at narrower desktop widths~~ — ADDRESSED 2026-08-09, mechanism never found
Kept in full because the honest version of this is more useful than "fixed".

**The 143px figure that framed this was a mis-pairing.** "MAINTENANCE" does measure 143px uppercase in Rokkitt — re-measuring reproduced it exactly — but it is on `services/brushRemoval.html`, a **four**-step board, whose column at 1081px is **197px**, not the 147px of a five-step board. It has 54px of clearance. The widest word on the five-step homepage board is "COMPLETE" at 104px against 147px.

Checked properly — every rendered title on all eight boards, uppercased as `text-transform` renders them, against its own board's column, every width 1081–1440px, with a 6% fallback-face inflation — **nothing overflows anywhere.** The box model agrees: `.processStep` is `flex: 1 1 0` with `min-width: 0`, `box-sizing: border-box` is global, and there is no `100vw` in the process chain. The board **provably cannot** overflow its container at any width in the band.

**So the reported symptom has no mechanism I can find, and it was not fixed by finding one.** What changed is that the horizontal row no longer runs compressed at all: the handover moved from 1080px to **1167px**, derived as `1120px` (board `max-width`) + `2 × 1.5rem` (section padding) — the narrowest viewport at which the board can render at its design width. Below 1168px it was being squeezed to 147px columns against a design value of 164px, and that band is where the report came from.

`.processStepTitle` also gained `overflow-wrap: break-word`. **That is a guard for the next title someone writes, not a fix for a current overflow.**

**If Aron still sees clipping after this, the mechanism is genuinely outside the box model** — browser zoom, a device pixel ratio effect, or something the static model cannot represent — and the next session should get a real browser on it rather than re-deriving the arithmetic, which is now known to be clean.

### 10h. ~~The Git remote URL is stale~~ — RESOLVED, confirmed at 2026-08-13 closeout
`origin` now points at `https://github.com/ArxnAlley/client_BluegridLandSolutions.git`, verified via `git remote -v`. No session recorded here ran the fix, and `origin/main` was also found to have moved ahead by a push this repository's history doesn't show — both point to activity happening outside these sessions, which is fine, just worth knowing the working tree isn't the only place this project changes.

### 10i. The validator toolchain lives outside the repository — **IT HAS NOW FAILED IN TRANSIT TWICE, IN TWO DIFFERENT WAYS**

**Twenty-eight scratchpad suites as of 2026-08-27** — 26 `validate*` and 2 `simulate*`, plus the Apps Script harness in the repo, which the runner enumerates from the directory rather than trusting a written number. `validateFooterLegalRow` is the one added this session. **The counting in this file and in `projectState.md` had drifted**: "28 validator suites + harness = 29/29" was recorded on 2026-08-21 against a directory holding 27 suites, so the harness was being counted twice. Count with `ls`, not from notes.

**SECOND TRANSIT FAILURE, 2026-08-27 — a lost dependency, which is quieter than a lost suite.** The toolchain was carried forward by copying `*.js` only. `fonts/` was left behind, and `validateHeader`, `validateInsightsSection` and `validateMegaMenus` all died on a missing `inter600.extracted.ttf`. Nothing was wrong with the site. Unlike the 2026-08-21 incident the suites were *present* — they simply could not run, and a hurried reader could have mistaken three stack traces for three real defects. **Copy the whole scratchpad directory**, not the scripts: the suites also need `fonts/`, `favaudit/`, `imgtest/` and `syntaxCheck/`.

**AND THE OTHER FAILURE MODE FIRED TOO: a validator drifted out of sync with the code it guards.** `validateAnalytics` asserted the footer's three-zone grid (`1fr auto 1fr`, DOM order copyright then legal then credit) — precisely the architecture the 2026-08-27 footer work replaced. It was rewritten to assert the new contract rather than relaxed or bypassed. Same lesson as `validateFollowTheWork` in 2026-08-21, and again it was caught only because the suite failed loudly rather than because anyone remembered to check.

Original analysis below.

**Twenty-eight suites as of 2026-08-21** — the 26 previously listed plus `validateConsentPrivacyLink` and `validateFooterSocialTarget`, both written 2026-08-21 to guard the two browser-QA defects (items 47 and 48). Plus two supporting modules that five of them will not run without: **`browserSession.js`** (drives the installed Chrome over CDP with no dependencies) and **`serveSite.js`** (serves the repo the way GitHub Pages does, including the no-redirect 404). `validate404Page`, `validateResponsiveImages`, `validateHeroEstimateUx`, `validateFavicons` and `validateProcessLayout` are useless without both.

**The predicted failure has now actually happened.** `validateFollowTheWork.js` did not survive the hand-off into the hardening session's scratchpad and had to be recovered from an *older* scratchpad — found only because a count was checked against a written list. Had nobody counted, the suite would simply have ceased to exist with no error anywhere. This is no longer a hypothetical risk in this item; it is a recorded incident.

**The other half of the lesson:** when recovered, the suite *failed* — because the section it validated had been deliberately deleted. A validator carried outside the repo also drifts out of sync with the code it guards, and nothing reconciles them. It was rewritten to prove the removal stayed complete rather than deleted, but only because someone was looking.

Original analysis below, and it still stands.

**Nineteen suites as of 2026-08-18** (up from fourteen: `validateAnalytics`, `validateCtaInteractions`, `validateMobileLayout` and `simulateConsentFlow` were added 2026-08-16 to 2026-08-18), plus the guarded assemblers, the font-metric models and TTFs in `fonts/`, the content modules (`navContent`, `faqContent`, `insightsContent`), the copy-rewrite tables, the SEO intent checks and the estimate-CTA checks — all existing only in a session scratchpad, carried forward by hand between sessions.

**The cost of losing it went up sharply this month.** The newer suites encode things no other artifact records: that neither analytics vendor can load from the markup, that the consent close button carries the *reject* hook rather than the accept one, that a skew never lands on a CTA's box, and that the mobile hero cannot hide the estimate card without showing its replacement. Several are injection-proven — they were verified by breaking the code and confirming the check fired. **This is the most fragile thing about how this project is worked on.** Losing it would cost more than any single feature in the repo: `validateSeo` alone encodes the intent map, the FAQ schema contract, and the anti-cannibalisation rule.
`projectState.md` tells the next session to locate it first, which is a mitigation rather than a fix. The reason it is out of the repo is item 17's decision not to ship half a generator; that reasoning covers the assemblers and does **not** obviously cover the validators.
**Fix: commit the validators.** They are read-only over the site, they have no dependencies, and they would make the repository self-checking.

**2026-08-13 made this worse and more urgent.** `validateAssets` was written that day and is the only thing standing between the site and a class of bug that Windows actively hides — a reference whose casing differs from the file on disk passes `fs.existsSync` locally and 404s on GitHub Pages. That has already happened once on this project. It lives in the scratchpad like the rest, so the single safeguard against a silent production 404 is a file that exists nowhere in version control.

### 10l. `DEFAULT_NOTIFICATION_EMAIL` has no guard against being hand-edited wrong
Found 2026-08-11: the working tree held `DEFAULT_NOTIFICATION_EMAIL = 'admin@nulostudio.com'` in `appsScript/config.gs`, an **uncommitted** change — `git log --all -p` shows only `'Bluegridls@gmail.com'` was ever committed. `appsScript/localTestRunner.js` already asserts `no recipient anywhere is admin@nulostudio.com`, and running it against the corrupted file failed that exact check, proving the drift rather than merely suspecting it. Reverted; the file now matches `HEAD` byte for byte.
Real exposure was narrow — `notifications.gs` only reaches this constant when the Sheet's `config.notificationEmail` cell is blank or missing — but the failure mode if it had shipped is serious: customer lead notifications routing to Nulo Studio instead of the client, which `notifications.gs`'s own header comment says must never happen.
**Nothing would have caught this before a commit.** The harness that proves it wrong only runs when someone remembers to run it; there is no pre-commit hook, and the validator toolchain itself lives outside the repo (item 10i) so there is nothing to point a hook at yet. Worth a look once 10i is addressed: run `appsScript/localTestRunner.js` as part of whatever makes the validators self-checking.

### 10m. Modal Step 1's heading undersells what it asks for
`data-step="1"`'s heading still reads **"Where's the property?"**, unchanged since it was written for a step that asked only for address and acres. As of 2026-08-11 the same step also collects Full Name, Phone, and Service Needed — three fields the heading gives no hint of.
**Left as-is deliberately**, per explicit instruction not to touch copy while fixing the CTA behavior. A landowner mid-form is unlikely to be confused (the labels are self-explanatory), but the heading is now doing less work than it should. **Fix, next time copy is in scope:** something like "Tell us about you and the property" — a two-line change, no validation or field impact.

### 10j. Structured data duplicates rendered copy with nothing enforcing the match
FAQ answers and service descriptions exist twice on the same page: once rendered, once inside `application/ld+json`. Google requires `FAQPage` questions and answers to match the visible text.
Three questions had already drifted before 2026-08-11 and were fixed; the copy sweep briefly broke the rest before the schema pass caught up. `validateSeo` now compares **questions**, and nothing yet compares **answers**.
**Fix: extend `validateSeo` to diff answer text too**, or generate both from one source.

### 10k. `Service` schema restates the provider instead of referencing it
`seoPlan.md` specifies `provider` as an `@id` reference to the homepage `LocalBusiness`. What ships is an inline stub (`name`, `telephone`, `url`) on 13 pages. It is valid and does not create competing entities, so it was left alone.
**Deliberately deferred to the domain sweep:** an `@id` is a URL, and adding 13 more production-domain-dependent values before the domain is settled would mean writing them twice. Do this in the same pass as item 1.

### 11. ~~`robots.txt` and `sitemap.xml` do not exist~~ — **RESOLVED 2026-08-13**
Both exist. Sitemap carries **28 URLs**, matching the 28 tracked HTML pages, generated from the canonical tag on each page so the two cannot drift. Regenerate rather than hand-edit.

### 12. ~~Open Graph images relative on all 28 pages~~ — **RESOLVED 2026-08-16**
All `og:image` and `twitter:image` values are now absolute on the production origin, each page keeping its own intended image. The stale `TODO: Replace canonical` / `TODO: Swap og:url` comments were deleted in the same sweep. Enforced going forward by `validateAnalytics`, which fails on a relative social image, an off-origin canonical, or a file whose casing does not match disk.

**Still open, and separate:** 28 of 29 pages declare `twitter:card="summary_large_image"` without a `twitter:image`. Only the homepage has one. See the hardening queue in `projectState.md`.

### 12a. ~~Apex vs `www` — direction unverified~~ — **RESOLVED 2026-08-16**
Measured with `curl -I`: **`https://www.bluegridlandsolutions.com/` returns 301 → `https://bluegridlandsolutions.com/`.** The apex is the survivor, which is what `CNAME` names.

The canonicals were pointing at the **redirecting** host. All 29 canonicals, all 29 `og:url` values, the 29 sitemap URLs and the `robots.txt` sitemap line were normalized to the apex. `validateAnalytics` now fails on any `https://www.` reappearing in a canonical, `og:url`, sitemap or robots line.

### 13. Chase owner introduction video — **THE FILE IS COMING, AND IT ARRIVES UPSIDE DOWN**
Chase has recorded an intro and is emailing the original. **It is rotated 180 degrees and must be corrected before anything else is done with it** — do not optimise, poster, or publish an unrotated file.

The section itself carries no code debt. `<section id="meetTheOwner">` holds `#introMediaSlot`, and `initializeIntroVideo()` in `js/indexJS.js` injects a player over it from three config fields — `introVideoUrl`, `introVideoConfigured`, `introVideoPoster` — supporting YouTube, Vimeo and self-hosted files in `graphics/videos/` (currently empty). **No markup change is required**; if a future session finds itself editing `index.html` for this, it has missed the injector.

`introVideoPoster` currently points at `graphics/images/excavator2_PiketonOH.webp`. A frame from the video is usually the better poster once one exists.

**A higher-quality recording is expected later**, once better equipment is available. Keep the swap a config change so replacing the source costs one line. The full sequence is in `projectState.md` under *NEXT SESSION SHOULD START HERE*.

### 14. Facebook embed disabled
`facebookPageConfigured: false`, so a designed fallback panel shows instead of the live Page Plugin. The real page URL is already in config. Needs someone to confirm the page renders in the plugin, then flip the flag.

### 15. Google Business Profile does not exist
`googleBusinessUrl` is empty; the footer icon is hidden at runtime rather than shipping a dead `#` link. Local SEO is meaningfully weaker without a GBP.
**Work has started outside the repository:** GBP service artwork is being staged locally in `graphics/GBP - Services/`, which is git-ignored by design (marketing collateral, not website assets). The playbook is `docs/phasePrompts/phase6GoogleBusinessProfile.md`.

### 16. Insights articles have no publication dates
By instruction: no visible date, no `datePublished`, no `dateModified`, no `<time>`. Each `Article` schema carries a comment explaining the omission.
Google does not require dates, but they help freshness signals and readers use them to judge relevance. When a publishing workflow exists, add them in the article data and drop the schema comments — **and relax the validator check, which currently fails if a date appears.**

---

## Low Priority

### 17. Shared chrome is duplicated across 28 pages
Header, mobile drawer, estimate modal, footer, and floating actions are copied into every page — roughly 900 lines × 24. Inherent to a no-build static site.
Mitigated: interior pages are generated by guarded assemblers, not hand-copied, and `applyBusinessConfig()` drives phone/email/social from one place at runtime. **A nav change now requires editing 24 files** — this session's two chrome passes each needed a scripted, guarded run to be safe. See *Consider a build step*.

### 18. Service-link path repointing has now been rediscovered three times
Service links have **three** path forms: root pages use `services/x.html`, pages inside `services/` use the bare sibling `x.html`, and every other one-level folder uses `../services/x.html`. Chrome spliced out of a `services/*.html` page therefore carries the sibling form and must be repointed.
Three separate one-shot generators have independently hit this — the second only after the link validator caught 63 broken references, the third (2026-08-06) caught before writing because its guard compared link sets first. Note the middle case is the one `projectState.md` used to describe as a two-variant rule; that has been corrected.
It belongs in the Phase 13 generator rather than in each script's memory.

### 19. Current page is not highlighted in the mega menus
`servicePageArchitecture.md` (Shared Template Anatomy, row 1) specifies it. Not implemented — the header block is byte-identical across all 28 pages. Confirmed at closeout: no `aria-current` or current-state class exists in either `js/indexJS.js` or `css/styleIndex.css`.
Now that all four panels share `.megaRow`, this is **one rule and one small routine for the whole system** rather than four implementations: mark the row whose `href` resolves to `window.location.pathname` and style `.megaRow[aria-current]`.
**Not done alongside the Our Company work on 2026-08-09**, though this note suggested it — that pass was held to its two stated objectives. Still worth doing, and now covers four panels and 28 pages.

### 20. ~~The 1150px header headroom is about to be spent~~ — SPENT AND RE-BUDGETED 2026-08-09
"Our Company" cost **144px including its gap**. The compact header went 988px → **1131px** and full spacing 1080px → **1236px**.

Both breakpoints moved, and neither typography, the phone chip, the CTA nor any spacing token was shrunk to make room:

- **Mobile switch 1150px → 1200px.** At 1151px the five-item bar had +20px on Inter and **−22px on the `'Segoe UI'` fallback** — it would have wrapped on first paint for a cold cache. At 1201px it clears by **+70px / +11px**. 1176px was the arithmetic minimum and left 4px, which is not a margin.
- **Compact band 1280px → 1360px.** With five items the *full-spacing* band became the tightest point on the whole sweep (+45px at 1281px), which is the wrong shape — the widest band should not be the one under pressure. 1360px is `.headerInner`'s own `max-width`: above it the inner is capped so full spacing always clears by 124px, below it every pixel of viewport is a pixel of header.

`validateHeader` now also sweeps a **6%-inflated fallback face**, so the criterion the switch was chosen on has a test. `measureHeader` **reads the primary nav out of `index.html`** rather than carrying its own copy — the old copy is why the model went on describing a four-item bar.

**Remaining headroom is real but finite: a sixth nav item would push the compact header past 1200px and force the switch up again.** Re-run `validateHeader` after any nav change.

### 21. Hero animation durations are duplicated between CSS and JS
`heroDuetConfig.forwardSweepMs` (1400) and `reverseDissolveMs` (1800) in `js/indexJS.js` must stay in lockstep with `transition: --heroSweepPos 1400ms` and `transition: opacity 1800ms` in `css/styleIndex.css`. Nothing enforces the pairing.
They agree today, and the loop now awaits the dissolve so a drift would show as a visible gap rather than a desync — but it would still be wrong. Cleanest fix: read the durations from CSS custom properties via `getComputedStyle`.

### 22. ~~Unreferenced assets~~ — **RE-AUDITED AND PRUNED 2026-08-18**
**The ~16.2 MB figure below no longer holds.** It counted the full-size originals, which are still referenced — as `srcset` fallbacks and as `og:image`/`twitter:image` targets. A fresh audit found **6.35 MB genuinely unreferenced**, and classifies rather than just lists, because "unreferenced" and "safe to delete" are not the same thing:

| | |
|---|---|
| **Removed — 4.34 MB** | `graphics/logos/oldLogo/` (3 files). Superseded by the completed primary-logo migration, referenced nowhere including docs, and tracked — so recoverable from git history with one command. |
| **Kept — 0.46 MB** | Both 512×512 favicon masters. They are distinct source artwork for the generated favicon set (different checksums, not duplicates), and source art was deliberately out of scope. See item 35. |
| **Kept — 1.55 MB** | `graphics/GBP - Services/` is gitignored and therefore never deployed. Nothing to do. |

`auditUnreferencedAssets.js` in the scratchpad re-runs the classification. It is conservative on purpose: a filename appearing anywhere — even in a comment — counts as referenced, because a false "unreferenced" deletes something the site needs.

Original analysis kept below.


**Widened again 2026-08-18.** The problem is much larger than the project photos this item originally tracked. A full sweep of `graphics/` against every shipped `.html`, `.css`, `.js` and `.webmanifest` found **~16.2 MB referenced by nothing**:

- `graphics/logos/oldLogo/` — 4.4 MB (three superseded logos)
- `Bluegrid_mainLogo.svg` + `Bluegrid_mainLogo1.svg` — 2.1 MB each
- `BG_secondaryLogo.png` — 2.07 MB
- `devCredit/MasterLogo.png` + `TPNulo_StudioLogo.png` — 2.1 MB combined
- `bgLogo_transparent.png`, `newBG_logo.png`, `circleBG_logo.png`, `logo.jpg`, `logo2.jpg`
- **`graphics/favicons/New folder/`** — a directory literally named "New folder"
- `graphics/images/whatTheyDo.jpg`, `b4ForestryMulch_minfordOH.jpg`

None of it is served to visitors, so it costs no page weight — but all of it deploys, and `New folder` is the kind of thing a client or another developer browsing the repo will notice.

**Care needed on two:** `whatTheyDo2.jpg` (referenced, keep) is the first-party evidence for the confirmed phone number, and `docs/` cites it. The original JPEGs behind the 2026-08-18 WebP conversion are also unreferenced now but are **deliberately retained as masters** — they are needed for the responsive resize work (item 25) and must not be swept up in a prune.

### 22a. Six project photos are on disk but referenced nowhere
`graphics/images/after_minfordOH.JPG` (427KB, renamed from `after.JPG` on 2026-08-13) was committed in `fb15070` alongside the hero refresh. **Re-verified 2026-08-13: still referenced nowhere** in any HTML, CSS, or JS. It appears to be the previous `hero_after` image kept as a backup.
Harmless but it ships to visitors' hosting. Left in place because it is the client's asset, not one this project created — the 2026-08-07 GBP cleanup deliberately removed only the asset Aron named.

**Widened 2026-08-13.** `validateAssets` now reports every unreferenced project photo rather than tracking this one by hand. It found six on 2026-08-13; **five remain** after the Minford page took one:

| File | Size | Status |
|---|---|---|
| `after_minfordOH.JPG` | 417KB | The original orphan above. |
| `whatTheyDo.jpg` | 345KB | **Newly discovered.** `whatTheyDo2.jpg` is referenced; this one never was. Pre-existing, not caused by the rename. |
| `B4MulchingJob_minfordOH.jpg` | 72KB | **New file, dropped in 2026-08-13.** Never referenced. |
| `mulchingJob_minfordOH.jpg` | 59KB | **New file**, the "after" partner to the above. |
| `b4ForestryMulch_minfordOH.jpg` | 65KB | **New file.** |
| ~~`afterForestryMulching_minfordOH.jpg`~~ | 62KB | **No longer orphaned** — placed on the new Minford location page 2026-08-13. |

The four new ones are two before/after pairs and are the strongest candidates yet for the galleries item 8 says are missing — they are small, recent, and carry confirmed Minford provenance. **Deliberately not placed on any page:** which photo belongs where is an editorial decision, and the rename task was explicitly scoped to repairing references, not adding imagery.

### 23. `dashboardMetrics` tab is created empty
`setupSpreadsheet()` creates the tab but writes no formulas. The formula set is specified in `docs/googleSheetArchitecture.md` but must be entered by hand. The dashboard SPA (Phase 2) computes its own numbers and does not read this tab, so nothing is blocked.

### 24. ~~Photo upload not implemented~~ — **RESOLVED 2026-08-13**
Photos now upload to Drive before the lead is created, and the owner's notification carries working links. See the journal entry and the *Resolved* table. What replaced it is items 24b–24f below, which are the real trade-offs the implementation chose rather than a restatement of the old gap.

### 24a. ~~Lead identifier has no internal/customer-facing split~~ — **RESOLVED 2026-08-13**
`leadId` is now internal and sequential (`BG-0001`), server-assigned inside the existing `LockService` section and *after* the dedupe check; `referenceId` is the customer-facing long id the browser mints and the key create dedupes on. Both are columns in the sheet. See the journal entry.

### 24b. `leads.addPhotos` is a public endpoint that writes to the owner's Drive — **substantially reduced 2026-08-15**
Still public, for the same reason `leads.create` is: a browser cannot hold a secret. The bounds are now much tighter — **5 files per lead, 8MB each, 25MB aggregate, JPEG/PNG/WebP verified by content signature, a 24-hour reference window, and a 120-upload/hour global ceiling.** Worst case per reference fell from **96MB to 25MB**.

**The residual is unchanged in kind:** a `referenceId` is `BG-<timestamp>` and trivially minted, so the per-lead caps bound one lead, not one attacker. Apps Script exposes **no client IP**, so per-caller limiting is impossible and the hourly ceiling is the only global brake. It fails **open** on a cache outage, deliberately — a cache failure must not stop a real customer.

**Watch for:** unexplained growth in `BlueGrid Lead Photos`, or folders whose `referenceId` matches no row in `leads`.

### 24c. Abandoned and orphaned photo folders — no reclamation
Unchanged, and now the main residual of 24b. Photos upload before the lead row is written, so an abandoned submission — or a minted reference that never becomes a lead — leaves a folder with no lead behind it. Nothing reclaims that space.

Deliberately not automated: a routine that deletes Drive folders on a schedule is a routine that can delete a real customer's photographs if its "has no lead" test is ever wrong.

**Recommended next step, not implemented:** a **reporting-only** `listOrphanPhotoFolders()` beside the other editor-run admin helpers in `Code.gs`. Read-only, no deletion, no schedule. Decide on deletion only after seeing what it actually reports.

### 24d. ~~`photoAccess` defaults assume the notification address can be granted Drive access~~ — **RESOLVED 2026-08-15**
The `ownerEmail` mode this described no longer exists. Access is now `rootInherited`: one Viewer grant on the `BlueGrid Lead Photos` root, applied once by `shareRootFolderWithOwner()`, inherited by every lead folder and photo. **Customer submissions perform no Drive sharing call at all.**

`photoViewerEmail` is a separate config key from `notificationEmail` precisely so the two can differ — which they did throughout acceptance testing.

**Verified externally 2026-08-15, and this is the part that had never been true before:** Aron tested with a **separate real Google account**. Unauthorized account → Google denied access. Authorized account → the same links opened. Both halves of the boundary exercised. Attributed to Aron's manual test; not provable from this repository.

### 24g. Content validation checks headers, not full image structure
`detectPhotoContentType()` decodes the first 48 bytes and matches magic numbers. A file with a valid JPEG header and arbitrary bytes appended passes.

**Accepted deliberately.** Full image parsing is not available in Apps Script without adding infrastructure, which is out of scope by instruction. This stops every practical disguised-file attack — executable, script, markup, archive, document — and is not a malware scanner. Do not let a future session mistake it for one.

### 24h. HEIC removed — watch early live traffic
JPEG/PNG/WebP only as of 2026-08-15. iPhones on the default *Most Compatible* setting send JPEG, so this should be invisible; iPhones set to *Current*, and Files-app picks, will now be refused with on-screen instructions to change the setting.

**This is the one refusal a real customer is likely to hit.** If early submissions show people bouncing off it, re-accepting is two lines — `image/heic` back into `ALLOWED_PHOTO_MIME_TYPES` and its `PHOTO_CONTENT_SIGNATURES` entry restored — at the cost of reintroducing the only brand-allowlist signature rule and the only format that bypasses browser downscaling.

### 24i. Customer photo retention — **unresolved policy decision, deliberately unimplemented**
`BlueGrid Lead Photos` accumulates customer photographs and customer names indefinitely. Nothing in this codebase deletes them, and **nothing should be added that does until a retention period is agreed with the client.**

Open questions: how long photos are kept after a job closes or a lead goes cold; whether deletion is manual or scheduled; and what the customer was told at submission. Raised at every photo-related session since 2026-08-14 and still unanswered.

### 24e. The owner's HTML email interpolates some field values without escaping
Pre-existing, found while adding the photo links. `buildOwnerEmailHtml()` builds its table rows as raw HTML and several cells — `fullName`, `propertyAddress`, `serviceNeeded`, `sourcePage` — go in unescaped, so a lead submitting `<b>` in their name gets bold text in the owner's inbox.
Low severity: it lands in one mailbox, Gmail strips scripting from mail, and the sheet itself is protected separately by the formula-injection defence. **Not fixed here on purpose** — it is unrelated to photos or identifiers, and this session's brief was explicit about not changing unrelated functionality. The values added by this session (`referenceId`, `leadId`, photo names) *are* escaped, so the fix is now the only inconsistency in that function.
**Fix:** wrap the plain-text cells in `escapeHtml()`. The cells that are deliberately HTML — `linkifyPhone`, `linkifyEmail`, `buildPhotoHtml` — must be left alone, which is exactly why the array mixes the two and why this was easy to get wrong in the first place.

### 24f. `photoCount` can disagree with the number of stored photos
`photoCount` is what the browser said it was attaching; `photoUrls` is what actually reached storage. They differ whenever an upload fails, and that difference is deliberate — it is how the owner's email knows to say "3 photos attached, upload did not complete" rather than silently reporting none.
Recorded because a future dashboard reading `photoCount` as the number of viewable images would be wrong. **Use `photoUrls.length` for anything that counts images; use `photoCount` only to detect the shortfall.**

### 25. ~~Performance — responsive image delivery~~ — **RESOLVED 2026-08-18**
**`srcset` + measured `sizes` now ship on 75 `<img>` tags, 240 candidates.** Result against the true baseline (the same page with every slot served the original, which is what shipped until now): **41% lighter across every page and viewport measured** — 72–82% at DPR 1, 32–53% at DPR 2, 12–27% at DPR 3.

**How the ladder was chosen, so nobody "improves" it back:**

- **640 / 1024 / 1280**, and a rung is generated only if it beats the original by **≥10%**. Nothing is hand-picked per file.
- **1536 was generated, measured and discarded.** Every source is already q92, progressive, 2×2-subsampled — at matched quality a 1536 re-encode came out **1–65% larger** than the 2048 original. The original *is* the better 1536 candidate.
- **1280 exists for high-DPR phones**, which nearly got missed: a 390px phone at DPR 3 asks for ~1170px, skips the 1024 rung and would otherwise land on the 2048 original. It pays on the WebP sources and loses on the JPEG holdouts, and the ≥10% rule sorts that out by itself.
- **Quality is matched at 92**, with the JPEG sampling and progressive settings copied from the sources. The saving is entirely resolution, not fidelity. Dropping to q82 would have saved more and been a quality regression.
- **Format is never changed** — the six JPEG holdouts stay JPEG (item 32).

`sizes` values are **measured, not guessed**: `measureImageSlots.js` reads the widest CSS width each slot actually renders at 1440/820/390 in real Chrome. `validateResponsiveImages` re-checks the static contract *and* what Chrome actually downloads at DPR 1/2/3.

**Still open from this item:** Google Fonts loads render-blocking from a third party; CSS and JS ship unminified. See item 36 for what responsive images could *not* fix.

Original analysis kept below.



**Done:** WebP conversion. 12 of 18 referenced images converted, 183 references migrated, served image library **6.51 MB → 5.89 MB**. See item 32 for the six that could not be converted and must not be retried blindly.

**The largest remaining performance item is responsive image delivery, and it is untouched.** There is **zero `srcset`, `sizes` or `<picture>` anywhere on the site**. Sources are still `2048×1536`, so a 375px phone downloads a full-resolution desktop image. Converting the format without fixing the dimensions captured only part of the available win — for the six holdouts it captured none of it.

This is the real mobile LCP fix and should be treated as the performance item, not a follow-up to it.

**Also still open:** Google Fonts loads render-blocking from a third party (`preconnect` and `display=swap` are already correct); CSS and JS ship unminified (144 KB + 17 KB CSS, 120 KB + 17 KB JS); 59 images are neither `loading="lazy"` nor `fetchpriority="high"` (above-fold ones are correctly marked).

**The hero typing animation is no longer on this list** — profiled and optimized 2026-08-06 (items 10c/10d).

### 28. ~~WCAG AA contrast failures on body copy~~ — **RESOLVED 2026-08-18**
All three fixes applied: `--colorSteel` → `#68737E`, `--colorSkyDeep` → `#356CA3`, footer alpha raised. A new **`validateContrast`** suite now computes every text role against the WCAG formula on every run, so a regression fails a validator rather than waiting for the next audit. Original analysis kept below.

Opened 2026-08-18. Computed with the WCAG relative-luminance formula, not estimated:

| Token | On | Ratio | Needs |
|---|---|---|---|
| `--colorSteel #7C8894` | `#F7F9FB` | **3.43:1** | 4.5:1 |
| `--colorSteel #7C8894` | `#FFFFFF` | **3.62:1** | 4.5:1 |
| `--colorSkyDeep #3E7CB8` | `#F7F9FB` | **4.16:1** | 4.5:1 |
| `.footerBottomBar p` (0.45 alpha) | `#101214` | **4.35:1** | 4.5:1 |

`--colorSteel` is not incidental — it carries `.sectionLede`, `.serviceCardCopy`, `.whyItemCopy`, `.whyStat dt`, `.faqPanel p`, `.serviceAreaTownsLabel` and `.reviewsPendingCopy`, i.e. the primary body copy on every light section (`servicesSection`, `whySection`, `serviceAreaSection`, `faqSection`, `reviewsSection`) across all 29 pages. `--colorSkyDeep` is the section kicker at 1.05rem/600, which is below the large-text threshold, so 4.5:1 applies.

**Why it matters beyond compliance:** this is a contractor's site read outdoors on phones by landowners. Low-contrast grey body text is worst exactly where the audience is.

**Fix — three one-line token changes:** `--colorSteel` → `#68737E` (4.58:1) or `#616C77` (5.08:1); `--colorSkyDeep` → `#356CA3` (5.20:1); footer alpha `0.45` → `0.5` (5.10:1). Dark sections already override these, so nothing else moves.

### 29. ~~Developer TODO comments are served to the public~~ — **RESOLVED 2026-08-18**
Stripped from all HTML. **The sweep initially missed two files:** `buildSitemap.js` stamped a "confirm the production domain" TODO into `robots.txt` *and* `sitemap.xml`, and the HTML-only strip did not cover `.txt`/`.xml`. Both are clean now, and the generator **refuses to write** if `TODO`, `FIXME` or `placeholder` appears in either output, or if the origin does not look like a real https host — so it cannot reintroduce what it introduced. Original analysis kept below.

Opened 2026-08-18. **Confirmed in the live HTML, not just locally** — 4–5 per page across all 29. They include `TODO: Replace with the real business email address`, `TODO: Confirm phone number with the owner`, `TODO: Client has no Google Business Profile yet`, and `TODO: PLACEHOLDER IMAGE`.

Two specific problems beyond untidiness: the email one **advertises to anyone viewing source that the published address is fake**, and the phone one is **stale** — the number was confirmed 2026-08-13 from Chase's own flyer, so it instructs a future reader to redo finished work.

**Fix:** strip TODOs from shipped HTML; the information belongs in this file, which is where a future session looks anyway.

### 30. ~~No custom 404 page~~ — **RESOLVED 2026-08-18**
`404.html` is built from the `company/index.html` chrome by a guarded generator: `noindex`, excluded from the sitemap, three recovery routes (services / service areas / elsewhere), full header and footer, and a working estimate modal so the header CTA does not dead-end.

**Every path in it is root-absolute and must stay that way.** GitHub Pages renders it for a miss at ANY depth *without redirecting*, so the browser's base URL is still the missing directory — a relative path there loads nothing, and it fails silently. `validate404Page` requests a deep missing URL in real Chrome and checks the page renders styled, collapses 3→2→1 columns, keeps 48px touch targets, and never overflows horizontally.

Original note kept below.

Opened 2026-08-18. There is no `404.html`. GitHub Pages serves its own generic branded 404 — correct status code, but no BlueGrid chrome and no route back into the site. A mistyped URL or a stale Facebook link currently dead-ends.
**Fix:** a `404.html` built from the existing page chrome, the same way `privacy/index.html` was. Works identically on GitHub Pages and Netlify.

### 31. ~~The host is GitHub Pages, not Netlify~~ — **CONFIRMED AND RECORDED 2026-08-18**
**GitHub Pages is the intended host.** Recorded under *Hosting* at the top of `projectState.md`. **No migration is planned.**

Two Pages behaviours the site now actively depends on, either of which would have to be reimplemented elsewhere: the `www` → apex 301, and `404.html` being served for a miss at any depth *without* a redirect. Original analysis kept below.

Opened 2026-08-18. The repository is configured for **GitHub Pages**: a `CNAME` file, and **no** `netlify.toml`, `_redirects` or `_headers`. A session brief described this as a Netlify deployment; it is not.

This matters for one concrete reason: the `www` → apex 301 (item 12a) is currently provided by GitHub Pages. **On Netlify that redirect does not exist by default** and would need a `_redirects` rule, or every canonical on the site would point at a host that no longer redirects.

All asset paths are relative, so the site itself is portable to either host. Only the redirect and DNS differ.

### 32. Six JPEGs that WebP cannot beat — **do not reconvert blindly**
Opened 2026-08-18. `after_minfordOH`, `cleanCut_minfordOH`, `freshMulching_minfordOH`, `hero_b4_minfordOH`, `overGrowthCleanedup_minfordOH`, `overGrowth_minfordOH` were **deliberately left as JPEG**.

All six are JPEG Q=92, `2048×1536`, with measured entropy **0.95–0.98** — dense foliage and fresh mulch, the worst case for WebP's intra-prediction against JPEG's DCT. At `-quality 80` WebP was **40–69% larger** than the source; even at q60 it still lost.

**Verified as a content property, not a tool problem:** re-encoded through ffmpeg's libwebp independently and got 702.7 KB against ImageMagick's 700.4 KB on the same file. Two encoders, same answer.

**A future session that runs a blanket "convert everything to WebP" pass will make the site heavier.** The win available on these six is **resizing** (item 25), not re-encoding.

**Established tooling:** ImageMagick 7.1.2-29 Q16-HDRI with libwebp 1.6.0, at `C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\`. No standalone `cwebp`. Convention lives in `client_HesterAsphalt/tools/optimizeImages.ps1` (`-strip -quality 80`), but note that quality 80 is wrong for this photo set — the working settings were `-define webp:method=6` with quality stepped per image, and **lossless for the alpha logos** (verified pixel-identical by compositing over white, then diffing: 0 differing pixels, RMSE 0).

### 42. Process board breakpoint is 699px and is measured — **do not "tidy" it to a round tablet number**
The five-step horizontal process hands over to the vertical timeline at **699px**, moved down from 1167px on 2026-08-19. 1167 was the width at which the board stopped fitting *at its fixed design size*; it said nothing about whether five columns still read. With `clamp()` scaling on the board padding, gaps, discs and type, the row holds to ~660px.

**699 rather than 660 for two structural reasons:** the `@media (max-width: 640px)` block owns vertical-timeline rules (`.processSteps::before`, `.processStep` as a grid, `.processStepNumber` positioning) and handing over at 660 would leave only 20px between two contradictory layout systems; and the widest title word is 83px in the display face, ~88px in the ~6%-wider fallback during font swap, which needs more than the 94px column that 660px yields.

**Every `clamp()` upper bound equals the original desktop value and is reached at 1200px**, so the large-width design is unchanged by construction. `validateProcessLayout` asserts that at ≥1280px the computed padding, gap, disc, icon and type still match the pre-change values.

**If the step copy or titles are ever edited, re-run `measureProcessFloor.js`** — the floor is a function of the longest title word, and new copy can move it.

### 44. Performance baseline — measured 2026-08-20, top three fixed, the rest ranked

**Do not re-audit from scratch.** The method, the numbers and what was deliberately not done are all here.

**Measure against a server that compresses.** `serveSite.js` sends no `Content-Encoding` and no `Cache-Control`, which is right for correctness testing and wrong for performance testing — it invents a "text compression, 115 KiB" opportunity GitHub Pages already takes, and inflates minification savings roughly 4x. A `serveSiteProduction.js` variant (gzip + `max-age=600`) lives in the scratchpad toolchain. Every number below is from that server.

| | Mobile before | Mobile after | Desktop before | Desktop after |
|---|---|---|---|---|
| Performance | 75 | **79** | 91 | **95** |
| LCP | 7.7 s | **5.6 s** | 1.8–2.0 s | **1.4 s** |
| FCP | 1.6 s | 1.6 s | 0.8 s | 0.8 s |
| CLS | 0.013 | 0.010 | 0.004 | 0.004 |
| TBT | 0–20 ms | 0 ms | 0 ms | 0 ms |
| Transferred | 1,307 KiB | **1,082 KiB** | 2,269 KiB | **2,045 KiB** |
| Requests | 16 | 15 | 21 | 20 |

Accessibility / Best Practices / SEO are **100 / 100 / 100** on all five page types tested. Interior pages scored 77–79 mobile with LCP 4.8–5.0 s, where LCP is the page-hero image and is network-bound, not animation-bound.

**Run-to-run variance is real and must be accounted for.** FCP swung 1.6–2.8 s and Speed Index 1.7–3.4 s across identical runs, moving the score 70→75 on its own. LCP was stable to within 80 ms across every run, which is why the findings were argued on LCP and why the before/after comparison above is matched on the fast-FCP cluster.

**Fixed:** H1 favicon SVG link (item 41), H2 after-plate priority (item 45), H3 hero LCP gate (item 46).

**Still open, in priority order:**

1. **M1 — Google Fonts is a render-blocking third party.** 1,700–1,870 ms simulated mobile, 490 ms desktop. Chain is document → `fonts.googleapis.com` CSS → two woff2 (75.7 KiB). `preconnect` and `display=swap` are already correct, so what remains is the cross-origin round trip itself. Fix is self-hosting the two woff2 under `graphics/fonts/` with a local `@font-face` and `preload`. Inter and Rokkitt are OFL, so this is permitted. Adds ~76 KiB to the repo and needs the fallback-metric work in the toolchain's `fonts/` re-checked.
2. **M2 — the two Unsplash hotlinks**, item 10. 483 KiB on desktop.
3. **M4 — main-thread work is style/layout dominated.** styleLayout 1,235 ms at 4x CPU throttle, against scripting 128 ms. TBT is 0–40 ms so responsiveness is fine; this is a battery cost on low-end phones, consistent with items 10c/10d rather than a new defect.

**Explicitly NOT recommended: minification.** Against a gzip server Lighthouse reports 16 KiB CSS + 19 KiB JS, not the 71 + 71 the raw server claims. Real gzip sizes are `styleIndex.css` 146 KB → 33.5 KB, `indexJS.js` 122 KB → 30.5 KB, `index.html` 176 KB → 26.6 KB. Roughly 35 KiB of genuine saving against `codeStyle.md`'s no-build-step rule. Not worth it.

**What can only be measured after deployment:** real TTFB and CDN behaviour, whether Pages serves brotli (better than the gzip modelled here), field Core Web Vitals via CrUX/PSI — especially CLS, which lab runs under-represent because `#heroCursor` produces a continuous stream of micro-shifts while typing (0.0002–0.0004 each, ~12/second, never stopping while the tab is open). Session CLS stayed at 0.005–0.016 in the lab.

**GitHub Pages' `Cache-Control: max-age=600` is not configurable** and still shows as a failing Lighthouse audit. Repeat-visit performance will genuinely be worse than a host with long-lived immutable asset URLs. Not fixable in this repository.

### 45. ~~The after hero plate loaded at full priority before it was needed~~ — **FIXED 2026-08-21**
`#heroPlateAfter` rests fully masked (`--heroSweepPos: -18%`) and is not revealed until the entrance sequence plus the first typed phrase, roughly 2.5–3.5 s in — but it loaded at default priority alongside the BEFORE plate. Measured cost: **511 KiB** of hero on a 412px phone, **724 KiB** at DPR 3, **832 KiB** on desktop, half of it not needed yet.

`fetchpriority="low"` on that one tag. Confirmed Medium → Low in the network trace. **Deliberately NOT `loading="lazy"`** — the plate is inside the viewport, so lazy defers almost nothing and risks a visible pop. The loop already tolerates an unloaded plate: `fireHeroForwardSweepAndWait()` waits on `load`/`error` and extends the hold, so on a slow connection the first sweep waits rather than tearing.

### 46. ~~The hero entrance gated the homepage LCP by ~1.0 s~~ — **FIXED 2026-08-21. Do not simplify it back.**
Stripping `data-heroanimate` is what releases the compositing layer, and the blanket 2200 ms `heroSequenceComplete` timer used to be the only thing that ever did it. Chrome withholds the LCP entry for text held in a compositor-animated layer until then, so LCP was pinned to the timer rather than to when the words became legible: **~2.5 s against a ~0.4 s first paint.**

`initializeHeroEntrance()` now releases each element on its own opacity `transitionend`, doing exactly what the timer did, only sooner. **LCP 2708 → 1448 ms** (mobile 390 DPR 3), **2496 → 1536** (mobile 412), **2520 → 1512** (desktop 1350).

**Three things not to undo:**

- **The 2200 ms timer stays.** It is the entrance's choreography anchor — `heroEntranceComplete` is what the typing loop waits on — and the backstop for an element whose `transitionend` never arrives, which an interrupted transition will not fire.
- **The opacity gate is not the lever.** Forcing the headline and copy to `opacity: 1`, releasing `will-change` on them, and removing their `transition-delay` were each measured and moved LCP by nothing. Removing the gate would also *cost* the win, since those elements would stop firing the opacity `transitionend` the release is keyed to.
- **Release is keyed on `propertyName === 'opacity'` for a reason.** `waitForHeroHookEntrance()` holds the typing loop on the headline's opacity `transitionend` and the stat counters start on `.heroStat`'s. Both capture their element synchronously at init, before any transition starts, so the teardown cannot strand them — but re-keying this to a different property would need that re-checked.

### 47. ~~Consent banner privacy link dead-ended on 404s two or more folders deep~~ — **FIXED 2026-08-21**
`resolvePrivacyHref()` counted folders in `location.pathname` and could only ever emit one `../`. Correct for every real page — none is more than one folder deep — and wrong on `404.html`, which GitHub Pages serves AT the missing URL without redirecting. `/no-such-page/deeper/still-missing` resolved the link to `/no-such-page/privacy/index.html`, a second 404.

**Nothing caught it because the link does not exist in any file** — it is injected at runtime, so no static check can see it, and `validate404Page` was checking layout rather than injected links.

The banner now borrows the href from the page's own footer, which the generators already write correctly for every depth: relative on real pages (so `file://` keeps working), root-absolute on `404.html`. The old derivation is retained as a fallback for a page with no footer, and the selector is scoped to `.siteFooter` because two legal pages also link privacy from body copy.

**Guarded by `validateConsentPrivacyLink`**, which fetches the target and checks the status across 7 real pages and 5 missing URLs up to six folders deep, and is injection-proven against the old behaviour.

### 48. ~~Footer social icon had a 17×17 tap target~~ — **FIXED 2026-08-21 at 44×39, and 39 is deliberate**
`.footerFacebookLink` was an `inline-flex` wrapper with no padding around a 17px icon, so the whole interactive target was 17×17 — under WCAG 2.5.8's 24×24 for a standalone control. The inline-in-a-sentence exception does not cover a social icon in a footer.

Fixed with `padding: 11px 13.5px` and a matching `margin: -11px -13.5px`. Padding is what makes the target real for the pointer **and** the focus ring, which a positioned `::after` overlay would not do; the negative margin removes the same space from the flow, so the icon sits on the pixel it always did and the footer's spacing is unchanged. Verified: mobile footer pixel-identical (RMSE 0), desktop 0.011%, tablet 0.037%.

**Why 39 tall and not the 44 that was asked for.** The email link sits directly above with a measured clearance of **12.2px** — identical at 375, 390, 430, 768, 820, 1024 and 1440. 13.5px of vertical padding overlapped it by 1.3px, and the Facebook link paints later, so it would have swallowed the bottom sliver of the email link's own target. A first attempt did exactly that, on the strength of a 36px clearance reading **taken before the footer's `[data-animate]` reveal ran**, when the block still rests 24px lower. **Measure at rest.**

**If `.footerGoogleLink` is ever un-hidden:** it shares this rule, and with a 14.4px row gap two 44px-wide targets centred 31.4px apart would overlap by ~12.6px. Widen `.footerSocialItem`'s gap to at least 27px at that point.

**Guarded by `validateFooterSocialTarget`.**

### 49. `nuloStudioCredit.webp` and `.png` are now unreferenced
The dev credit image was swapped to `masterLogoTP240.webp` on 2026-08-21. The two old assets (11,978 B and 18,833 B) are still tracked and still deployed, referenced by nothing. Same category as item 22 — pruning is a decision, not a cleanup, so they were left.

**Also found during that swap:** `privacy/index.html` was still pointing at `nuloStudioCredit.png` while the other 32 pages used the `.webp` — a page the WebP migration missed. Both files existed and resolved, which is exactly why no validator ever flagged it. All 33 pages now reference one asset. **Worth remembering: "every reference resolves" does not mean "every reference is the one you intended".**

### 50. `graphics/logos/devCredit/` ships ~2.6 MB the site never loads
Three master logos: `MasterLogo.png` (1.2 MB) and `TPNulo_StudioLogo.png` (962 KB) are **tracked and therefore deployed**; `MasterLogoTP.png` (435 KB) was added 2026-08-21 and is currently untracked. Nothing references any of them — the site loads the 20 KB derivative.

`graphics/marketingAssets/` was gitignored on 2026-08-20 for precisely this reason. **`graphics/logos/devCredit/` is the same case and has not been given the same treatment.** Aron's call: gitignore the folder, or move the masters out of the deployed repository into asset storage.

### 51. `validateFavicons` prints a note it no longer earns
With the SVG icon link removed (item 41), no page references an SVG icon, so the suite's "SVG icons rasterise to non-blank output" check now iterates an empty set — but the note is printed unconditionally. The note is vacuous rather than wrong, and everything the suite actually checks still passes. One-line fix whenever the toolchain is next touched.

### 43. Validators located media queries by `indexOf` — fixed, but the pattern is worth avoiding
`validateMobileLayout`, `validateFloatingCta` and `validateProcessSequence` found their blocks with `css.indexOf('@media (max-width: NNNpx)')`. When the process breakpoint comment began *mentioning* `@media (max-width: 640px)` to explain why it keeps clear of that block, all three started slicing from the comment and produced five confident, wrong failures — including safe-area complaints about CSS that had not changed.

They now scan for a declaration at the **start of a line**. Worth remembering generally: a validator that parses CSS by substring will eventually be defeated by a comment that documents the thing it is looking for.

### 39. Favicon system — **AUDITED 2026-08-19, RE-AUDITED AND DECIDED 2026-08-27. THE MOUNTAIN/TREE ARTWORK IS APPROVED FOR EVERY CONTEXT AND MUST NOT BE RECOMPOSED.**

**DECISION, 2026-08-27 — the mountain/tree mark is the favicon everywhere.** A second package generated from the circular BLUEGRID wordmark logo was audited against the deployed one and rejected. **Neither package had transparent padding** — both are a disc inscribed edge to edge: opaque area 78.5% of canvas (π/4), content bounding box the full canvas, margin to the canvas edge 0px. The wordmark package fails on *feature scale*, not padding:

| Feature | stroke @512 | at 16px | canvas needed for a 2px stroke |
|---|---|---|---|
| Mountain/tree — main trees | 95px | **2.97px** | **11px** |
| Wordmark — `BLUEGRID` | 20px | 0.63px | 51px |
| Wordmark — `LAND SOLUTIONS` | 5px | **0.16px** | **205px** |

The wordmark lockup occupies 19.9% of the icon's height, so a 16px render gives it 3.19px of vertical space and gives `BLUEGRID` alone 2.03px. Detail survival (downscale, restore, RMSE against the master) is **2.3× worse at every size** — the wordmark loses more at 96px than the tree mark loses at 16px. The wordmark also spans 96.1% of the canvas width, which puts it **outside the Android maskable safe zone**: under the 80% crop that `site.webmanifest` invites with `purpose: "any maskable"`, `BLUEGRID` is clipped at both ends. The tree mark's finest detail sits at x 158–434 of 512 and degrades gracefully.

The wordmark was measurably better in exactly one place — Apple Touch and the manifest icons at 180–512px, where it is fully legible — and a mixed implementation was offered on that basis. **Aron chose one artwork everywhere.** Do not reopen this without new measurements; the numbers above are the record.

**`newFavicons/` and `oldFavicons/` were deleted on 2026-08-27** after confirming zero references anywhere in the repository. Neither was ever tracked. The production set was restored from `HEAD` rather than copied out of `oldFavicons/`: its PNGs were pixel-identical re-encodes carrying different bytes, and restoring keeps the exact bytes that have already passed `validateFavicons`. **One file in `oldFavicons/` was not a re-encode at all** — its `apple-touch-icon.png` was a bleed-to-edge transparent circle (RMSE 0.464 against the deployed file), having lost the opaque 10%-margin treatment described below. Copying that folder wholesale would have regressed iOS the way the 2026-08-19 incident regressed browser tabs.

**The rejected wordmark master is kept on purpose, and is NOT a favicon.** `graphics/logos/masterFavicon_BG.png` — moved out of `graphics/favicons/` on 2026-08-27 precisely so it cannot be mistaken for one — is the 512x512 circular BLUEGRID wordmark mark. It is retained as a possible **alternate logo concept to show Chase**. Untracked. Do not wire it into any icon declaration.

**The approved master is `graphics/favicons/Bluegrid_Favicon1.png`** — 512×512, transparent, pixel-identical to `web-app-manifest-512x512.png` (compare AE 0.22px). It is unreferenced by any page, so **it must not be pruned as a spare** (this nearly happened under item 22). `New folder/Bluegrid_Favicon.png` is a flattened-on-white export and is **not** the master.

**What happened, so it does not happen again:** the audit judged the approved mark "illegible at 16px" because it bleeds to the canvas edge, and regenerated the tab icons from `apple-touch-icon.png` — the only fully contained asset, and contained *because it has an opaque black fill baked in for iOS, which cannot render transparency*. That put a **black square behind the mark** in browser tabs and Google's small icon. It was an unauthorised visual change, rejected, and reverted to the exact pre-audit bytes.

**The rule: the favicon artwork is Aron's. Do not recompose, recolour, crop, or add a background to it.** Regenerate a derivative size only if technically required, from `Bluegrid_Favicon1.png`, with `-background none`, preserving alpha.

**`apple-touch-icon.png` is legitimately opaque** and is exempt from the transparency guard. iOS home-screen icons do not support transparency; the black fill there is intentional and is the client's own artwork.

**Do not "fix" the manifest icons.** `web-app-manifest-192x192.png` and `-512x512.png` are `"purpose": "any maskable"`; a maskable icon must bleed to the canvas edge because the platform applies its own mask and only the centre 80% is safe. Their edge-to-edge composition is correct.

**Structural work from the audit that stands:** `mask-icon` removed from `index.html` (it pointed at a raster-in-SVG; Safari's pinned-tab mask needs a monochrome vector, and Safari 13+ uses the standard icons); root `/favicon.ico` added as the stable probe URL, byte-identical to the linked file; coverage verified on 33/33 pages at every path depth; manifest icons verified to resolve relative to the manifest; nothing blocked by robots.txt. The approved `.ico` already carried 48/32/16 frames, so Google's ≥48px requirement was always met.

**`validateFavicons` now guards the artwork itself**, not just the plumbing: transparent icons must keep transparent corners and mean alpha below 0.95. Injection-proven. `rebuildFavicons.js` is retired to a tombstone that refuses to run.

### 41. ~~`favicon.svg` is 300KB~~ — **RESOLVED 2026-08-21 by unlinking it, not by re-encoding it**

**The `<link rel="icon" type="image/svg+xml">` was removed from all 33 pages.** That ends the cost without touching the artwork at all, which is why it needed no brand decision: the `.ico` already carries 48/32/16 frames and the 96×96 PNG covers the rest, so **nothing a visitor sees changed**. Measured over white at tab sizes, old source vs new: 16px 0.52%, 32px 1.26%, 48px 1.34% RMSE — resampling only.

**Measured cost while it was linked:** 307,449 bytes raw, **226 KiB on the wire after gzip** (it barely compresses), fetched at **priority High** on every first visit. Largest single resource on every interior page, larger than their own LCP image. Removing it moved simulated mobile LCP **7.7s → 6.3s** and cut 226 KiB.

**The file stays on disk, untouched.** Do not re-add the declaration without re-measuring. The original analysis is kept below because the 192px rebuild option is still there if a real SVG icon is ever wanted.

Original note follows.

It is not a vector. It is a RealFaviconGenerator wrapper around a single base64-encoded 512px raster, and Chrome prefers `type="image/svg+xml"` when a page offers one — so it is downloaded to paint a 16px tab icon.

A 192px rebuild measured **38KB, an 87% saving**, visually identical at tab sizes. It was reverted with the rest of the artwork restoration because shrinking it means **re-encoding Aron's artwork**, which is a brand decision rather than a defect fix.

**If it is ever approved:** rebuild from `Bluegrid_Favicon1.png` with `-background none`, embed with `xlink:href` (SVG 1.1 — a file carrying only the SVG 2 `href` renders blank in non-browser consumers while `magick identify` still reports the declared size), and re-run `validateFavicons`, which rasterises SVG icons and fails on a blank canvas.

### 40. No `WebSite` or `Organization` schema node — observation, not yet actioned
The site declares exactly one `LocalBusiness` node (homepage) and no `WebSite` or `Organization` node anywhere. Its `image` was relative and it had no `logo`; both were fixed 2026-08-19 (absolute URLs, `logo` → the square 290×290 brand lockup).

A `WebSite` node is what Google reads for the **site name** in search results, and `Organization` is the conventional home for brand identity. Adding either is a deliberate schema decision rather than a defect fix, so it was left for Aron. Naming is already consistent across the site — "BlueGrid Land Solutions", one declaration, no variants.

### 37. The tablet hero estimate gap — **FIXED 2026-08-19, recorded so it is not reintroduced**
`.heroInner` stops being two columns at **1080px**; the compact estimate system used to switch on at **640px**. Between them — most tablets — the desktop hero CTAs were shown while the estimate card they point at had already stacked below the fold. At 768/960/1024 the card's top edge measured exactly 800 in an 800px viewport: not one pixel visible.

**The switch now lives in one place, the 1080px block**, and 640px only changes the compact row's shape. `validateMobileLayout` fails if `.estimateFormCard` or `.heroActions` are hidden at 640px again — duplicating the switch is what disguised the defect, by making 640 look like where the system began. `validateHeroEstimateUx` drives seven widths in a real browser and asserts exactly one estimate system at each.

### 38. `size="1"` on the hero address input is load-bearing — **do not remove it**
An `<input>` carries an intrinsic width of about 20 characters — 218px here — and that is the figure the hero's grid track uses as its automatic minimum. Without the attribute `.heroContent` is floored at **380px inside a 375px viewport**, and 29px of hero is clipped out of sight by `.heroSection`'s `overflow: hidden`. Real 375/390px phones lost the right edge of the copy, the Get Estimate button and a stat column.

**This was pre-existing**, confirmed by force-restoring the old rules in the browser and measuring the identical 380.2px.

**CSS cannot fix it.** `min-width: 0` and `flex-basis: 0` were both measured and neither moved it — they govern flex layout, not the intrinsic size the outer grid measures. Only the attribute does. Flex still sets the rendered width, so the field fills its row exactly as before.

### 33. The double scrollbar — **FIXED 2026-08-18, recorded so it is not reintroduced**
`css/styleIndex.css` carried `overflow-x: hidden` on **both** `html` and `body`. Once the root's overflow is not `visible`, body stops propagating its overflow to the viewport and keeps it — and a hidden value on one axis forces the other axis to compute to `auto`. The duplicate declaration quietly made body a **second scroll container** inside the viewport's.

It only needed something to overflow, and the site supplies that on every page: every `[data-animate]` element rests at `translateY(24px)` until revealed, and the last one in the document pushes 24px past the footer's 19.2px of bottom padding. **24 − 19.2 = 4.8px**; body measured exactly 5px of scrollable slack. That is what the second bar scrolled — which is why it appeared while reading and vanished at the bottom of the page.

**`body` now has no `overflow-x` at all, deliberately.** `html`'s declaration is the site's entire horizontal clipping policy, and it is load-bearing — at 390px the page genuinely has ~10px of horizontal overflow. **Do not re-add `overflow-x` to `body`**; `overflow-x: clip` was considered and rejected as the more complex answer to the same problem, with a Safari <16 caveat that plain removal does not have.

`validate404Page` asserts on 11 pages × 3 viewports that body never becomes a scroll container and that `document.scrollingElement` is always `html`. Both the modal and drawer scroll locks were re-tested after the change and still hold.

### 34. Three `<img>` tags declared dimensions their files did not have — **FIXED 2026-08-18**
`faq/index.html` and `insights/index.html` declared `width="2048" height="1536"` for photographs that are **1536×1024**, and `locations/forestry-mulching-minford-oh.html` declared 2048×1536 for a **512×384** file.

Those are different aspect ratios — 4:3 reserved for a 3:2 image — so the browser held open the wrong box and the layout moved when the image landed, which is exactly the shift explicit dimensions exist to prevent. It surfaced only because the first `srcset` installer trusted the width attribute, and a wrong `w` descriptor is a lie the browser acts on when choosing a candidate.

**The installer now reads real dimensions off the file with ImageMagick and never from the markup**, and `fixImageDimensions.js` guards that every declaration still matches its file.

### 35. `graphics/favicons/New folder/` — needs an owner decision
A directory literally named `New folder`, holding a 512×512 favicon master (250 KB). A second, *different* 512×512 master sits beside it as `Bluegrid_Favicon1.png` (225 KB). Neither is referenced; both are source artwork for the generated favicon set.

**Deliberately not touched.** Source art was out of scope for the prune (item 22), and the two files are not duplicates, so picking one is a decision rather than a cleanup. **Aron should decide** whether to keep one, keep both, or move them out of the deployed repository into asset storage. 0.46 MB either way — this is tidiness, not weight.

### 36. High-DPR phones still pull full-size JPEGs — a compression floor, not a bug
Responsive images cut 41% overall, but the win narrows to **12–27% at DPR 3**. The cause is item 32: the six JPEG holdouts have no rung that beats their original, so a 390px phone at DPR 3 (asking ~1170px) falls through to the 2048 file.

**Nothing in `srcset` can fix this** — it is a property of the photographs. The options, if it ever matters enough:

1. **Accept a small quality drop** on those six only. At q82 the 1024 rung saves 41–46% instead of 19–23%. Currently rejected: quality was to be preserved.
2. **Re-shoot or re-export from higher-quality originals**, if Chase has them. These files may already be re-encodes of re-encodes, which would explain the floor.
3. **Crop rather than scale** for the small slots, which changes composition and needs a human eye.

Recorded so the next person does not spend an afternoon rediscovering that the encoder is not the problem.

### 26. Owner is not named on the site
Copy says "the owner" throughout because naming Chase publicly was never approved. For an owner-operated brand, naming him is likely stronger. One-line copy change once decided.

### 27. `MODULE_API_KEY` state cannot be verified from outside
`leads.list` returns `UNAUTHORIZED` identically whether the key is unset or merely not supplied. Only the Phase 2 dashboard depends on it; the public form does not.

---

## Future Improvements

- **Dashboard SPA (Phase 2)** — `leads.list` / `leads.update` and `MODULE_API_KEY` already exist and are tested; nothing has been built against them.
- **Weekly summary email** — `weeklySummaryDay` config key is seeded but unused; specced in `phase5Zapier.md`.
- **SMS alerts** — the one notification Apps Script cannot do natively; needs an email-to-SMS gateway or a webhook.
- **Location × service pages** — beyond forestry mulching, only where search volume justifies genuinely distinct content.
- **`locations/` hub page** — the six location pages have no index of their own; the homepage `#serviceAreas` block and the Forestry Mulching "Where We Work" section stand in. Specced as part of Phase 13.
- **Insights growth** — the section is built to scale. A new article needs only a record in the content data; the uniqueness gate and the no-dates check already apply.
- **Structured data expansion** — `LocalBusiness` omits a street address (service-area business); revisit if the client wants one public.
- **Consider a build step** — the site is at 28 pages and item 17's duplication already costs scripted, guarded passes for any nav change. Phase 13 (`phasePrompts/phase13ServiceAreaExpansion.md`) specifies the generator; its stated trigger is "hand-maintenance of location pages exceeds ~12 files", and the shared chrome has arguably hit that first.

---

## Explicitly Not Debt

Recorded so future sessions do not "fix" them:

- **No ActivityLog sheet.** Deliberate. The `leads` sheet is the success record; `errorLog` captures failures only. A second log of successful traffic adds noise and quota cost.
- **Nulo Studio is not copied on lead emails.** Deliberate client decision — the studio must not sit in the customer's email thread. Operational problems surface in `errorLog`.
- **`leads.create` is a public endpoint.** Deliberate — a browser cannot hold a secret. The honeypot, validation, and dedupe are its gate.
- **`Content-Type: text/plain` on form POSTs.** Deliberate — Apps Script web apps cannot answer a CORS preflight, so `application/json` would fail from the browser.
- **The owner's photo links point at Drive rather than being email attachments.** Deliberate: attachments would multiply MailApp quota against a 12-photo cap, cannot be re-downloaded once the mail is deleted, and would bounce on size. Links are also what the sheet can hold.
- **`leadId` is held for the whole page load, not per attempt.** Deliberate. The API dedupes on `leadId`, so a stable id lets a retry after a network failure collapse into the original row. The flow allows one submission per page load, so there is nothing to reset.
- **The unconfigured-endpoint branch in `submitEstimateRequest()` is unreachable.** Kept on purpose: it makes a blanked or mistyped endpoint obvious in the console instead of silently failing, and costs four lines.
- **Location pages do not link to each other.** Deliberate, per the Internal Linking Map in `seoPlan.md` — they pass authority up to the parent service page, not sideways. Nearby towns render as plain text pills, which is why `.nearbyList` styles `li` rather than `a`. Sitewide chrome *does* link to them; rule 4 allows that explicitly.
- **Location pages have no gallery.** No photo in the library can be honestly captioned to a named town. Adding one would mean labelling a Greenup County photo as Chillicothe work.
- **The FAQ mega menu links to service pages, not only the FAQ page.** Deliberate — several of the most common questions were already answered on a service page, and `seoPlan.md` bans restating them. The menu points at whoever owns the answer.
- **The FAQ hub shares no questions with the rest of the site.** Deliberate and enforced by a check. The site had 75 FAQs; the hub took the 28 that were left rather than competing with the service pages.
- **Mobile navigation does not render the mega menu.** Deliberate and instructed — a mega menu inside a full-screen drawer is worse than a short list.
- **The page assemblers are not in the repo.** New pages were generated once from guarded splices plus content data, then committed as plain static HTML. Phase 13 builds the real generator; shipping a half-generator now would leave two competing sources of truth.
- **CRLF working tree, LF index.** `core.autocrlf` is `true`, so Git normalises on commit and converts on checkout. Audited 2026-08-09: all 26 source files are CRLF on disk and LF in the index — **there is no mixture**, and the older note claiming some files were LF on disk was wrong. Nothing to fix; scripted edits detect and restore per file anyway.

---

## Resolved — moved out of debt

| Item | Resolved | Notes |
|---|---|---|
| Lead capture not live | 2026-08-03 | Production `/exec` wired; `ping` returns the matching `forestryModule` / `bluegrid` / `1.0.0` identity and a honeypot POST returns a correct envelope. |
| `BlueGrid Leads` spreadsheet did not exist | 2026-08-03 | Created; `setupSpreadsheet()` and `runSelfTest()` both passed. |
| Service area pages: 0 of 13 | 2026-08-02 | First wave of 6 shipped. Remainder tracked as item 6. |
| Hero background ran past the fold on mobile | 2026-08-03 | Media layer decoupled from section height. |
| Before/after transition stopped alternating | 2026-08-03 | Dissolve made awaitable; 92/92 cycles verified. |
| `hero_after` filename casing mismatch | 2026-08-03 | Normalized in git; all 3 references updated. |
| Desktop header wrapped between ~1100–1200px | 2026-08-03 | 101px of tightening plus the switch moved to 1150px. |
| Header compact values scattered as literals | 2026-08-03 | Twelve `:root` tokens; queries reduced to overrides. |
| Estimate form had no double-submit guard | 2026-08-03 | In-flight lock, disabled button, stable `leadId`. |
| Rowan County missing from coverage data | 2026-08-02 | Added to all four places; TODO-marked for client confirmation. |
| Services mega menu had no hierarchy and an odd-numbered hole | 2026-08-06 | Featured band plus three balanced groups of two; fit measured 1151–1600px. |
| Hero typing cadence irregular; character writes off the frame boundary | 2026-08-06 | Profiled first. Rendered cadence now equals the scheduled cadence exactly; write-to-paint 8.5ms → 0ms. |
| Typed line re-rastered the hero photograph on every keystroke | 2026-08-06 | `.heroTypedLine` promoted; 8.0 megapixels/second of photo resampling removed. Residual blur cost is item 10c. |
| Mega panel styling scattered as literals | 2026-08-06 | Nine `--mega*` tokens; the FAQ panel repointed at identical values, so nothing renders differently. |
| Process grid hardcoded to 5 columns while 7 of 8 pages had 4 steps | 2026-08-07 | Those pages had been rendering with an empty fifth column. Replaced with flex; nothing assumes a step count. |
| Process section was a static scroll-reveal | 2026-08-07 | Sequenced reveal with arrow flash/dim, viewport-triggered, looping. Order verified beat by beat in simulation. |
| Both chrome assemblers double-indented their output | 2026-08-07 | They sliced from the opening tag, leaving the line's own indentation in place. Fixed in both; the services mega panel was regenerated. |
| `drawLine` animation primitive orphaned | 2026-08-07 | Existed only to animate `.processTrack`; removed with it. |
| Three mega panels, three heading treatments, two CTA patterns | 2026-08-07 | One shell, one featured card, one row primitive, one group heading. Shared rules asserted to be declared exactly once. |
| Service Areas panel ran at half the width of its siblings | 2026-08-07 | `min-width: 420px` replaced by the shared 760px shell. |
| Mega panels jumped horizontally between nav items | 2026-08-07 | Positioning moved from `.navItem` to `.primaryNav`; all three land on one rectangle. Left clearance at 1151px went 62px → 214px. |
| Mega menu flickered when the pointer crossed the 14px gap | 2026-08-07 | Transparent bridge on `.megaPanel::before`. Pre-existing since the panels were built. |
| Services panel was the one exception to the path rule | 2026-08-07 | Bare siblings inside `services/` retired; two variants again sitewide. |
| Feature branch not merged | 2026-08-07 | `phase2a-lead-capture` fast-forwarded into `main` (`8108f94..bc4021d`), 17 commits, 0 deletions, validated on `main` before pushing. Branch kept. |
| Nothing pushed to origin | 2026-08-07 | `main` pushed; local and `origin/main` synchronized at `9237e53`. |
| GBP service graphic committed by accident | 2026-08-07 | 2.6MB asset the site never loaded, swept in by a broad `git add -A` in `235a4a3`. Removed in `9237e53` after verifying zero references. |
| GBP marketing assets appearing as untracked noise | 2026-08-07 | Repository's first `.gitignore`, one rule: `graphics/GBP - Services/`. Folder stays local and intact. |
| Process sequence reset and replayed the whole board forever | 2026-08-09 | Two phases as explicit forward-only states. `resetBoard()` deleted; the assembler guards it did not survive. Verified over 120s of virtual time: 5 reveals, none repeated, **0 un-reveals**, 0 step events after the reveal. |
| Phase B read as a point chasing along the row | 2026-08-09 | Rebuilt as a cumulative sweep: highlights accumulate to all four, hold, then clear together. `lightArrow()` is its own beat — reusing Phase A's `flashArrow()` would have dimmed each arrow on the way across. 25 passes verified, each peaking at four. |
| FORESTRV misspelling on every page | 2026-08-11 | Primary mark migrated to `bluegridMark290.png`, which has no arc text. Still open for print/signage — see item 2. |
| Copy read as machine-written (447 em dashes) | 2026-08-11 | 440 rewritten by hand through 215 context-anchored rules; only the `1–2 day` numeric en dash remains, deliberately. |
| Schema and rendered FAQ copy disagreed | 2026-08-11 | Three pre-existing mismatches fixed; `validateSeo` now fails the build if a schema question is not rendered. |
| Service page H2s were design elements, not search intents | 2026-08-11 | 36 rewritten. The site's own Content Guideline 2 had required this since the plan was written. |
| Homepage H1 was duplicated and carried no intent | 2026-08-11 | "Take Back Take back your property." → "Take Back your property. Forestry mulching and land clearing in Southern Ohio and Eastern Kentucky." |
| Company page was a content orphan | 2026-08-11 | Three editorial inbound links; `validateSeo` counts body links only, so chrome does not mask it. |
| British and American spellings mixed | 2026-08-11 | Normalised to American on a US local business site. |
| Floating CTA bar cropped along its bottom edge | 2026-08-11 | A fixed height that ignored its own padding and border left the 46px buttons 1.44px taller than the 44.56px content box, so they painted over the bottom border and its rounded corners. Height now derives from content. `validateFloatingCta` fails if a height is reintroduced that does not fit. |
| Site had no About page of any kind | 2026-08-09 | `company/index.html`, 24th page, built from the `faq/` donor with chrome carried byte for byte. 865 words, **zero new CSS**, `AboutPage` schema, verified claims only. |
| Fifth nav item did not fit the header | 2026-08-09 | Switch 1150→1200px, compact band 1280→1360px. Nothing shrunk. See item 20. |
| The header model carried its own copy of the nav | 2026-08-09 | `measureHeader` reads `index.html`. It had been describing a four-item bar. |
| Mega-menu row rules were services-branded | 2026-08-09 | Company classes joined the existing selector groups rather than copying declarations — one block, two names, so the panels cannot drift. |
| "Get My Free Estimate" read as broken on the homepage | 2026-08-11, **superseded same day** | Not a routing bug — audited 227 estimate/quote anchors on 24 pages, all bare `#estimateForm` fragments, no cross-page or path issue. First fix: focus `#fullName` on click, giving unambiguous arrival regardless of scroll distance. **Real browser QA showed this wasn't what was wanted** — see the next row. |
| `DEFAULT_NOTIFICATION_EMAIL` held an uncommitted, wrong value | 2026-08-11 | Working tree had `admin@nulostudio.com`; only `Bluegridls@gmail.com` was ever committed. `localTestRunner.js`'s own guard caught it (`to=admin@nulostudio.com`) once run. Reverted to match `HEAD`. See item 10l for the recurrence risk. |
| Estimate CTAs scrolled to the mini-form instead of opening the modal | 2026-08-11 | Every `a[href="#estimateForm"]` now calls `preventDefault()` and `openEstimateModal()` directly. Required adding Name/Phone/Service to the modal's Step 1 first — see the next row — because opening the modal without them would have silently rejected every submission server-side. |
| The modal could not be opened on its own (missing Name/Phone/Service) | 2026-08-11 | Modal Step 1 gained `modalFullName`/`modalPhone`/`modalServiceNeeded`, same copy and enum order as the mini-form. `buildEstimatePayload()`, `validateModalStep(1)`, `buildReviewSummary()`, and `showSubmissionError()` repointed at the new ids — verified twice, once by static check and once by actually running the real script against a mocked DOM and inspecting the captured submission payload (`simulateEstimateFlow.js`), both proven to catch the defect by injecting it first. |
| Git remote pointed at the old repository name | confirmed resolved 2026-08-13 | `origin` now reads `.../client_BluegridLandSolutions.git`. Fixed outside any session recorded here — worth knowing this repo isn't the only place things change. |
| Whether the estimate pipeline actually works end to end | reported 2026-08-13 by Aron, not independently verified | A real submission reached the Sheet; the owner notification reached a test recipient with correct field data. Surfaced, not resolved: the photo attached to that lead was not actually accessible — see item 24, promoted to high priority the same day. |
| Submitted photos were never uploaded anywhere | 2026-08-13 | The browser held the files in memory, animated a progress bar off a timer, and dropped them on submit; `photoUrls` was hardcoded `[]`. Now each photo is downscaled client-side and POSTed to `leads.addPhotos` **before** `leads.create`, stored one folder per lead in Drive, and linked from both the sheet and the owner's email. `leads.create` reads the folder itself rather than accepting URLs from the client, so a forged POST cannot put an arbitrary link in the owner's inbox. |
| The progress bar was a lie | 2026-08-13 | `simulateUploadProgress()` filled every bar to 100% on a 160ms timer whether or not anything was being sent — it is what let a visitor believe photos had uploaded when nothing had left the browser. Deleted; progress is now driven by the upload, and a failed photo says so in the preview. |
| One identifier doing two incompatible jobs | 2026-08-13 | Split into an internal sequential `leadId` (`BG-0001`, server-assigned inside the existing lock, allocated *after* the dedupe check so a retry consumes nothing) and a customer-facing `referenceId` (the long client-minted id, now the sole dedupe key). Both columns appended per the append-only rule. Numbering derives from the sheet rather than a counter, so clearing test rows before launch is the whole reset. |
| Legacy long ids would have poisoned the new sequence | 2026-08-13 | `parseLeadNumber()` ignores anything above `MAX_SEQUENTIAL_LEAD_NUMBER`, so a `BG-1786635839698` left in the `leadId` column cannot send the next lead to `BG-1786635839699`. Proven by injecting the missing guard and confirming four checks fail. |
