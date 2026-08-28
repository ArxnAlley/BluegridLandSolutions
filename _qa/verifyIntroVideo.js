/* ============================================================
   OWNER INTRODUCTION VIDEO — BROWSER SUITE

   Drives the real homepage in real Chrome and asserts the whole of
   Section 2's video behaviour. Everything here was a real question at
   some point in the build; each check is the answer being held in
   place.

   What it guards:

     - the video costs NOTHING on first paint (preload="none" means no
       .mp4 request until a visitor asks for it)
     - a genuine click on the play affordance starts playback, and the
       affordance then gets out of the way
     - Chase is the right way up — the file carries a -180 degree
       display matrix and the browser must apply it
     - the caption track parses, loads, and displays, while staying OFF
       by default
     - the frame never moves: no layout shift, no overflow, 16:9 held
       at every width

   MUST be run against _qa/rangeServer.js, not a range-less one-liner —
   see the header of that file for what happens otherwise.

   Usage:
     node _qa/runAll.js                       # preferred, boots the server
     QA_URL=http://127.0.0.1:8732/index.html node _qa/verifyIntroVideo.js
============================================================ */

const puppeteer = require('puppeteer-core');
const path = require('path');
const {
    findChrome, createReporter, buildOrientationReference,
    orientationDiff, isBenignMediaAbort
} = require('./lib/harness');

const REPO = path.resolve(__dirname, '..');
const VIDEO = path.join(REPO, 'graphics/videos/chaseIntro.web.mp4');
const URL = process.env.QA_URL || 'http://127.0.0.1:8732/index.html';

const SEEK_T = 5.0;   // where the orientation frame is sampled
const FW = 320, FH = 180;

const EXPECTED = {
    src: 'graphics/videos/chaseIntro.web.mp4',
    poster: 'graphics/videos/chaseIntro.poster.webp',
    captions: 'graphics/videos/chaseIntro.en.vtt',
    cueCount: 13,
    firstCue: 'My name is Chase.',
    lastCue: 'Thank you.',
    durationSeconds: 29.2,
    width: 1280,
    height: 720
};

