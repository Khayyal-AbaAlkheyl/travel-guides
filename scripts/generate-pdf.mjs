import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import http from 'http';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlArg = process.argv[2] || 'cities/london-pdf.html';
const pdfArg = process.argv[3] || htmlArg.replace(/-pdf\.html$/, '.pdf').replace(/\.html$/, '.pdf');

const htmlPath = path.resolve(root, htmlArg);
const pdfPath = path.resolve(root, pdfArg);

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML not found: ${htmlPath}`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const raw = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = raw.replace(/^\//, '') || htmlArg.replace(/\\/g, '/');
      const filePath = path.resolve(root, rel);

      if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

console.log(`Generating PDF from ${htmlArg}...`);

const port = 8765 + Math.floor(Math.random() * 500);
const server = await startServer(port);
const pageUrl = `http://127.0.0.1:${port}/${htmlArg.replace(/\\/g, '/')}`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(pageUrl, { waitUntil: 'networkidle0', timeout: 180000 });
  await page.emulateMediaType('print');

  const imageReport = await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    let failed = 0;
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            const done = () => resolve();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', () => {
              failed += 1;
              done();
            }, { once: true });
            setTimeout(done, 10000);
          })
      )
    );
    return { total: imgs.length, failed };
  });

  console.log(`Images loaded: ${imageReport.total - imageReport.failed}/${imageReport.total}`);
  if (imageReport.failed) {
    console.warn(`${imageReport.failed} image(s) failed — placeholders may appear in PDF`);
  }

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
} finally {
  await browser.close();
  server.close();
}

const sizeKb = Math.round(fs.statSync(pdfPath).size / 1024);
console.log(`Done: ${pdfArg} (${sizeKb} KB)`);
