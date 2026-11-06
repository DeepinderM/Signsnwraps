"""Builds the Signs N Wraps PPF kit shop from a reference product export and our own kit images.

Usage (needs openpyxl, cwebp and ffmpeg):
  python3 scripts/convert-kit-catalogue.py docs/<reference-catalogue>.xlsx

Writes src/lib/data/kit-catalogue.json (vehicles + products) and product images to public/media/kits/.

The reference export is used for the range, vehicle fitments, options and prices only:
- every name, option and description is rewritten in our own words and under our own brand;
- prices are set 3–5% below the reference price (see our_price);
- images come only from Assets/Wraps-products (our own renders, 1000 px and larger).
The script stops if any third-party brand name would end up in the output.
"""
import collections
import json
import math
import pathlib
import re
import subprocess
import sys

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "Assets" / "Wraps-products"
OUT_JSON = ROOT / "src" / "lib" / "data" / "kit-catalogue.json"
OUT_MEDIA = ROOT / "public" / "media" / "kits"
BRAND = "Signs N Wraps"
# Names from the reference that must never appear on our site (checked on the final JSON).
FORBIDDEN = re.compile(r"bush|wrapz|\bcape\b|advance|vael|\bbw\b|shopify", re.I)

# ---------- naming ----------
FILM_VALUES = {
    "cape": "Essential film", "cape film": "Essential film",
    "advance": "Premium film", "advance film": "Premium film",
    "bushwrapz hd": "HD film", "bushwrapz pro gloss": "Pro Gloss film",
    "vael 75 gloss": "Ultra Gloss film", "vael gloss": "Ultra Gloss film",
    "gloss film": "Gloss film", "matte film": "Matte film", "matte": "Matte film",
}
OPTION_NAMES = {"select cab type": "Coverage", "film type": "Film", "color": "Film", "cab type": "Coverage", "kit": "Coverage", "tub option": "Tub",
                "to add bonnet strip?": "Bonnet strip", "select to add templated bonnet strip? (advance)": "Bonnet strip",
                "coverage options": "Coverage", "window options": "Windows", "year model": "Year", "roof": "Roof", "wash product": "Wash"}


ADDON_VALUES = {
    "no tailgate or bonnet strip": "None", "yes - add tailgate + bonnet strip": "Tailgate + bonnet strip", "tailgate only": "Tailgate only",
    "bonnet strip only": "Bonnet strip only", "no bonnet strip nor door cups": "None", "yes - door cups only": "Door cups only",
    "yes - add bonnet strip only": "Bonnet strip only", "yes - add both bonnet strip and door cups": "Bonnet strip + door cups",
    "no door cups": "No door cups", "yes - add door cups": "Add door cups", "cab only": "Cab only", "tub included": "Tub included",
    "gloss finish": "Gloss", "matte finish": "Matte", "add bonnet strip": "Add a bonnet strip", "yes bonnet strip": "Add a bonnet strip",
}


def option_name(name, values):
    low = name.lower()
    if "and/or" in low:
        return "Add-ons"
    if "door cups" in low:
        return "Door cups"
    if "bonnet strip" in low:
        return "Bonnet strip"
    if "grille strip" in low:
        return "Grille strips"
    if "snorkel" in low:
        return "Snorkel"
    if "film type" in low and all(re.search(r"(?i)gloss|matte", v) for v in values):
        return "Finish"
    return OPTION_NAMES.get(low, title_case(clean_value(name)))


def clean_value(value):
    v = str(value).strip()
    key = v.lower()
    if key in ADDON_VALUES:
        return ADDON_VALUES[key]
    if key in FILM_VALUES:
        return FILM_VALUES[key]
    v = re.sub(r"(?i)bushwrapz|bushies", BRAND, v)
    v = re.sub(r"(?i)\badvance\b", "Premium film", v)
    v = re.sub(r"(?i)\bcape\b", "Essential film", v)
    v = re.sub(r"\s*-\s*PPF Safe", " (PPF safe)", v)
    m = re.match(r"(?i)^yes\s*-?\s*add\s+(?:a\s+)?(.*?)\s*bonnet strip", v)
    if m:  # keep a trim name: "Yes - Add Z71 bonnet strip - (ADVANCE)" → "Add Z71 bonnet strip"
        return f"Add {m.group(1).strip()} bonnet strip" if m.group(1).strip() else "Add a bonnet strip"
    if re.match(r"(?i)^yes\b.*grille strip", v):
        return "Add grille strips"
    if re.match(r"(?i)^no\b.*grille strip", v):
        return "No grille strips"
    if re.match(r"(?i)^yes\b.*snorkel", v):
        return "Stock snorkel"
    v = re.sub(r"(?i)^no\b.*bonnet strip.*", "No bonnet strip", v)
    v = re.sub(r"(?i)^Yes - add tub$", "Add the tub", v)
    v = re.sub(r"(?i)^yes - add bonnet strip$", "Add a bonnet strip", v)
    v = re.sub(r"(?i)^No bonnet strip$", "No bonnet strip", v)
    return v


