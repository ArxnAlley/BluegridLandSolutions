# Project State — BlueGrid Land Solutions

**Last updated:** 2026-08-27 (second session — **owner introduction video shipped**, `_qa/` validators committed, video master archived and gitignored)
**Repository:** `c:/Dev/NuloWorkspace/ClientSites/client_BluegridLandSolutions/`
**Branch:** `main`
**Remote:** `origin` → `https://github.com/ArxnAlley/client_BluegridLandSolutions.git`
**Host:** **GitHub Pages.** See *Hosting* below.
**Last CODE commit:** `2080723` — "Footer links and devCredit fix" (author arxnalley). **34 files, +702 / −542** — the 33 pages plus `css/styleIndex.css`, carrying the footer legal-row restructure. Committed and pushed by Aron.
**Closeout commit:** `d6f36cc` — "Session closeout: footer legal row, favicon decision, Apps Script deployed" (2026-08-27). **Docs only, local, unpushed.** HEAD is the small `docs:` commit recording this hash immediately after it — a hash cannot cite itself, so this repo records it in a follow-up, as it did at `0095da0` and `7f056c4`.
**Sync:** `main` was **level with `origin/main`** before this closeout commit — verified with `git fetch` + `git rev-list --left-right --count origin/main...HEAD` → `0	0`. Not carried over from notes. Commit hashes recorded before 2026-08-15 no longer resolve — history was rewritten during the production deployment. Re-derive with `git log`, never trust a hash quoted here.
**Working tree:** **NOT clean — the owner video work is complete, verified and uncommitted.** Three tracked files modified (`js/indexJS.js`, `css/styleIndex.css`, `.gitignore`), plus new untracked production assets in `graphics/videos/` and the new `_qa/` suite. Full classification in *Uncommitted Work* below. The two untracked logo files carried by previous closeouts are still there and still deliberate — `graphics/logos/masterFavicon_BG.png` (the rejected wordmark favicon master, kept as an alternate logo concept to show Chase — see *Waiting on Client*) and `graphics/logos/TPname.png`.

## THE OWNER INTRODUCTION VIDEO IS LIVE — AND THE ROTATION WARNING WAS WRONG

**Section 2 ships Chase's video.** Three closeouts carried the instruction that
the file "arrives rotated 180 degrees and must be corrected before anything else
is done with it." **That was wrong, and following it would have shipped him
upside down.** The file carries a **-180 degree display matrix** — the pixels are
stored inverted and every browser applies the matrix on playback. Re-encoding a
rotation would have baked the fix into the pixels while leaving the matrix in
place, inverting him twice.

**Anyone replacing the video source must re-check this rather than assuming a
rotation is needed.** It is asserted in QA against an ffmpeg-decoded reference.

What ships, all in `graphics/videos/`:

| File | What it is |
|---|---|
| `chaseIntro.web.mp4` | **8,742,071 B.** Lossless `-c copy -movflags +faststart` remux of the master — `moov` moved to the front. Video and audio bitstreams hash **identically** to the master's; nothing was re-encoded. |
| `chaseIntro.poster.webp` | **640x360, 54,972 B, q88.** Frame **t=21.30s**, chosen on measurement — the sharpest his face gets in the whole 29.2s, mouth closed, square to camera. **58% lighter** than the 130,782 B excavator photograph it replaced. |
| `chaseIntro.en.vtt` | **13 cues**, transcribed from his own audio by three models. Attached as an English captions `<track>` but **deliberately NOT defaulted on** — see *Waiting on Aron*. |
| `IntroVideoFromChase.mp4` | The **9MB archival master. Gitignored and never committed.** Archived outside the repo — see *The video master* below. |

**`preload="none"`: not one byte of the video is fetched until a visitor presses
play.** Verified — 21 requests on initial load, none of them `.mp4` or `.vtt`.

**A centred play affordance was added**, because Chrome desktop draws no middle
play button and a poster of a man in a field otherwise reads as a photograph. It
is a real `<button>` covering the frame, it removes itself on the `play` event,
and it lives inside the slot that already owns the 16:9 box — **CLS 0.0008**.

**`index.html` was not touched.** The injector did the whole job, exactly as
`technicalDebt.md` item 13 predicted.

### The video master

`graphics/videos/IntroVideoFromChase.mp4` is **excluded from the repository** by
an explicit `.gitignore` rule. Nothing on the site loads it; the site is served
by GitHub Pages, so committing it would put 9MB permanently into Git history
*and* make it publicly downloadable to serve a file no page references.

- **Never committed** — `git log --all -- <path>` returns zero commits, so no
  history rewrite is needed.
- **Archived first, then ignored**, to
  `ClientSites/_archive/client_BluegridLandSolutions/video/`, verified
  byte-identical (MD5 `63f9fa5255a4840db6abbd29d5dfd950`), with a README
  recording the codec facts and the display-matrix trap.
- **The ignore rule names the single file on purpose.** Widening it to
  `graphics/videos/` would exclude the three production assets beside it and
  break Section 2. The rule carries that warning inline.
- **`technicalDebt.md` item 52 records the trade-off:** the one irreplaceable
  artifact in this project is now the one artifact version control is not
  looking after, and the archive sits on the same disk as the working copy. **An
  offsite copy is still owed.**

## THE GOOGLE-SIDE WORK IS DONE — THE PIPELINE AND THE REPO NOW AGREE

**Reported by Aron on 2026-08-27, and not verifiable from this repository.** All of it is
recorded as his report rather than asserted as confirmed fact:

- `config!notificationEmail` and `config!photoViewerEmail` in the Sheet **both confirmed as
  the real BlueGrid Gmail account.** This was the standing P0 and it is closed.
- **`config.gs` and `validation.gs` pasted into Apps Script**, and the existing deployment
  updated with **Deploy → Manage deployments → pencil → New version** — the correct path,
  which preserves the `/exec` URL all 33 forms post to.

**Consequence: production is no longer a version behind the repository.** The photo-format
narrowing to JPEG/PNG/WebP is live, and the two config constants match. Three closeouts have
opened with "Aron must do the Google-side steps"; that task is finished and should not be
looked for again.

**Still true and unchanged:** Apps Script is a hand-pasted deployment. A future commit to
`appsScript/*.gs` does not reach production on its own.

## The 2026-08-21 backlog note, kept for its detail

**Everything the previous three closeouts described as "uncommitted, unpushed, not in production" is now committed and pushed.** `90f10ec` swept the whole tree in one commit. That single change makes most of the previous header obsolete, so it has been rewritten rather than annotated.

What went live in that commit, all of it previously staged-but-unshipped:

- mobile UX pass, WebP migration, production hardening
- tablet/mobile hero estimate UX (1080px handover), process breakpoint (699px)
- favicon structural fixes, root `/favicon.ico`, `404.html`, four legal pages
- responsive image variants and the `srcset`/`sizes` install
- **this session's work** — performance fixes H1/H2/H3, both browser-QA fixes, the dev credit logo swap

**GitHub Pages deploys from `main`, so the public site is now serving `90f10ec`.** Nothing in this repository is waiting to be published.

**What did NOT ship, and cannot ship from a commit:** the Apps Script backend. `appsScript/config.gs` changed in `90f10ec` and `appsScript/validation.gs` in `c4cef24` (2026-08-15), both *after* the live deployment. Apps Script is pasted by hand — a commit does not reach it. See *Waiting on Aron*.

**Also verified at closeout:** `graphics/marketingAssets/` was correctly excluded by `.gitignore` — zero marketing PNGs are in `90f10ec`, and all six are still on disk locally. `docs/sessionCloseout.md` remains untracked.

## Hosting — decided and recorded 2026-08-18

**This site is hosted on GitHub Pages, and that is the intended host.** The
evidence is in the repository: a `CNAME` file (the Pages custom-domain
mechanism) and no Netlify configuration of any kind — no `netlify.toml`, no
`_redirects`, no `_headers`.

Two behaviours the rest of this document depends on:

- **`www` → apex is handled by Pages**, not by a config file. Verified live.
  If the host is ever changed, that redirect must be reimplemented or every
  canonical on the site starts disagreeing with the served URL.
- **`404.html` is served for a miss at any depth *without* a redirect**, with
  the browser's base URL still pointing at the missing directory. This is why
  every path in `404.html` is root-absolute and must stay that way.

**No migration is planned or in progress.**

## THE SITE IS LIVE

`bluegridlandsolutions.com` is serving, the Apps Script is deployed, and the
full estimate-with-photos path has been **verified end to end in production by
a public visitor in an incognito browser** — see the 2026-08-15 journal entry.
Several older sections below still describe the pre-launch world; where this
header and a later section disagree, this header is right.

> Source of truth for resuming work. Only verified, completed work is recorded here.
> Read this file first. `engineeringJournal.md` has the reasoning; `technicalDebt.md` has what is knowingly deferred.
> **The last section of this file is where the next session starts.**

**Scope note:** BlueGrid is a Nulo Studio *website + lead-capture* client. It receives the static site, the Google Apps Script lead pipeline, and the reusable front-end systems described below. It does **not** receive NuloOS, the NuloEdge dashboard shell, or any platform product.

---

## Current Phase

**SHIPPED. The repository side is finished and published.**

Hardening, the performance pass and the representative browser QA are all
complete, committed and pushed. The working tree is clean and there is no
staged-but-unshipped work left anywhere in this repository.

**The Google-side steps are DONE** (Aron, 2026-08-27 — the config tab confirmed,
`config.gs` and `validation.gs` pasted, deployment updated with New version).
What remains between here and handing the site to Chase is **not repository
work**, with one exception:

1. **Chase's intro video** — the one real content task left, and it is waiting
   on him to email the file. See *NEXT SESSION SHOULD START HERE*.
2. **The Chase review** — he has still never seen the site end to end.
3. **Search Console** — property verification and sitemap submission.
4. **Google Business Profile verification, and the Bing postcard/PIN** — both
   external, client-side, and unresolved as far as this repository knows.

**Three consecutive closeouts opened with "resolve the working tree" and the
ones after them with "Aron must do the Google-side steps". Both are finished.
Do not go looking for either again.**

**Historical note (superseded):** the line below described the state at the
2026-08-15 closeout and is kept because the phase table under it is still
accurate.

**LAUNCHED. Between phases, working tree clean.**

`bluegridlandsolutions.com` is live, the Apps Script is deployed, and the full estimate-with-photos path was verified in production on 2026-08-15 by a public visitor in an incognito browser.

~~**The repository is one Apps Script version ahead of production.**~~ **RESOLVED 2026-08-27.** Aron pasted `config.gs` and `validation.gs` and updated the deployment with New version. The repo and production now run the same code, and the JPEG/PNG/WebP photo-format policy is live.

