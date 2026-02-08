const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const manifest = require('./Pictures/optimized/manifest.json');

// Standard widths we use in srcset (subset of generated widths)
const STANDARD_WIDTHS = [400, 800, 1200, 2000, 2400];

const htmlFiles = [
  'index.html', 'story.html', 'lookbook.html',
  'faq.html', 'contact.html', 'sizing.html', 'success.html', 'cancel.html',
  'collections/money.html', 'collections/libation.html',
  'collections/transport.html', 'collections/sanitation.html'
];
// shop.html handled separately (JavaScript-based)

// Build a lookup: URL-decoded filename → manifest entry
const lookup = {};
Object.keys(manifest).forEach(filename => {
  lookup[filename] = manifest[filename];
});

// Given a source filename, return the optimized static URL for a specific width
function staticUrl(filename, width) {
  const baseName = filename.replace(/\.(png|jpg|jpeg)$/i, '');
  const encoded = encodeURIComponent(`${baseName}-${width}w.webp`);
  return `/Pictures/optimized/${encoded}`;
}

// Given a source filename, return the best available width (largest standard, or original if smaller)
function bestWidth(filename) {
  const entry = lookup[filename];
  if (!entry) return 2400; // fallback
  const available = entry.widths;
  // Use the largest standard width that's available, or the max available
  const standardAvailable = STANDARD_WIDTHS.filter(w => available.includes(w));
  if (standardAvailable.length > 0) return Math.max(...standardAvailable);
  return Math.max(...available);
}

// Given a source filename, return srcset string with all available standard widths
function buildSrcset(filename) {
  const entry = lookup[filename];
  if (!entry) return '';
  const available = entry.widths;
  // Use standard widths that are available, plus original if not in standard set
  const widths = STANDARD_WIDTHS.filter(w => available.includes(w));
  // If original width is larger than max standard but still available, don't include it
  // (2400 is large enough for any screen)
  return widths.map(w => `${staticUrl(filename, w)} ${w}w`).join(', ');
}

// Decode a URL-encoded filename from Netlify CDN URL
function decodeFilename(encoded) {
  // The filename in Netlify URLs is URL-encoded
  try {
    return decodeURIComponent(encoded);
  } catch (e) {
    return encoded;
  }
}

let totalUpdated = 0;

htmlFiles.forEach(file => {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) return;

  let html = fs.readFileSync(fullPath, 'utf8');
  let count = 0;

  // Step 1: Replace <img> tags with Netlify CDN src + srcset
  // Match the full <img> tag, extract filename, rebuild src and srcset
  html = html.replace(
    /(<img\b[^>]*?)src="\/\.netlify\/images\?url=\/Pictures\/Pictures\/([^"&]+)&w=\d+(?:&fm=webp)?&q=\d+"(\s+srcset="[^"]*")?(\s+sizes="[^"]*")?([^>]*?>)/gi,
    (match, before, encodedFile, oldSrcset, sizes, after) => {
      const filename = decodeFilename(encodedFile);
      if (!lookup[filename]) {
        console.log(`  WARNING: ${filename} not in manifest, skipping`);
        return match;
      }
      count++;
      const best = bestWidth(filename);
      const newSrc = staticUrl(filename, best);
      const newSrcset = buildSrcset(filename);
      const sizesAttr = sizes || '';

      if (newSrcset) {
        return `${before}src="${newSrc}" srcset="${newSrcset}"${sizesAttr}${after}`;
      }
      return `${before}src="${newSrc}"${sizesAttr}${after}`;
    }
  );

  // Step 2: Replace <link rel="preload"> hero images
  html = html.replace(
    /(<link\b[^>]*?href=")\/\.netlify\/images\?url=\/Pictures\/Pictures\/([^"&]+)&w=\d+(?:&fm=webp)?&q=\d+"(\s+imagesrcset="[^"]*")?(\s+imagesizes="[^"]*")?([^>]*?>)/gi,
    (match, before, encodedFile, oldSrcset, sizes, after) => {
      const filename = decodeFilename(encodedFile);
      if (!lookup[filename]) {
        console.log(`  WARNING: ${filename} not in manifest (preload), skipping`);
        return match;
      }
      count++;
      const best = bestWidth(filename);
      const newHref = staticUrl(filename, best);
      const newSrcset = buildSrcset(filename);
      const sizesAttr = sizes || '';

      if (newSrcset) {
        return `${before}${newHref}" imagesrcset="${newSrcset}"${sizesAttr}${after}`;
      }
      return `${before}${newHref}"${sizesAttr}${after}`;
    }
  );

  // Step 3: Replace data-product-image attributes
  html = html.replace(
    /(data-product-image=")\/\.netlify\/images\?url=\/Pictures\/Pictures\/([^"&]+)&w=\d+(?:&fm=webp)?&q=\d+"/gi,
    (match, before, encodedFile) => {
      const filename = decodeFilename(encodedFile);
      if (!lookup[filename]) return match;
      count++;
      const best = bestWidth(filename);
      return `${before}${staticUrl(filename, best)}"`;
    }
  );

  if (count > 0) {
    fs.writeFileSync(fullPath, html);
    console.log(`${file}: ${count} images updated to static WebP`);
    totalUpdated += count;
  } else {
    console.log(`${file}: no Netlify CDN images found`);
  }
});

console.log(`\nTotal: ${totalUpdated} images updated across ${htmlFiles.length} files`);
console.log('Note: shop.html needs separate JS update');
