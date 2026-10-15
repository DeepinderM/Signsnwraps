import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

// Default social share image for every page (pages can add their own opengraph-image to override).
export const alt = "Signsnwraps: signage, printing, vehicle wraps and paint protection film in Laverton North, Melbourne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoSrc = `data:image/png;base64,${await readFile(join(process.cwd(), "Assets/logo-black-blue.png"), "base64")}`;

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", color: "#000", gap: 26, borderBottom: "18px solid #03AAFA" }}>
      <img src={logoSrc} width={900} height={314} alt="" />
      <div style={{ fontSize: 34, letterSpacing: 2, color: "#000", fontWeight: 800 }}>SIGNS · PRINT · VEHICLE WRAPS · PPF</div>
      <div style={{ fontSize: 26, color: "#444" }}>Expert advice. Bold results. · Laverton North, Melbourne</div>
    </div>,
    size,
  );
}
