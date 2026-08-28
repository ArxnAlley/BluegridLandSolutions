/* ============================================================
   SITEWIDE PAGE REGRESSION

   Loads EVERY .html page in the repository in real Chrome and asserts
   the boring things that quietly break in a no-build static site with
   33 hand-maintained pages and shared chrome duplicated into each one.

   Per page:
     - responds 200
     - no uncaught page errors, no console errors
     - no failed requests
     - every asset and internal link target it requests actually exists
       (the server records each 404 it serves, so a mistyped path shows
       up as a real miss rather than as a silent broken image)
     - the owner-video play affordance appears on the ONE page that has
       an #introMediaSlot and nowhere else — js/indexJS.js ships on
       every page, so "inert everywhere else" is a claim worth testing
     - no video bytes are pulled on any page at load

   The page list is DISCOVERED, not hardcoded. A hardcoded list goes
   stale the day someone adds a page, and a typo in it reports a site
   failure that is really a test failure.

   Usage:
     node _qa/runAll.js                    # preferred, boots the server
     QA_BASE=http://127.0.0.1:8732 node _qa/regressionPages.js
============================================================ */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { findChrome, createReporter, isBenignMediaAbort } = require('./lib/harness');

const REPO = path.resolve(__dirname, '..');
const BASE = process.env.QA_BASE || 'http://127.0.0.1:8732';

const SKIP_DIRS = new Set(['.git', '_qa', 'node_modules', 'graphics', 'appsScript']);

function discoverPages(dir, found) {
    found = found || [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
            discoverPages(path.join(dir, entry.name), found);
        } else if (entry.name.endsWith('.html')) {
            const rel = path.relative(REPO, path.join(dir, entry.name)).split(path.sep).join('/');
            found.push('/' + rel);
        }
    }
    return found;
}

async function run(serverStats) {
    const { check, summary } = createReporter();
    const pages = discoverPages(REPO).sort();
    console.log('discovered ' + pages.length + ' page(s)\n');

    const browser = await puppeteer.launch({
        executablePath: findChrome(),
        headless: 'new',
        args: ['--mute-audio', '--no-sandbox']
    });

    const allMisses = [];

    try {
        for (const p of pages) {
            const page = await browser.newPage();
            const errs = [];
            const failed = [];
            const reqs = [];
            page.on('pageerror', e => errs.push('pageerror: ' + e.message));
            page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
            page.on('requestfailed', r =>
                failed.push(r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
            page.on('request', r => reqs.push(r.url()));

            const missesBefore = serverStats ? serverStats.notFound.length : 0;

            let status = 0;
            try {
                const resp = await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 45000 });
                status = resp ? resp.status() : 0;
            } catch (e) {
                errs.push('navigation: ' + e.message);
            }
            await new Promise(r => setTimeout(r, 900));

            const dom = await page.evaluate(() => ({
                slot: !!document.getElementById('introMediaSlot'),
                overlays: document.querySelectorAll('.introPlayOverlay').length,
                icons: document.querySelectorAll('.introPlayIcon').length,
                h1: document.querySelectorAll('h1').length
            }));

            const misses = serverStats ? serverStats.notFound.slice(missesBefore) : [];
            // a page's own console 404 line is already counted as a miss
            const consoleOnly404 = errs.filter(e => /404|Failed to load resource/.test(e));
            const realErrs = errs.filter(e => !/404|Failed to load resource/.test(e));
            const realFailed = failed.filter(f => !isBenignMediaAbort(f));
            const media = reqs.filter(u => /\.(mp4|vtt)(\?|$)/i.test(u));
            const expectOverlay = dom.slot ? 1 : 0;

            if (misses.length) allMisses.push({ page: p, misses: misses });

            const ok = status === 200
                && realErrs.length === 0
                && realFailed.length === 0
                && misses.length === 0
                && consoleOnly404.length === 0
                && media.length === 0
                && dom.overlays === expectOverlay
                && dom.icons === expectOverlay
                && dom.h1 === 1;

            const detail = 'http=' + status
                + ' h1=' + dom.h1
                + ' slot=' + (dom.slot ? 'y' : 'n')
                + ' overlay=' + dom.overlays + '/' + expectOverlay
                + ' media=' + media.length
                + ' missing=' + misses.length
                + ' errors=' + realErrs.length
                + (misses.length ? '  MISSING: ' + misses.slice(0, 3).join(', ') : '')
                + (realErrs.length ? '  ' + realErrs.slice(0, 2).join(' | ') : '')
                + (realFailed.length ? '  FAILED: ' + realFailed.slice(0, 2).join(' | ') : '');

            check(p, ok, detail);
            await page.close();
        }

        check('No page requests a missing asset', allMisses.length === 0,
            allMisses.length
                ? allMisses.map(m => m.page + ' -> ' + m.misses.join(', ')).join(' ; ')
                : 'every asset and link target requested by every page resolved');

        return summary('Sitewide page regression');
    } finally {
        await browser.close();
    }
}

module.exports = { run, discoverPages };

if (require.main === module) {
    run(null).then(f => process.exit(f ? 1 : 0))
        .catch(e => { console.error('HARNESS ERROR:', e.message); process.exit(2); });
}
