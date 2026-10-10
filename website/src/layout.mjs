// The frame every page shares (head, header, footer) and small pieces several pages use: the champ, store buttons,
// social links and icons.
import { APP_STORE, EMAIL, GOOGLE_PLAY, SITE_URL, SOCIAL, WEB_APP, WHATSAPP } from './config.mjs';

/** The champ from the logo. `pose`: cheer (arms up), eat, lift or point. */
export function champ(pose = 'cheer', { size = 40, ink = 'currentColor', head = 'var(--accent)', cls = '' } = {}) {
  const s = `stroke="${ink}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const bodies = {
    cheer: `<path d="M50 58V84" ${s} stroke-width="8"/><path d="M28 36L50 58L72 36" ${s} stroke-width="8"/><circle cx="50" cy="26" r="8" fill="${head}"/><path class="spark" d="M20 28L16 22M24 22L22 15M80 28L84 22M76 22L78 15" stroke="${head}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`,
    logo: `<path d="M50 58V84" ${s} stroke-width="9"/><path d="M28 36L50 58L72 36" ${s} stroke-width="9"/><circle cx="50" cy="26" r="9" fill="${head}"/>`,
    eat: `<path d="M50 58V84" ${s} stroke-width="8"/><path d="M50 58L32 54" ${s} stroke-width="8"/><path d="M12 50H46Q44 68 29 68Q14 68 12 50Z" fill="${ink}"/><path d="M16 50Q20 42 25 48Q29 41 34 48Q38 43 42 50Z" fill="${head}"/><path d="M50 58L70 40" ${s} stroke-width="8"/><path d="M70 40L75 20" ${s} stroke-width="4"/><path d="M71 20L80 20M71.5 20L72 11M75.5 20L75.5 11M79.5 20L79 11" ${s} stroke-width="3"/><circle cx="50" cy="28" r="8" fill="${head}"/>`,
    lift: `<path d="M50 60V88" ${s} stroke-width="8"/><path d="M26 24L50 60L74 24" ${s} stroke-width="8"/><circle cx="50" cy="44" r="6.5" fill="${head}"/><path d="M10 22H90" ${s} stroke-width="5"/><rect x="7" y="11" width="9" height="22" rx="3" fill="${head}"/><rect x="84" y="11" width="9" height="22" rx="3" fill="${head}"/>`,
    point: `<path d="M50 58V84" ${s} stroke-width="8"/><path d="M50 58L30 34" ${s} stroke-width="8"/><path d="M50 58L82 47" ${s} stroke-width="8"/><circle cx="50" cy="26" r="8" fill="${head}"/>`,
  };
  return `<svg class="champ ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${bodies[pose]}</svg>`;
}

const ICON_PATHS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  dumbbell: '<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>',
  pill: '<path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z"/><path d="M8.5 8.5l7 7"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  flame: '<path d="M12 21c4 0 6-2.7 6-6 0-4-3-6-4-9-1 2-2 3-3 3 0-2-1-4-1-6-2 2-4 6-4 10 0 4.5 2.5 8 6 8z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.8 3.5 5.8 3.5 9s-1 6.2-3.5 9c-2.5-2.8-3.5-5.8-3.5-9S9.5 5.8 12 3z"/>',
  barcode: '<path d="M4 6v12M7 6v12M11 6v12M14 6v12M17 6v12M20 6v12"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  lab: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6l8.5 7 8.5-7"/>',
  chat: '<path d="M4 19l1.5-4A7.5 7.5 0 1 1 9 18.5z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.6 2.4 4.5 5 4.8"/>',
  facebook: '<path d="M14 21v-8h3l.5-3.5H14V7.5c0-1 .4-1.8 1.8-1.8h1.8V2.6c-.4 0-1.5-.1-2.7-.1-2.7 0-4.4 1.6-4.4 4.6v2.4H7.5V13h3v8"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
  x: '<path d="M4 4l16 16M20 4L4 20"/>',
};

/** A small stroke icon that takes the text colour. */
export const icon = (name, size = 22) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;

