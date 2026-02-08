const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const WIDTHS = [400, 800, 1200, 2000, 2400];
const Q = 95;

const htmlFiles = [
  'index.html', 'story.html', 'lookbook.html', 'shop.html',
  'faq.html', 'contact.html', 'sizing.html', 'success.html', 'cancel.html',
  'collections/money.html', 'collections/libation.html',
  'collections/transport.html', 'collections/sanitation.html'
];

let totalUpdated = 0;
let totalCleaned = 0;

htmlFiles.forEach(file => {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) return;

  let html = fs.readFileSync(fullPath, 'utf8');
  let count = 0;

  // Step 0: Clean junk from url parameter - remove encoded ?w=XXXX from source paths
  // These are leftovers from Statically CDN URLs: %3Fw%3D followed by digits
  const before = html.length;
  html = html.replace(/%3Fw%3D\d+/gi, '');
  // Also clean any ?w=XXXX that wasn't encoded (non-Netlify param in the url path)
  html = html.replace(/(\/Pictures\/Pictures\/[^"&]*?)\?w=\d+/g, '$1');
  if (html.length !== before) {
    const cleaned = (before - html.length);
    totalCleaned += cleaned;
    console.log(`  ${file}: cleaned ${cleaned} chars of URL junk`);
  }

  // Step 1: Strip existing srcset, sizes, imagesrcset, imagesizes attributes
  html = html.replace(/ srcset="[^"]*"/gi, '');
  html = html.replace(/ sizes="[^"]*"/gi, '');
  html = html.replace(/ imagesrcset="[^"]*"/gi, '');
  html = html.replace(/ imagesizes="[^"]*"/gi, '');

  // Step 2: Process <img> tags with Netlify image URLs
  // Match &fm=webp&q=N, &q=N (no fm), or &w=N&q=N patterns
  html = html.replace(
    /(<img\b[^>]*?)src="(\/\.netlify\/images\?url=[^"]*?)&w=\d+(?:&fm=webp)?&q=\d+"([^>]*?>)/gi,
    (match, before, baseUrl, after) => {
      count++;
      const isHero = (before + after).includes('fetchpriority');
      const defaultW = isHero ? 2400 : 2400;

      const src = `${baseUrl}&w=${defaultW}&fm=webp&q=${Q}`;
      const srcset = WIDTHS.map(w => `${baseUrl}&w=${w}&fm=webp&q=${Q} ${w}w`).join(', ');
      const sizes = isHero ? '100vw' : '(max-width: 768px) 100vw, 50vw';

      return `${before}src="${src}" srcset="${srcset}" sizes="${sizes}"${after}`;
    }
  );

  // Step 3: Update <link rel="preload"> hero images
  html = html.replace(
    /(<link\b[^>]*?href=")(\/\.netlify\/images\?url=[^"]*?)&w=\d+(?:&fm=webp)?&q=\d+"([^>]*?>)/gi,
    (match, before, baseUrl, after) => {
      count++;
      const srcset = WIDTHS.map(w => `${baseUrl}&w=${w}&fm=webp&q=${Q} ${w}w`).join(', ');
      return `${before}${baseUrl}&w=2400&fm=webp&q=${Q}" imagesrcset="${srcset}" imagesizes="100vw"${after}`;
    }
  );

  // Step 4: Update data-product-image attributes
  html = html.replace(
    /(data-product-image=")(\/\.netlify\/images\?url=[^"]*?)&w=\d+(?:&fm=webp)?&q=\d+"/gi,
    (match, before, baseUrl) => {
      count++;
      return `${before}${baseUrl}&w=800&fm=webp&q=${Q}"`;
    }
  );

  if (count > 0) {
    fs.writeFileSync(fullPath, html);
    console.log(`${file}: ${count} images updated`);
    totalUpdated += count;
  } else {
    console.log(`${file}: no Netlify images found`);
  }
});

console.log(`\nTotal: ${totalUpdated} images updated`);
console.log(`Total URL junk cleaned: ${totalCleaned} chars`);
console.log(`Quality: ${Q}, Widths: ${WIDTHS.join(', ')}`);
