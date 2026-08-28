/* ============================================================
   RUN EVERYTHING

   Boots the range-capable server, runs both suites against it, shuts
   the server down, and exits non-zero if anything failed.

   This is the entry point. Running the suites by hand against some
   other server is possible but is how the Range mistake happens — see
   the header of rangeServer.js.

     node _qa/runAll.js
     node _qa/runAll.js --video        # owner video suite only
     node _qa/runAll.js --pages        # sitewide regression only
============================================================ */

const { start } = require('./rangeServer');

const args = process.argv.slice(2);
const onlyVideo = args.includes('--video');
const onlyPages = args.includes('--pages');
const runVideo = onlyVideo || !onlyPages;
const runPages = onlyPages || !onlyVideo;

(async () => {
    const server = await start(Number(process.env.QA_PORT) || 8732);
    console.log('range-capable server on ' + server.base + '\n');

    process.env.QA_URL = server.base + '/index.html';
    process.env.QA_BASE = server.base;

    let failures = 0;
    try {
        if (runVideo) {
            console.log('── OWNER INTRODUCTION VIDEO ' + '─'.repeat(38));
            failures += await require('./verifyIntroVideo').run();
            console.log('');
        }
        if (runPages) {
            console.log('── SITEWIDE PAGE REGRESSION ' + '─'.repeat(38));
            failures += await require('./regressionPages').run(server.stats);
            console.log('');
        }
    } finally {
        await server.stop();
    }

    console.log('='.repeat(66));
    console.log('range requests served: ' + server.stats.rangeRequests
        + (server.stats.rangeRequests === 0 && runVideo
            ? '   <-- expected > 0; seeking may not have been exercised' : ''));
    console.log(failures === 0
        ? 'ALL SUITES PASSED'
        : failures + ' CHECK(S) FAILED');
    process.exit(failures === 0 ? 0 : 1);
})().catch(e => {
    console.error('RUNNER ERROR:', e.message);
    process.exit(2);
});