| Phase | State |
|---|---|
| Phase 1 — Website completion | Complete |
| Phase 2A — Lead capture infrastructure | Complete |
| Phase 2B — Service area pages, first wave | Complete (6 of 13 cities) |
| Phase 2C — Hero mobile refinement | Complete |
| Phase 2D — Live Apps Script backend | **Complete — lead capture is live** |
| Header navigation polish + tokenization | Complete |
| Navigation & content expansion (FAQ hub, Insights) | Complete |
| Launch polish — services mega menu, hero typing performance | Complete |
| Process section — dark board, arrowheads, sequenced reveal | Complete |
| Mega menu design system — all four panels | Complete |
| Merge to `main` + push | Complete |
| Repository / GBP asset housekeeping | Complete |
| **Our Company nav item + mega panel** | **Complete** |
| **Company page (`company/index.html`)** | **Complete** |
| **Process animation — two-phase (reveal once, arrows loop)** | **Complete** |
| **Process responsive handover + header breakpoints** | **Complete** |
| **Primary logo migration** | **Complete** |
| **Site-wide copy cleanup (dashes, spelling)** | **Complete** |
| **On-page SEO sweep (headings, intent map, schema)** | **Complete** |
| **Mobile floating CTA — bottom edge clipping** | **Complete** |
| **Estimate CTA arrival fix + notification config restore** | Complete, **superseded same day** — see below |
| **Estimate CTAs open the modal directly** | **Complete** |
| **Project photos renamed with locations + references repaired** | **Complete** |
| **Live end-to-end lead test** (Aron, test recipient) | Superseded by the production acceptance test below |
| **Session closeout SOP** (`docs/sessionCloseout.md`, gitignored) | **Complete** |
| **Photo storage — Drive upload, links in the Sheet and owner email** | **Complete and verified in production** |
| **Lead identifier split — internal `leadId` + customer `referenceId`** | **Complete and verified in production** |
| **P0 SEO — service-area hub, 3 verified-proof town pages, robots, sitemap** | **Complete** |

| **Drive access — `rootInherited`, root-folder Viewer inheritance** | **Complete; boundary verified from an external Google account** |
| **Photo upload hardening — content signatures, caps, throttle** | **Complete in repo; production one version behind** |
| **Production launch + public acceptance test** | **Complete 2026-08-15** |
| **Local performance audit — mobile + desktop baseline** | **Complete 2026-08-20** |
| **Performance fixes H1/H2/H3** (favicon SVG link, after-plate priority, hero LCP gate) | **Complete, shipped in `90f10ec`** |
| **Marketing assets moved to `graphics/marketingAssets/` + gitignored** | **Complete 2026-08-20** |
| **Final representative browser QA** (8 pages × 7 viewports + boundaries + functional) | **Complete 2026-08-20** |
| **Both QA defects fixed** (consent privacy link on deep 404s, footer tap target) | **Complete, shipped in `90f10ec`** |
| **Dev credit logo → `masterLogoTP240.webp`** | **Complete 2026-08-21** |
| **Whole tree committed and pushed** (`90f10ec`) | **Complete 2026-08-21 — the site is serving it** |
| **Footer legal row moved above the divider** (`2080723`) | **Complete 2026-08-27** |
| **Favicon artwork decision — mountain/tree everywhere** | **Complete 2026-08-27; deployed set restored from `HEAD`** |
| **Google-side config + Apps Script redeploy** (Aron) | **Complete 2026-08-27 — reported, not repo-verifiable** |

**No launch blockers remain, and the P0 is closed.** The Google Sheet config check and the Apps Script redeploy were both completed by Aron on 2026-08-27.

---

## Overall Objective

Take the BlueGrid Land Solutions website from "built but not launchable" to production launch:

1. ~~Repair missing functionality and broken navigation~~ — done
2. ~~Complete missing content (service pages, service area pages)~~ — done for the first wave
3. ~~Wire lead capture end to end (website → Apps Script → Sheet → owner email)~~ — done, and **verified in production 2026-08-15** with five photos from an incognito public submission.
4. Final SEO, performance, and launch validation — **domain settled; `og:image` and Search Console still outstanding.** See *NEXT SESSION SHOULD START HERE*.

---

## Current Repository Status

