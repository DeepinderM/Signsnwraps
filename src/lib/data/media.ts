// Real Signsnwraps work used across the site. Files are built from Assets/ into public/media/ by
// scripts/build-media.py (WebP images, silent MP4 videos with a poster frame). Alt text describes what's
// in each picture for search engines and screen readers; captions are the short label shown on galleries.

export type MediaImage = { src: string; alt: string; caption: string; width: number; height: number };
/** src is the full version; smallSrc a lighter copy for phones. */
export type MediaVideo = { src: string; smallSrc: string; poster: string; label: string; portrait?: boolean };

const sq = (name: string, caption: string, alt: string): MediaImage => ({ src: `/media/${name}.webp`, alt, caption, width: 1254, height: 1254 });
const wide = (name: string, caption: string, alt: string, width = 1600, height = 800): MediaImage => ({ src: `/media/${name}.webp`, alt, caption, width, height });
const video = (name: string, label: string, portrait = false): MediaVideo => ({ src: `/media/video/${name}.mp4`, smallSrc: `/media/video/${name}-sm.mp4`, poster: `/media/video/${name}.webp`, label, portrait });

export const media = {
  signage: {
    carpro: sq("signage/carpro", "Building signage · Car Pro Automotive", "Illuminated building sign for Car Pro Automotive roadworthy, EV and tyres"),
    yourChoice: sq("signage/your-choice", "Entry signage · Your Choice", "Backlit gold Your Choice logo sign above a glass entry"),
    primeWall: sq("signage/prime-wall", "Printed feature wall · Prime", "Floor-to-ceiling printed logo wall graphic in red and white"),
    spysar: sq("signage/spysar", "Building banners · Spysar", "Large printed building banners and a pylon sign for Spysar real estate"),
    stellaPizza: sq("signage/stella-pizza", "Fascia signage · Stella Pizza", "Illuminated fascia sign for Stella Pizza in Taylors Hill"),
    bombay: wide("signage/bombay", "Building sign · Bombay Real Estate", "Bombay Real Estate panel sign on a warehouse building", 1600, 1200),
    legacyHub: sq("signage/legacy-hub", "Wall logo · Legacy Hub", "Round Legacy Hub logo sign on a brick building"),
    propbase: sq("signage/propbase", "3D letters · Propbase", "Propbase 3D letter sign on a dark building facade"),
    punjabImports: sq("signage/punjab-imports", "Illuminated letters · Punjab Imports Xpress", "Large illuminated letters for Punjab Imports Xpress"),
    aClassBuilding: sq("signage/a-class-building", "Building sign · A Class Building Materials", "A Class Building Materials sign on a cladded commercial building"),
    fiveAb: sq("signage/5ab-homes", "Office sign · 5AB Homes", "5AB Homes logo printed on a brushed panel office sign"),
    burgerFrenzi: wide("signage/burger-frenzi", "Acrylic sign · Burger Frenzi", "Burger Frenzi printed acrylic panel sign", 1600, 1200),
  },
  shopfronts: {
    afghanBakery: sq("shopfronts/afghan-bakery", "Shopfront · Afghan Bakery", "Afghan Bakery shopfront with illuminated fascia signage at golden hour"),
    afghanBakeryTwilight: wide("shopfronts/afghan-bakery-twilight", "Shopfront at night · Afghan Bakery", "Afghan Bakery storefront signage lit at twilight", 1600, 900),
    dansEntry: sq("shopfronts/dans-entry", "Shopfront · Dans Seafood Outlet", "Dans Seafood Outlet entry with fascia and blade signage"),
    dansPylon: sq("shopfronts/dans-pylon", "Pylon sign · Dans Seafood Outlet", "Tall printed pylon sign for Dans Seafood Outlet"),
    dansInterior: sq("shopfronts/dans-interior", "Interior sign · Dans Seafood Outlet", "Dans Seafood Outlet sign above a roller door inside the shop"),
    quickSignage: sq("shopfronts/quick-signage", "Showroom · Quick Signage", "Quick Signage showroom facade with a wrapped Gutter-Vac trailer"),
    sahibESwad: sq("shopfronts/sahib-e-swad", "Shopfront · Sahib e Swad", "Sahib e Swad restaurant shopfront with illuminated fascia signage"),
    artyHair: sq("shopfronts/arty-hair", "Salon shopfront · Arty Hair Studio", "Arty Hair Studio and Dulge salon shopfront signage and window graphics"),
    dentist: sq("shopfronts/dentist", "Fascia sign · Healthwest Dental", "Healthwest Dental illuminated fascia sign"),
    cosmeticLaneway: sq("shopfronts/cosmetic-laneway", "Lettering · Cosmetic Laneway", "Cosmetic Laneway 3D lettering above an arched window"),
  },
  printing: {
    uvPrinter: sq("printing/uv-printer", "Large-format printing in the studio", "Large-format UV printer in the Signsnwraps print studio"),
    customArtPrint: sq("printing/custom-art-print", "Custom print · Tommy Custom Art", "Custom Art banner coming off the large-format printer"),
    customArtRoll: sq("printing/custom-art-roll", "Banner print · Tommy Custom Art", "Printed Tommy Custom Art banner on the print table"),
    fenceBanners: sq("printing/fence-banners", "Mesh fence banners", "Printed mesh banners along a site fence"),
  },
  neon: {
    litLetters: sq("neon/lit-letters", "Illuminated 3D letters", "Gold illuminated 3D letters during fabrication"),
    lahLahLand: sq("neon/lah-lah-land", "LED neon · Lah Lah Land", "Pink and blue LED neon sign reading Lah Lah Land"),
    laCocina: sq("neon/la-cocina", "LED neon · La Cocina", "Red LED neon La Cocina sign in a bar"),
    ultraBinHire: sq("neon/ultra-bin-hire", "Backlit office sign · Ultra Bin Hire", "Backlit Ultra Bin Hire logo sign in an office"),
    ultraOffice: wide("neon/ultra-office", "Installed · Ultra Bin Hire office", "Ultra Bin Hire illuminated logo installed on an office wall", 1600, 1200),
  },
  projects: {
    bellevue: sq("projects/bellevue", "Gate signage · Bellevue Receptions", "Bellevue Receptions sign above entrance gates"),
    friendlyCatering: sq("projects/friendly-catering", "Food trailer wrap · Friendly Catering", "Red Friendly Catering food trailer wrapped with menu graphics"),
    goldCoin: sq("projects/gold-coin", "Car signage · Gold Coin Real Estate", "White hatchback with Gold Coin Real Estate vehicle graphics"),
    skRoyalHomes: sq("projects/sk-royal-homes", "3D logo · SK Royal Homes", "Gold 3D SK Royal Homes logo on a concrete wall"),
    baazVan: sq("projects/baaz-van", "Van wrap · Baaz Painting Supplies", "Van wrapped for Baaz Painting Supplies"),
    qwikRealEstate: sq("projects/qwik-real-estate", "Vehicle graphics · Qwik Real Estate", "Yellow Qwik Real Estate logo on a black car door"),
    satisfryd: sq("projects/satisfryd", "Food trailer wrap · Satisfryd", "Black Satisfryd food trailer with flame graphics"),
  },
  fleet: {
    hawkPrimeMover: sq("fleet/hawk-prime-mover", "Prime mover · Hawk Logistics", "Hawk Logistics prime mover with branded livery"),
    dhillonBus: sq("fleet/dhillon-bus", "Bus livery · Dhillon", "Dhillon minibus with fleet livery"),
    dhillonCoaches: sq("fleet/dhillon-coaches", "Coach fleet · Dhillon", "Line of Dhillon coaches with matching livery"),
    hawkTrailer: sq("fleet/hawk-trailer", "Trailer graphics · Hawk Logistics", "Hawk Logistics refrigerated trailer with large logo graphics"),
    hawkTruck: sq("fleet/hawk-truck", "Truck and trailer · Hawk Logistics", "Hawk Logistics truck and trailer with full fleet branding"),
    dhillonCity: sq("fleet/dhillon-city", "Coach livery · Dhillon", "Dhillon coach with city skyline livery"),
    northStarsVan: sq("fleet/north-stars-van", "Van wrap · North Stars", "North Stars cleaning services van with a commercial wrap"),
    aClassUte: sq("fleet/a-class-ute", "Ute signage · A Class Fencing", "Black ute with A Class Fencing and Retaining vehicle signage"),
    igaTrailer: sq("fleet/iga-trailer", "Trailer graphics · IGA", "IGA refrigerated trailer with You can't beat local graphics"),
    foodlandTrailer: sq("fleet/foodland-trailer", "Trailer graphics · Foodland", "Foodland refrigerated trailer with printed graphics"),
    hawkRear: sq("fleet/hawk-rear", "Rear doors · Hawk Logistics", "Rear doors of a Hawk Logistics truck with logo and safety markings"),
  },
  wraps: {
    hawkBDouble: sq("wraps/hawk-b-double", "B-double wrap · Hawk Logistics", "Hawk Logistics B-double with wrapped trailers on the highway"),
    hawkCab: sq("wraps/hawk-cab", "Cab detail · Hawk Logistics", "Close-up of a Hawk Logistics truck cab with chrome and livery"),
    studioTruck: sq("wraps/studio-truck", "At the Signsnwraps studio", "Truck outside the Signsnwraps studio in Laverton North"),
    southernUte: sq("wraps/southern-ute", "Ute graphics · Southern Services Group", "White ute with Southern Services Group door graphics in the studio"),
    wrapShop: sq("wraps/wrap-shop", "Colour change · gloss blue", "Blue colour-change wrapped sports car outside a wrap shop"),
    truckHood: sq("wraps/truck-hood", "Truck protection in the studio", "Prime mover bonnet being protected in the wrap studio"),
    truckInstall: sq("wraps/truck-install", "Wrap installation", "Installer applying film to a truck panel"),
    ppfInstall: sq("wraps/ppf-install", "PPF installation", "Installer applying paint protection film to a green BMW"),
    ppfSqueegee: sq("wraps/ppf-squeegee", "PPF installation", "Paint protection film being squeegeed onto a green BMW guard"),
  },
  ppf: {
    colourRange: sq("ppf/colour-range", "Colour PPF · colour-shift", "Colour-shift PPF on an Audi with film rolls in the studio"),
    purpleBmw: sq("ppf/purple-bmw", "Colour PPF · gloss purple", "BMW finished in gloss purple colour PPF"),
    colourSamples: sq("ppf/colour-samples", "Colour PPF options", "Porsche showing several colour PPF panels"),
    aus390: wide("ppf/aus390-gold", "AUS 390 · Liquid Metal Gem Gold", "Supercar in AusPPF AUS 390 Liquid Metal Gem Gold colour PPF", 1600, 800),
    aus399: wide("ppf/aus399-red", "AUS 399 · Metallic Red", "SUV in AusPPF AUS 399 Metallic Red colour PPF", 1600, 800),
    aus403: wide("ppf/aus403-black", "AUS 403 · Super Black", "SUV in AusPPF AUS 403 Super Black colour PPF", 1600, 800),
    aus620: wide("ppf/aus620-nickel", "AUS 620 · Nickel Alloy", "Car in AusPPF AUS 620 Nickel Alloy matte chrome PPF", 1600, 800),
    aus621: wide("ppf/aus621-carbon", "AUS 621 · Carbon Fibre", "Ferrari in AusPPF AUS 621 carbon fibre PPF", 1600, 800),
  },
  kits: {
    wranglerSide: sq("kits/jeep-wrangler-side", "Jeep Wrangler · side coverage", "Jeep Wrangler showing pre-cut PPF kit coverage in blue from the side"),
    wranglerFront: sq("kits/jeep-wrangler-front", "Jeep Wrangler · front coverage", "Jeep Wrangler front showing pre-cut PPF kit coverage"),
    wranglerAngle: sq("kits/jeep-wrangler-angle", "Jeep Wrangler · full kit", "Jeep Wrangler three-quarter view with full PPF kit coverage highlighted"),
    gladiator: sq("kits/jeep-gladiator", "Jeep Gladiator · side coverage", "Jeep Gladiator pickup showing PPF kit coverage"),
    jimnySide: sq("kits/jimny-side", "Suzuki Jimny · side coverage", "Suzuki Jimny side view with PPF kit coverage highlighted"),
    jimnyFront: sq("kits/jimny-front", "Suzuki Jimny · front coverage", "Suzuki Jimny front three-quarter with PPF kit coverage"),
    jimnyAngle: sq("kits/jimny-angle", "Suzuki Jimny · full kit", "Suzuki Jimny with roof rack showing full PPF kit coverage"),
    jimnyBonnet: sq("kits/jimny-bonnet", "Suzuki Jimny · bonnet strip", "Suzuki Jimny bonnet strip PPF coverage detail"),
  },
};

export const videos = {
  fleet: video("fleet", "Fleet branding by Signsnwraps: buses, vans and trucks"),
  signsReel: video("signs-reel", "Signsnwraps signage and print work"),
  printing: video("printing", "Large-format printing and banners at Signsnwraps"),
  neon: video("neon", "LED neon and illuminated signs by Signsnwraps"),
  letters: video("letters", "3D letters and building signage by Signsnwraps"),
  truck: video("truck", "Truck wrap at the Signsnwraps studio", true),
};
