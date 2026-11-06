import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { MediaGallery } from "@/components/media/media-gallery";
import { media } from "@/lib/data/media";
export const metadata: Metadata = pageMetadata({ title: "Signage & Print Projects", description: "See signage, shopfront, neon, print and fleet projects by Signsnwraps across Melbourne, from first consultation to finished install, and plan your own project.", path: "/signs/projects" });
const signage = [media.signage.carpro, media.signage.stellaPizza, media.signage.yourChoice, media.signage.propbase, media.signage.punjabImports, media.signage.aClassBuilding, media.signage.legacyHub, media.signage.bombay, media.projects.bellevue, media.projects.skRoyalHomes, media.signage.fiveAb, media.signage.burgerFrenzi];
const shopfronts = [media.shopfronts.afghanBakery, media.shopfronts.sahibESwad, media.shopfronts.dansEntry, media.shopfronts.artyHair, media.shopfronts.dentist, media.shopfronts.cosmeticLaneway, media.shopfronts.dansPylon, media.shopfronts.quickSignage];
const printAndNeon = [media.neon.laCocina, media.neon.lahLahLand, media.neon.ultraBinHire, media.neon.litLetters, media.signage.primeWall, media.signage.spysar, media.printing.customArtRoll, media.printing.fenceBanners];
const vehicles = [media.projects.baazVan, media.projects.qwikRealEstate, media.projects.goldCoin, media.projects.friendlyCatering, media.projects.satisfryd, media.fleet.northStarsVan, media.fleet.aClassUte, media.fleet.hawkTruck];
export default function Page(){return <><section className="signs-project-intro"><div className="container"><span className="eyebrow">SIGNS · PRINT · PROJECTS</span><h1 className="heading-xl">Work that makes<br/>a brand visible.</h1><p className="body-lg">A selection of signage, shopfronts, neon, print and vehicle graphics made for businesses across Melbourne.</p></div></section>
<MediaGallery eyebrow="SIGNAGE" title="Building & business signs." images={signage} />
<MediaGallery eyebrow="SHOPFRONTS" title="First impressions." images={shopfronts} tone="plain" />
<MediaGallery eyebrow="NEON · PRINT" title="Light and print." images={printAndNeon} />
<MediaGallery eyebrow="VEHICLES" title="Brands on the move." images={vehicles} tone="plain" link={{ href: "/signs/fleet", label: "Explore fleet signage" }} />
</>;}
