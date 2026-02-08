# Image Optimization Guide for Hogan's Alley

## 🚨 Current Problem
- Images are 20-25MB each
- Total: 1.4GB of images
- Page load times: **VERY SLOW**

## ✅ Solutions Implemented

### 1. Netlify Image CDN (Automatic)
Netlify now automatically optimizes images. Use this URL format:

**Instead of:**
```html
<img src="/Pictures/Pictures/DETAIL-1 Fleece Lining Interior - Money.png">
```

**Use:**
```html
<img src="/.netlify/images?url=/Pictures/Pictures/DETAIL-1%20Fleece%20Lining%20Interior%20-%20Money.png&w=800&fm=webp">
```

**Parameters:**
- `w=800` - Width in pixels (adjust as needed)
- `fm=webp` - Format (WebP is 30% smaller than PNG)
- `q=80` - Quality (80 is good balance)

### 2. Responsive Images
For different screen sizes:

```html
<img
  srcset="/.netlify/images?url=/Pictures/file.png&w=400&fm=webp 400w,
          /.netlify/images?url=/Pictures/file.png&w=800&fm=webp 800w,
          /.netlify/images?url=/Pictures/file.png&w=1200&fm=webp 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  src="/.netlify/images?url=/Pictures/file.png&w=800&fm=webp"
  alt="Description"
  loading="lazy">
```

### 3. Lazy Loading
Add `loading="lazy"` to all images:

```html
<img src="..." loading="lazy" alt="...">
```

---

## 📏 Recommended Sizes

| Use Case | Width | Quality | Example |
|----------|-------|---------|---------|
| Hero images | 1200px | 80% | Product banners |
| Product photos | 800px | 85% | Collection pages |
| Thumbnails | 400px | 80% | Grid views |
| Detail shots | 600px | 85% | Close-ups |

---

## 🔧 Option: Compress Originals Locally

If you want to compress the original files, install Sharp:

```bash
npm install sharp --save-dev
```

Then run this script:

```javascript
// compress-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './Pictures/Pictures';
const outputDir = './Pictures/Optimized';

fs.mkdirSync(outputDir, { recursive: true });

fs.readdirSync(inputDir).forEach(file => {
  if (file.endsWith('.png') || file.endsWith('.jpg')) {
    sharp(path.join(inputDir, file))
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(outputDir, file.replace(/\.(png|jpg)$/, '.webp')))
      .then(() => console.log(`✓ ${file}`))
      .catch(err => console.error(`✗ ${file}:`, err));
  }
});
```

---

## 🎯 Expected Results

After optimization:
- **Image size:** 20MB → 200KB (100x smaller!)
- **Page load:** 10+ seconds → <2 seconds
- **Bandwidth:** 1.4GB → 14MB total

---

## 🚀 Quick Win: Update One Image

Test with one image first:

**Before:**
```html
<img src="/Pictures/Pictures/DETAIL-1 Fleece Lining Interior - Money.png">
```

**After:**
```html
<img
  src="/.netlify/images?url=/Pictures/Pictures/DETAIL-1%20Fleece%20Lining%20Interior%20-%20Money.png&w=800&fm=webp&q=85"
  loading="lazy"
  alt="Fleece lining interior detail">
```

This single change will reduce that image from **22MB to ~200KB** (110x smaller!)