CODES = {"RAM", "GMC", "GWM", "KIA", "BYD", "PRO", "PPF", "DT", "DS", "HD", "PX", "SR", "NT", "XL", "MV", "MQ", "MR", "MU-X", "D-MAX", "FJ", "GU", "RG", "ZR2", "Z71", "INEOS", "FUSO"}


def title_case(text):
    """Shouting reference names read better in title case; model codes (RAM, D-MAX, N80, PX…) stay as they are."""
    small = {"AND", "OF", "WITH", "FOR", "THE"}
    out = []
    for i, w in enumerate(text.split()):
        core = re.sub(r"[^A-Za-z0-9-]", "", w)
        if not core.isupper() or core in CODES or re.search(r"\d", core):
            out.append(w)
        elif i and core in small:
            out.append(w.lower())
        else:
            out.append(w[0] + w[1:].lower() if len(core) > 1 else w)
    return " ".join(out)


# ---------- vehicles ----------
# make slug, display name, keywords that identify it in a reference name (first match wins)
MAKES = [
    ("land-rover", "Land Rover", ["land rover", "defender", "discovery"]),
    ("toyota", "Toyota", ["toyota", "hilux", "landcruiser", "land cruiser", "prado", "fortuner", "fj cruiser", "rav4", "70 series", "76, 78"]),
    ("ford", "Ford", ["ford", "ranger", "raptor", "everest", "f150", "f250", "f350"]),
    ("isuzu", "Isuzu", ["isuzu", "dmax", "d-max", "mux", "mu-x", "nps"]),
    ("mitsubishi", "Mitsubishi", ["mitsubishi", "triton", "pajero"]),
    ("mazda", "Mazda", ["mazda", "bt50", "bt 50", "bt-50"]),
    ("nissan", "Nissan", ["nissan", "navara", "patrol"]),
    ("suzuki", "Suzuki", ["suzuki", "jimny"]),
    ("jeep", "Jeep", ["jeep", "wrangler", "gladiator"]),
    ("volkswagen", "Volkswagen", ["volkswagen", "amarok"]),
    ("ram", "RAM", ["ram "]),
    ("gmc", "GMC", ["gmc", "sierra"]),
    ("chevrolet", "Chevrolet", ["chevrolet", "silverado"]),
    ("gwm", "GWM", ["gwm", "cannon", "tank"]),
    ("kia", "KIA", ["kia", "tasman"]),
    ("ineos", "INEOS", ["ineos", "grenadier", "quartermaster"]),
    ("holden", "Holden", ["holden", "colorado"]),
    ("byd", "BYD", ["byd", "shark"]),
    ("denza", "Denza", ["denza"]),
    ("fuso", "FUSO", ["fuso", "canter"]),
]
# per make: (pattern, model slug, model name, body) — first match wins
MODELS = {
    "toyota": [(r"hilux", "hilux", "Hilux", "Ute"), (r"7\d series|70 series|76, 78|landcruiser 7", "landcruiser-70", "LandCruiser 70 Series", "4WD"),
               (r"300", "landcruiser-300", "LandCruiser 300 Series", "4WD"), (r"200", "landcruiser-200", "LandCruiser 200 Series", "4WD"),
               (r"100/105|105|100 series", "landcruiser-100", "LandCruiser 100/105 Series", "4WD"), (r"80 series", "landcruiser-80", "LandCruiser 80 Series", "4WD"),
               (r"prado", "prado", "Prado", "4WD"), (r"fortuner", "fortuner", "Fortuner", "4WD"), (r"fj", "fj-cruiser", "FJ Cruiser", "4WD"), (r"rav4", "rav4", "RAV4", "SUV")],
    "ford": [(r"everest", "everest", "Everest", "4WD"), (r"ranger|raptor", "ranger", "Ranger", "Ute"), (r"f150", "f-150", "F-150", "Ute"), (r"f250", "f-250", "F-250", "Ute"), (r"f350", "f-350", "F-350", "Ute")],
    "isuzu": [(r"mu-?x", "mu-x", "MU-X", "4WD"), (r"d-?max", "d-max", "D-MAX", "Ute"), (r"nps", "nps", "NPS", "Ute")],
    "mitsubishi": [(r"pajero sport", "pajero-sport", "Pajero Sport", "4WD"), (r"pajero", "pajero", "Pajero", "4WD"), (r"triton", "triton", "Triton", "Ute")],
    "mazda": [(r"bt ?-?50", "bt-50", "BT-50", "Ute")],
    "nissan": [(r"navara", "navara", "Navara", "Ute"), (r"patrol y62|y62", "patrol-y62", "Patrol Y62", "4WD"), (r"patrol", "patrol-gu", "Patrol GU", "4WD")],
    "suzuki": [(r"jimny", "jimny", "Jimny", "4WD")],
    "jeep": [(r"gladiator", "gladiator", "Gladiator", "Ute"), (r"wrangler", "wrangler", "Wrangler", "4WD")],
    "volkswagen": [(r"amarok", "amarok", "Amarok", "Ute")],
    "ram": [(r"1500", "1500", "1500", "Ute"), (r"2500|3500", "2500-3500", "2500 / 3500", "Ute")],
    "gmc": [(r"sierra", "sierra", "Sierra", "Ute")],
    "chevrolet": [(r"silverado 1500|1500", "silverado-1500", "Silverado 1500", "Ute"), (r"2500|3500|silverado", "silverado-2500", "Silverado 2500 / 3500", "Ute")],
    "gwm": [(r"tank", "tank-300", "Tank 300", "4WD"), (r"cannon", "cannon", "Cannon", "Ute")],
    "kia": [(r"tasman", "tasman", "Tasman", "Ute")],
    "ineos": [(r"quartermaster", "quartermaster", "Quartermaster", "Ute"), (r"grenadier", "grenadier", "Grenadier", "4WD")],
    "land-rover": [(r"defender 90", "defender-90", "Defender 90", "4WD"), (r"defender", "defender-110", "Defender 110", "4WD"), (r"discovery", "discovery-4", "Discovery 4", "4WD")],
    "holden": [(r"colorado", "colorado", "Colorado", "Ute")],
    "byd": [(r"shark", "shark-6", "Shark 6", "Ute")],
    "denza": [(r"b8", "b8", "B8", "SUV")],
    "fuso": [(r"canter", "canter", "Canter", "Ute")],
}
CURRENT_YEAR = 2026


