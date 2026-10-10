// Builds the website about the app: every page in Arabic (site root) and English (en/), plus the static files.
// Usage: node website/build.mjs [out-dir]   (default: website/dist)
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { layout } from './src/layout.mjs';
import { PAGES } from './src/pages.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, 'dist'));

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'en'), { recursive: true });
cpSync(join(here, 'static'), join(out, 'static'), { recursive: true });

for (const lang of ['ar', 'en']) {
  const en = lang === 'en';
  const root = en ? '../' : '';
  for (const page of PAGES) {
    const file = page.file === 'index.html' ? '' : page.file;
    const ctx = {
      lang, en, root, other: (en ? '../' : 'en/') + file,
      L: (ar, eng) => (en ? eng : ar),
      img: (name) => `${root}static/img/${lang}/${name}.jpg`,
    };
    writeFileSync(join(out, en ? 'en' : '', page.file), layout(ctx, page));
  }
}

writeFileSync(join(out, '.nojekyll'), '');
console.log(`Built ${PAGES.length * 2} pages into ${out}`);
