/**
 * Add lazy loading to all images in HTML files
 * Run: node add-lazy-loading.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all HTML files
const files = glob.sync('**/*.html', {
  ignore: ['node_modules/**', '**/node_modules/**']
});

console.log(`Found ${files.length} HTML files\n`);

let totalUpdated = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Add loading="lazy" to images that don't have it
  const imgRegex = /<img(?![^>]*loading=)([^>]*)>/gi;
  const newContent = content.replace(imgRegex, (match, attributes) => {
    // Don't add to images that already have loading attribute
    if (match.includes('loading=')) return match;

    // Add loading="lazy" before the closing >
    updated = true;
    totalUpdated++;
    return `<img${attributes} loading="lazy">`;
  });

  if (updated) {
    fs.writeFileSync(file, newContent);
    console.log(`✓ Updated: ${file}`);
  }
});

console.log(`\n✅ Added lazy loading to ${totalUpdated} images across ${files.length} files!`);