def find_vehicle(text):
    low = f" {text.lower()} "
    for slug, name, keys in MAKES:
        if any(k in low for k in keys):
            for pattern, mslug, mname, body in MODELS[slug]:
                if re.search(pattern, low):
                    return slug, name, mslug, mname, body
            return None
    return None


def years_in(text):
    """'2024 - Current', '2012 -2020', '(2022 - Current)', '2010 - 2023' → list of years."""
    t = text.lower().replace("early ", "")
    m = re.search(r"((?:19|20)\d\d)\s*(?:-|–|to)\s*((?:19|20)\d\d|curr?ent|curren)", t)
    if m:
        start = int(m.group(1)); end = CURRENT_YEAR if not m.group(2)[0].isdigit() else int(m.group(2))
        return list(range(min(end, CURRENT_YEAR), start - 1, -1))[:30]
    m = re.search(r"((?:19|20)\d\d)\s*\+", t)
    if m:
        return list(range(CURRENT_YEAR, int(m.group(1)) - 1, -1))
    return []


def slugify(text):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text.lower())).strip("-")[:90]


# ---------- pricing ----------
DISCOUNT = 0.10  # our prices are 10% below the reference price


def our_price(price):
    """Exactly 10% below the reference price, to the cent ($1,375 → $1,237.50; $85 → $76.50)."""
    return int(math.floor(price * 100 * (1 - DISCOUNT) + 0.5))


# ---------- product classification and wording ----------
SKIP_TYPES = {"CARAVAN", "MARINE", "MERCH", "Gift Card", "FILM BY THE METER", ""}


def kind_of(row):
    name, ptype = row["Product"], row["Product Type"] or ""
    low = name.lower()
    if ptype in ("TOOLS", "DETAILING"):
        return "tool"
    if ptype == "UNIVERSAL" or "universal" in low:
        return "universal"
    if re.match(r"^(left|right) ", low) or low.startswith("custom") or "cape custom" in low or "offcut" in low:
        return "panel"
    if "bonnet strip" in low or "bonnet protector" in low or "grille surround" in low or "glare deflector" in low or "grill surround" in low:
        return "bonnet"
    if "tailgate" in low or "luggage strip" in low:
        return "tailgate"
    if "door cups" in low:
        return "doorcups"
    if (ptype == "PRO" or re.search(r"\bpro\b", low)) and "roof" in low:
        return "roof"
    if ptype == "PRO" or re.search(r"\bpro\b", low):
        return "pro"
    return "kit"


