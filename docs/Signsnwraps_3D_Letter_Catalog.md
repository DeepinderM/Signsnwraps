# Signsnwraps — 3D Letter Sign Catalog

One code tells everyone everything:
- **Client** → what they're getting and the price
- **Production** → exactly what to build

---

## 1. How to read a code

```
3DL  -  LF  -  H300  -  D45  -  ACR  -  ALU  -  PVC
 │       │       │        │       │       │       │
Type   Light  Height   Depth   Face    Sides   Back
```

**Reads as:** 3D Letter · Front-lit · up to 300mm tall · 45mm deep · Acrylic face · Aluminium sides · PVC back

Always 7 parts, always in this order.

---

## 2. The 7 parts

### ① Type
| Code | Meaning |
|---|---|
| `3DL` | 3D Letter |
| `3DLOG` | 3D Logo / shape (priced like a letter of the same height) |

### ② Light — the most important part
**Rule: `NL` = no light at all. Every lit option starts with `L`.**

| Code | Name | What the client sees | What production builds | Price column |
|---|---|---|---|---|
| `NL` | **No light** | Solid letter, no glow | **No LEDs, no power supply, no wiring** | No Light |
| `LF` | Front-lit | Letter face glows | LEDs inside, translucent acrylic face | Lit |
| `LH` | Halo-lit | Glow behind letter onto the wall | LEDs inside, solid metal face, clear back, letters stood off wall | Lit |
| `LFH` | Front + Halo | Face glows + glow behind | LEDs inside, translucent face, clear back, stood off wall | Lit |
| `LRGB` | RGB colour-change | Face changes colour | RGB LEDs + controller | Lit + [PRICE] |

### ③ Height (tallest letter)
`H` + top of the height band → see price table (section 3).
Example: a 280mm letter falls in 251–300mm → `H300`

### ④ Depth (how far it sticks out)
| Code | Depth | Typical use |
|---|---|---|
| `D20` | 20mm | Small non-lit letters |
| `D30` | 30mm | Standard non-lit |
| `D45` | 45mm | **Standard lit** |
| `D50` | 50mm | Stainless / premium |
| `D75` | 75mm | Large letters |
| `D100` | 100mm | Extra large / high-impact |

### ⑤ Face (front of letter) · ⑥ Sides · ⑦ Back
| Code | Material | Use on |
|---|---|---|
| `ACR` | Acrylic (colour on job note) | Face, sides, back |
| `ACC` | Clear acrylic | Back (halo letters) |
| `ALU` | Aluminium (powder-coat colour on job note) | Face, sides, back |
| `SS` | Stainless steel (brushed) | Face, sides |
| `PVC` | PVC | Sides, back |

**Colours / PMS / finish are never in the code** — write them on the job note, e.g. *Face: White acrylic · Sides: Black powder coat*.

---

## 3. Price per letter

| Height | Code | **No light** `NL` | **Lit** `LF` `LH` `LFH` `LRGB` |
|---|---|---|---|
| Up to 80mm | `H080` | $90 | $150 |
| 81–100mm | `H100` | $87 | $145 |
| 101–150mm | `H150` | $111 | $185 |
| 151–200mm | `H200` | $123 | $205 |
| 201–250mm | `H250` | $132 | $220 |
| 251–300mm | `H300` | $138 | $230 |
| 301–350mm | `H350` | $144 | $240 |
| 351–400mm | `H400` | $150 | $250 |
| 401–450mm | `H450` | $156 | $260 |
| 451–500mm | `H500` | $162 | $270 |
| 501–550mm | `H550` | $177 | $295 |
| 551–600mm | `H600` | $219 | $365 |
| 601–650mm | `H650` | $246 | $410 |
| 651–700mm | `H700` | $282 | $470 |
| 701–750mm | `H750` | $300 | $500 |
| 751–800mm | `H800` | $312 | $520 |
| 801–850mm | `H850` | $420 | $700 |
| 851–900mm | `H900` | $480 | $800 |
| 901–950mm | `H950` | $540 | $900 |
| 951–1000mm | `H1000` | $600 | $1,000 |
| Over 1000mm | `HPOA` | POA | POA |

**Quote = number of letters × price per letter.** Spaces are free. Prices [ex / inc] GST.

---

## 4. Ready-made builds (pick one, add the height)

| Build | Code | Client sees | Production builds |
|---|---|---|---|
| **Classic Front-lit** | `3DL-LF-H___-D45-ACR-ALU-PVC` | Bright glowing letters | Acrylic face, aluminium sides, PVC back, LEDs |
| **Premium Halo** | `3DL-LH-H___-D45-SS-SS-ACC` | Stainless letters with glow behind | Stainless face + sides, clear back, LEDs, stand-offs |
| **Front + Halo** | `3DL-LFH-H___-D45-ACR-ALU-ACC` | Face + wall glow | Acrylic face, aluminium sides, clear back, LEDs, stand-offs |
| **RGB Colour** | `3DL-LRGB-H___-D45-ACR-ALU-PVC` | Colour-changing letters | Acrylic face, aluminium sides, PVC back, RGB LEDs + controller |
| **Budget Non-lit** | `3DL-NL-H___-D30-ACR-PVC-PVC` | Solid coloured letters | Acrylic face, PVC sides + back. No LEDs |
| **Solid Acrylic** | `3DL-NL-H___-D45-ACR-ACR-ACR` | Solid block letters | All acrylic. No LEDs |
| **Aluminium Non-lit** | `3DL-NL-H___-D45-ALU-ALU-ALU` | Powder-coated metal letters | Fabricated aluminium. No LEDs |
| **Stainless Non-lit** | `3DL-NL-H___-D50-SS-SS-SS` | Brushed stainless letters | Fabricated stainless. No LEDs |

---

## 5. Build rules (production check)

| If Light is… | Face must be | Back must be | Never |
|---|---|---|---|
| `NL` | Any | Any | No LEDs, no power supply, no wiring, no clear parts needed |
| `LF` | `ACR` (translucent) | `PVC` / `ALU` | Metal face (light can't get through) |
| `LH` | `ALU` / `SS` (solid) | `ACC` (clear) | Translucent face, solid back |
| `LFH` | `ACR` (translucent) | `ACC` (clear) | Solid face or solid back |
| `LRGB` | `ACR` (translucent) | `PVC` / `ALU` | Metal face |

If a code breaks a rule → send back to sales before production starts.

---

## 6. Extras

| Item | Code | Price |
|---|---|---|
| Illuminated horizontal line / underline | `3DL-LINE` | $300 each |
| Installation | `INST-3DL` | [PRICE] |
| Mounting panel / backing | `3DL-PANEL` | [PRICE] |

---

## 7. Quote example

**Sign: "BAKERY" — Classic Front-lit, 300mm**

| Line | Code | Qty | Unit | Total |
|---|---|---|---|---|
| 3D Letter, Front-lit, up to 300mm | `3DL-LF-H300-D45-ACR-ALU-PVC` | 6 | $230 | $1,380 |
| Job note | Face: White acrylic · Sides: Black powder coat · LED: Cool white | | | |
| Installation | `INST-3DL` | 1 | [PRICE] | [PRICE] |

- **Client reads:** 6 front-lit letters, 300mm tall, white face, black sides.
- **Production reads:** acrylic face, 45mm aluminium returns, PVC back, LEDs inside.

Final price confirmed after artwork and site check.
