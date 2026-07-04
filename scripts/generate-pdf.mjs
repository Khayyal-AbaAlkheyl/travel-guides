import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlArg = process.argv[2] || 'cities/london-pdf.html';
const pdfArg = process.argv[3] || htmlArg.replace(/-pdf\.html$/, '.pdf').replace(/\.html$/, '.pdf');

const htmlPath = path.resolve(root, htmlArg);
const pdfPath = path.resolve(root, pdfArg);

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML not found: ${htmlPath}`);
  process.exit(1);
}

const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

console.log(`Generating PDF from ${htmlArg}...`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 180000 });
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
          setTimeout(done, 8000);
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

await browser.close();

const sizeKb = Math.round(fs.statSync(pdfPath).size / 1024);
console.log(`Done: ${pdfArg} (${sizeKb} KB)`);
