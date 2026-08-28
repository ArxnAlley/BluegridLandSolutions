/* ============================================================
   RANGE-CAPABLE STATIC SERVER

   Serves the repository root over HTTP with byte-range support.

   WHY THIS EXISTS, AND WHY `python -m http.server` WILL NOT DO.

   python's http.server answers every request with 200 and the whole
   file. It does not implement the Range header. Chrome cannot seek
   inside a media file it is streaming from such a server: a forward
   seek past whatever happens to be buffered makes it abort the load and
   restart from byte 0, and `video.currentTime` silently comes back as
   0 instead of the value that was set.

   That is not a theoretical problem. It cost a session: a caption
   assertion failed with "no active cue at t=10.5s" and looked exactly
   like a broken caption track, when the site was fine and the test
   server was lying. GitHub Pages, which is what actually serves this
   site, supports Range.

   Any future test that seeks, scrubs, or checks buffering MUST run
   against this server rather than a convenience one-liner.

   Usage:
     node _qa/rangeServer.js [port]        # standalone
     const { start } = require('./rangeServer');   # programmatic
============================================================ */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = 8732;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.mp4': 'video/mp4',
    '.vtt': 'text/vtt; charset=utf-8',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.JPG': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.gs': 'text/plain; charset=utf-8'
};

function contentType(file) {
    const ext = path.extname(file);
    return TYPES[ext] || TYPES[ext.toLowerCase()] || 'application/octet-stream';
}

function createServer(stats) {
    return http.createServer((req, res) => {
        let urlPath;
        try {
            urlPath = decodeURIComponent(req.url.split('?')[0]);
        } catch (e) {
            res.writeHead(400).end('bad request');
            return;
        }
        if (urlPath.endsWith('/')) urlPath += 'index.html';

        const file = path.join(ROOT, urlPath);

        // never serve outside the repository root
        if (!file.startsWith(ROOT)) {
            res.writeHead(403).end('forbidden');
            return;
        }

        fs.stat(file, (err, stat) => {
            if (err || !stat.isFile()) {
                if (stats) stats.notFound.push(urlPath);
                res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
                return;
            }

            const type = contentType(file);
            const total = stat.size;
            const range = req.headers.range;

            if (range) {
                if (stats) stats.rangeRequests++;
                const m = /bytes=(\d*)-(\d*)/.exec(range);
                if (!m) {
                    res.writeHead(416, { 'Content-Range': 'bytes */' + total }).end();
                    return;
                }
                let start = m[1] ? parseInt(m[1], 10) : 0;
                let end = m[2] ? parseInt(m[2], 10) : total - 1;
                if (isNaN(start) || start >= total) {
                    res.writeHead(416, { 'Content-Range': 'bytes */' + total }).end();
                    return;
                }
                if (end >= total) end = total - 1;
                res.writeHead(206, {
                    'Content-Type': type,
                    'Content-Length': end - start + 1,
                    'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-store'
                });
                fs.createReadStream(file, { start: start, end: end }).pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Type': type,
                    'Content-Length': total,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-store'
                });
                fs.createReadStream(file).pipe(res);
            }
        });
    });
}

/* Starts the server and resolves with { port, base, stop, stats }. */
function start(port) {
    const stats = { rangeRequests: 0, notFound: [] };
    const server = createServer(stats);
    return new Promise((resolve, reject) => {
        server.on('error', reject);
        server.listen(port || DEFAULT_PORT, '127.0.0.1', () => {
            const actual = server.address().port;
            resolve({
                port: actual,
                base: 'http://127.0.0.1:' + actual,
                stats: stats,
                stop: () => new Promise(r => server.close(r))
            });
        });
    });
}

module.exports = { start, createServer, ROOT };

if (require.main === module) {
    const port = Number(process.argv[2]) || DEFAULT_PORT;
    start(port).then(s => {
        console.log('serving ' + ROOT);
        console.log('range-capable server on ' + s.base);
        console.log('ctrl-c to stop');
    }).catch(e => {
        console.error('could not start:', e.message);
        process.exit(1);
    });
}
