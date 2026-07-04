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

await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 120000 });
await page.emulateMediaType('print');

// Allow external images (Unsplash, QR codes) to finish loading
await page.evaluate(async () => {
  const imgs = Array.from(document.images);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = img.onerror = resolve;
          })
    )
  );
});

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
