# InteriorShopApps — Design System v1.0

## Brand Direction
**Premium Warm Modern** — Inspired by luxury interior design brands. We blend the sophistication of high-end interiors with the clarity of modern SaaS design. Think: if Aesop and Stripe had a baby that sold blinds software.

## Design Principles

### 1. Quiet Confidence
No screaming colours or flashy animations. Let the quality of the design speak for itself. Whitespace is our friend.

### 2. Texture & Warmth
Nod to the physicality of fabrics, wood, and materials. Subtle gradients, soft shadows, and warm tones remind users this is about real, beautiful products.

### 3. Precision Meets Elegance
Our tools are calculators — precise, mathematical. But the UI should feel effortless, like the numbers just appear where they should.

### 4. Photography First
Real interiors, real products, real light. Stock photos of generic offices are banned. Every image should feel like it belongs in a design magazine.

---

## Colour Palette

### Primary
| Name | Hex | Use |
|------|-----|-----|
| Midnight Navy | `#0f1729` | Primary backgrounds, headers |
| Deep Indigo | `#1e2a4a` | Secondary backgrounds, cards |
| Warm White | `#faf8f5` | Light backgrounds, text on dark |
| Cream | `#f5f0e8` | Subtle light backgrounds |

### Accent
| Name | Hex | Use |
|------|-----|-----|
| Burnished Gold | `#c9a96e` | CTAs, highlights, premium touches |
| Copper | `#b87333` | Secondary accent, hover states |
| Sage Green | `#7d8c6e` | Success states, nature/fabric connection |

### Neutral
| Name | Hex | Use |
|------|-----|-----|
| Charcoal | `#2d2d2d` | Body text on light backgrounds |
| Slate | `#64748b` | Secondary text, captions |
| Silver | `#e2e8f0` | Borders, dividers |
| Cloud | `#f8fafc` | Light card backgrounds |

### System
| Name | Hex | Use |
|------|-----|-----|
| Error Red | `#dc2626` | Error states |
| Success Green | `#16a34a` | Success states |
| Warning Amber | `#d97706` | Warning states |
| Info Blue | `#2563eb` | Info states |

---

## Typography

### Font Stack
- **Headings:** `'Playfair Display', Georgia, serif` — Elegant, editorial feel
- **Body:** `'Inter', -apple-system, sans-serif` — Clean, modern, readable
- **Code/Data:** `'JetBrains Mono', 'Fira Code', monospace` — For measurements, calculations

### Scale
| Element | Size | Weight | Font |
|---------|------|--------|------|
| Display (hero) | 56px / 3.5rem | 700 | Playfair Display |
| H1 | 40px / 2.5rem | 700 | Playfair Display |
| H2 | 32px / 2rem | 600 | Playfair Display |
| H3 | 24px / 1.5rem | 600 | Inter |
| H4 | 20px / 1.25rem | 600 | Inter |
| Body | 16px / 1rem | 400 | Inter |
| Body small | 14px / 0.875rem | 400 | Inter |
| Caption | 12px / 0.75rem | 500 | Inter |
| Data/Numbers | 16px / 1rem | 500 | JetBrains Mono |

---

## Spacing System
Base unit: 4px

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Tight padding |
| sm | 8px | Element spacing |
| md | 16px | Component padding |
| lg | 24px | Section spacing |
| xl | 32px | Card padding |
| 2xl | 48px | Section gaps |
| 3xl | 64px | Page sections |
| 4xl | 96px | Hero padding |

---

## Border Radius
| Token | Value | Use |
|-------|-------|-----|
| sm | 4px | Badges, tags |
| md | 8px | Buttons, inputs |
| lg | 12px | Cards |
| xl | 16px | Modal, large cards |
| full | 9999px | Avatars, pills |

---

## Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
--shadow-gold: 0 4px 14px rgba(201, 169, 110, 0.15);
```

---

## Button Styles

### Primary (CTA)
- Background: Burnished Gold (`#c9a96e`)
- Text: Midnight Navy (`#0f1729`)
- Hover: Darken 10%, add gold shadow
- Border radius: 8px
- Padding: 12px 24px
- Font: Inter 600 14px, uppercase, letter-spacing 0.5px

### Secondary
- Background: transparent
- Border: 1px solid Silver (`#e2e8f0`)
- Text: Charcoal (`#2d2d2d`)
- Hover: Background Cloud (`#f8fafc`)

### Ghost (on dark)
- Background: transparent
- Border: 1px solid rgba(255,255,255,0.2)
- Text: Warm White (`#faf8f5`)
- Hover: Background rgba(255,255,255,0.05)

---

## Input Fields
- Background: Cloud (`#f8fafc`) on light / Deep Indigo (`#1e2a4a`) on dark
- Border: 1px solid Silver (`#e2e8f0`)
- Focus border: Burnished Gold (`#c9a96e`)
- Border radius: 8px
- Padding: 12px 16px
- Label: Caption style, Slate colour, uppercase

---

## Card Style
- Background: White / Deep Indigo (dark mode)
- Border: 1px solid Silver / rgba(255,255,255,0.06)
- Border radius: 12px
- Padding: 24px
- Shadow: shadow-md
- Hover: shadow-lg, subtle border colour change

---

## Photography & Image Guidelines
- **Style:** Natural light, editorial quality, warm tones
- **Subjects:** Real interiors with curtains, blinds, shutters. Fabric textures close-ups. Retail showrooms. Happy merchants (not stock).
- **Treatment:** Subtle warm filter. Never over-saturated. No harsh flash.
- **Aspect ratios:** 16:9 for hero/banner, 1:1 for Instagram grid, 4:5 for Instagram stories

---

## Instagram Visual Standards
- **Grid layout:** Alternating between product/interior shots and text/tip posts
- **Text posts:** Midnight Navy background, Burnished Gold accents, Playfair Display headlines
- **Photo posts:** Warm-toned interiors, subtle overlay with logo watermark (bottom-right, 10% opacity)
- **Stories:** Full-bleed images, text in Inter Bold, gold highlight boxes

---

## Logo Usage
- Primary: "InteriorShopApps" wordmark in Playfair Display
- Icon: Stylised window/blind mark (to be designed)
- Minimum clear space: 1x the height of the "I" on all sides
- Never stretch, rotate, or recolour outside palette

---

## Dark Mode vs Light Mode
| Element | Light | Dark |
|---------|-------|------|
| Background | Warm White `#faf8f5` | Midnight Navy `#0f1729` |
| Surface | White `#ffffff` | Deep Indigo `#1e2a4a` |
| Text primary | Charcoal `#2d2d2d` | Warm White `#faf8f5` |
| Text secondary | Slate `#64748b` | `#94a3b8` |
| Border | Silver `#e2e8f0` | `rgba(255,255,255,0.08)` |
| Accent | Burnished Gold | Burnished Gold (same) |

---

## Inspiration References
- **Aesop** — Typography, whitespace, warmth
- **Stripe** — Clarity, developer experience, precision
- **Restoration Hardware (RH)** — Editorial photography, luxury feel
- **Cereal Magazine** — Typography, minimalism, editorial layout
- **Hunter Douglas** — Industry leader, clean product presentation

---

*This is a living document. Updated as the brand evolves.*
*Last updated: 2026-02-13*