/** App Store, Google Play and the web version. Stores without a link yet read "coming soon". */
export function storeButtons(ctx, { web = true } = {}) {
  const { L } = ctx;
  const store = (url, name, label) => url
    ? `<a class="store" href="${url}" rel="noopener"><span class="store-small">${L('متاح على', 'Get it on')}</span><span class="store-big" lang="en">${name}</span></a>`
    : `<span class="store is-soon" aria-label="${label}"><span class="store-small">${L('قريبا على', 'Coming soon to')}</span><span class="store-big" lang="en">${name}</span></span>`;
  return `<div class="stores">
    ${store(APP_STORE, 'App Store', L('قريبا على آب ستور', 'Coming soon to the App Store'))}
    ${store(GOOGLE_PLAY, 'Google Play', L('قريبا على جوجل بلاي', 'Coming soon to Google Play'))}
    ${web ? `<a class="store store-web" href="${WEB_APP}"><span class="store-small">${L('متاح دلوقتي', 'Available now')}</span><span class="store-big">${L('على الويب', 'On the web')}</span></a>` : ''}
  </div>`;
}

const SOCIAL_NAMES = { instagram: ['انستجرام', 'Instagram'], tiktok: ['تيك توك', 'TikTok'], facebook: ['فيسبوك', 'Facebook'], youtube: ['يوتيوب', 'YouTube'], x: ['إكس', 'X'] };

/** Social accounts that have a link; empty when none is set yet. */
export function socialLinks(ctx) {
  return Object.entries(SOCIAL).filter(([, url]) => url).map(([k, url]) =>
    `<a class="social" href="${url}" rel="noopener" aria-label="${ctx.L(SOCIAL_NAMES[k][0], SOCIAL_NAMES[k][1])}">${icon(k, 20)}</a>`).join('');
}
export const hasSocial = () => Object.values(SOCIAL).some(Boolean);
export const contact = { email: EMAIL, whatsapp: WHATSAPP };
export { SOCIAL_NAMES };

const NAV = [
  ['features.html', ['المميزات', 'Features']],
  ['index.html#how', ['إزاي بيشتغل', 'How it works']],
  ['faq.html', ['الأسئلة', 'FAQ']],
  ['about.html', ['عن يلا ويل', 'About']],
  ['contact.html', ['تواصل', 'Contact']],
];

