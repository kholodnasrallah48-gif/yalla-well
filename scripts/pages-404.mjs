// Writes the GitHub Pages 404.html: the app's index.html (so routes under /app/ open in the app) with a small
// script that moves old links first. /site/x was the website before the custom domain, so it goes to /x; any other
// missing path was an app route before the app moved under /app/.
// Usage: node scripts/pages-404.mjs <dist>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] || 'dist';
const redirect = `<script>(function(){var p=location.pathname,q=location.search+location.hash;
if(p==='/app'||p.indexOf('/app/')===0)return;
var m=p.match(/^\\/site(\\/.*)?$/);
location.replace((m?(m[1]||'/'):'/app'+p)+q);})();</script>`;
const html = readFileSync(join(dist, 'app', 'index.html'), 'utf8').replace('<head>', `<head>\n${redirect}`);
writeFileSync(join(dist, '404.html'), html);
console.log('Wrote 404.html');
