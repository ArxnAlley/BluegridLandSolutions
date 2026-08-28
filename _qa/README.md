# `_qa/` — browser validation suite

Real-Chrome checks for this site. **Not part of the published site.**

```
npm install --prefix _qa      # once — pulls puppeteer-core only
node _qa/runAll.js            # boot server, run everything, report
```

Exit code is 0 when everything passes, 1 when a check fails, 2 when the
harness itself could not run.

---

## Why the folder name starts with an underscore

This repository *is* the deployed site — GitHub Pages serves whatever is
committed at the root. A folder called `qa/` would be publicly
reachable at `https://bluegridlandsolutions.com/qa/`.

There is no `.nojekyll` file here, so Pages builds the site with Jekyll,
and **Jekyll does not copy directories whose names begin with `_` into
the built site.** That is what keeps this folder out of production while
still keeping it in the repository where it is useful.

**If anyone ever adds a `.nojekyll` file, this folder starts being
served.** Nothing in here is secret — it is inert test code — but the
tidy fix at that point is to move it out of the repository root rather
than to leave it published.

> This has not been verified against a live Pages build from inside this
> repository; it rests on documented Jekyll behaviour. Worth confirming
> once against the deployed site by requesting `/_qa/runAll.js`.

## Requirements

| | |
|---|---|
| **Node** | any current LTS |
| **Chrome** | a real installed Chrome. `puppeteer-core` drives it and downloads nothing. Set `CHROME_PATH` if it is not in a standard location. |
| **ffmpeg** | on `PATH`. Used only to build the orientation reference frame for the video suite. |

## What is here

| File | Job |
|---|---|
| `runAll.js` | Entry point. Boots the server, runs both suites, tears down. |
| `rangeServer.js` | Static server **with HTTP Range support**. Read its header. |
| `verifyIntroVideo.js` | The owner-introduction video: loading cost, playback, orientation, captions, affordance, responsiveness. |
| `regressionPages.js` | Every `.html` page: errors, missing assets, shared-chrome sanity. |
| `lib/harness.js` | Chrome discovery, check reporting, orientation reference. |

## The one trap worth knowing about

**Never run these against `python -m http.server`.** It does not
implement the `Range` header, so Chrome cannot seek in a video: a
forward seek past the buffer aborts the load and resets `currentTime`
to 0.

This produced a caption failure that looked exactly like a broken
caption track and was not — the site was fine, the test server was
lying. `rangeServer.js` exists so that cannot recur, and
`verifyIntroVideo.js` asserts the seek actually landed so the symptom
can never be misread again.

## Deliberately not preserved

The video work produced a lot of one-off tooling that is **not** here on
purpose: frame-extraction and sharpness-scoring scripts for choosing the
poster, an audio transcription harness, poster-candidate previews, and
screenshot generators. They answered questions that are now answered.
Their conclusions live in `docs/engineeringJournal.md`; the scripts
themselves would only rot.

What is here is what would catch a **regression**.

## Scope, honestly

This suite covers the homepage video section thoroughly and the rest of
the site shallowly — page loads, asset resolution, script errors. It is
not a replacement for the wider validator set described in
`docs/technicalDebt.md` item 10i, most of which still lives only in
session scratchpads. It is the first part of that set to make it into
the repository.