KIND_LABEL = {"kit": "PPF Kit", "pro": "PRO PPF Kit", "roof": "PRO Roof Kit", "bonnet": "Bonnet Strip", "tailgate": "Tailgate Kit", "doorcups": "Door Cup Kit"}


def vehicle_label(name):
    """The 'to suit …' part of a reference name, tidied: 'Isuzu DMAX Dual Cab 2024 - Current' → 'Isuzu D-MAX Dual Cab (2024–current)'."""
    m = re.search(r"(?i)\bto suit\b\s*(.*)$", name)
    v = m.group(1) if m else re.sub(r"(?i)\b(bushwrapz|bushies)\b\s*(pro|kit|tailgate)?\s*-?\s*", "", name)
    v = re.sub(r"(?i)\bpro\b|\broofs?\b|\btailgate\b|\bbonnet strip\b|templated", "", v) if not m else v
    v = re.sub(r"(?i)\bDMAX\b", "D-MAX", v)
    v = re.sub(r"(?i)\bMUX\b", "MU-X", v)
    v = re.sub(r"(?i)\bBT ?50\b", "BT-50", v)
    v = re.sub(r"(?i)landcruiser", "LandCruiser", v)
    v = re.sub(r"(?i)\b((?:19|20)\d\d)\s*-\s*early\s*((?:19|20)\d\d)", r"(\1–early \2)", v)
    v = re.sub(r"\(\s*((?:19|20)\d\d)\s*-\s*(Curr?ent|Curren)\s*\)?", r"(\1–current)", v)
    v = re.sub(r"\b((?:19|20)\d\d)\s*-\s*(Curr?ent)\b", r"(\1–current)", v)
    v = re.sub(r"\(\s*((?:19|20)\d\d)\s*-\s*((?:19|20)\d\d)\s*\)", r"(\1–\2)", v)
    v = re.sub(r"\b((?:19|20)\d\d)\s*-\s*((?:19|20)\d\d)\b", r"(\1–\2)", v)
    v = re.sub(r"\s{2,}", " ", v).strip(" -")
    return title_case(v)


def describe(kind, label, options):
    coverage = any(o["name"] == "Coverage" for o in options)
    grade = " Made with our Premium film: thick, tough and clear for long-lasting protection." if kind not in ("tool", "universal") else ""
    tub = " Order the cab only, or add the tub for full side coverage." if coverage else ""
    if kind == "kit":
        return (f"Pre-cut paint protection film kit to suit the {label}. Every piece is cut to the panel shape, so it goes on cleanly at home "
                f"or at our Laverton North studio.{grade}{tub} Includes fitting instructions; check your year, trim and body style before ordering.")
    if kind == "pro":
        return (f"Our PRO kit for the {label}: wider, studio-grade coverage with edges planned for a near-invisible finish. Best fitted by an "
                f"experienced installer or at our Laverton North studio.{grade}{tub}")
    if kind == "roof":
        return f"PRO-grade film for the roof of the {label}, cut around aerials and fittings so the edges sit cleanly.{grade}"
    if kind == "bonnet":
        return f"Pre-cut protection for the leading edge of the bonnet on the {label}, where stone chips hit first. Quick to fit and great value.{grade}"
    if kind == "tailgate":
        return f"Pre-cut protection for the tailgate of the {label}, so loading gear and tie-downs don't mark the paint.{grade}"
    if kind == "doorcups":
        return f"Clear film for the door handle cups on the {label}, where rings and keys scratch the paint every day."
    if kind == "panel":
        return f"A single pre-cut replacement piece ({label}). Ideal for refreshing one panel or repairing part of an existing kit.{grade}"
    if kind == "universal":
        return f"{label}: universal clear protection pieces for high-wear spots, trimmed to suit most vehicles."
    return f"{label}. Handy for installing, maintaining and caring for paint protection film."


