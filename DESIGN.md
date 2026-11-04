---
name: LoL Wiki
description: A League of Legends reference wiki styled as a gilded, hextech-lit archive on a dark game-client backdrop.
colors:
  gold-base: "#c8aa6e"
  gold-light: "#f0e6d2"
  gold-dark: "#785a28"
  gold-bright: "#f4d37c"
  gold-text: "#e5cd8d"
  gold-metal-top: "#fffae3"
  gold-metal-mid: "#eac269"
  gold-metal-shadow: "#8f6014"
  hextech-cyan: "#0ac8b9"
  hextech-cyan-text: "#7de9df"
  rune-blue: "#00c8ff"
  deep-sea: "#0b2233"
  deep-sea-lit: "#123c58"
  void-black: "#0a0a0c"
  veil-black: "#030406"
  panel-glass: "rgba(10, 10, 12, 0.85)"
  steel-light: "#3f4d58"
  steel-mid: "#23282d"
  steel-dark: "#1e262c"
  steel-edge: "#101518"
  mist: "#8b9ea8"
  faint: "#5e6b74"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.02em"
  headline:
    fontFamily: "Cinzel, serif"
    fontSize: "1.2rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1px"
  title:
    fontFamily: "Cinzel, serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.5px"
  body:
    fontFamily: "Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Cinzel, serif"
    fontSize: "0.68rem"
    fontWeight: 400
    letterSpacing: "2.5px"
rounded:
  none: "0"
  xs: "2px"
  sm: "4px"
  dropdown: "0 0 8px 8px"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "2rem"
  lg: "4rem"
components:
  nav-button:
    backgroundColor: "{colors.steel-mid}"
    textColor: "{colors.gold-text}"
    typography: "{typography.title}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 1.2rem"
  nav-button-hover:
    backgroundColor: "{colors.steel-light}"
  featured-box:
    backgroundColor: "{colors.gold-dark}"
    textColor: "{colors.gold-text}"
    rounded: "{rounded.xs}"
    padding: "1rem 2rem"
  search-inner:
    backgroundColor: "{colors.deep-sea}"
    textColor: "{colors.rune-blue}"
    height: "60px"
  search-button:
    backgroundColor: "{colors.gold-base}"
    textColor: "{colors.void-black}"
    height: "48px"
    width: "70px"
  dropdown-panel:
    backgroundColor: "{colors.steel-edge}"
    textColor: "{colors.gold-text}"
    rounded: "{rounded.dropdown}"
---

# Design System: LoL Wiki

## Overview

**Creative North Star: "The Hextech Archive"**

A wiki shelved inside the game client. Everything sits on a near-black vault (a dimmed key-art backdrop under a heavy veil). Gilded type and hairlines carry structure, and hextech cyan is the only light source. The system borrows League's own interface language (chamfered plates, metallic gold lettering, glowing blue readouts) so a player who just left a match feels they never left the client.

Density is moderate and lookup-driven: dark plates hold dense information, gold sets hierarchy, and cyan marks what is active or selectable. Chrome is flat plates with glow as an accent; heavy bevels are reserved for the hero controls on the home page.

It rejects the generic dark-mode dashboard: no neutral gray cards, no flat SaaS styling. Every surface should read as part of the game client.

**Key Characteristics:**
- Dark vault base with a dimmed backdrop image under a directional black veil.
- Gold as structure and type, cyan as state and light.
- Chamfered and hexagonal silhouettes cut with `clip-path`, never plain rounded rectangles.
- Metallic gradient lettering for hero headings only.
- Flat plates at rest; glow appears on hover, focus and selection.

## Colors

A restrained two-metal palette on black: antique gold carries the structure, hextech cyan carries the energy, and steel-blue greys form the frames around inputs and buttons.

### Primary
- **Antique Gold** (`#c8aa6e`): Section headings, ability names, hairlines, borders on icons and the key-badge outline. The workhorse accent.
- **Bright Gold** (`#f4d37c`): Reserved emphasis, such as the ultimate (R) key badge and the top of metallic gradients.
- **Gold Text** (`#e5cd8d`): Interactive text on dark steel (nav buttons, search result names, featured box label).
- **Aged Bronze** (`#785a28`): Resting borders on icon frames and the base of gold bevels.