function header(ctx, page) {
  const { L } = ctx;
  const links = NAV.map(([href, [ar, en]]) =>
    `<a href="${href === 'index.html#how' ? './#how' : href}"${href === page.file ? ' aria-current="page"' : ''}>${L(ar, en)}</a>`).join('');
  return `<header class="hdr">
  <div class="wrap hdr-in">
    <a class="brand" href="./" aria-label="${L('يلا ويل، الصفحة الرئيسية', 'Yalla Well home')}">${champ('logo', { size: 34 })}<span class="wordmark">${L('يلا ويل', 'Yalla Well')}</span></a>
    <nav class="nav" id="nav" aria-label="${L('القايمة الرئيسية', 'Main menu')}">${links}
      <a class="nav-only-m" href="${ctx.other}" hreflang="${ctx.en ? 'ar' : 'en'}" lang="${ctx.en ? 'ar' : 'en'}">${ctx.en ? 'عربي' : 'English'}</a>
    </nav>
    <div class="hdr-end">
      <a class="lang" href="${ctx.other}" hreflang="${ctx.en ? 'ar' : 'en'}" lang="${ctx.en ? 'ar' : 'en'}">${ctx.en ? 'عربي' : 'EN'}</a>
      <a class="btn btn-primary btn-sm" href="download.html">${L('التحميل', 'Download')}</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="${L('فتح القايمة', 'Open menu')}" data-open="${L('فتح القايمة', 'Open menu')}" data-close="${L('قفل القايمة', 'Close menu')}">${icon('menu', 24)}</button>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const { L } = ctx;
  const social = hasSocial() ? `<div class="socials">${socialLinks(ctx)}</div>` : `<p class="muted small">${L('حسابات السوشيال ميديا قريبا.', 'Social media accounts coming soon.')}</p>`;
  return `<footer class="ftr">
  <div class="wrap">
    <div class="ftr-top">
      <div class="ftr-brand">
        <a class="brand" href="./">${champ('logo', { size: 30 })}<span class="wordmark">${L('يلا ويل', 'Yalla Well')}</span></a>
        <p class="muted">${L('تطبيق مصري للأكل والتمرين والصحة.', 'An Egyptian app for food, training and health.')}</p>
        ${social}
      </div>
      <nav class="ftr-cols" aria-label="${L('روابط آخر الصفحة', 'Footer links')}">
        <div><h2>${L('التطبيق', 'The app')}</h2><a href="features.html">${L('المميزات', 'Features')}</a><a href="download.html">${L('التحميل', 'Download')}</a><a href="${WEB_APP}">${L('النسخة على الويب', 'Web version')}</a></div>
        <div><h2>${L('مساعدة', 'Help')}</h2><a href="faq.html">${L('الأسئلة الشائعة', 'FAQ')}</a><a href="contact.html">${L('التواصل', 'Contact us')}</a></div>
        <div><h2>${L('يلا ويل', 'Yalla Well')}</h2><a href="about.html">${L('عن يلا ويل', 'About')}</a><a href="privacy.html">${L('الخصوصية', 'Privacy')}</a><a href="terms.html">${L('الشروط', 'Terms')}</a></div>
      </nav>
    </div>
    <p class="ftr-note">${L('يلا ويل بيساعد في تنظيم الأكل والتمرين والأدوية، لكنه مش بديل عن الدكتور. أي تغيير في الدوا أو الأكل أو التمرين يكون بعد استشارة الدكتور.', "Yalla Well helps organise food, training and medicines, but it isn't a substitute for a doctor. Talk to your doctor before changing any medicine, diet or training.")}</p>
    <p class="ftr-copy">© 2026 ${L('يلا ويل', 'Yalla Well')}</p>
  </div>
</footer>`;
}

/** A whole page. */
export function layout(ctx, page) {
  const { L } = ctx;
  const title = page.title(ctx);
  const desc = page.desc(ctx);
  const path = (ctx.en ? 'en/' : '') + (page.file === 'index.html' ? '' : page.file);
  const alt = (ctx.en ? '' : 'en/') + (page.file === 'index.html' ? '' : page.file);
  const fullTitle = page.file === 'index.html' ? `${L('يلا ويل', 'Yalla Well')}: ${title}` : `${title} · ${L('يلا ويل', 'Yalla Well')}`;
  return `<!doctype html>
<html lang="${ctx.lang}" dir="${ctx.en ? 'ltr' : 'rtl'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${desc}">
<meta name="theme-color" content="#000000">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${SITE_URL}${path}">
<link rel="alternate" hreflang="${ctx.lang}" href="${SITE_URL}${path}">
<link rel="alternate" hreflang="${ctx.en ? 'ar' : 'en'}" href="${SITE_URL}${alt}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${L('يلا ويل', 'Yalla Well')}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta property="og:image" content="${SITE_URL}static/img/og-${ctx.lang}.png">
<meta property="og:locale" content="${ctx.en ? 'en_US' : 'ar_EG'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ctx.root}static/img/favicon.png">
<link rel="apple-touch-icon" href="${ctx.root}static/img/apple-touch-icon.png">
<link rel="preload" href="${ctx.root}static/fonts/lalezar.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${ctx.root}static/fonts/almarai-400.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add('js')</script>
<link rel="stylesheet" href="${ctx.root}static/site.css">
<script src="${ctx.root}static/site.js" defer></script>
</head>
<body class="${ctx.en ? 'is-en' : 'is-ar'}${page.file === 'index.html' ? ' is-home' : ''}">
<a class="skip" href="#main">${L('الانتقال للمحتوى', 'Skip to content')}</a>
${header(ctx, page)}
<main id="main">
${page.body(ctx)}
</main>
${footer(ctx)}
</body>
</html>
`;
}