# ---------- images ----------
# Our renders in the make folders, matched to models by file name.
MAKE_FOLDER_IMAGES = {
    ("jeep", "wrangler"): ["Jeep/jeep-Wrangler-JL-2-door-side-1.webp", "Jeep/jeep-Wrangler-JL-2-door-side-2.webp", "Jeep/jeep-Wrangler-JL-2-door-side-3.webp"],
    ("jeep", "gladiator"): ["Jeep/jeep-gladiater-nightEagle_rubicon-side-1-cab.webp", "Jeep/jeep-gladiater-nightEagle_rubicon-side-1-tub.webp"],
    ("kia", "tasman"): ["KIA /kia-side-1-cab.webp", "KIA /kia-side-1-tub.webp", "KIA /kia-side-1-front.webp"],
    ("land-rover", "defender-110"): ["Land Rover /land--over-side-1-cab.webp", "Land Rover /land -over-side-1-tub.webp"],
    ("land-rover", "defender-90"): ["Land Rover /land rover-JL-2-door-side-1.webp"],
    ("land-rover", "discovery-4"): ["Land Rover /land rover-JL-2-door-side-2.webp"],
    ("mitsubishi", "triton"): ["Mitsubishi/mitsubishi--side-1-cab.webp", "Mitsubishi/mitsubishi-front-Facing-2.webp", "Mitsubishi/mitsubishi-back-Facing-1.webp"],
    ("mitsubishi", "pajero"): ["Mitsubishi/mitsubishi-front-Facing.webp", "Mitsubishi/mitsubishi-back-Facing.webp"],
    ("mitsubishi", "pajero-sport"): ["Mitsubishi/mitsubishi-slide-1.webp", "Mitsubishi/mitsubishi-slide-2.webp", "Mitsubishi/mitsubishi-slide-3.webp", "Mitsubishi/mitsubishi-slide-4.webp", "Mitsubishi/mitsubishi-slide-2-tub.webp"],
    ("volkswagen", "amarok"): ["Volkswagen /volkswagen-side-1-cab.webp", "Volkswagen /volkswagen-side-1-tub.webp", "Volkswagen /Volkswagen-side-1.webp", "Volkswagen /Volkswagen-side-2.webp", "Volkswagen /Front-Facing-volkswagem.webp", "Volkswagen /back-Facing-volkswagem.webp"],
    ("mazda", "bt-50"): ["mazda /mazda-side-1-cab.webp", "mazda /mazda-side-2-tub.webp", "mazda /mazda-side-1.webp", "mazda /mazda-side-2.webp", "mazda /mazda-side-3.webp"],
    ("nissan", "patrol-y62"): ["nissan/nissan-side-1.webp", "nissan/nissan-side-1-tub.webp", "nissan/nissan-side-2-cab.webp", "nissan/nissan-front-bonnet-strip.webp"],
    ("nissan", "patrol-gu"): ["nissan/nissan-side-2.webp", "nissan/nissan-side-3.webp"],
    ("ram", "1500"): ["ram/RAM-1500-Crew-Cab-Comparison.webp", "ram/ram-1500-Express-Quad-Cab.webp", "ram/RAM-back-Facing-1.webp", "ram/RAM-front-Facing-1.webp"],
    ("ram", "2500-3500"): ["ram/RAM-2500-Studio-Truck.webp", "ram/RAM-side-1-cab.webp", "ram/RAM-side-1-tub.webp"],
    ("suzuki", "jimny"): ["suzuki/01.webp", "suzuki/suzuki jimny-side-1-tub.webp", "suzuki/suzuki jimny-side-2-cab.webp", "suzuki/suzuki-jimny-front-bonnet-strip.webp"],
    ("toyota", "hilux"): ["toyota/toyota-side-1.webp", "toyota/toyota-back.webp", "toyota/toyota-front-bonnet-strip-3.webp", "toyota/toyota-Bonnet-1.webp"],
    ("toyota", "fj-cruiser"): ["toyota/toyota-side-1-cab.webp", "toyota/toyota-side-1-tub.webp"],
    ("toyota", "landcruiser-70"): ["toyota/toyota-front-bonnet-strip-1.webp"],
    ("toyota", "landcruiser-300"): ["toyota/toyota-front-bonnet-strip-2.webp"],
}
# Specific pictures for some product kinds on a model (e.g. the bonnet strip shot for bonnet strips).
KIND_IMAGES = {
    ("nissan", "patrol-y62", "bonnet"): ["nissan/nissan-front-bonnet-strip.webp"],
    ("toyota", "hilux", "bonnet"): ["toyota/toyota-front-bonnet-strip-3.webp", "toyota/toyota-Bonnet-1.webp"],
    ("toyota", "hilux", "tailgate"): ["toyota/toyota-back.webp"],
    ("volkswagen", "amarok", "bonnet"): ["Volkswagen /Front-Facing-volkswagem.webp"],
    ("volkswagen", "amarok", "tailgate"): ["Volkswagen /back-Facing-volkswagem.webp"],
    ("ram", "1500", "tailgate"): ["ram/RAM-back-Facing-1.webp"],
    ("ram", "1500", "bonnet"): ["ram/RAM-front-Facing-1.webp"],
    ("suzuki", "jimny", "bonnet"): ["suzuki/suzuki-jimny-front-bonnet-strip.webp"],
    ("kia", "tasman", "bonnet"): ["KIA /kia-side-1-front.webp"],
    ("toyota", "landcruiser-70", "bonnet"): ["toyota/toyota-front-bonnet-strip-1.webp"],
    ("toyota", "landcruiser-300", "bonnet"): ["toyota/toyota-front-bonnet-strip-2.webp"],
}
UNIVERSAL_IMAGES = {"door cup": "universal-kit /car-universal-kit-door-cups.webp", "door edge": "universal-kit /car-universal-kit-door-edges.webp",
                    "sill": "universal-kit /car-universal-kit-door-sills-4pack.webp", "luggage": "universal-kit /car-universal-kit-luggage-strip.webp",
                    "bike": "universal-kit /bike-universal-kit.webp", "bonnet": "universal-kit /car-universal-kit-luggage-strip.webp"}