**112 tracked files. 28 HTML pages.** (Counted with `git ls-files` at this session's commit.)

```
index.html                  homepage
company/index.html          company page — who/what/why/how/where + proof
faq/index.html              FAQ hub — 28 questions, 6 categories
services/          (7)      forestryMulching, landClearing, brushRemoval,
                            trailCutting, stormCleanup, propertyCleanup,
                            huntingPropertyPrep
locations/        (10)      index.html (service-area hub) +
                            forestry-mulching-{ashland-ky, portsmouth-oh,
                            ironton-oh, chillicothe-oh, grayson-ky, morehead-ky,
                            minford-oh, piketon-oh, jackson-oh}
insights/          (8)      index.html + 7 articles
appsScript/        (8 .gs)  Code, routes, leads, photoStorage, validation,
                            notifications, utilities, config
                            (+ README.md, localTestRunner.js)
css/                        styleIndex.css (homepage + shared systems),
                            stylePages.css (interior pages)
js/indexJS.js               single shared script for all 28 pages
.gitignore                  see GBP assets below
robots.txt, sitemap.xml     generated from the canonicals, never hand-edited
docs/                       this file, engineeringJournal.md, technicalDebt.md,
                            seoPlan.md, servicePageArchitecture.md,
                            forestryModuleSchema.md, googleSheetArchitecture.md,
                            heroDirection/, phasePrompts/
```

### Architecture facts a new session must know

- Static site, **no build step**, pure HTML/CSS/JS per `codeStyle.md`.
- Shared chrome (header, mega panels, mobile drawer, estimate modal, footer, floating actions) is **duplicated into every page** and kept in sync by guarded one-shot Node scripts run from a scratchpad. **Those scripts are deliberately not checked in** — Phase 13 (`docs/phasePrompts/phase13ServiceAreaExpansion.md`) owns the real generator. Every one of them refuses to write unless its guards pass; that habit has caught three separate classes of defect and should be kept.
- **Two path variants.** Root pages take the canonical href; every one-level folder takes `../` + href. The Services mega panel used to be the one exception (bare siblings inside `services/`) and that exception was retired on 2026-08-07, so all three panels spell paths the same way.
- **Put any new page one level deep** so it reuses the proven one-level chrome — that is why the FAQ page is `faq/index.html` and the company page is `company/index.html`.
- **Line endings are MIXED, and the note that used to sit here was wrong.** The 2026-08-09 audit recorded "all 26 source files are CRLF"; re-measured byte by byte on 2026-08-21, that is not true:

  | File | On disk |
  |---|---|
  | `index.html`, `404.html`, all other HTML | **CRLF** |
  | `js/indexJS.js` | **CRLF** |
  | `js/consent.js` | **LF** |
  | `css/styleIndex.css` | **LF** |
  | `css/stylePages.css` | **LF** |

  `core.autocrlf` is `true`, so Git still normalises on commit — the mixture is a working-tree fact, not an index one, and it is harmless as long as nobody fights it. **The rule stands and matters more now than when it was written: a scripted edit must detect the file's own convention and preserve it, never assume CRLF.** Every script used this session did, and each one asserted the CRLF/LF counts were unchanged before writing. **Validators that match on `\n` must still normalise first** — a real bug that has bitten twice.
- The Apps Script endpoint lives in **exactly one place** — `businessConfig.estimateEndpoint` in `js/indexJS.js`. There are now **two** `fetch()` call sites (`leads.create` and `leads.addPhotos`) and both build their URL from that one constant, which `validateLeadFlow` asserts. Changing the deployment is still a one-line edit.

### Responsive breakpoints (current)

| Width | What changes |
|---|---|
| **≤1360px** | Header compact band — token overrides only (`--headerPadX`, `--headerGap`, `--headerNavGap`, `--headerNavLinkPadX`, …). `--headerCtaPadX` is pointedly absent: the primary CTA keeps its padding at every width. **1360px is `.headerInner`'s own `max-width`** — above it the inner is capped so available width never changes; below it every pixel of viewport is a pixel of header. |
| **≤1200px** | **Mobile nav switch.** `.primaryNav`, `.phoneChip` and `.headerCta` hide; hamburger appears. Header-only on purpose. |
| **≤1167px** | **Process board goes vertical.** Derived, not chosen: the board is `max-width: 1120px` inside `.sectionInner`'s 1.5rem padding, so 1168px is the narrowest viewport at which it can render at its design width. Its own query — nothing else lives here. |
| **≤1080px** | Section layouts — hero media band, services grid, intro, service-area and Facebook layouts. **No longer carries the process board.** |
| ≤640px, ≤360px | Progressive tightening. |

Header fit with the five-item nav, measured from the real font files: full spacing needs **1236px**, compact needs **1131px**. Tightest desktop width is **1201px** with **+70px** on Inter and **+11px** on a 6%-wider fallback face. Above 1360px the bar always clears by 124px.

Every header dimension is a `:root` custom property overridden in the two header queries, and all of them animate on a shared `--headerTransition` (`0.35s var(--easePremium)`), zeroed under `prefers-reduced-motion`.

### GBP marketing assets — decided 2026-08-07

- **`graphics/GBP - Services/` is intentionally local and ignored by Git** (`.gitignore:18`). It holds Google Business Profile marketing collateral — service tiles, post images — not website assets. The folder and its contents stay on disk; they are simply never offered to Git, now or for future GBP graphics dropped there.
- **`graphics/images/GBP_ForestryMulchingService.png` was intentionally removed** (commit `9237e53`). It had been swept into `235a4a3` by a broad `git add -A` rather than added deliberately: 2.6MB of repository for a file the site never loaded.
- **Verified at closeout:** zero references to `GBP_ForestryMulchingService` anywhere in the working tree, and the file is absent from `HEAD`.

---

## Verification State — 90/90 in the NEW in-repo suite; the scratchpad suites were NOT run

**READ THIS CAREFULLY, BECAUSE TWO DIFFERENT TEST SETS ARE NOW IN PLAY.**

**1. `_qa/` — new, in the repository, and it ran: 90/90.**

```
node _qa/runAll.js
```

- `verifyIntroVideo.js` — **56/56.** Loading cost, playback from a genuine click
  with no autoplay-policy override, orientation against an ffmpeg reference,
  captions, the play affordance, and responsiveness at 1440/768/390.
- `regressionPages.js` — **34/34.** All **33 pages** discovered by walking the
  repo: every one returns 200 with exactly one `h1`, zero console and page
  errors, no video bytes pulled, and **every asset every page requests
  resolves** — proven by recording each 404 the server actually serves rather
  than by trusting `fs.existsSync`, which hides casing bugs on Windows.

This is the **first validation infrastructure this project has ever
version-controlled**, and it partially addresses `technicalDebt.md` item 10i.

**2. The 28 scratchpad suites — NOT CARRIED FORWARD, NOT RUN.**

They were not present in this session's scratchpad and were not recovered.
**`validateAssets`, `validateSeo`, `validateResponsiveImages`,
`validateFooterLegalRow` and the rest have not been run against the current
working tree.** The `_qa/` suite overlaps them only partly — it does check that
every requested asset resolves, which is `validateAssets`'s core job, but it does
not cover SEO intent, schema contracts, the responsive-image ladder, or the
footer legal row.

**Do not read "90/90" as "everything passes".** It means the new suite passes.
Item 10i remains open and is now the clearest blocker to this repository being
genuinely self-checking.

**Also verified this session:** `node --check` clean on `js/indexJS.js`; CSS
braces balanced **679/679** in `styleIndex.css`; the video master re-verified
byte-identical by MD5.

### The historical scratchpad count, kept for reference

**Counting note, because the last three closeouts disagreed with each other.**
"28 validator suites + harness = 29/29" was recorded on 2026-08-21, which does
not add up against a directory holding 27 suites at the time; the harness was
being counted twice. The number above comes from `ls`, not from notes.

`node --check` clean on `js/indexJS.js`, `js/consent.js` and
`appsScript/localTestRunner.js`. CSS braces balanced — **668/668** in
`styleIndex.css` (was 667 before the footer work added `.footerLegalBar`),
126/126 in `stylePages.css`. `git diff --check` clean.

**One suite is new this session: `validateFooterLegalRow`** — 40 page/viewport
combinations in real Chrome (5 page shapes x the 8 widths 1440/1024/820/768/
600/430/390/375), asserting the legal row paints above the divider, the two
zones below it stay fully visible and non-overlapping, the row wraps without a
line ever starting with a separator, every control is hit-testable, and Cookie
Settings still reopens the consent banner. **Injection-proven**: pushing the
row below the divider and the credit past the right edge produced 95 failures
naming exactly those two defects.

**`validateAnalytics` was rewritten, not worked around.** Its footer section
asserted the old three-zone grid (`1fr auto 1fr`, legal nav between copyright
and credit) — the architecture this session deliberately replaced. It now
asserts the new contract: a `.footerLegalBar` before `.footerBottomBar`, the
nav outside `.footerBottomInner`, `1fr auto` below the divider, the legal row
sharing the footer content column, and `flex-wrap` on the nav. This is item
10i's predicted failure mode in its second form — a validator drifting out of
sync with the code it guards — and it was caught because the suite failed
rather than because anyone remembered.

**A transit incident, recorded because item 10i predicted it.** The toolchain
was carried into this session's scratchpad by copying `*.js` only, which left
`fonts/` behind. `validateHeader`, `validateInsightsSection` and
`validateMegaMenus` all died on a missing `inter600.extracted.ttf`. Nothing
was wrong with the site. **Copy the whole scratchpad, not the scripts** — the
suites depend on `fonts/`, `favaudit/`, `imgtest/` and `syntaxCheck/` too.

**Page count is 33** — 32 indexable pages plus `404.html`, which is `noindex`
and correctly excluded from the sitemap (32 `<loc>` entries). **158 tracked
files.**

**Two suites are new this session, both guarding a defect found in the browser
QA and fixed the same day:**

| Suite | What it guards |
|---|---|
| `validateConsentPrivacyLink` | The consent banner's privacy link resolves to the real privacy page from 7 real pages **and from a missing URL at any depth** — it fetches the target and checks the status, because the link is injected at runtime and no static check can see it. Also asserts real pages keep a *relative* href so `file://` still works. **Injection-proven:** it forces the old one-level derivation, observes the 404, and confirms it fails. |
| `validateFooterSocialTarget` | The footer social link is a 44×39 interactive target with a 17×17 icon and a 17px row — size, hit-testability at centre and four corners, and no overlap with a neighbouring control. |

**Six suites are new across this session, and one was rewritten:**

| Suite | What it covers |
|---|---|
| `validate404Page` | Drives real Chrome. Requests a deep missing URL, proves the error page renders styled from any depth, 3-column grid collapsing to 1, 48px touch targets, no horizontal overflow — **and that body never becomes a scroll container on 11 pages × 3 viewports, with both scroll locks still holding.** |
| `validateResponsiveImages` | Static contract (every candidate resolves at its *declared* width, explicit dimensions intact, original always the largest candidate) **plus** what Chrome actually downloads at DPR 1/2/3. |
| `validateContrast` | Every text role computed against the WCAG relative-luminance formula. |
| `validateHeroEstimateUx` | Seven viewports in Chrome: exactly one estimate system visible at each, the address field's semantics, and the typed address reaching the modal. |
| `validateFavicons` | Coverage on all 33 pages at every path depth, `.ico` frames square with a ≥48px frame, **transparency preserved** (injection-proven), SVG icons rasterise non-blank, root `/favicon.ico` byte-identical, manifest icons resolving relative to the manifest, robots.txt, schema logo/image, and a live HTTP fetch of all 8 icon URLs. |
| `validateProcessLayout` | Thirteen viewports: horizontal above the breakpoint and vertical below, no mid-word title breaks, no collision or overflow, CTA intact, the reveal sequencer still reaching 5/5 — **and that the ≥1280px computed values still equal the pre-change desktop design.** |
| `validateFollowTheWork` | **Rewritten.** Its subject section was deleted, so it now proves the *removal* stayed complete rather than asserting deleted CSS exists. |

**A real browser is now part of the toolchain** — `browserSession.js` (Chrome
over CDP, no dependencies) and `serveSite.js` (serves the repo the way GitHub
Pages does, including the no-redirect 404). Several things in this project are
not checkable any other way, and **five suites will not run without them.**

**Four suites were taught about `404.html`'s root-absolute paths** rather than
worked around: `validateAssets`, `validateSeo`, `validateMegaMenus`,
`validateEstimateCtas`. They were failing on a page that is correct.

**Three suites had their media-query parsing hardened** — `validateMobileLayout`,
`validateFloatingCta`, `validateProcessSequence` located blocks with a plain
`indexOf`, so a CSS *comment* mentioning a breakpoint made them slice the wrong
block and report confident, wrong failures. They now match a declaration at the
start of a line. See `technicalDebt.md` item 43.

---

### The pre-hardening verification table, kept for its detail

**Historical snapshot from 2026-08-18, superseded by the section above.** It read: 19 validator suites, 178/178 Apps Script harness, `runSelfTest` 9/9, page count 29. Current figures are **26 suites, 180/180, 33 pages** — the table below is kept only for the per-check detail, not for its counts.

**Six suites added since the table below was written:** `validateFollowTheWork`, `validateFrontendPhotoPolicy`, `validateAnalytics`, `validateCtaInteractions`, `validateMobileLayout`, and `simulateConsentFlow`. A **23-check upload security audit** also runs against `doPost` directly — see the 2026-08-15 journal entry.

**Independently verified 2026-08-18, not from documentation:**
- Live site: apex 200, `www` 301 → apex, `/sitemap.xml` 200, bad path returns a real 404.
- Lead endpoint: `?action=ping` returns `{"success":true,"data":{"module":"forestryModule","clientId":"bluegrid",...}}` — the pipeline is live, not merely configured.
- 0 broken internal links, 0 broken or case-mismatched assets, sitemap 29/29 with no orphans or duplicates.

**Two additions since the table below was written:** `validateFollowTheWork` (layout arithmetic against real Inter metrics) and `validateFrontendPhotoPolicy` (drives the shipped `addPhotoFiles()` in a mocked DOM). A **23-check upload security audit** also runs against `doPost` directly — see the 2026-08-15 journal entry.

| Check | Result |
|---|---|
| Internal links & assets (`validateSite`) | **28 pages, zero broken** |
| **Local assets** (`validateAssets`, new 2026-08-13) | PASS — **284 references** resolve with **exact casing**: src/href, og:image and twitter:image `content`, srcset, inline and CSS `url()`, and the asset paths in `js/indexJS.js`. Catches case-only mismatches that `fs.existsSync` hides on Windows and that 404 on GitHub Pages |
| **Mobile floating CTA** (`validateFloatingCta`) | PASS — bar sizes to content at both breakpoints (61.44px / 59.44px), touch targets 46px and 44px, `env(safe-area-inset-*)` on all three insets, bar outside `<main>` and `<footer>` on 28 pages |
| **Estimate CTA routing** (`validateEstimateCtas`, rewritten) | PASS — 131 `a[href="#estimateForm"]` anchors all call `preventDefault()` + `openEstimateModal()`; modal Step 1 carries `modalFullName`/`modalPhone`/`modalServiceNeeded` on all 28 pages with the config.gs enum order; **`buildEstimatePayload()` verified to read from the modal's fields, not the mini-form's**; mini-form untouched; no duplicate ids |
| **Estimate flow, functionally** (`simulateEstimateFlow`, new) | PASS — real `js/indexJS.js` loaded into a mocked DOM and actually driven: a direct-CTA click opens the modal with `preventDefault` observed, Step 1 genuinely rejects an empty submission, a completed flow's captured (unsent) payload matches what was typed; a mini-form Continue pre-fills Step 1 and its payload matches the mini-form's values. 25 assertions; both this and the static check proven to catch the payload-source regression by injecting it first |
| **On-page SEO** (`validateSeo`) | PASS — 28 pages: exactly one non-empty H1 each, no skipped heading levels, 28 unique titles and descriptions within budget, canonicals and breadcrumbs present, per-page-kind schema, **every FAQ schema question rendered on its page**, alt coverage, descriptive anchors, no content orphans, **zero H1 intent collisions** |
| Navigation / mobile drawer / FAQ hub / Insights | PASS on all 28 pages |
| **Mega menu system** | PASS — 28 pages × 4 panels: one shell, every row on `.megaRow`, links resolving with the right relative form per depth, no duplicate ids, `aria-controls` intact, fit 1201–1600px, height spread **24%** against a 45% gate |
| **Process sequence** | PASS — 8 pages, two-phase: Phase A exact 13-beat order, max 1 arrow bright, **5 reveals in 120s with none repeated**, **0 un-reveals ever**; Phase B **25 passes each filling 1 → 1+2 → 1+2+3 → 1+2+3+4**, peaking at all four, holding 1400ms, clearing on one tick, **0 step events throughout**, fresh pass at arrow 1 on resume; reduced motion registers nothing |
| Header width sweep 900–1600px | PASS — zero wrapping; tightest desktop **1201px at +70px** slack, **+11px on the fallback face** |
| Hero seam geometry (5 viewports) | PASS — copy ends exactly on the seam, 24px card overlap |
| Hero before/after loop (10 min simulated) | PASS — **91 cycles alternating**, 6.16–7.01s cadence |
| Hero typing profile (5 min simulated) | PASS — rendered cadence equals scheduled cadence exactly; **0 characters swallowed**, **0ms** write-to-paint |
| Lead submission contract | PASS — one endpoint behind both call sites (`leads.create`, `leads.addPhotos`), payload matches schema on all 28 pages |
| Apps Script harness | **178/178**, `runSelfTest` 9/9 — deterministic over 10 consecutive runs after the `formatDate` mock fix |
| **Photo storage + identifiers** (in the harness above) | PASS — sequential numbering with correct padding, a duplicate consuming no number, the legacy-id guard, upload idempotency, per-lead caps, MIME/size/reference gates, path separators stripped, real links in both email bodies, and a non-destructive, idempotent migration. Nine regressions injected one at a time, every one caught |
| **Photo upload, client side** (`simulateEstimateFlow` path C) | PASS — the real uploader driven against a mocked File: bytes transmitted, filed under the same referenceId as the lead, sent **before** `leads.create`, progress moving only as the upload resolves, and a retry re-uploading nothing |
| `node --check` (indexJS, localTestRunner) | clean |
| CSS brace balance | balanced in both stylesheets |

**All validation to date is static analysis or simulation.** No session on this project has ever had a browser. See `technicalDebt.md` item 4.

---

## Completed Work (verified)

### Lead capture — Phase 2A + 2D, live
- 8 Apps Script modules (`Code`, `routes`, `leads`, `photoStorage`, `validation`, `notifications`, `utilities`, `config`), 29-column `LEADS_HEADERS`, `errorLog` sheet, honeypot `companyWebsite`, server-side dedupe on `referenceId` (`BG-\d{13}`), sequential `leadId` allocated under `LockService`, formula-injection defence. **The column count and the dedupe key both changed on 2026-08-13** — see *Lead pipeline finalization* below.
- **Production `/exec` wired and verified live** with zero side effects: `ping` returned the matching `forestryModule` / `bluegrid` / `1.0.0` identity, proving the deployed script is this repo's code; `UNKNOWN_ACTION` and `UNAUTHORIZED` behaved; a honeypot-tripped `POST leads.create` exercised the whole transport chain while the server short-circuited before writing a row or sending mail.
- **Duplicate-submit defect found and fixed** by the post-wiring review. `isLoading` was cosmetic, the button was never `disabled`, and `buildEstimatePayload()` minted a fresh `leadId` per call — a double-tap would have sent two payloads with two ids the server's dedupe could not collapse (two rows, two owner emails, two auto-replies, double MailApp quota). Fixed with an in-flight lock, a genuinely disabled button, release on all three terminal paths, and a `leadId` held stable for the page load so a retry collapses into the original row.
- `text/plain` POST transport is deliberate — Apps Script web apps cannot answer a CORS preflight.

### Location pages — Phase 2B
6 pages, rows 1–6 of the `seoPlan.md` table. Local intent block, four-tile fact grid, terrain write-up, "what landowners here call us about" cards, all 7 services linked with localized anchor text, **5 unique local FAQs** each, estimate form with `serviceNeeded` preselected, nearby-communities block. **Uniqueness enforced mechanically:** worst pairwise 5-word-phrase overlap **14.7%** against a 25% gate; 1,133–1,283 body words each. Rowan County was added to `serviceRegions`, `LocalBusiness` `areaServed`, the map panel and both copies of the county FAQ answer — Morehead was advertised but Rowan appeared nowhere in the coverage data.

### Hero — media and typing
- **Media decoupled from section height.** `.heroMedia` was `inset: 0`, so on mobile the photo stretched to cover the doubled section. Now pinned top-only with `height: var(--heroMediaHeight)` (`100lvh`, `100vh` fallback); one property drives the media band, the copy block and the estimate band. `.heroSection::after` gives the estimate area its own background in the colour the photo fades into; the card rides 24px over the seam.
- **Before/after loop fixed at the cause.** The reverse dissolve was fire-and-forget with an 1800ms cleanup timer while the loop moved on after 220ms, so a stale cleanup stripped the next cycle's `isRevealed` mid-sweep. Now awaited. The forward sweep gained an `error` fallback so a failed image cannot strand the loop.
- **Typing profiled, then optimized.** Three measured causes: one `setTimeout` per character writing into `.textContent` (8.5ms mean write-to-paint, and two writes could land in one frame with the second erasing the first); a schedule asking for cadences the display cannot express (+24% jitter at 60Hz, +31% under load); and `.heroHeadline` losing its compositing layer at t=2200ms — roughly the sixteenth character of the first phrase — after which every keystroke re-rastered **655k pixels of hero photograph, 8.0 megapixels/second**.
  Fixes: commits inside `requestAnimationFrame`, deadlines chained from the frame that served the previous commit, a cached `Text` node mutated via `nodeValue`, strings pre-computed outside the frame callback, and `.heroTypedLine` holding its own compositing layer (zeroed under reduced motion). Result: jitter added by the render step **0%**, write-to-paint **0ms**, text-node rebuilds 873 → 18, timers 939 → 139. `heroDuetConfig` untouched.
  **Frame-counting was rejected and the rejection verified** — 0.1ms smoother at 60Hz but exactly double speed on a 120Hz panel (40.5ms vs 81.8ms mean).

### Header — responsive architecture
Measured with the real Inter/Rokkitt font metrics (TTF extracted from the EOT wrapper; `head`/`hhea`/`hmtx`/`cmap` parsed). The full-spacing header needed 1207px while the mobile switch sat at 1080px — a 126px band where the desktop nav was live and could not fit. **101px of tightening**, then the **switch moved 1080 → 1150px**; the compact band starts at 1280px, above the wrap point, so crossing it makes the bar roomier rather than tighter. Then tokenized: twelve `:root` properties, both queries reduced to token overrides, one shared transition curve.

### FAQ hub — `faq/index.html`
28 questions in 6 categories, jump-link grid, per-question anchors, `FAQPage` schema, cross-links to all 7 service pages. **All 28 are new** — the site already had 75 FAQs and `seoPlan.md` bans duplicates, so the hub took the uncovered ground.

### Insights hub — `insights/`
Landing page + 7 articles, 550–900 body words each, worst pairwise overlap **0.3%**. No dates anywhere, by instruction. Hero images are real job photos standing in, all `TODO:`-marked.

### Mega menu design system — **reuse this, do not build another**

All four panels — **Services**, **Service Areas**, **FAQ**, **Our Company** — are built from one shared architecture. Each of these is declared **once**, and `validateMegaMenus` asserts it:

| Part | Role |
|---|---|
| `.megaPanel` | The shell: width `min(760px, 100vw - 3rem)`, padding, radius, surface, border, shadow, top-edge highlight, open/close transition, and the transparent `::before` band that bridges the 14px gap to the toggle |
| `.megaFeature` | The featured card that opens every panel — icon tile, eyebrow, display-face title, supporting line, cue with a sliding arrow |
| `.megaBody` | The region under the feature: divider and rhythm |
| `.megaRow` | The row primitive — padding, radius, hover tint, and the sky rule that grows down the leading edge |
| `.megaGroup` / `.megaGroupHeading` / `.megaGroupIcon` | One labelled-group treatment |
| `--mega*` (9 tokens) | Surface, shadow, top edge, rule, row radius, hover tint, label and copy colours |

Panels are `class="megaPanel"` with unique ids — the per-panel modifier classes were retired; `aria-controls` already used the id. Positioning resolves against **`.primaryNav`**, not `.navItem`, so all three land on the same rectangle and switching nav items swaps one panel's contents instead of sliding three.

Internals differ by content, and should:
- **Services** — featured Forestry Mulching, then six services in three labelled groups of two (Clearing & Site Prep / Access & Habitat / Cleanup & Recovery).
- **Service Areas** — featured *Where We Work*, then two regions whose 13 towns flow down two sub-columns each; a pin sits on each region heading, not on every town.
- **FAQ** — featured *Questions We Get Every Week*, then the six highest-intent questions with one-sentence previews. The full library stays on the FAQ page.
- **Our Company** — featured *Built for the Land. Run by the Owner.*, then six rows in two labelled groups (*The Company* / *How We Work*). 414px tall against its siblings' 392/392/486.

**Any future mega menu must be built on these parts.** Adding an independent system is the specific thing this architecture exists to prevent — and Our Company is the proof it works: it needed **zero JavaScript** (`indexJS.js` drives `.navItem.hasMegaMenu` generically) and **zero new CSS rules**. The company row classes joined the existing services selector groups — `.megaServicesList, .megaCompanyList` and so on — so there is one declaration under two names and the two panels cannot drift apart.

### Process section — current state
A centred dark board (`.processBoard`, max-width 1120px) floating on the white section, steps inside it, **arrowheads only** between steps (no connecting rule), CTA below. Homepage runs 5 steps; the 7 service pages run 4. Nothing assumes a count — arrows are always steps − 1. Flex layout replaced a grid hardcoded to `repeat(5, 1fr)`, under which seven of the eight pages had been rendering with an empty fifth column.

**Animation — two phases, and the states only move forward:**

```
'idle'  ->  'revealing'  ->  'looping'
```

- **Phase A** runs **once per page view**, 6.08s at five steps: step reveals → arrow flashes → arrow dims → next step. The next step is revealed from *inside* its arrow's dim callback, so a step cannot appear before its arrow has finished. When it ends, every step is revealed and **stays revealed for the rest of the page view**.
- **Phase B** is arrows only, forever, and the highlight **accumulates** rather than travelling: arrow 1 lights and stays lit, then 1+2, then 1+2+3, then all four; a **1400ms hold** with the row full; then all four clear on a single tick; then a 900ms pause and it begins again. **3.56s per pass.** It cannot touch a step because it never references one.

  Accumulating rather than travelling is the point: the row fills and empties, which reads as the whole progression completing over and over, rather than as a single point chasing along it. Phase A is still a travelling flash — each arrow dims before the next step lands — so the two phases deliberately do not share a beat function.

There is no transition back to `'idle'`, which is what makes "Phase A runs once" a property of the machine rather than of its timing. `resetBoard()` is gone.

Phase A is deliberately **uninterruptible** once started — seven seconds, once, and stopping it half way would either lose the steps already up or replay them. Only Phase B answers to visibility: it pauses off screen and on a hidden tab, and resumes without disturbing a step. Reduced motion shows everything immediately and registers no observer and no timers.

**One trap worth knowing.** `.processArrow.isActive` and `.isResting` carry equal specificity, so an arrow holding both renders as whichever is declared later — `isResting`, meaning the arrow never appears to light at all. Exactly two functions touch those classes — `flashArrow()` for Phase A and `lightArrow()` for Phase B — and **both must remove one before adding the other**. Phase B lights arrows that are already resting, so a missing removal there would show up as a row that never brightens. Both files say so in comments, and the validator asserts the ordering in each function.

**Responsive:** horizontal five-across down to **1168px**, vertical below. That number is `1120px` (board `max-width`) + `2 × 1.5rem` (section padding) — the narrowest viewport at which the board can be the size it was designed at. See the note in `technicalDebt.md` on why the reported clipping never reproduced.

### Primary logo — migrated 2026-08-11

The header badge is **`graphics/logos/web/bluegridMark290.png`**, derived from the client's `circleBG_logo.png`. Chosen on measurement:

| Asset | Measured | Verdict |
|---|---|---|
| `circleBG_logo.png` | 290×290, **alpha mean 0.785** — that is π/4, a circle inscribed in a square, the same silhouette as the badge it replaces, transparent outside the circle | **Primary site logo.** Legible at 50–69px because it carries no arc tagline |
| `newBG_logo.png` | 1200×1200, **alpha mean 1.0 — fully opaque**, white corners, content only in the middle band | **Not the header.** It would render as a white box, and its tagline would land near 4px. Kept for white-background contexts: Open Graph, GBP, print |

76 references across 24 pages. Every rendered size is covered (header 50–69px, footer 120px, Facebook fallback 76px, post avatar 38px). Both marks are 1:1 and the rendered sizes are CSS-driven, so **the migration cannot shift layout**. One 45KB file replaces 215KB + 57KB.

**This retires the FORESTRV misspelling from the website** (was `technicalDebt` item 2). The typo exists only on the old badge's arc text, which the new mark does not have. The client's original badge files stay on disk. **Favicons are a different mark entirely** — a simplified tree circle, not the badge — and were correctly left alone.

### Copy cleanup — 2026-08-11

**447 em dashes across 24 pages** was the specific thing making the writing read as machine-generated. 440 rewritten by hand through 215 context-anchored rules, each replaced with the punctuation the sentence actually wanted: a period where the clause stands alone, a comma for an aside, a colon before a list. Sentences were rewritten where removing the dash left the grammar awkward.

**Deliberately preserved:** compound words (`owner-operated`, `side-by-side`, `right-of-way`, `two-track`), numeric ranges, and the single en dash in the `1–2 day` statistic, which is correct typography for a range. That en dash is the only one left on the site and its survival is a decision, not an oversight.

**The structured data had to move with the copy.** The FAQ answers and service descriptions exist twice — rendered and inside `application/ld+json`. The first pass protected every `<script>` block, which left schema disagreeing with visible copy, and **Google requires FAQPage answers to match the rendered text**. 61 further replacements were applied there, with every block re-parsed and its key set compared before writing.

Also corrected: **British spellings mixed inconsistently with American ones** on a US local business site (`organisation`, `mobilisation`, `favourite`, `neighbour`, `destabilising`, `tyres`, `smouldering`).

### On-page SEO — 2026-08-11

**The intent map now lives in `seoPlan.md`** and is the anti-cannibalisation contract: one page per intent, with terms deliberately assigned or deliberately unowned. `validateSeo` enforces it by stripping brand and geography from every H1 and failing if two pages collide.

**36 H2s** moved from brand flourishes to real topics, because the site's own Content Guideline 2 required it and the service pages were not following it. The voice was not lost: every one of those sections already carries a `.sectionKicker` above the heading, so the topic could move into the H2 without flattening the page.

**Four H1s fixed:**

- **Homepage.** The crawlable H1 was `Take Back` (the visible fixed word) plus `Take back your property.` (the screen-reader fallback) — duplicated, and carrying no service or geography. The fallback now completes the visible phrase rather than repeating it. **`aria-hidden` was tried first and rejected**: it removes text from the accessibility tree but *not* from indexing, so it fixed the wrong problem.
- **FAQ hub** — `Frequently Asked Questions` → `Forestry Mulching & Land Clearing FAQs`.
- **Company** — the brand line moved out of the H1 and stays where it earns its keep, in the Our Company mega panel.
- **Property Cleanup** — "Across the Ohio River Corridor" is a place, not a search.

**Three FAQPage schema questions did not match the rendered copy.** In all three the schema wording was the better search phrasing, so the rendered question moved to match the schema rather than the reverse.

**The company page was a content orphan** — reachable only from nav and footer, which passes no topical relevance. Three editorial links added from the homepage owner section, the FAQ hub intro, and the Insights lede.

### Mobile floating CTA — fixed 2026-08-11

The sticky Call Now / Free Estimate bar was cropped along its bottom edge on mobile. **The cause was a box-model contradiction, not a positioning or safe-area problem.**

`.mobileFloatingActions` declared a fixed `height` while also carrying padding and a border. `box-sizing` is `border-box` globally, so that height is the *outer* box:

| | Declared | Padding + border | Content box | Buttons | Overflow |
|---|---|---|---|---|---|
| ≤640px | 60px | 13.44 + 2 | **44.56px** | 46px | **1.44px** |
| ≤360px | 58px | 13.44 + 2 | **42.56px** | 44px | **1.44px** |

With `align-items: center` the surplus splits evenly, so each button sat **0.72px past the top and bottom** of the content box. The bar sets no `overflow`, so the buttons painted over its 1px border — and they are `border-radius: 999px` pills on a 24px-radius container, so at the bottom corners the pill edge crossed the border on a different curve. That is what read as the bottom edge and rounded corners being cropped.

**Fix: the fixed heights are gone and the bar derives its height from its content**, so the box and its buttons can never disagree again. The bar is now 61.44px and 59.44px, 1.44px taller than the values replaced, which is not a visible change.

**Deliberately unchanged:** the radius, the shadow, the colours, the scroll trigger, and the insets — `bottom: calc(0.85rem + env(safe-area-inset-bottom, 0px))` and `left`/`right: max(1rem, env(safe-area-inset-*, 0px))` were already correct, which is why an arbitrary pixel offset would have hidden the real bug. Touch targets stay at 46px and 44px, both at or above the 44px minimum.

### Estimate CTA arrival + notification config restore — 2026-08-11, **superseded same day**

**"Get My Free Estimate" was reported as reading broken on the homepage — clicking it "only moves/slides slightly."** Audited all 227 estimate/quote-labeled anchors on 24 pages: every one resolves to the bare `#estimateForm` fragment, never cross-page, never path-prefixed. **This ruled out the routing bug the report assumed.** There is no separate "estimate page" — each page carries its own self-contained mini-form (`id="estimateForm"`) that opens the five-step modal on submit, which is the correct, already-consistent architecture.

**Root cause: the CTA and its target can already share one screen.** `.heroSection` is `min-height: 100svh`; `.estimateFormCard` sits inside that same section beside `.heroContent` in a two-column grid (`align-self: end` pins it low, near the CTA and the hero stats). On a typical desktop viewport both are already visible, so the browser's anchor scroll — completely correct — is a few pixels or zero.

**First fix: arrival feedback, not a redesign.** Every `a[href="#estimateForm"]` focused `#fullName` on click instead of scrolling further. **Real browser QA showed this was not the requested behavior** — see the next section for what replaced it.

**Separately: `appsScript/config.gs` held an uncommitted `DEFAULT_NOTIFICATION_EMAIL = 'admin@nulostudio.com'`.** `git log --all -p` shows only `Bluegridls@gmail.com` was ever committed — this was working-tree drift, not a shipped regression. `appsScript/localTestRunner.js`'s own guard (`no recipient anywhere is admin@nulostudio.com`) caught it the moment the harness ran. Reverted; the file now matches `HEAD` exactly. **The live Apps Script deployment is a separately pasted copy** (per `appsScript/README.md`) and is unaffected either way by this repo-side fix; normal submissions are governed by the Sheet's `notificationEmail`, confirmed at `Bluegridls@gmail.com`. This part of the fix stands — it was not superseded.

Debt recorded: `technicalDebt.md` item 10l — nothing currently stops this class of drift from being committed, since the toolchain that catches it (item 10i) lives outside the repo and has no pre-commit hook to run it.

### Estimate CTAs open the modal directly — 2026-08-11

**The scroll-and-focus fix above did not solve the reported problem.** The actual requirement: every true estimate CTA opens the modal directly, no anchor jump, no page movement at all.

**That could not be done safely as first specified.** Audited `openEstimateModal()` and the modal markup: its 5 steps never ask for Full Name, Phone, or Service Needed — only the mini-form does, and `buildEstimatePayload()` read them from the mini-form's own elements. `appsScript/config.gs` hard-requires all three server-side (`REQUIRED_CREATE_FIELDS`). Opening the modal directly with no way to enter them meant every submission through these CTAs would fail server-side validation, with the error pointing at fields the visitor was never shown — they live outside the modal. That is a direct conflict between "open the modal directly" and "preserve all existing... submission behavior" / "do not redesign anything," both explicitly required. Surfaced it and asked rather than guessing; the chosen resolution was to add the three fields to the modal.

**What shipped:** modal Step 1 gained `modalFullName` / `modalPhone` / `modalServiceNeeded` — same labels, same copy, same validators, same `serviceNeeded` enum order as the mini-form (checked against `appsScript/config.gs` before writing anything). The step heading, "Where's the property?", was left exactly as-is per instruction not to touch copy — recorded as a known trade-off in `technicalDebt.md` item 10m, not hidden. The mini-form is completely untouched — same fields, same ids, same validation, Continue still `type="submit"` — and now calls one new function, `copyMiniFormIntoModal()`, right before opening the modal, so "Continue... with the entered data" is literally true.

Every `a[href="#estimateForm"]` (131 anchors, one shared script) now calls `preventDefault()` + `openEstimateModal()`. **The change that mattered most:** `buildEstimatePayload()`, `validateModalStep(1)`, `buildReviewSummary()`, and `showSubmissionError()` were all repointed at the modal's own fields — leaving even one reading the mini-form's ids would have silently sent a blank name or phone for every direct-CTA visitor. `openEstimateModal()` itself is untouched: `currentModalStep` already starts at 1, and the existing "resume where you left off" behavior for a reopened, partially-filled modal was deliberately preserved rather than force-reset.

**Validated two ways.** `validateEstimateCtas.js` was rewritten (its prior version asserted the opposite architecture and would have passed a broken build). New `simulateEstimateFlow.js` goes further: it loads the real `js/indexJS.js` into a hand-built DOM mock and actually drives both the direct-CTA path and the mini-form-Continue path through to a captured, never-sent submission payload — 25 assertions against real execution, not string matching. Both were proven to have teeth by injecting the payload-source regression and confirming each caught it independently before restoring the file.

### Live lead test — reported by Aron, 2026-08-13

**Not independently verified by this session** — this repository has no access to the live Google Sheet, the test inbox, or the Apps Script execution log. Recorded as Aron reported it, because it is real project truth and drives the next session's priority, but flagged clearly as unverified-by-repo rather than confirmed.

Aron reports:
- A real submission through the live site reached the `BlueGrid Leads` Sheet.
- The owner notification reached the temporary test recipient (the Sheet's `config!notificationEmail` was pointed at a test address for this — see *Waiting on Aron* below for restoring it to Chase's address before any further real submissions).
- Lead field data (name, phone, service, etc.) arrived correctly in that notification.
- A photo was attached to the submission and its **filename** was recognized and reported in the notification — matching exactly what the code guarantees today (`appsScript/notifications.gs`: *"photos are not uploaded yet — reply or text the customer to request them"*). **The owner could not actually access the photo.** This is not a new defect; `photoUrls` has always stayed `[]` (`technicalDebt.md` item 24, pre-existing since Phase 1). The live test is what makes it a felt, urgent gap rather than a documented theoretical one — see the resume task below.

### Project photos renamed with locations — 2026-08-13

Aron renamed ten project photos in `graphics/images/` to carry their confirmed locations (Minford OH, Piketon OH, Jackson OH), which broke **75 references across 24 files**. All repaired.

**The mapping was established by content hash, not by name similarity** — each old name's blob in `HEAD` was hashed and matched byte-for-byte against a file on disk. All ten matched exactly. That mattered: `after.JPG`, `hero_after.jpg` and `afterForestryMulching_minfordOH.jpg` are three different photographs whose names all contain "after", and name-matching would eventually have repointed a reference at the wrong image.

Four files on disk match no blob in `HEAD` — they are **new photos**, not renames, and nothing references them. Documented as orphans in `technicalDebt.md` item 22 rather than placed on pages, since which photo belongs where is an editorial decision.

**Doc references were split by kind.** `heroSpecification.md` (names the hero source plates) and `technicalDebt.md` item 22 (names the orphan) are operational and were updated with a "renamed from" note. `engineeringJournal.md` and this file's own merge history describe *past* renames as narrative and were deliberately left alone — rewriting them would falsify the record.

**A new validator came out of it.** `validateAssets` covers three blind spots in `validateSite`: meta `content` image references (every location page's `og:image` is relative and was never checked), CSS/inline `url()`, and — the important one — **case-only mismatches**, which `fs.existsSync` hides on Windows and which 404 on GitHub Pages. This project has shipped that exact bug once before. 284 references now checked, up from roughly 90.

### Lead pipeline finalization — 2026-08-13

**Both defects the live test exposed are fixed in the repository. Neither is live.**

**Photos.** The root cause was worse than "upload not built": the browser held the files in memory and `simulateUploadProgress()` filled every progress bar to 100% on a timer, so the visitor watched photos "upload" that never left the page. Now each photo is downscaled client-side (1600px long edge, JPEG 0.82, EXIF orientation honoured) and POSTed to a new `leads.addPhotos` endpoint **before** `leads.create`, one request per photo so a weak rural connection loses one photo rather than the whole submission. Files land in `BlueGrid Lead Photos/<referenceId>/`, and the folder is relabelled `BG-0001 · Name · <referenceId>` once the row exists.

**`leads.create` reads that folder itself and never accepts photo URLs from the client** — otherwise a hand-crafted POST could put any link at all in front of the owner under his own website's name. The owner's email now carries a working link per photo plus one for the folder, and says plainly when an upload did not complete rather than implying the photos are somewhere.

**Identifiers.** `leadId` is now internal and sequential (`BG-0001`), assigned by the server inside the `LockService` section that already serialises writes, and **after** the dedupe check — so a retry returns the original row and consumes no number. `referenceId` is the long client-minted id, now the sole dedupe key, and the only one a customer ever sees. Both columns were appended after `lastUpdated` per the append-only rule, which is why `referenceId` sits in column AB rather than beside `leadId`.

The next number is derived from the sheet rather than a stored counter, which means **clearing the test rows before launch is the entire reset** — there is no counter to remember. A guard in `parseLeadNumber()` ignores legacy 13-digit ids so one unmigrated row cannot send the next lead to `BG-1786635839699`.

**Migration.** `previewLeadIdentifierMigration()` reports the plan and writes nothing; `migrateLeadIdentifiers()` applies it. Both share one planning function so they cannot disagree. No rows are deleted, no columns removed, no other cell touched, and running it twice is a no-op. Rows it cannot interpret are reported rather than guessed at. Nothing destructive is automated — the pre-launch reset is documented as manual steps in `appsScript/README.md`.

**Validated at the time (2026-08-13):** 12/12 validator suites and 116/116 Apps Script harness checks, with nine backend and three client regressions injected one at a time and every one confirmed caught. **Current counts are 14 suites and 178 harness checks** — see *Verification State*. The photo path has since been exercised in production; `technicalDebt.md` item 4g is narrower than it was but most page layout still has not been seen in a browser.

### Session closeout SOP

Created `docs/sessionCloseout.md` — a local, gitignored workflow document instructing any future session how to close out cleanly (inspect real repo state, update the three continuity docs, run validation, commit locally, never push automatically, hand off a compact summary). Verified four ways before writing anything else: `git status --short` does not list it, `git ls-files --error-unmatch` confirms it was never tracked, `git check-ignore -v` resolves it to the new `.gitignore` rule, and `git status --ignored` shows it with the `!!` (ignored) marker. Nothing needed removing from tracking — it was never added.

### Merge, push, and housekeeping
`phase2a-lead-capture` merged into `main` as a clean **fast-forward** (`8108f94..bc4021d`), 17 commits, 42 files, 52,050 insertions, **zero deletions**; the single rename is the Phase 2C `hero_after.JPG → after.JPG` casing fix. Full validation re-run on `main` after the merge — 12/12. Pushed `main → origin/main`. The feature branch was **not deleted** and still exists at `bc4021d`, 8 ahead of `origin/phase2a-lead-capture`. Then the GBP housekeeping commit `9237e53`.

---

## Currently In Progress

**Nothing is in flight.** The owner introduction video — the single item the last
three closeouts were waiting on — is built, verified and **uncommitted**. The
next task is a new one: the geographic SEO audit.

### Uncommitted Work — every file, classified

**Modified (tracked) — COMMIT (7):**

| File | Why |
|---|---|
| `js/indexJS.js` | Video source, poster and captions config; caption `<track>` injection; play-affordance injection; `preload` rationale rewritten now that `moov` is at the front. |
| `css/styleIndex.css` | Play-affordance styles, reduced-motion guard, and a corrected comment — the `object-fit: cover` rule's stated reason (a 4:3 stand-in poster) no longer held once the poster became a 16:9 video frame. |
| `index.html` | **Comment text only — no markup change.** The section comment was rewritten from "video-ready, here is how to activate it" to "the video is live, the figure below is the no-JS fallback, leave it alone." Carried from the first video session, not touched in the closeout. |
| `.gitignore` | Excludes the video master and `_qa/node_modules/`. |
| `docs/projectState.md` | This file. |
| `docs/engineeringJournal.md` | New top entry for the video session. |
| `docs/technicalDebt.md` | Item 13 closed, item 10i partially addressed, items 52–55 opened. |

**New (untracked) — COMMIT (11):**

| Path | Why |
|---|---|
| `graphics/videos/chaseIntro.web.mp4` | Production video. Referenced by `js/indexJS.js`. |
| `graphics/videos/chaseIntro.poster.webp` | Production poster. Referenced by `js/indexJS.js`. |
| `graphics/videos/chaseIntro.en.vtt` | Production captions. Referenced by `js/indexJS.js`. |
| `_qa/runAll.js` | Suite entry point. |
| `_qa/rangeServer.js` | Range-capable static server. Read its header before testing media. |
| `_qa/verifyIntroVideo.js` | 56 checks over the owner video. |
| `_qa/regressionPages.js` | 34 checks over all 33 pages. |
| `_qa/lib/harness.js` | Chrome discovery, reporting, orientation reference. |
| `_qa/package.json` | Declares the one dependency, `puppeteer-core`. |
| `_qa/package-lock.json` | Pins it. |
| `_qa/README.md` | How to run it, and why the folder name starts with an underscore. |

**New (untracked) — IGNORE (already ignored, listed so nobody re-adds them):**

| Path | Why |
|---|---|
| `graphics/videos/IntroVideoFromChase.mp4` | 9MB master, archived outside the repo. See above. |
| `_qa/node_modules/` | `puppeteer-core`, restored by `npm install --prefix _qa`. |

**Pre-existing and unchanged — still an open decision, not this session's work:**

| Path | Status |
|---|---|
| `graphics/logos/masterFavicon_BG.png` | Kept deliberately as an alternate logo concept to show Chase. Not an approved favicon. |
| `graphics/logos/TPname.png` | Carried untracked by previous closeouts. **Nobody has recorded what this file is for.** Worth resolving. |

**No scratch, debug, screenshot or experiment file is anywhere in the working
tree.** All throwaway tooling from this session stayed in the session scratchpad
and was deliberately not preserved — see `_qa/README.md`, *Deliberately not
preserved*.

> **DO NOT `git add -A` BLINDLY.** It would sweep in the two undecided logo
> files along with everything else. Stage the 18 intended paths explicitly, or
> add the logos to `.gitignore` first if they are meant to stay local.

**What has and has not been seen in a browser** — still the honest distinction,
and it is now better than it was:

- **Seen and verified in a real browser:** 8 representative pages across 7
  viewports (1440/1024/820/768/430/390/375) in the 2026-08-20 QA — homepage,
  a service page, a location page, an Insights article, Company, FAQ, a legal
  page and the custom 404. Plus 18 breakpoint widths, the mega menus, mobile
  drawer, estimate modal and its five-step progression, address prefill, FAQ
  accordion, consent controls, process board, hero typing and sweep, and 404
  recovery.
- **Still unseen by a human:** the remaining 25 pages' copy, and the whole site
  on real hardware. Every viewport above is Chrome device emulation, not a
  phone in someone's hand. **Chase has still never seen the site end to end.**

**Outside the repository:** nothing is outstanding. Production runs the current
Apps Script version and both config emails are confirmed, as of 2026-08-27.

---

## Final Production Hardening — the work queue

**Rewritten 2026-08-18 from the pre-launch audit.** Items 3, 4 and 5 of the
previous list are **done** — `og:image` is absolute, the stale canonical/OG
TODOs are gone, and apex-vs-`www` is verified (`www` 301s to the apex, which
is what every canonical names).

Ordered by launch impact.

**STATUS: items 0–9 are COMPLETE, validated and SHIPPED in `90f10ec`. Items
10–12 are not repository work and remain open.**

**Three further pieces of work landed after this queue was written** and are
also complete and validated — they are not part of the original queue but are
in the same uncommitted tree:

- **Tablet/mobile hero estimate UX.** The compact estimate row switched on at
  640px while the two-column hero ended at 1080px, so every tablet got the
  desktop CTAs pointing at an estimate card stacked below the fold. The switch
  now happens at 1080px, declared once. The compact field also asked for
  "address or ZIP" while writing into the modal's Property Address — now an
  address field throughout. Fixed a pre-existing 375px clipping bug on the way
  (`size="1"`, see `technicalDebt.md` item 38).
- **Favicon audit.** Structural fixes kept (root `/favicon.ico`, `mask-icon`
  removed, schema `logo`/`image` absolute, coverage verified on 33 pages). The
  artwork change was **unauthorised and has been reverted** — see item 39.
- **Process breakpoint 1167px → 699px.** The five-step row now scales via
  `clamp()` instead of collapsing, and holds down to 700px. Desktop is
  asserted unchanged at ≥1280px. See item 42.

0. ~~**Resolve the working tree.**~~ **DONE 2026-08-21.** Aron committed the whole tree as `90f10ec` "Complete" and pushed it. No commit split was made in the end — one commit carried everything. The tree is clean.

1. ~~**Replace the public email address.**~~ **DONE.** `bluegridls@gmail.com` in `businessConfig`; zero occurrences of `estimates@bluegridlandsolutions.com` anywhere in the tree.

2. ~~**Fix the three contrast tokens.**~~ **DONE** by the interrupted session. `--colorSkyDeep` `#3E7CB8`→`#356CA3`, `--colorSteel` `#7C8894`→`#68737E`. A new `validateContrast` suite computes every text role against the WCAG formula and passes.

3. ~~**Strip the TODO comments from shipped HTML.**~~ **DONE**, and extended: the sweep only covered HTML, so `robots.txt` and `sitemap.xml` were still shipping a "confirm the production domain" TODO. Both are clean, and `buildSitemap.js` now **refuses to write** if any unfinished marker appears in either output.

4. ~~**Add a custom `404.html`.**~~ **DONE.** Root-absolute throughout, `noindex`, three recovery routes, full site chrome and a working estimate modal. Verified in Chrome by requesting a deep missing URL.

5. ~~**Responsive image sizing and delivery.**~~ **DONE.** 640/1024/1280 variants with `srcset` + measured `sizes` on **75 `<img>` tags**. **41% lighter** against the pre-srcset baseline across every page and viewport measured. Format never changed; the six JPEG holdouts were not reconverted.

6. ~~**Trim over-length metadata.**~~ **DONE — and the count was wrong.** Only **two** titles were genuinely over 60 rendered characters; the other two counted `&amp;` as five characters and were already inside budget. Descriptions were already compliant.

7. ~~**Add `twitter:image`.**~~ **DONE.** All 33 pages declaring `summary_large_image` now carry exactly one `twitter:image`, matching their own `og:image`. Also fixed `privacy/index.html`, whose `og:image` still pointed at a pre-WebP `.jpg`.

8. ~~**Prune unreferenced assets.**~~ **DONE — and the ~16.2 MB figure no longer holds.** Only 6.35 MB is genuinely unreferenced. **4.34 MB removed** (`graphics/logos/oldLogo/`). Favicon masters kept as source art; `graphics/GBP - Services/` is gitignored and never deployed.

9. ~~**Confirm the host.**~~ **DONE — GitHub Pages.** Recorded under *Hosting* at the top of this file. No migration planned.

10. ~~**Aron's P0 config check**~~ — **DONE 2026-08-27.** Aron confirmed `notificationEmail` and `photoViewerEmail` in the Sheet's `config` tab both name the real BlueGrid Gmail account. Reported by Aron; not verifiable from this repository.

11. ~~**Paste the changed `.gs` files, deploy a new Apps Script version.**~~ **DONE 2026-08-27.** `config.gs` and `validation.gs` pasted, existing deployment updated via **New version** — the path that preserves the `/exec` URL. Reported by Aron; not verifiable from this repository.

12. **Page-by-page copy and browser QA.** **Still open.** The estimate flow, the uploader, the 404 page, the scrollbar fix and responsive image selection have all now been exercised in a real browser; **general layout and copy across 33 pages still has not been reviewed by a human.** Item 10m (Step 1's heading) sits here.
7. **Chase review / major revision pass** — expect a real round of change requests.
8. **Search Console** — property verification and sitemap submission.
9. **Competitor and search-intent research** — never done, and the homepage geographic decision is waiting on it. See *Open Decisions*.
10. **Lighthouse mobile + desktop** — hero images are full-resolution `2048x1536` with no `srcset`; Google Fonts loads render-blocking.
11. **Tree / brush clearing page** — `technicalDebt.md` item 3b. First-party supported by Chase's own advertising and the only advertised service with no page.
12. **Location pages rows 7-11** — Gallipolis OH, Waverly OH, Greenup KY, Louisa KY. (Jackson shipped in the P0 pass.) Build to the shipped nine, not a template.
13. **Decide West Union, OH and Flatwoods, KY** — advertised in the nav but absent from `seoPlan.md`'s 11-city table.
14. **Google Business Profile** — none exists. `docs/phasePrompts/phase6GoogleBusinessProfile.md` holds the playbook; artwork is staged in the gitignored `graphics/GBP - Services/`.
15. **Commit the validator toolchain** — `technicalDebt.md` item 10i, now the most fragile thing about how this project is worked on.

---

## Current Blockers

| # | Blocker | Impact |
|---|---|---|
| ~~1~~ | ~~**The new Apps Script is not deployed**~~ | **RESOLVED 2026-08-15.** Deployed and verified in production by a public incognito submission with five photos. |
| ~~3~~ | ~~**Production domain undecided**~~ | **RESOLVED.** `bluegridlandsolutions.com` is live. |
| ~~2~~ | ~~**`config!notificationEmail` and `photoViewerEmail`**~~ | **RESOLVED 2026-08-27.** Aron confirmed both name the real BlueGrid Gmail account. Reported, not repo-verifiable. |
| ~~4~~ | ~~**Apps Script is one version behind the repo**~~ | **RESOLVED 2026-08-27.** `config.gs` and `validation.gs` pasted and the deployment updated with New version. Repo and production now agree; the JPEG/PNG/WebP policy is live. Reported, not repo-verifiable. |
| 4 | `MODULE_API_KEY` state unknown | Cannot be checked from outside — `leads.list` returns `UNAUTHORIZED` whether the key is unset or merely not supplied. Blocks only a future dashboard, never the public form. |

---

## Deployment Handover — the exact live steps

> **HISTORICAL, as of 2026-08-15.** These steps were executed and the pipeline is live and verified in production. Kept because they document the first-deployment sequence and the reset-to-`BG-0001` procedure, which will matter again if the Sheet or the script project is ever rebuilt.
>
> **For a routine code update, the whole procedure is:** paste the changed `.gs` files → *Deploy → Manage deployments → pencil → New version → Deploy*. A **new deployment** mints a different URL and silently breaks all 28 forms.

**Everything below happens in Google, by hand. No session can do any of it, and nothing in the repo is live until it is done.** Full detail in `appsScript/README.md`; this is the ordered summary.

**Order matters: Apps Script first, website second.** The new site posts `referenceId` and uploads photos to `leads.addPhotos`. Against the old deployment, photo upload would 404 and dedupe would silently stop working on retries. The old site against the new deployment is fine — `leadId` is read as a `referenceId` fallback precisely so that window is safe.

1. **Paste the code.** Eight `.gs` files now, not seven — `photoStorage.gs` is new. Create it in the editor and paste the others over their existing contents.
2. **Redeploy correctly.** *Deploy → Manage deployments → pencil → Version: New version → Deploy.* **Never "New deployment"** — that mints a different URL and silently breaks all 28 forms.
3. **Run `setupSpreadsheet`.** Appends the two new headers and seeds `photoAccess`. Existing rows are untouched. Authorize the new Drive scope when prompted — the script now writes files, which it did not before.
4. **Run `previewLeadIdentifierMigration`,** read the Execution log, and confirm the plan looks right. It writes nothing.
5. **Run `migrateLeadIdentifiers`** to apply it. Safe to run twice.
6. **Run `runSelfTest`.** Expect eight PASS lines, including the two new ones (`identifiers`, `dedupe keeps leadId`).
7. **Confirm `config!notificationEmail`** is the address you actually want the next test to reach.
8. **Publish the website** (`js/indexJS.js` is the only file that changed).
9. **Submit a real lead with two photos** and confirm: a row with a sequential `leadId` and a long `referenceId`; photo links in the sheet and in the owner email that actually open the images; the auto-reply quoting the `referenceId` and never the sequential number; `errorLog` still empty.

**Then, before launch — starting real leads at `BG-0001`:** delete the test data rows from `leads` (the rows, not their contents, and never row 1), optionally clear `errorLog` and the test folders under `BlueGrid Lead Photos`, and confirm `notificationEmail` is Chase's address. **Sequential numbering derives from the sheet, so deleting the rows is the whole reset — there is no counter to clear.** Nothing in the code does this automatically, deliberately.

---

## Waiting on Client (Chase)

- **Price ranges.** `seoPlan.md` calls cost transparency the biggest opening in this trade. No page quotes a dollar figure because none has been approved. **Rough per-acre or per-day ranges are the single highest-value upgrade available to the location pages** and cost one conversation.
- **Confirm Rowan County / Morehead coverage.** If Chase does not work Rowan County, the Morehead page and all four data entries come back out.
- **Real project photos** — ideally before/after pairs per service, tagged by location. Would unlock galleries on all 6 location pages and replace the Insights placeholders.
- ~~**THE OWNER INTRO VIDEO**~~ — **RECEIVED AND SHIPPED 2026-08-27.** Section 2 plays his recording. The "arrives rotated 180 degrees" warning carried by three closeouts was **wrong** — it carries a display matrix the browser applies, and correcting it would have inverted him twice. See the video section near the top of this file.
- **NEW — two things about the video now need Chase:**
  - **May we name him in the captions and the player's accessible name?** Both currently say "Chase DeVore". The section heading already reads "Meet Chase DeVore, the owner behind BlueGrid", so this is consistent with what already shipped — but it is worth a confirmation, and it sits alongside the older "may we name Chase on the site?" question below.
  - **Approve the caption wording**, transcribed from his own audio. Full text in the 2026-08-27 journal entry. Includes **"bush hogging"**, which is what he says; the site's own copy says "brush hogging". Aron has ruled it stays as spoken.
- **A better owner intro can still replace it later.** The current file is what Chase could record that day; a higher-quality version is expected once better equipment is available. **Swapping the source is one config line, but the poster and the captions are welded to this take** — `chaseIntro.poster.webp` is a frame of it and every VTT timestamp refers to its audio. Both must be regenerated. Recorded as `technicalDebt.md` item 55.
- **An alternate logo concept is waiting to be shown to him.** `graphics/logos/masterFavicon_BG.png` is the circular BLUEGRID wordmark mark. It was **rejected as a favicon** on measurement (`technicalDebt.md` item 39) but kept deliberately as a possible alternate logo to put in front of Chase. **It is not an approved production favicon and must not be used as one.**
- **Badge artwork typo** — the official badge reads **"FORESTRV"**, not "FORESTRY". Off the website since 2026-08-11 (`technicalDebt.md` item 2); still wrong on any print/signage that uses the old artwork.
- ~~**Confirm phone** `(740) 464-2526`~~ — **confirmed 2026-08-13**, printed on his own advertisement (`graphics/images/whatTheyDo2.jpg`).
- ~~**Confirm business email**~~ — **RESOLVED 2026-08-18. The confirmed public business email is `bluegridls@gmail.com`.** `estimates@bluegridlandsolutions.com` is **not a confirmed mailbox** and must not remain the public-facing address. The swap is queue item 1 under *Final Production Hardening*; it has **not been made yet**.
- **Retention period for customer photographs.** `BlueGrid Lead Photos` keeps them indefinitely and nothing deletes them. Needs a decision before it becomes a quiet liability — `technicalDebt.md` item 24i.
- **The pre-launch review of the whole site** — the first time he sees it end to end, now that it is actually live.
- **Confirm the Facebook page renders in the Page Plugin** → flip `facebookPageConfigured`.
- **Google Business Profile — verification.** Outstanding as far as this repository knows; the footer icon is hidden at runtime until `googleBusinessUrl` is set. External, client-side.
- **Bing Places — the postcard / PIN verification.** Same status: external, client-side, and unresolved as far as this repository knows. Neither this nor GBP is repository work, and neither blocks anything in the codebase.
- **May we name Chase on the site?** Copy says "the owner" throughout.
- **Company facts worth adding, now that there is a page to hold them.** `company/index.html` ships using only claims that already appear elsewhere on the site. **Nothing about history, credentials, awards, certifications, years in business, or crew size is on it, and none may be added without Chase confirming it.**
- **Copy review** of the 6 location pages and 7 Insights articles.
- **The Chase review / major revision pass itself** — see *Remaining Launch Work* item 10. Expect this to generate its own list.

## Waiting on Aron

**The P0 is closed and the Google-side sequence is finished.** Reported by Aron
on 2026-08-27 and recorded as his report, because none of it can be checked
from this repository:

- ~~**P0 — confirm `notificationEmail` and `photoViewerEmail`**~~ — **DONE.**
  Both name the real BlueGrid Gmail account.
- ~~**Paste `config.gs` and `validation.gs`, redeploy**~~ — **DONE**, via
  Deploy → Manage deployments → pencil → **New version**, which preserves the
  `/exec` URL all 33 forms post to. Production and the repository now run the
  same backend code and the JPEG/PNG/WebP photo policy is live.

**The historical detail of that sequence is kept in `appsScript/README.md`**,
which is where it belongs — it will matter again if the Sheet or the script
project is ever rebuilt. It is no longer duplicated here.

**One rule survives and always will:** the two config keys stay separate on
purpose and merely hold the same address in production. The owner both receives
the leads and opens the photographs. Do not collapse them into one setting.

**Still genuinely open:**

- **NEW — decide whether to commit the video work.** It is finished, verified
  90/90, and deliberately left uncommitted. Every file and its classification is
  in *Uncommitted Work* above. Nothing else should be built on top of it until
  this is settled.
- **NEW — sign off the caption wording**, or send it to Chase. Until then the
  track stays attached but not defaulted on, which is the deliberate current
  state. Enabling it is one line. Full transcript in the 2026-08-27 journal
  entry.
- **NEW — make an offsite copy of the video master.** It is now gitignored, so
  Git is no longer protecting it, and the archive at
  `ClientSites/_archive/client_BluegridLandSolutions/video/` is on the same
  machine and the same disk as the working copy. It protects against a bad
  `git clean`, not against drive failure. `technicalDebt.md` item 52.
- **NEW — decide what `graphics/logos/TPname.png` is.** It has been carried
  untracked through several closeouts and **no document records what it is for.**
  Commit it, ignore it, or delete it.

- **Decide the homepage geographic target.** An audit was delivered 2026-08-15
  recommending the homepage stay regional; Aron has neither accepted nor
  rejected it. See *Open Decisions* below.
- **Get the remaining claims confirmed or corrected by Chase** —
  `technicalDebt.md` item 3a lists what his own advertising does and does not
  support. The two needing him: whether he can commit to any estimate
  turnaround, and whether the certificate-of-insurance sentence is accurate.
- **A real browser pass on real hardware.** 56 page/viewport combinations have
  been driven in Chrome device emulation and the estimate flow and photo
  uploader were exercised in production, but nothing has been seen on a phone
  in someone's hand.
- **Decide whether to delete `phase2a-lead-capture`.** Fully merged into
  `main`, kept deliberately.
- **Commit the validator toolchain** — `technicalDebt.md` item 10i. It cost
  three suite failures again this session (see *Verification State*), and it
  is still the most fragile thing about how this project is worked on.

---

## Open Decisions — recorded, not implemented

**1. Homepage geographic target.** Audited 2026-08-15 in response to a proposal to make Wheelersburg the homepage's primary signal. Recommendation: **keep the homepage regional.** There is no Wheelersburg page; Portsmouth already claims Wheelersburg in copy *and* FAQ schema; the homepage is the only page holding the two-state region; and `LocalBusiness` declares 12 counties with no address. The proposed eyebrow was rejected; the proposed supporting copy was approved for adding "land clearing", which is absent from the eyebrow today. **Full reasoning in the 2026-08-15 journal entry. Aron has not ruled.**

**2. Competitor and search-intent research has never been done.** It is item 9 of the old Remaining Launch Work list and remains outstanding. **There is no search-volume, keyword-difficulty or competitor data anywhere in this repository** — the only prioritisation rationale ever recorded is one unquantified line in `seoPlan.md`. Any further geographic or keyword decision is being made without it.

**3. Customer photo retention.** `BlueGrid Lead Photos` accumulates customer photographs and names indefinitely. Nothing deletes them and **nothing should be added that does** until a period is agreed with the client. `technicalDebt.md` item 24i.

**4. Whether to re-accept HEIC.** Removed 2026-08-15. Watch early live traffic for iPhone users bouncing off the on-screen instruction. Two-line reversal. `technicalDebt.md` item 24h.

---

## NEXT SESSION SHOULD START HERE

**The video is done. The next major task is the GEOGRAPHIC SEO AUDIT.**

Before anything else, note that **the working tree is dirty and the work in it is
finished and verified** — see *Uncommitted Work* above for every file and how it
should be classified. It was left uncommitted deliberately, at Aron's
instruction. **Decide whether to commit it before starting new work; do not
start the audit on top of an unreviewed tree.**

1. **Read `CLAUDE.md`, then this file, then `engineeringJournal.md` (top entry)
   and `technicalDebt.md`.** The repository is authoritative — correct stale
   documentation rather than carrying it forward. **Commit hashes recorded
   before 2026-08-15 no longer resolve.** And note the lesson from this session:
   a warning carried across three closeouts ("the video arrives rotated 180
   degrees") turned out to be wrong, and ninety seconds of `ffprobe` beat three
   sessions of notes.

2. **Verify Git state.** `git fetch` + `git rev-list --left-right --count
   origin/main...HEAD` in both directions. Expect `main`, and the uncommitted
   video and `_qa/` work described above.

3. **Establish a baseline before changing anything:**

   ```
   npm install --prefix _qa     # once, if node_modules is absent
   node _qa/runAll.js           # expect 90/90
   ```

   This is new and it is in the repository — it does not need locating in a
   scratchpad. **The 28 older validator suites still do**, and they were not run
   this session (item 10i). If they can be recovered, recover them and run them
   too; that is the honest baseline.

4. **THE MAIN TASK: the geographic SEO audit.**

   **There is an unresolved decision waiting at the front of it.** *Open
   Decisions* item 1 records an audit delivered 2026-08-15 recommending the
   homepage stay **regional** rather than target Wheelersburg specifically.
   **Aron has neither accepted nor rejected it.** Settle that first — the rest
   of the geographic work depends on which way it goes.

   **And a hard constraint on the whole exercise, from *Open Decisions* item 2:**
   **no search-volume, keyword-difficulty or competitor data exists anywhere in
   this repository.** The only prioritisation rationale ever recorded is one
   unquantified line in `seoPlan.md`. Every geographic decision to date has been
   made without it. Either gather that data or state plainly that the audit is
   reasoning from site structure alone — do not let it look quantified when it
   is not.

   Known territory the audit has to cover:

   - **West Union, OH and Flatwoods, KY are advertised in the nav but appear
     nowhere in `seoPlan.md`'s 11-city table, and have no pages.** Give them
     pages or take them out of the nav. Open since the location-pages session.
   - **9 location pages exist**; `seoPlan.md` lists 11 cities.
   - **Portsmouth already claims Wheelersburg** in copy *and* FAQ schema.
   - `LocalBusiness` declares **12 counties with no address**.
   - Item 10k: `Service` schema uses an inline provider stub on 13 pages instead
     of an `@id` reference — deliberately deferred to the domain sweep.

5. **Then the Chase review.** He has still never seen the site end to end.
   Expect it to generate its own list.

6. **External, client-side, and not repository work:** Google Business Profile
   verification and the Bing Places postcard/PIN. Both still unresolved. Neither
   blocks anything in the codebase.

7. **Two things need a human, not a session** — both recorded under *Waiting on
   Aron*: signing off the caption wording, and an offsite copy of the video
   master.

### Do NOT redo any of this

- **The owner introduction video is finished and must not be rebuilt.** The
  faststart remux, the t=21.30s poster, the play affordance and the caption
  track are approved. **Do not re-encode the video to "fix" the rotation** — it
  carries a -180 display matrix the browser applies, and re-encoding would
  invert Chase twice. Do not move the poster into `graphics/images/`; a poster
  has no `srcset` siblings. Do not enable captions by default until the wording
  is signed off.
- **Do not re-derive the poster choice.** Six candidate frames were measured on
  face sharpness and the numbers are in the journal entry. `21.30s` won on
  measurement, not taste.
- **The Google-side work is finished.** Config emails confirmed, `config.gs`
  and `validation.gs` pasted, deployment updated with New version. Three
  closeouts carried this as the P0. It is done.
- **The working tree is resolved**, and has been since `90f10ec`. Do not go
  looking for uncommitted work.
- **The favicon question is settled: the mountain/tree artwork, everywhere.**
  A second package built on the circular BLUEGRID wordmark was measured against
  it and rejected; the deployed set was restored from `HEAD` and the comparison
  folders deleted. The measurements are in `technicalDebt.md` item 39. **Do not
  reopen this without new measurements**, and do not mistake
  `graphics/logos/masterFavicon_BG.png` for an approved favicon — it is kept
  only as an alternate logo concept to show Chase.
- **The footer legal row is deliberate.** The legal links sit in
  `.footerLegalBar` **above** the divider; only the copyright and the developer
  credit are below it, on a `1fr auto` grid. Putting the links back into
  `.footerBottomInner` re-creates the defect that squeezed the credit toward
  the viewport edge. `validateFooterLegalRow` guards it in real Chrome.
- **The performance audit is done and its top three findings are fixed.**
  **Do not re-audit from scratch**; the baseline, method and remaining ranked
  items are in the 2026-08-20 journal entry and `technicalDebt.md` items
  25/36/44.
- **`favicon.svg` is no longer linked, deliberately.** It is a 307KB raster in
  an SVG wrapper — zero vector elements, one base64 `<image>` — that browsers
  preferred over the `.ico`. The file stays on disk; **do not re-add the
  `<link>`** without re-measuring.
- **The hero entrance releases per element on `transitionend`.** That is what
  un-gates LCP. **Do not "simplify" it back to the single 2200ms teardown**,
  and do not delete the 2200ms timer.
- **Responsive images are at their compression floor.** Re-verified 2026-08-21.
  **Do not "complete" the ladder.**
- **The favicon artwork, the six JPEG holdouts, the double-scrollbar fix, the
  699px process breakpoint and the root-absolute `404.html`** all still carry
  their original do-not-touch notes. They have not changed.