async function run() {
    const { check, summary } = createReporter();
    const REF = buildOrientationReference(VIDEO, SEEK_T, FW, FH);

    const browser = await puppeteer.launch({
        executablePath: findChrome(),
        headless: 'new',
        // deliberately NO --autoplay-policy override: playback has to be
        // earned by a real user gesture, the way a visitor earns it.
        args: ['--mute-audio', '--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

        const requests = [];
        const consoleErrors = [];
        const pageErrors = [];
        const failedRequests = [];
        page.on('request', r => requests.push(r.url()));
        page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
        page.on('pageerror', e => pageErrors.push(e.message));
        page.on('requestfailed', r =>
            failedRequests.push(r.url() + ' :: ' + (r.failure() && r.failure().errorText)));

        await page.evaluateOnNewDocument(() => {
            window.__cls = 0;
            new PerformanceObserver(list => {
                for (const e of list.getEntries()) {
                    if (!e.hadRecentInput) window.__cls += e.value;
                }
            }).observe({ type: 'layout-shift', buffered: true });
        });

        await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2500));

        // ── 1. costs nothing on load ──
        const mp4OnLoad = requests.filter(u => /\.mp4(\?|$)/i.test(u));
        const vttOnLoad = requests.filter(u => /\.vtt(\?|$)/i.test(u));
        check('No MP4 request on initial page load', mp4OnLoad.length === 0,
            mp4OnLoad.join(', ') || requests.length + ' requests, none of them .mp4');
        check('No VTT request on load either (captions not defaulted on)',
            vttOnLoad.length === 0, vttOnLoad.join(', ') || 'none');

        // ── 2. the injected player ──
        const el = await page.evaluate(() => {
            const slot = document.getElementById('introMediaSlot');
            const v = slot && slot.querySelector('video');
            if (!v) return { found: false };
            return {
                found: true,
                src: v.getAttribute('src'),
                poster: v.getAttribute('poster'),
                preload: v.preload,
                controls: v.controls,
                playsinline: v.hasAttribute('playsinline'),
                ariaLabel: v.getAttribute('aria-label'),
                tracks: Array.from(v.querySelectorAll('track')).map(t => ({
                    kind: t.kind, srclang: t.srclang, label: t.label,
                    src: t.getAttribute('src'), isDefault: t.default
                })),
                figureRemoved: !slot.querySelector('figure'),
                readyState: v.readyState
            };
        });
        check('Player injected into #introMediaSlot', el.found);
        check('src is the faststart web copy', el.src === EXPECTED.src, el.src);
        check('poster is the Chase frame', el.poster === EXPECTED.poster, el.poster);
        check('preload is "none"', el.preload === 'none', 'preload=' + el.preload);
        check('controls enabled', el.controls === true);
        check('playsinline set', el.playsinline === true);
        check('video has an accessible name', !!el.ariaLabel, el.ariaLabel);
        check('no-JS fallback figure was replaced', el.figureRemoved === true);
        check('one English captions track, present but NOT defaulted on',
            el.tracks.length === 1 && el.tracks[0].kind === 'captions'
            && el.tracks[0].srclang === 'en'
            && el.tracks[0].src === EXPECTED.captions
            && el.tracks[0].isDefault === false,
            JSON.stringify(el.tracks));
        check('nothing buffered before interaction (readyState 0)',
            el.readyState === 0, 'readyState=' + el.readyState);

        // ── 3. the play affordance ──
        const ov = await page.evaluate(() => {
            const slot = document.getElementById('introMediaSlot');
            const b = slot.querySelector('.introPlayOverlay');
            if (!b) return { found: false };
            const icon = b.querySelector('.introPlayIcon');
            const sr = slot.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            const ir = icon.getBoundingClientRect();
            const cs = getComputedStyle(b);
            return {
                found: true, tag: b.tagName, type: b.type,
                ariaLabel: b.getAttribute('aria-label'),
                iconAriaHidden: icon.getAttribute('aria-hidden'),
                visible: cs.display !== 'none' && cs.visibility === 'visible' && Number(cs.opacity) > 0.9,
                coversFrame: Math.abs(br.width - sr.width) < 2 && Math.abs(br.height - sr.height) < 2,
                dx: (ir.left + ir.width / 2) - (sr.left + sr.width / 2),
                dy: (ir.top + ir.height / 2) - (sr.top + sr.height / 2),
                iconW: ir.width, iconH: ir.height,
                focusable: b.tabIndex >= 0
            };
        });
        check('Centered play affordance exists before playback',
            ov.found && ov.tag === 'BUTTON' && ov.type === 'button');
        check('Play affordance is visible', ov.visible === true);
        check('Play affordance is centered', Math.abs(ov.dx) < 2 && Math.abs(ov.dy) < 2,
            'dx=' + ov.dx.toFixed(1) + ' dy=' + ov.dy.toFixed(1));
        check('Play button is a clearly visible size', ov.iconW >= 60 && ov.iconH >= 60,
            ov.iconW.toFixed(0) + 'x' + ov.iconH.toFixed(0) + 'px');
        check('Whole poster is the click target', ov.coversFrame === true);
        check('Play affordance has an accessible name', !!ov.ariaLabel, ov.ariaLabel);
        check('Decorative icon hidden from assistive tech', ov.iconAriaHidden === 'true');
        check('Play affordance is keyboard focusable', ov.focusable === true);

        const cls = await page.evaluate(() => window.__cls);

        // ── 4. a genuine click starts it ──
        const before = requests.length;
        await page.evaluate(() =>
            document.getElementById('meetTheOwner').scrollIntoView({ block: 'center' }));
        await new Promise(r => setTimeout(r, 500));
        await page.click('.introPlayOverlay');
        await new Promise(r => setTimeout(r, 2200));

        const play = await page.evaluate(() => {
            const slot = document.getElementById('introMediaSlot');
            const v = slot.querySelector('video');
            return {
                paused: v.paused, currentTime: v.currentTime, duration: v.duration,
                videoWidth: v.videoWidth, videoHeight: v.videoHeight,
                overlayGone: !slot.querySelector('.introPlayOverlay')
            };
        });
        check('Clicking the affordance starts playback',
            play.paused === false && play.currentTime > 0.3,
            't=' + play.currentTime.toFixed(2) + 's of ' + play.duration + 's');
        check('Affordance removes itself once playback starts', play.overlayGone === true);
        check('MP4 requested only after interaction',
            requests.slice(before).filter(u => /\.mp4(\?|$)/i.test(u)).length > 0);
        check('Decoded dimensions are ' + EXPECTED.width + 'x' + EXPECTED.height,
            play.videoWidth === EXPECTED.width && play.videoHeight === EXPECTED.height,
            play.videoWidth + 'x' + play.videoHeight);
        check('Duration reads ' + EXPECTED.durationSeconds + 's',
            Math.abs(play.duration - EXPECTED.durationSeconds) < 0.1, play.duration + 's');

        // ── 5. orientation ──
        const frame = await page.evaluate(async (t, w, h) => {
            const v = document.querySelector('#introMediaSlot video');
            v.pause();
            await new Promise(res => {
                const done = () => { v.removeEventListener('seeked', done); res(); };
                v.addEventListener('seeked', done);
                v.currentTime = t;
            });
            await new Promise(r => setTimeout(r, 400));
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(v, 0, 0, w, h);
            return {
                data: Array.from(c.getContext('2d').getImageData(0, 0, w, h).data),
                t: v.currentTime
            };
        }, SEEK_T, FW, FH);

        check('Seek landed where it was asked to (server supports Range)',
            Math.abs(frame.t - SEEK_T) < 0.15,
            'currentTime=' + frame.t.toFixed(3)
            + (Math.abs(frame.t - SEEK_T) >= 0.15
                ? '  <-- range-less server? see rangeServer.js header' : ''));

        const d = orientationDiff(frame.data, REF, FW, FH);
        check('Chase is UPRIGHT (browser applies the -180 display matrix)',
            d.normal < d.rotated / 3,
            'mean|diff| upright ' + d.normal.toFixed(2) + ' vs rotated ' + d.rotated.toFixed(2));

        const luma = await page.evaluate(() => {
            const v = document.querySelector('#introMediaSlot video');
            const c = document.createElement('canvas');
            c.width = 320; c.height = 180;
            const ctx = c.getContext('2d');
            ctx.drawImage(v, 0, 0, 320, 180);
            const d = ctx.getImageData(0, 0, 320, 180).data;
            const band = (y0, y1) => {
                let s = 0, n = 0;
                for (let y = y0; y < y1; y++) for (let x = 0; x < 320; x++) {
                    const i = (y * 320 + x) * 4;
                    s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++;
                }
                return s / n;
            };
            return { top: band(0, 30), bottom: band(150, 180) };
        });
        check('Sky sits above ground (model-free orientation sanity)',
            luma.top > luma.bottom + 15,
            'top ' + luma.top.toFixed(1) + ' vs bottom ' + luma.bottom.toFixed(1));

        // ── 6. captions ──
        const cues = await page.evaluate(async () => {
            const v = document.querySelector('#introMediaSlot video');
            const tt = v.textTracks[0];
            if (!tt) return { error: 'no textTrack exposed' };
            tt.mode = 'hidden';                     // what opening the menu does
            for (let i = 0; i < 60 && (!tt.cues || tt.cues.length === 0); i++) {
                await new Promise(r => setTimeout(r, 100));
            }
            if (!tt.cues || tt.cues.length === 0) return { error: 'cues never loaded' };
            const list = Array.from(tt.cues);
            return {
                count: list.length,
                first: list[0].text,
                last: list[list.length - 1].text,
                monotonic: list.every((c, i) =>
                    c.endTime > c.startTime && (i === 0 || c.startTime >= list[i - 1].startTime)),
                withinDuration: list[list.length - 1].endTime <= 29.3
            };
        });
        check('Caption track parses; all ' + EXPECTED.cueCount + ' cues load',
            !cues.error && cues.count === EXPECTED.cueCount,
            cues.error || 'cues=' + cues.count);
        if (!cues.error) {
            check('First cue is correct', cues.first === EXPECTED.firstCue, JSON.stringify(cues.first));
            check('Last cue is correct', cues.last === EXPECTED.lastCue, JSON.stringify(cues.last));
            check('Cues are ordered and non-degenerate', cues.monotonic === true);
            check('No cue runs past the end of the video', cues.withinDuration === true);
        }

        const active = await page.evaluate(async () => {
            const v = document.querySelector('#introMediaSlot video');
            const tt = v.textTracks[0];
            tt.mode = 'showing';
            await new Promise(res => {
                const done = () => { v.removeEventListener('seeked', done); res(); };
                v.addEventListener('seeked', done);
                v.currentTime = 10.5;
            });
            await new Promise(r => setTimeout(r, 500));
            return {
                n: tt.activeCues ? tt.activeCues.length : 0,
                text: tt.activeCues && tt.activeCues.length ? tt.activeCues[0].text : null
            };
        });
        check('A caption renders active at t=10.5s when switched on',
            active.n > 0, active.text ? JSON.stringify(active.text) : 'none active');

        // ── 7. errors and stability ──
        const realFailures = failedRequests.filter(f => !isBenignMediaAbort(f));
        check('No uncaught page errors', pageErrors.length === 0, pageErrors.join(' | ') || 'none');
        check('No console errors', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | ') || 'none');
        check('No failed requests (normal media aborts excluded)',
            realFailures.length === 0, realFailures.slice(0, 5).join(' | ') || 'none');
        check('No layout shift on load (CLS < 0.1)', cls < 0.1, 'CLS=' + cls.toFixed(4));

        await page.close();

        // ── 8. responsiveness ──
        for (const vp of [{ w: 1440 }, { w: 768 }, { w: 390 }]) {
            const p2 = await browser.newPage();
            const errs = [];
            p2.on('pageerror', e => errs.push(e.message));
            p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
            await p2.setViewport({ width: vp.w, height: 900, deviceScaleFactor: 2 });
            await p2.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
            await new Promise(r => setTimeout(r, 1800));
            const box = await p2.evaluate(() => {
                const sec = document.getElementById('meetTheOwner');
                const slot = document.getElementById('introMediaSlot');
                const v = slot.querySelector('video');
                const icon = slot.querySelector('.introPlayIcon');
                const sr = slot.getBoundingClientRect();
                const vr = v.getBoundingClientRect();
                const ir = icon.getBoundingClientRect();
                return {
                    vW: vr.width, vH: vr.height, vLeft: vr.left, vRight: vr.right,
                    docW: document.documentElement.clientWidth,
                    scrollW: sec.scrollWidth, clientW: sec.clientWidth,
                    dx: (ir.left + ir.width / 2) - (sr.left + sr.width / 2),
                    dy: (ir.top + ir.height / 2) - (sr.top + sr.height / 2),
                    iconW: ir.width,
                    iconInside: ir.left >= sr.left && ir.right <= sr.right
                        && ir.top >= sr.top && ir.bottom <= sr.bottom,
                    mp4: performance.getEntriesByType('resource').filter(e => /\.mp4/.test(e.name)).length
                };
            });
            const tag = '@' + vp.w + 'px';
            check(tag + ' player fits the viewport',
                box.vLeft >= -1 && box.vRight <= box.docW + 1,
                box.vW.toFixed(0) + 'x' + box.vH.toFixed(0));
            check(tag + ' section does not overflow horizontally',
                box.scrollW <= box.clientW + 1, 'scrollW=' + box.scrollW + ' clientW=' + box.clientW);
            check(tag + ' slot holds 16:9',
                Math.abs(box.vW / box.vH - 16 / 9) < 0.02, 'ratio ' + (box.vW / box.vH).toFixed(3));
            check(tag + ' affordance centered and inside the frame',
                Math.abs(box.dx) < 2 && Math.abs(box.dy) < 2 && box.iconInside,
                'icon ' + box.iconW.toFixed(0) + 'px dx=' + box.dx.toFixed(1) + ' dy=' + box.dy.toFixed(1));
            check(tag + ' still no MP4 on load', box.mp4 === 0);
            check(tag + ' no errors', errs.length === 0, errs.join(' | ') || 'none');
            await p2.close();
        }

        return summary('Owner introduction video');
    } finally {
        await browser.close();
    }
}

module.exports = { run };

if (require.main === module) {
    run().then(f => process.exit(f ? 1 : 0))
        .catch(e => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
}