### Secondary
- **Hextech Cyan** (`#0ac8b9`): Selected filters, passive (P) badge, inner glows on active chips. Its text-safe sibling is **Pale Cyan** (`#7de9df`).
- **Rune Blue** (`#00c8ff`): The search field only: its inner outline, glow, rune icons and result-type tag. It is deliberately brighter than hextech cyan.

### Neutral
- **Void Black** (`#0a0a0c`): Page and body background.
- **Veil Black** (`#030406`): Overlay gradient over the backdrop image (used at 80 to 97% alpha).
- **Deep Sea** (`#0b2233`) and **Lit Sea** (`#123c58`): Blue wells behind search and active chips.
- **Steel Light / Mid / Dark** (`#3f4d58`, `#23282d`, `#1e262c`): The metal ramp for buttons and frames; **Steel Edge** (`#101518`) is the outline around them.
- **Parchment** (`#f0e6d2`): Default body text and hover borders.
- **Mist** (`#8b9ea8`) and **Faint** (`#5e6b74`): Secondary and tertiary text.

### Named Rules
**The Cyan-Means-Active Rule.** Cyan appears only on something selected, focused, passive or searchable. It is never decorative.

**The Two-Metals Rule.** Gold builds the structure, steel builds the frames. Do not introduce a third accent hue.

## Typography

**Display Font:** Cinzel (with serif fallback)
**Body Font:** Roboto (with sans-serif fallback), also used for text typed into the search field
**Label Font:** Cinzel, small, wide-tracked, uppercase

**Character:** Roman-inscription capitals for headings and filter labels, set against a plain sans for data. The inscription voice comes from the serif and the metallic fill, not from ornament.

> Known drift: the list and detail pages still hard-code `'Times New Roman'` for ability and item names (found in each `*-list` and `*-detail` stylesheet). The home surface (hero, nav, featured box, search) now uses the `--font-title` and `--font-body` tokens. Treat the tokens as canonical for new work.

### Hierarchy
- **Display** (700, clamp 1.75rem to 3.25rem, tracking 0.02em, 1.15): Home hero title, filled with the metallic gold gradient and outlined with a dark drop-shadow. Cinzel is caps-only, so it balances across lines on narrow screens.
- **Headline** (700, ~1.2rem, tracking 1px): Page and section titles on list pages.
- **Title** (700, 1rem; 0.9rem on nav buttons, 0.85rem on mobile nav): Nav button text and search result names, in Cinzel.
- **Body** (400, 1rem, 1.5): Roboto for descriptions and data; 1.375rem for text typed into the home search (1rem at 768px and below); 0.875rem for result subtitles. Keep prose near 65 to 75ch.
- **Label** (400 to 700, 0.68 to 0.75rem, tracking 1.5 to 2.5px, uppercase): Filter group headings, the "DESTACADO:" tag and result-type tags, in Cinzel.

### Named Rules
**The Metal-Only-On-Hero Rule.** The metallic gradient fill is for a handful of hero headings. Body copy, list text and labels stay solid color.

## Layout

A centered content column (max 1200px, 4rem and 2rem outer padding) over a full-bleed backdrop. The home page is a vertical split: hero text top-left, search bar centered, and navigation and the featured box bottom-right. List pages are full-viewport fixed sheets: a filter rail plus a responsive grid of square cards.

Spacing runs on a loose rem rhythm (0.5, 1, 2, 4rem) with 1rem gaps between controls. Responsive breakpoints sit at 1024px (centering the bottom cluster), 768px (nav stacks to full-width, hero centers) and 480px (rune ornaments are hidden, type shrinks).

## Elevation & Depth

Hybrid, leaning flat. List pages are tonal: plates differ by background gradient, with a hairline gold border and a soft black shadow. Hover adds a gold or cyan glow. The home hero controls (nav buttons, search frame, featured box) use the heavier bevel: inset highlight on top, inset shadow on the bottom, a 2px dark outline ring, and a deep drop shadow.

