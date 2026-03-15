/**
 * screenshot.js — Devoke site design iteration loop
 *
 * Usage:
 *   Terminal 1: npm run dev
 *   Terminal 2: node scripts/screenshot.js
 *
 * Outputs timestamped folders under screenshots/
 * Each run: full-page desktop + mobile for each page,
 *           plus cropped section clips (hero, before-after) at desktop.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const BASE_URL = 'http://localhost:4321';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844, isMobile: true },
];

const PAGES = [
  { slug: 'home',    path: '/' },
  { slug: 'privacy', path: '/privacy' },
];

// Named sections to crop at desktop only.
// selector: CSS selector that uniquely identifies the section root element.
const SECTIONS = [
  { name: 'hero',         selector: '#hero' },
  { name: 'before-after', selector: '#before-after' },
  { name: 'how-it-works', selector: '#how-it-works' },
  { name: 'features',     selector: '#features' },
];

async function run() {
  const ts = new Date()
    .toISOString()
    .slice(0, 16)        // "2026-03-15T14-22" shape
    .replace('T', 'T')
    .replace(/:/g, '-'); // filesystem-safe

  const outDir = path.join(ROOT, 'screenshots', ts);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
  });

  console.log(`\n◎ Devoke screenshot loop — saving to screenshots/${ts}/\n`);

  for (const page of PAGES) {
    for (const vp of VIEWPORTS) {
      const tab = await browser.newPage();

      await tab.setViewport({
        width:            vp.width,
        height:           vp.height,
        deviceScaleFactor: 2,               // retina — crisp output
        isMobile:         vp.isMobile ?? false,
      });

      await tab.goto(`${BASE_URL}${page.path}`, {
        waitUntil: 'networkidle0',
        timeout:   30_000,
      });

      // Full-page screenshot
      const fullName = `${page.slug}-${vp.name}-full.png`;
      await tab.screenshot({
        path:     path.join(outDir, fullName),
        fullPage: true,
      });
      console.log(`  ✓ ${fullName}`);

      // Section crops — desktop only
      if (vp.name === 'desktop' && page.slug === 'home') {
        for (const section of SECTIONS) {
          try {
            const el = await tab.$(section.selector);
            if (!el) {
              console.warn(`  ⚠ Section not found: ${section.selector}`);
              continue;
            }

            const clipName = `${page.slug}-${section.name}-clip.png`;
            await el.screenshot({
              path: path.join(outDir, clipName),
            });
            console.log(`  ✓ ${clipName}`);
          } catch (err) {
            console.warn(`  ⚠ Clip failed (${section.name}):`, err.message);
          }
        }
      }

      await tab.close();
    }
  }

  await browser.close();

  console.log(`\n◎ Done. ${outDir}\n`);
}

run().catch((err) => {
  console.error('[screenshot]', err.message);
  process.exit(1);
});