TOOL_IMAGES = {"towel": "KIA /kia-towel.webp"}
# Make logos for the "shop by car brand" grid (makes without one show their name instead).
LOGOS = {"gmc": "GMC/GMC logo.png", "gwm": "GWM/GWM logo.png", "holden": "Holden/Holden logo.png", "ineos": "INEOS/INEOS logo.png", "isuzu": "Isuzu/Isuzu logo.png",
         "jeep": "Jeep/jeep-logo.webp", "kia": "KIA /kia-logo.webp", "land-rover": "Land Rover /landrover-logo.webp", "mitsubishi": "Mitsubishi/mitsubishi-logo.webp",
         "volkswagen": "Volkswagen /volkswagen-logo.webp", "mazda": "mazda /mazda-logo.webp", "nissan": "nissan/nissan-logo.webp", "ram": "ram/RAM-logo.webp",
         "suzuki": "suzuki/suzuki-logo.webp", "toyota": "toyota/toyota-logo.webp"}
MIN_IMAGE_PX = 1000  # smaller files in the folders aren't our renders
# Pictures that carry another business's contact details (found by text recognition): never published.
EXCLUDED_IMAGES = {
    "Isuzu/BushWrapz Kit - To Suit Isuzu DMAX Dual Cab 2020 - 2023/4.png",
    "Isuzu/BushWrapz Kit - To Suit Isuzu DMAX Dual Cab 2024 - Current/6.png",
    "Isuzu/BushWrapz Kit - To Suit Isuzu NPS Crew Cab/4.png",
}