### Shadow Vocabulary
- **Plate** (`box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6)`): Resting icon and card plates.
- **Gold Glow** (`box-shadow: 0 0 0 1px #c8aa6e, 0 0 20px rgba(200, 170, 110, 0.6)`): Hover and press state on cards.
- **Cyan Inset Glow** (`box-shadow: inset 0 0 0 1px #0ac8b9, inset 0 0 12px rgba(10, 200, 185, 0.28)`): Selected chips and active filters.
- **Hero Bevel** (`inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -2px 5px rgba(0,0,0,0.8), 0 0 0 2px #101518, 0 5px 15px rgba(0,0,0,0.8)`): Home nav buttons only.

### Named Rules
**The Glow-Is-State Rule.** Outward glow means interaction (hover, focus, selected). Do not add resting glows.

## Shapes

Cut, not rounded. Silhouettes are chamfered rectangles and elongated hexagons made with `clip-path`: hexagonal search frame (25px corner cuts), parallelogram filter chips (7px slant), and cards with two diagonal-cut corners (10px). Where `border-radius` is used it is tiny (2 to 4px), and 50% is used for round avatars only. Frames are layered: an outer steel clip with a padded inner clip, producing a metal rim.

## Components

### Navigation Buttons
Steel plates with a vertical metal gradient, Gold Text label and a 28px gold icon.
- **Shape:** Slightly rounded rectangle (4px).
- **Hover:** Brightens by 15% and lifts 2px.
- **Active:** Drops 1px and swaps to an inset shadow so it reads as pressed.
- **Mobile:** Stacks full-width, label centered.

### Search Bar (signature)
A hexagonal steel frame holding a deep-blue inner well outlined in Rune Blue with an inner glow. A hex "R" badge sits on the top rim, rune icons flank the input, and a gold hexagonal button closes the right edge.
- **Input:** Transparent, 1.25rem, Mist placeholder.
- **Results dropdown:** Dark steel panel with a steel border, a bottom-rounded 8px corner, and rows with a 48px gold-bordered icon, gold name, mist subtitle and cyan type tag. Hover tints the row with 10% cyan.
- **Mobile:** Corner cuts shrink and the rune icons are hidden at 480px.

### Featured Box
A bronze-gradient plaque with a 2px gold border, a dark outer ring, and L-shaped gold corner brackets at the top-left and bottom-right.

### Filter Chips
Parallelogram plates in the steel gradient; selected chips switch to a Deep Sea gradient with a cyan inset glow and Pale Cyan text.

### Ability and Item Cards
Square icon plate with diagonal cut corners, a bronze border and a key badge (Q, W, E, R, P) pinned bottom-left. The name sits below in Antique Gold, with the owner in Mist. Hover brightens the border to Parchment and adds the gold glow.

### Skeleton Loading
Plates pulse between 35% and 70% opacity over 1.4s; sheets enter with an 8px upward slide over 0.18s.

## Do's and Don'ts

### Do:
- **Do** use Antique Gold (`#c8aa6e`) for structure and Hextech Cyan (`#0ac8b9`) only for active or selected state.
- **Do** cut silhouettes with `clip-path` chamfers or hexagons; keep any `border-radius` at 4px or less.
- **Do** use the `--font-title` (Cinzel) token for headings and uppercase labels, and `--font-body` (Roboto) for data.
- **Do** keep resting surfaces flat and let glow signal interaction.
- **Do** keep the backdrop image dimmed (about 22% opacity) under the veil so text stays readable.

### Don't:
- **Don't** drift toward a generic dark-mode dashboard: no neutral gray cards, flat SaaS buttons or system-style rounded panels.
- **Don't** introduce a third accent hue beyond gold and cyan.
- **Don't** apply the metallic gradient fill to body text, list rows or labels.
- **Don't** hard-code `'Times New Roman'` in new components; use the font tokens.
- **Don't** add resting glows or heavy bevels outside the home hero controls.
