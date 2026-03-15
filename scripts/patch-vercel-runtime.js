// Patch the Vercel output config to use Node 20 instead of Node 18.
// @astrojs/vercel@7 hardcodes nodejs18.x which Vercel no longer accepts (EOL).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const configPath = path.join(
  __dirname, '..', '.vercel', 'output', 'functions',
  '_render.func', '.vc-config.json'
);

if (!fs.existsSync(configPath)) {
  console.log('[patch] .vc-config.json not found — skipping');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.runtime = 'nodejs20.x';
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('[patch] Patched runtime → nodejs20.x');
