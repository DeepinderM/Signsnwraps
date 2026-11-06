"""Builds the website's images and videos from the originals in Assets/ into public/media/.

Usage: python3 scripts/build-media.py            (needs cwebp and ffmpeg: brew install webp ffmpeg)
Re-run after adding or replacing files; outputs that already exist are skipped (delete one to rebuild it).

Images become WebP (longest side 1600 px, quality 80). Videos become silent H.264 MP4s (1280 px wide,
720 px for portrait clips) plus a lighter phone copy (<name>-sm.mp4, 640 px) and a WebP poster frame.
The pages reference these files through src/lib/data/media.ts.
"""
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "Assets" / "Web-Images-pages"
VID = ROOT / "Assets" / "Vedio"
OUT = ROOT / "public" / "media"

# public/media/<name>.webp  <-  Assets/Web-Images-pages/<source>
IMAGES = {
    # Signs: commercial signage
    "signage/carpro": "signage page/signage page/signage page (1).png",
    "signage/your-choice": "signage page/signage page/signage page (2).png",
    "signage/prime-wall": "signage page/signage page/signage page (3).png",
    "signage/spysar": "signage page/signage page/signage page (4).png",
    "signage/stella-pizza": "signage page/signage page/signage page (5).png",
    "signage/bombay": "google-drive-image/30212393-447c-4f79-a5f5-f0bfa9bbeafe.jpg",
    "signage/legacy-hub": "Neon & illuminated signs/new/leagecyhub.png",
    "signage/propbase": "Neon & illuminated signs/new/probase.png",
    "signage/punjab-imports": "Neon & illuminated signs/new/punjab imports.png",
    "signage/a-class-building": "Neon & illuminated signs/new/Aclass2.png",
    "signage/5ab-homes": "Neon & illuminated signs/new/5AB.png",
    "signage/burger-frenzi": "google-drive-image/IMG_0792.JPG",
    # Signs: shopfronts
    "shopfronts/afghan-bakery": "shopfronts-page/Golden Hour Afghan Bakery Storefront.png",
    "shopfronts/afghan-bakery-twilight": "shopfronts-page/Twilight Afghan Bakery Storefront.png",
    "shopfronts/dans-entry": "shopfronts-page/shopfronts-page (3).png",
    "shopfronts/dans-pylon": "shopfronts-page/shopfronts-page (1).png",
    "shopfronts/dans-interior": "shopfronts-page/shopfronts-page (2).png",
    "shopfronts/quick-signage": "shopfronts-page/Quick Signage and Gutter-Vac Showcase.png",
    "shopfronts/sahib-e-swad": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (6).webp",
    "shopfronts/arty-hair": "projects-page/projects-page/webp/Picflow Images Nov 2/projects-page (2).webp",
    "shopfronts/dentist": "projects-page/projects-page/webp/Picflow Images Nov 2/projects-page (3).webp",
    "shopfronts/cosmetic-laneway": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (2).webp",
    # Signs: printing
    "printing/uv-printer": "printing-page/printing-page/printing-page (1).png",
    "printing/custom-art-print": "printing-page/printing-page/printing-page (2).png",
    "printing/custom-art-roll": "printing-page/printing-page/printing-page (3).png",
    "printing/fence-banners": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (5).webp",
    # Signs: neon & illuminated
    "neon/lit-letters": "Neon & illuminated signs/Neon & illuminated signs (1).webp",
    "neon/lah-lah-land": "Neon & illuminated signs/Neon & illuminated signs (2).webp",
    "neon/la-cocina": "Neon & illuminated signs/new/quickneon.png",
    "neon/ultra-bin-hire": "Neon & illuminated signs/new/ultra bin hire.png",
    "neon/ultra-office": "google-drive-image/2089af7f-496d-4b05-8ec9-1a61498bd95d.jpg",
    # Projects ("Built to stand out")
    "projects/bellevue": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (1).webp",
    "projects/friendly-catering": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (3).webp",
    "projects/gold-coin": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (4).webp",
    "projects/sk-royal-homes": "Built to stand out. - section/Built to stand out. - section/Built to stand out. - section (7).webp",
    "projects/baaz-van": "projects-page/projects-page/webp/Picflow Images Nov 2/projects-page (1).webp",
    "projects/qwik-real-estate": "projects-page/projects-page/webp/Picflow Images Nov 2/projects-page (4).webp",
    "projects/satisfryd": "projects-page/projects-page/webp/Picflow Images Nov 2/projects-page (5).webp",
    # Fleet
    "fleet/hawk-prime-mover": "Fleet--page/Fleet-page/fleet--page (1).png",
    "fleet/dhillon-bus": "Fleet--page/Fleet-page/fleet--page (2).png",
    "fleet/dhillon-coaches": "Fleet--page/Fleet-page/fleet--page (3).png",
    "fleet/hawk-trailer": "Fleet--page/Fleet-page/fleet--page (4).png",
    "fleet/hawk-truck": "Fleet--page/Fleet-page/fleet--page (6).png",
    "fleet/dhillon-city": "Fleet--page/Fleet-page/fleet-page (1).png",
    "fleet/north-stars-van": "Fleet--page/Fleet-page/fleet-page (6).png",
    "fleet/a-class-ute": "Fleet--page/Fleet-page2/fleetpage (1).webp",
    "fleet/iga-trailer": "Fleet--page/Fleet-page2/fleetpage (3).webp",
    "fleet/foodland-trailer": "Fleet--page/Fleet-page2/fleetpage (6).webp",
    "fleet/hawk-rear": "Fleet--page/Fleet-page2/fleetpage (7).webp",
    # Wraps
    "wraps/hawk-b-double": "vehicle-wraps-page/vehicle-wraps-page/vehicle-wraps-page (1).png",
    "wraps/hawk-cab": "vehicle-wraps-page/vehicle-wraps-page/vehicle-wraps-page (2).png",
    "wraps/studio-truck": "vehicle-wraps-page/vehicle-wraps-page/vehicle-wraps-page (3).png",
    "wraps/southern-ute": "vehicle-wraps-page/vehicle-wraps-page/vehicle-wraps-page (4).png",
    "wraps/wrap-shop": "shopfronts-page/Vibrant Blue Sports Car at Wrap Shop.png",
    "wraps/truck-hood": "wraps-main page/wraps-main page (1).png",
    "wraps/truck-install": "wraps-main page/wraps-main page (3).png",
    "wraps/ppf-install": "wraps-main page/wraps-main page (4).png",
    "wraps/ppf-squeegee": "wraps-main page/wraps-main page 4a.png",
    # Colour PPF (AusPPF colours)
    "ppf/colour-range": "color-ppf/color-ppf (1).png",
    "ppf/purple-bmw": "color-ppf/color-ppf (2).png",
    "ppf/colour-samples": "color-ppf/color-ppf (3).png",
    "ppf/aus390-gold": "COLOUR PPF-page/original/AUS 390/Liquid Metal Gem Gold Supercar Showcase.webp",
    "ppf/aus399-red": "COLOUR PPF-page/original/AUS 399/Metallic Red SUV in Luxe Showroom.webp",
    "ppf/aus403-black": "COLOUR PPF-page/original/AUS 403/Super Black SUV Studio Showcase.webp",
    "ppf/aus620-nickel": "COLOUR PPF-page/original/AUS 620/AUS 620 Nickel Alloy Showcase.webp",
    "ppf/aus621-carbon": "COLOUR PPF-page/original/AUS 621/Carbon-Fiber Ferrari Showroom Showcase.webp",
    # DIY kits (pattern coverage previews)
    "kits/jeep-wrangler-side": "DiY-kits/Picflow Images Nov 2(1)/DiY-kits (2).webp",
    "kits/jeep-wrangler-front": "DiY-kits/Picflow Images Nov 2(1)/DiY-kits (1).webp",
    "kits/jeep-wrangler-angle": "DiY-kits/Picflow Images Nov 2(1)/DiY-kits (3).webp",
    "kits/jeep-gladiator": "DiY-kits/Picflow Images Nov 2(1)/DiY-kits (4).webp",
    "kits/jimny-side": "DiY-kits/suzuki/01.webp",
    "kits/jimny-front": "DiY-kits/suzuki/suzuki jimny-side-1-tub.webp",
    "kits/jimny-angle": "DiY-kits/suzuki/suzuki jimny-side-2-cab.webp",
    "kits/jimny-bonnet": "DiY-kits/suzuki/suzuki-jimny-front-bonnet-strip.webp",
}

