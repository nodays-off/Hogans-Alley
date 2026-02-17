#!/usr/bin/env python3
"""
Hogan's Alley - Google Ads Creative Generator
Saves resized ad images to marketing/ad-creatives/ - NEVER overwrites existing files.

Run from the repo root directory:
    pip install Pillow
    python marketing/generate-ad-creatives.py

Google Ads image requirements:
  Landscape (1.91:1): 1200x628 min, also 600x314
  Square (1:1):       1200x1200 min, also 300x300
  Display banners:    300x250, 728x90, 160x600, 300x600, 320x50
  Logo (square):      1200x1200 and 128x128
  Logo (landscape):   1200x300 and 512x128
"""

import os
import io
import urllib.request
import urllib.parse
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("ERROR: Run: pip install Pillow")
    exit(1)

# Brand colours
BRAND_BLACK = (10, 10, 10)
BRAND_GOLD  = (196, 169, 98)

OUTPUT_DIR = Path("marketing/ad-creatives")
RAW_BASE   = "https://raw.githubusercontent.com/nodays-off/Hogans-Alley/master/Pictures/Pictures/"

# Source images: repo filename -> output label
SOURCE_IMAGES = {
    "VHERO2 Coal Harbour Seawall - 1.png":          "hero-coal-harbour",
    "V-HERO-1 Vancouver Art Gallery Plaza - 1.png":  "hero-art-gallery",
    "V-HERO-1 Vancouver Art Gallery Plaza - 2.png":  "hero-art-gallery-2",
    "V1 Stanley Park Seawall.png":                   "lifestyle-stanley-park",
    "V2 Gastown Steam Clock - 1.png":                "lifestyle-gastown",
    "S1 Capitol Hill Coffee Run.png":                "lifestyle-seattle-coffee",
    "S2 Pike Place Market.png":                      "lifestyle-seattle-market",
    "S3 Ferry Commute.png":                          "lifestyle-seattle-ferry",
    "P1 Hawthorne Bridge Bike.png":                  "lifestyle-portland-bridge",
    "P3 Powell's Books Exit - 1.png":                "lifestyle-portland-books",
    "Fabric Detail Shot - Libation.png":             "fabric-libation",
    "Fabric Detail Shot - Money.png":                "fabric-money",
    "Fabric Detail Shot - Sanitation.png":           "fabric-sanitation",
    "Fabric Detail Shot - Transportaion.png":        "fabric-transport",
    "DETAIL-3 Zipper and Storm Flap - Money.jpg":    "detail-zipper",
    "DETAIL-4 Hand in Pocket - Money.jpg":           "detail-pocket",
    "DETAIL-2 Hood with Drawcord System - Money.jpg":"detail-hood",
    "Artist Print Creation Photo - 1.png":           "story-artist",
    "Gwen Photos - Front Shot.jpg":                  "story-designer",
}

# (width, height, subfolder, description)
AD_SIZES = [
    (1200, 628,  "landscape-1200x628",  "Landscape 1.91:1"),
    (600,  314,  "landscape-600x314",   "Landscape small"),
    (1200, 1200, "square-1200x1200",    "Square large"),
    (300,  300,  "square-300x300",      "Square small"),
    (300,  250,  "banner-300x250",      "Medium Rectangle"),
    (728,  90,   "banner-728x90",       "Leaderboard"),
    (160,  600,  "banner-160x600",      "Wide Skyscraper"),
    (300,  600,  "banner-300x600",      "Half Page"),
    (320,  50,   "banner-320x50",       "Mobile Banner"),
]


def download_image(filename):
    url = RAW_BASE + urllib.parse.quote(filename)
    print(f"  Downloading {filename}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        img = Image.open(io.BytesIO(data)).convert("RGB")
        print(f"  Source size: {img.size[0]}x{img.size[1]}")
        return img
    except Exception as e:
        print(f"  FAILED: {e}")
        return None


def smart_crop(img, w, h):
    """Crop to target ratio with slight upward bias, then resize."""
    sw, sh = img.size
    ratio = w / h
    if sw / sh > ratio:
        nw = int(sh * ratio)
        left = (sw - nw) // 2
        img = img.crop((left, 0, left + nw, sh))
    else:
        nh = int(sw / ratio)
        top = int((sh - nh) * 0.35)
        img = img.crop((0, top, sw, top + nh))
    return img.resize((w, h), Image.LANCZOS)


def make_logo(w, h):
    """HOGAN'S ALLEY wordmark on black background."""
    img = Image.new("RGB", (w, h), BRAND_BLACK)
    draw = ImageDraw.Draw(img)
    text = "HOGAN'S ALLEY"
    font = ImageFont.load_default()
    fs = max(12, h // 6)
    for fname in ["georgia.ttf", "Georgia.ttf", "ariblk.ttf", "trebuc.ttf"]:
        try:
            font = ImageFont.truetype(fname, fs)
            break
        except Exception:
            pass
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    except Exception:
        tw, th = len(text) * 7, 14
    draw.text(((w - tw) // 2, (h - th) // 2), text, fill=BRAND_GOLD, font=font)
    return img


def main():
    print("\n=== Hogan's Alley Ad Creative Generator ===")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for _, _, folder, _ in AD_SIZES:
        (OUTPUT_DIR / folder).mkdir(exist_ok=True)
    (OUTPUT_DIR / "logos").mkdir(exist_ok=True)
    print(f"Output: {OUTPUT_DIR.resolve()}")

    # Generate logos
    print("\n-- Logos --")
    for w, h, fname in [
        (1200, 1200, "logo-square-1200x1200.jpg"),
        (128,  128,  "logo-square-128x128.jpg"),
        (1200, 300,  "logo-landscape-1200x300.jpg"),
        (512,  128,  "logo-landscape-512x128.jpg"),
    ]:
        out = OUTPUT_DIR / "logos" / fname
        if not out.exists():
            make_logo(w, h).save(str(out), "JPEG", quality=95)
            print(f"  Created: {fname}")
        else:
            print(f"  Skipped (exists): {fname}")

    # Generate photo creatives
    created = failed = skipped = 0
    for source_file, label in SOURCE_IMAGES.items():
        print(f"\n-- {label} --")
        img = download_image(source_file)
        if img is None:
            failed += 1
            continue
        for w, h, folder, _ in AD_SIZES:
            out = OUTPUT_DIR / folder / f"{label}-{w}x{h}.jpg"
            if out.exists():
                skipped += 1
                continue
            try:
                smart_crop(img.copy(), w, h).save(str(out), "JPEG", quality=92, optimize=True)
                created += 1
            except Exception as e:
                print(f"  ERROR {folder}: {e}")
                failed += 1
        print(f"  Done.")

    print(f"\n=== Results ===")
    print(f"Created: {created}  |  Skipped: {skipped}  |  Failed: {failed}")
    print(f"Output: {OUTPUT_DIR.resolve()}")
    print(f"\nNext steps:")
    print(f"  1. git add marketing/ad-creatives/")
    print(f"  2. git commit -m 'Add Google Ads creative assets'")
    print(f"  3. Upload images to Google Ads campaigns 2 & 3")


if __name__ == "__main__":
    main()
