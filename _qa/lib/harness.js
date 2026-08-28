/* Shared plumbing for the browser suites: locating Chrome, reporting
   checks, and building the reference frame the orientation test needs. */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

/* ── Chrome ──
   puppeteer-core drives an installed Chrome rather than downloading its
   own. CHROME_PATH overrides; otherwise the usual install locations are
   tried in order. */

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe')
        : null,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser'
].filter(Boolean);

function findChrome() {
    for (const c of CHROME_CANDIDATES) {
        try { if (fs.existsSync(c)) return c; } catch (e) { /* keep looking */ }
    }
    throw new Error(
        'Chrome not found. Set CHROME_PATH to the executable, e.g.\n'
        + '  set CHROME_PATH=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    );
}

/* ── Check reporting ── */

function createReporter() {
    const results = [];
    function check(name, pass, detail) {
        results.push({ name: name, pass: !!pass, detail: detail });
        console.log((pass ? 'PASS  ' : 'FAIL  ') + name + (detail ? '  -- ' + detail : ''));
    }
    function summary(title) {
        const failed = results.filter(r => !r.pass);
        console.log('\n' + '='.repeat(66));
        console.log(title + ': ' + (results.length - failed.length) + '/' + results.length + ' checks passed');
        if (failed.length) {
            console.log('FAILURES:');
            failed.forEach(f => console.log('  - ' + f.name + ' :: ' + f.detail));
        }
        return failed.length;
    }
    return { check, summary, results };
}

/* ── Orientation reference ──

   The owner video carries a -180 degree display matrix: its pixels are
   stored upside down and the browser is trusted to rotate them. To
   prove the browser actually does, a frame drawn from the <video> is
   compared against the same frame decoded by ffmpeg, which applies the
   matrix by default.

   The reference is GENERATED, never committed — a raw RGB dump is a
   170KB binary that would rot the moment the video changed. It is
   written to the OS temp directory and rebuilt whenever the video is
   newer than the cache. */

function buildOrientationReference(videoPath, seconds, w, h) {
    const cacheDir = path.join(os.tmpdir(), 'bluegridQa');
    fs.mkdirSync(cacheDir, { recursive: true });
    const out = path.join(cacheDir, 'ref_' + seconds + '_' + w + 'x' + h + '.rgb');

    const fresh = fs.existsSync(out)
        && fs.statSync(out).mtimeMs >= fs.statSync(videoPath).mtimeMs;

    if (!fresh) {
        try {
            execFileSync('ffmpeg', [
                '-hide_banner', '-v', 'error', '-y',
                '-ss', String(seconds), '-i', videoPath,
                '-frames:v', '1',
                '-vf', 'scale=' + w + ':' + h,
                '-pix_fmt', 'rgb24', '-f', 'rawvideo', out
            ], { stdio: ['ignore', 'ignore', 'pipe'] });
        } catch (e) {
            throw new Error(
                'ffmpeg is required to build the orientation reference frame.\n'
                + 'Install it and ensure `ffmpeg` is on PATH, or skip the suite.\n'
                + 'underlying error: ' + (e.stderr ? e.stderr.toString().trim() : e.message)
            );
        }
    }
    return fs.readFileSync(out);
}

/* Mean absolute per-channel difference between an RGBA canvas dump and
   an RGB reference, computed both as-is and with the reference rotated
   180 degrees. If the browser is showing the video the right way up,
   `normal` is far smaller than `rotated`. */

function orientationDiff(rgbaFromCanvas, rgbReference, w, h) {
    let normal = 0;
    let rotated = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ci = (y * w + x) * 4;
            const ri = (y * w + x) * 3;
            const fi = ((h - 1 - y) * w + (w - 1 - x)) * 3;
            for (let k = 0; k < 3; k++) {
                normal += Math.abs(rgbaFromCanvas[ci + k] - rgbReference[ri + k]);
                rotated += Math.abs(rgbaFromCanvas[ci + k] - rgbReference[fi + k]);
            }
        }
    }
    const n = w * h * 3;
    return { normal: normal / n, rotated: rotated / n };
}

/* Chrome cancels an in-flight media range request when it seeks or when
   the page tears down. That surfaces as ERR_ABORTED on the media file
   and is normal streaming behaviour, not a defect. */
function isBenignMediaAbort(entry) {
    return /\.(mp4|webm|m4a)/.test(entry) && /ERR_ABORTED/.test(entry);
}

module.exports = {
    findChrome,
    createReporter,
    buildOrientationReference,
    orientationDiff,
    isBenignMediaAbort
};
