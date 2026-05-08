#!/usr/bin/env python3
"""
PlayStore Asset Generator for Definition Detective App

This script generates all necessary PlayStore assets from the base logo.
Requirements:
  - Pillow (PIL): pip install Pillow

Usage:
  python3 generate-assets.py
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow is not installed.")
    print("Install it with: pip install Pillow")
    sys.exit(1)

# Configuration
BASE_LOGO_PATH = "../../public/logo-definition-detective.png"
OUTPUT_DIR = "."
ICON_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "icons")
GRAPHICS_OUTPUT_DIR = os.path.join(OUTPUT_DIR, "graphics")

# Icon sizes and densities
ICON_SIZES = {
    "ldpi": 36,
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
    "playstore": 512,
}

def ensure_directory(path):
    """Create directory if it doesn't exist."""
    os.makedirs(path, exist_ok=True)
    print(f"✓ Ensured directory: {path}")

def create_icon_with_background(logo_image, size, bg_color=(255, 255, 255)):
    """
    Create an icon by centering the logo on a background.
    
    Args:
        logo_image: PIL Image object
        size: Target size (square)
        bg_color: Background color (RGB tuple)
    
    Returns:
        PIL Image object with the icon
    """
    # Create new image with background
    icon = Image.new('RGBA', (size, size), bg_color + (255,))
    
    # Calculate scaling to fit logo in icon (with padding)
    padding = int(size * 0.1)  # 10% padding
    available_size = size - (padding * 2)
    
    # Scale logo maintaining aspect ratio
    logo_resized = logo_image.copy()
    logo_resized.thumbnail((available_size, available_size), Image.Resampling.LANCZOS)
    
    # Center the logo
    logo_x = (size - logo_resized.width) // 2
    logo_y = (size - logo_resized.height) // 2
    
    # Paste logo onto background
    if logo_resized.mode == 'RGBA':
        icon.paste(logo_resized, (logo_x, logo_y), logo_resized)
    else:
        icon.paste(logo_resized, (logo_x, logo_y))
    
    return icon

def create_feature_graphic(logo_image, width=1024, height=500):
    """
    Create the PlayStore feature graphic.
    
    Args:
        logo_image: PIL Image object
        width: Width of feature graphic
        height: Height of feature graphic
    
    Returns:
        PIL Image object
    """
    # Create gradient background (dark to lighter)
    feature = Image.new('RGB', (width, height), (20, 20, 40))
    
    # Resize and place logo
    logo_size = min(int(height * 0.8), int(width * 0.4))
    logo_resized = logo_image.copy()
    logo_resized.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Place logo on left side
    logo_x = int(width * 0.1)
    logo_y = (height - logo_resized.height) // 2
    
    feature_rgba = feature.convert('RGBA')
    if logo_resized.mode == 'RGBA':
        feature_rgba.paste(logo_resized, (logo_x, logo_y), logo_resized)
    else:
        feature_rgba.paste(logo_resized, (logo_x, logo_y))
    
    return feature_rgba.convert('RGB')

def create_promo_graphic(logo_image, width=180, height=120):
    """
    Create the small promo graphic for PlayStore.
    
    Args:
        logo_image: PIL Image object
        width: Width of promo graphic
        height: Height of promo graphic
    
    Returns:
        PIL Image object
    """
    # Create background
    promo = Image.new('RGB', (width, height), (50, 50, 80))
    
    # Scale logo to fit
    logo_resized = logo_image.copy()
    logo_resized.thumbnail((width - 10, height - 10), Image.Resampling.LANCZOS)
    
    # Center the logo
    logo_x = (width - logo_resized.width) // 2
    logo_y = (height - logo_resized.height) // 2
    
    promo_rgba = promo.convert('RGBA')
    if logo_resized.mode == 'RGBA':
        promo_rgba.paste(logo_resized, (logo_x, logo_y), logo_resized)
    else:
        promo_rgba.paste(logo_resized, (logo_x, logo_y))
    
    return promo_rgba.convert('RGB')

def main():
    """Generate all PlayStore assets."""
    print("🎨 PlayStore Asset Generator")
    print("=" * 50)
    
    # Check if base logo exists
    if not os.path.exists(BASE_LOGO_PATH):
        print(f"✗ Error: Base logo not found at {BASE_LOGO_PATH}")
        print(f"  Current directory: {os.getcwd()}")
        sys.exit(1)
    
    print(f"✓ Loading base logo: {BASE_LOGO_PATH}")
    
    try:
        logo = Image.open(BASE_LOGO_PATH).convert('RGBA')
        print(f"✓ Logo loaded successfully ({logo.width}x{logo.height})")
    except Exception as e:
        print(f"✗ Error loading logo: {e}")
        sys.exit(1)
    
    # Create output directories
    ensure_directory(ICON_OUTPUT_DIR)
    ensure_directory(GRAPHICS_OUTPUT_DIR)
    
    # Generate icon sizes
    print("\n📱 Generating app icons...")
    for density, size in ICON_SIZES.items():
        try:
            icon = create_icon_with_background(logo, size, bg_color=(245, 245, 255))
            output_path = os.path.join(ICON_OUTPUT_DIR, f"ic_launcher-{density}-{size}x{size}.png")
            icon.save(output_path, 'PNG', quality=95)
            print(f"  ✓ {density:10s} ({size:3d}x{size:3d}): {os.path.basename(output_path)}")
        except Exception as e:
            print(f"  ✗ {density}: {e}")
    
    # Generate feature graphic
    print("\n🎯 Generating feature graphics...")
    try:
        feature = create_feature_graphic(logo, 1024, 500)
        output_path = os.path.join(GRAPHICS_OUTPUT_DIR, "feature-graphic-1024x500.png")
        feature.save(output_path, 'PNG', quality=95)
        print(f"  ✓ Feature Graphic (1024x500): {os.path.basename(output_path)}")
    except Exception as e:
        print(f"  ✗ Feature Graphic: {e}")
    
    # Generate promo graphic
    try:
        promo = create_promo_graphic(logo, 180, 120)
        output_path = os.path.join(GRAPHICS_OUTPUT_DIR, "promo-graphic-180x120.png")
        promo.save(output_path, 'PNG', quality=95)
        print(f"  ✓ Promo Graphic (180x120): {os.path.basename(output_path)}")
    except Exception as e:
        print(f"  ✗ Promo Graphic: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Asset generation complete!")
    print("\n📝 Next steps:")
    print("  1. Replace generated graphics with actual designs in graphics/")
    print("  2. Capture screenshots from the app and place in screenshots/")
    print("  3. Review app-listing.json and update as needed")
    print("  4. Upload assets to Google Play Console")
    print("\n📂 Generated files:")
    print(f"  Icons: {ICON_OUTPUT_DIR}")
    print(f"  Graphics: {GRAPHICS_OUTPUT_DIR}")
    print("\nFor more information, see README.md in this directory.")

if __name__ == "__main__":
    main()
