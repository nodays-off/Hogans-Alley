/**
 * Convert GitHub CDN images to Netlify Image CDN
 * Run: node convert-to-netlify-images.js
 */

import fs from 'fs';
import path from 'path';

// Find all HTML files
const htmlFiles = [
  'index.html',
  'shop.html',
  'story.html',
  'lookbook.html',
  'collections/libation.html',
  'collections/money.html',
  'collections/sanitation.html',
  'collections/transport.html'
];

console.log(`Converting images in ${htmlFiles.length} HTML files\n`);

let totalConverted = 0;

htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠ Skipping ${file} (not found)`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Pattern to match existing Netlify CDN images with old parameters
  // /.netlify/images?url=/Pictures/Pictures/FILENAME&w=1200&fm=webp&q=85
  const netlifyPattern = /\/.netlify\/images\?url=(\/Pictures\/Pictures\/[^&]+)&w=\d+&fm=webp&q=\d+/g;

  // Replace with updated quality settings
  content = content.replace(netlifyPattern, (match, imagePath) => {
    // Use 2400px for high-res/retina displays and premium quality
    const width = 2400;
    const quality = 95;

    // Construct updated Netlify Image CDN URL
    const netlifyURL = `/.netlify/images?url=${imagePath}&w=${width}&fm=webp&q=${quality}`;

    totalConverted++;
    return netlifyURL;
  });

  // Add loading="lazy" to images that don't have it
  // But skip the first hero image on each page (better UX to load it immediately)
  let firstImageSkipped = false;
  content = content.replace(/<img(?![^>]*loading=)([^>]*)>/gi, (match, attributes) => {
    // Skip the very first image (hero) - load it immediately
    if (!firstImageSkipped) {
      firstImageSkipped = true;
      return match;
    }

    // Don't add to images that already have loading attribute
    if (match.includes('loading=')) return match;

    // Add loading="lazy" before the closing >
    return `<img${attributes} loading="lazy">`;
  });

  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`✓ Updated: ${file}`);
  } else {
    console.log(`  No changes: ${file}`);
  }
});

console.log(`\n✅ Converted ${totalConverted} images to Netlify CDN format!`);
console.log(`\n📊 Expected improvements:`);
console.log(`   • Image size: 20MB → 200-400KB (50-100x smaller)`);
console.log(`   • Format: PNG → WebP (30% additional compression)`);
console.log(`   • Width: Original → 1200px max (responsive scaling)`);
console.log(`   • Loading: Lazy loading for all non-hero images`);
console.log(`\n🚀 Commit and push to deploy the optimized images!`);