def image_width(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", str(path)], capture_output=True, text=True).stdout
    m = re.search(r"pixelWidth: (\d+)", out)
    return int(m.group(1)) if m else 0


def product_folder_images(*names):
    """Our renders in a per-product folder, in order. A folder can be named with our product ID
    (e.g. Assets/Wraps-products/Ford/kit-ford-ranger-ppf-kit-ranger-raptor/1.png) or after the reference product."""
    keys = {re.sub(r"[^a-z0-9]", "", name.lower()) for name in names if name}
    for folder in ASSETS.glob("*/*"):
        if folder.is_dir() and re.sub(r"[^a-z0-9]", "", folder.name.lower()) in keys:
            files = sorted((f for f in folder.iterdir() if f.suffix.lower() in (".png", ".webp", ".jpg", ".jpeg")), key=lambda f: int(re.sub(r"\D", "", f.stem) or 0))
            return [f for f in files if image_width(f) >= MIN_IMAGE_PX and str(f.relative_to(ASSETS)) not in EXCLUDED_IMAGES]
    return []


built = {}


def publish(src, name):
    """Convert one source image to public/media/kits/<name>.webp (once) and return its URL."""
    if src in built:
        return built[src]
    dest = OUT_MEDIA / f"{name}.webp"
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        tmp = dest.with_suffix(".tmp.png")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-vf", "scale='min(1254,iw)':-2,format=rgba", str(tmp)], check=True)
        subprocess.run(["cwebp", "-quiet", "-q", "80", "-m", "6", "-alpha_q", "100", str(tmp), "-o", str(dest)], check=True)
        tmp.unlink()
    built[src] = f"/media/kits/{name}.webp"
    return built[src]


# ---------- film ----------
GRADE_FILMS = {"Essential film", "Premium film", "HD film", "Pro Gloss film", "Ultra Gloss film"}


def premium_only(options, variants):
    """We sell one film grade, Premium. Keep only the Premium-film variants (for PRO kits sold in several grades, the top
    grade, which becomes our Premium film) and drop the Film choice. Gloss / Matte is a finish, so it stays as "Finish"."""
    index = next((i for i, o in enumerate(options) if o["name"] == "Film"), None)
    if index is None:
        return options, variants
    films = options[index]["values"]
    if not set(films) <= GRADE_FILMS:
        options = [dict(o, name="Finish") if i == index else o for i, o in enumerate(options)]
        return options, variants
    keep = "Premium film" if "Premium film" in films else max(films, key=lambda f: max(v["priceCents"] for v in variants if v["values"][index] == f))
    kept = []
    for v in variants:
        if v["values"][index] != keep:
            continue
        values = [x for i, x in enumerate(v["values"]) if i != index]
        kept.append({"key": slugify(" ".join(values)) or "default", "label": " · ".join(values), "values": values, "priceCents": v["priceCents"]})
    return [o for i, o in enumerate(options) if i != index], kept


# ---------- main ----------
def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    sheet = list(wb["Products"].iter_rows(values_only=True)); head = sheet[0]
    rows = [dict(zip(head, r)) for r in sheet[1:]]
    vsheet = list(wb["Variants & Pricing"].iter_rows(values_only=True)); vhead = vsheet[0]
    variants_by = collections.defaultdict(list)
    for r in vsheet[1:]:
        r = dict(zip(vhead, r)); variants_by[r["Product"]].append(r)

    products, vehicles, skipped = [], {}, collections.Counter()
    seen_ids = set()
    for order, row in enumerate(rows):
        name, ptype = row["Product"], row["Product Type"] or ""
        if ptype in SKIP_TYPES or re.match(r"(?i)^free\b|sample pack|replacement panels$|^(tailgate|roof|roof strip)$", name.strip()):
            skipped[ptype or "other"] += 1; continue
        kind = kind_of(row)
        found = find_vehicle(name) if kind not in ("tool", "universal") else None
        if kind in ("kit", "pro", "roof", "bonnet", "tailgate", "doorcups") and not found:
            if kind == "pro" and re.match(r"(?i)^(roof strip|roof|tailgate)$", name):
                skipped["pro (no vehicle)"] += 1; continue
            kind = "panel"
        # options and variants
        options = []
        for i in (1, 2, 3):
            oname, ovals = row.get(f"Option {i}"), row.get(f"Option {i} Values")
            if not oname or oname == "Title":
                continue
            values = [clean_value(v) for v in str(ovals).split(" | ") if v and v.strip().upper() != "PLEASE SELECT"]
            options.append({"name": option_name(oname, values), "values": values})
        variants = []
        for v in variants_by[name]:
            values = [clean_value(v[f"Option {i} Value"]) for i in (1, 2, 3) if v.get(f"Option {i}") and v.get(f"Option {i}") != "Title"]
            if any(str(v.get(f"Option {i} Value") or "").upper() == "PLEASE SELECT" for i in (1, 2, 3)):
                continue
            price = float(v["Price (AUD)"] or 0)
            if price <= 0:
                continue
            variants.append({"key": slugify(" ".join(values)) or "default", "label": " · ".join(values), "values": values, "priceCents": our_price(price)})
        if not variants:
            skipped["no price"] += 1; continue
        options, variants = premium_only(options, variants)
        keys = [v["key"] for v in variants]
        if len(keys) != len(set(keys)):
            sys.exit(f"{name}: two options ended up with the same name {keys}; fix ADDON_VALUES / clean_value")
        # name, id, fitment
        if found:
            mslug, mname, model_slug, model_name, body = found
            label = vehicle_label(name)
            if not label.lower().startswith(mname.lower()):
                label = f"{mname} {label}"
            title = f"{BRAND} {KIND_LABEL.get(kind, 'PPF Kit')} to suit {label}" if kind != "panel" else f"{label} replacement panel"
            years = years_in(name)
            rest = re.sub(r"(?i)^" + re.escape(mname) + r"\s*", "", label)
            kit_slug = slugify(KIND_LABEL.get(kind, "kit") + " " + rest) or slugify(KIND_LABEL.get(kind, "kit"))
            pid = f"kit-{mslug}-{model_slug}-{kit_slug}"[:120].rstrip("-")
            make = vehicles.setdefault(mslug, {"slug": mslug, "name": mname, "models": {}})
            model = make["models"].setdefault(model_slug, {"slug": model_slug, "name": model_name, "body": body, "years": set()})
            model["years"].update(years)
            category, fitment = "vehicle-kit", {"make": mslug, "model": model_slug, "coverage": pid[len(f"kit-{mslug}-{model_slug}-"):]}
        else:
            label = re.sub(r"(?i)\bbushwrapz\b|\bbushies\b|^the bw\b|\bbw\b", BRAND, title_case(name)).replace(f"{BRAND} {BRAND}", BRAND)
            label = re.sub(r"^PRO - (.*)$", r"\1 (PRO)", label).replace("Roofs", "Roof")
            label = re.sub(r"(?i)^cape custom panels$", "Custom PPF panels", label)
            label = re.sub(r"(?i)^offcut pack of paint protection film \(ppf\)$", "PPF offcut pack", label)
            label = re.sub(r"(?i)install kegs", "Install Solution Kegs", label)
            title = label if kind != "panel" or re.search(r"(?i)panel|pack|roof|tailgate|flares", label) else f"{label} replacement panel"
            category = {"tool": "tools", "universal": "universal", "panel": "replacement-panels"}[kind]
            pid = f"{category}-{slugify(title)}"[:120].rstrip("-")
            fitment, years = None, []
        if pid in seen_ids:
            pid = f"{pid}-{order}"
        seen_ids.add(pid)
        # images: per-product folder first, then model / kind pictures from the make folders
        srcs = product_folder_images(pid, name)
        if found:
            srcs += [ASSETS / p for p in KIND_IMAGES.get((found[0], found[2], kind), [])]
            if kind in ("kit", "pro", "doorcups") or not srcs:
                srcs += [ASSETS / p for p in MAKE_FOLDER_IMAGES.get((found[0], found[2]), [])]
        elif kind == "universal":
            srcs += [ASSETS / p for k, p in UNIVERSAL_IMAGES.items() if k in title.lower()][:1]
        elif kind == "tool":
            srcs += [ASSETS / p for k, p in TOOL_IMAGES.items() if k in title.lower()][:1]
        images, seen = [], set()
        for i, src in enumerate(srcs):
            if src in seen or not src.exists():
                continue
            seen.add(src)
            # Per-product folder pictures are named after our product; make-folder pictures after their own file.
            own = src.parent.parent != ASSETS
            stem = (fitment["coverage"] if fitment else slugify(title)) if own else slugify(src.stem)
            base = f"{fitment['make']}/{fitment['model']}/{stem}" if fitment else f"{category}/{stem}"
            images.append(publish(src, f"{base}-{len(images) + 1}" if own else base))
            if len(images) >= 8:
                break
        products.append({
            "id": pid, "name": title, "category": category, "description": describe(kind, label, options),
            "priceCents": min(v["priceCents"] for v in variants), "imageUrl": images[0] if images else None, "images": images,
            "stock": None, "active": True, "sample": False, "sortOrder": order,
            "fitment": fitment, "years": years, "options": options if len(variants) > 1 else [], "variants": variants if len(variants) > 1 else [],
        })

    # Each model gets a picture for the "choose your car" step: a full kit's first photo if there is one.
    def model_image(make_slug, model_slug):
        kits = [p for p in products if p["fitment"] and p["fitment"]["make"] == make_slug and p["fitment"]["model"] == model_slug and p["images"]]
        kits.sort(key=lambda p: (not p["fitment"]["coverage"].startswith("ppf-kit"), p["sortOrder"]))
        return kits[0]["images"][0] if kits else None
    makes = [{**m, "logo": publish(ASSETS / LOGOS[m["slug"]], f"logos/{m['slug']}") if m["slug"] in LOGOS else None,
              "models": sorted(({**model, "years": sorted(model["years"], reverse=True), "image": model_image(m["slug"], model["slug"]),
                                 "kits": sum(1 for p in products if p["fitment"] and p["fitment"]["make"] == m["slug"] and p["fitment"]["model"] == model["slug"])}
                                for model in m["models"].values()), key=lambda x: x["name"])}
             for m in sorted(vehicles.values(), key=lambda x: x["name"])]
    data = {"makes": makes, "products": products}
    text = json.dumps(data, indent=1, ensure_ascii=False)
    bad = sorted({m.group(0) for m in FORBIDDEN.finditer(text)})
    if bad:
        hits = [p["name"] for p in products if FORBIDDEN.search(json.dumps(p))][:10]
        sys.exit(f"Third-party names left in the output: {bad}\n  e.g. {hits}")
    OUT_JSON.write_text(text)
    print(f"{len(products)} products ({collections.Counter(p['category'] for p in products)}), {sum(len(m['models']) for m in makes)} models across {len(makes)} makes, "
          f"{len(built)} images; skipped {dict(skipped)}")


if __name__ == "__main__":
    main()