# public/media/video/<name>.mp4 (+ <name>.webp poster)  <-  Assets/Vedio/<source>; (portrait, seconds kept)
VIDEOS = {
    "fleet": ("web-hero-vedio.mp4", False, 20),
    "signs-reel": ("all videos sign n wraps/First page.mp4", False, 20),
    "printing": ("all videos sign n wraps/Printing & banners.mp4", False, 15),
    "neon": ("all videos sign n wraps/neon light.mp4", False, 20),
    "letters": ("all videos sign n wraps/web front page shop.mp4", False, 15),
    "truck": ("all videos sign n wraps/truck video.mp4", True, 20),
}


def run(args):
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode:
        sys.exit(f"Failed: {' '.join(map(str, args))}\n{result.stderr[-800:]}")


def main():
    made = 0
    for name, source in IMAGES.items():
        src, dest = SRC / source, OUT / f"{name}.webp"
        if dest.exists():
            continue
        if not src.exists():
            sys.exit(f"Missing source for {name}: {src}")
        dest.parent.mkdir(parents=True, exist_ok=True)
        # cwebp can't read every PNG/JPEG variant from phones; ffmpeg normalises first when needed.
        tmp = dest.with_suffix(".tmp.png")
        run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-vf", "scale='min(1600,iw)':'min(1600,ih)':force_original_aspect_ratio=decrease", str(tmp)])
        run(["cwebp", "-quiet", "-q", "80", "-m", "6", str(tmp), "-o", str(dest)])
        tmp.unlink()
        made += 1
    for name, (source, portrait, seconds) in VIDEOS.items():
        src, dest = VID / source, OUT / "video" / f"{name}.mp4"
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            scale = "scale=720:-2" if portrait else "scale=1280:-2"
            run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-t", str(seconds), "-an", "-vf", f"{scale},fps=30,format=yuv420p",
                 "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-profile:v", "high", "-movflags", "+faststart", str(dest)])
            made += 1
        # Lighter copy for phones (picked by HeroVideo on small screens).
        small = dest.with_name(f"{name}-sm.mp4")
        if not small.exists():
            scale = "scale=480:-2" if portrait else "scale=640:-2"
            run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(dest), "-an", "-vf", f"{scale},fps=24,format=yuv420p",
                 "-c:v", "libx264", "-preset", "slow", "-crf", "31", "-profile:v", "main", "-movflags", "+faststart", str(small)])
            made += 1
        poster = dest.with_suffix(".webp")
        if not poster.exists():
            tmp = poster.with_suffix(".tmp.png")
            run(["ffmpeg", "-loglevel", "error", "-y", "-ss", "1", "-i", str(dest), "-frames:v", "1", str(tmp)])
            run(["cwebp", "-quiet", "-q", "75", str(tmp), "-o", str(poster)])
            tmp.unlink()
    print(f"Built {made} new files in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
