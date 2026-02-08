const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'Pictures', 'Pictures');
const OUT_DIR = path.join(__dirname, 'Pictures', 'optimized');
const WIDTHS = [400, 800, 1200, 2000, 2400];
const WEBP_QUALITY = 95;
const CONCURRENCY = 4;

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = {};

async function processImage(filename) {
  const srcPath = path.join(SRC_DIR, filename);
  const meta = await sharp(srcPath).metadata();
  const baseName = filename.replace(/\.(png|jpg|jpeg)$/i, '');
  const generated = [];

  // Generate at each standard width that doesn't exceed original
  for (const w of WIDTHS) {
    if (w > meta.width) continue;

    const outName = `${baseName}-${w}w.webp`;
    const outPath = path.join(OUT_DIR, outName);

    await sharp(srcPath)
      .resize(w)
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath);

    const outSize = (fs.statSync(outPath).size / 1024).toFixed(0);
    generated.push({ width: w, file: outName, sizeKB: parseInt(outSize) });
  }

  // Also generate at original width if it's not a standard width and < max
  const maxStandard = Math.max(...WIDTHS.filter(w => w <= meta.width));
  if (meta.width > maxStandard || !WIDTHS.includes(meta.width)) {
    // Only if original is larger than our biggest generated width
    if (meta.width > maxStandard) {
      const outName = `${baseName}-${meta.width}w.webp`;
      const outPath = path.join(OUT_DIR, outName);

      await sharp(srcPath)
        .webp({ quality: WEBP_QUALITY })
        .toFile(outPath);

      const outSize = (fs.statSync(outPath).size / 1024).toFixed(0);
      generated.push({ width: meta.width, file: outName, sizeKB: parseInt(outSize) });
    }
  }

  generated.sort((a, b) => a.width - b.width);

  manifest[filename] = {
    originalWidth: meta.width,
    originalHeight: meta.height,
    widths: generated.map(g => g.width),
    files: generated
  };

  const totalKB = generated.reduce((sum, g) => sum + g.sizeKB, 0);
  const srcSizeKB = (fs.statSync(srcPath).size / 1024).toFixed(0);
  console.log(`  ${filename} (${meta.width}x${meta.height}, ${srcSizeKB}KB) → ${generated.length} WebP files (${totalKB}KB total)`);
}

async function processBatch(files, batchSize) {
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(f => processImage(f)));
    console.log(`  Progress: ${Math.min(i + batchSize, files.length)}/${files.length}`);
  }
}

async function main() {
  const files = fs.readdirSync(SRC_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  console.log(`Processing ${files.length} images into ${OUT_DIR}...`);
  console.log(`Widths: ${WIDTHS.join(', ')}, Quality: ${WEBP_QUALITY}\n`);

  await processBatch(files, CONCURRENCY);

  // Write manifest
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  // Summary
  const totalFiles = Object.values(manifest).reduce((sum, m) => sum + m.files.length, 0);
  const totalSizeKB = Object.values(manifest).reduce(
    (sum, m) => sum + m.files.reduce((s, f) => s + f.sizeKB, 0), 0
  );
  console.log(`\nDone!`);
  console.log(`  ${files.length} source images → ${totalFiles} optimized WebP files`);
  console.log(`  Total optimized size: ${(totalSizeKB / 1024).toFixed(1)}MB`);
  console.log(`  Manifest: Pictures/optimized/manifest.json`);
}

main().catch(console.error);
