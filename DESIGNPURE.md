---
name: Midnight & Cream
colors:
  surface: '#f7f9ff'
  surface-dim: '#cadcf1'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e3efff'
  surface-container-high: '#d9eaff'
  surface-container-highest: '#d2e4fa'
  on-surface: '#0a1d2d'
  on-surface-variant: '#44474c'
  inverse-surface: '#213242'
  inverse-on-surface: '#e8f2ff'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6073'
  primary: '#041627'
  on-primary: '#ffffff'
  primary-container: '#1a2b3c'
  on-primary-container: '#8192a7'
  inverse-primary: '#b7c8de'
  secondary: '#5f5f59'
  on-secondary: '#ffffff'
  secondary-container: '#e1e0d9'
  on-secondary-container: '#63635d'
  tertiary: '#091621'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e2b36'
  on-tertiary-container: '#85929f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fb'
  primary-fixed-dim: '#b7c8de'
  on-primary-fixed: '#0b1d2d'
  on-primary-fixed-variant: '#38485a'
  secondary-fixed: '#e4e2dc'
  secondary-fixed-dim: '#c8c6c0'
  on-secondary-fixed: '#1b1c18'
  on-secondary-fixed-variant: '#474742'
  tertiary-fixed: '#d7e4f2'
  tertiary-fixed-dim: '#bbc8d6'
  on-tertiary-fixed: '#101d27'
  on-tertiary-fixed-variant: '#3c4854'
  background: '#f7f9ff'
  on-background: '#0a1d2d'
  surface-variant: '#d2e4fa'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 80px
---

## Brand & Style
The design system embodies a sophisticated, editorial aesthetic that balances the depth of high-end technology with the warmth of tactile stationery. It is designed for luxury lifestyle, high-end SaaS, or premium editorial platforms where clarity and prestige are paramount. 

The visual style is a fusion of **Modern Minimalism** and **Tonal Layering**. It prioritizes generous negative space, intentional typographic hierarchy, and a restricted but high-contrast palette. The emotional response is one of calm authority, reliability, and timeless elegance. The interface should feel expensive and considered, avoiding unnecessary ornamentation in favor of precise alignment and structural integrity.

## Colors
The palette is built on the foundational contrast between the deep, intellectual "Midnight Blue" and the soft, organic "Cream." 

- **Primary (Midnight Blue - #1a2b3c):** Used for primary actions, headings, and high-impact structural elements. It provides the "weight" in the design.
- **Secondary (Cream - #f2f0e9):** The primary surface color. It replaces pure white to reduce eye strain and provide a more premium, "paper-like" feel.
- **Tertiary (Muted Slate - #7d8a97):** Used for secondary text, borders, and inactive states to maintain a soft transition between the primary and background colors.
- **Neutral (Deep Slate - #2d3e4f):** Used for body text and subtle interactive states where the full primary color is too heavy.

Backgrounds should default to the Cream hex, while primary buttons and dark-mode sections utilize the Midnight Blue.

## Typography
This design system uses **Montserrat** exclusively to achieve a geometric, modern, and clean look. 

- **Headlines:** Utilize tighter letter-spacing and heavier weights (600-700) to create a strong visual anchor.
- **Body:** Set with generous line heights to ensure readability against the cream background.
- **Labels:** Small caps or uppercase styling with increased letter-spacing is encouraged for UI metadata and category tags to differentiate them from body content.
- **Scaling:** On mobile devices, large display headings should scale down aggressively to maintain the minimalist composition without overwhelming the viewport.

## Layout & Spacing
The layout follows a **Fluid Grid** model with significant emphasis on white space (or "cream space"). 

- **Grid:** Use a 12-column grid for desktop with 24px gutters. Elements should ideally span 4, 6, 8, or 12 columns to maintain a balanced, architectural feel.
- **Rhythm:** An 8px linear scale (built on a 4px base unit) governs all padding and margins. 
- **Desktop:** Large external margins (80px+) are used to center content and create a focused, high-end editorial experience.
- **Mobile:** Transition to a 4-column grid with 16px margins. Stack elements vertically while maintaining consistent padding to preserve the "breathable" nature of the design.

## Elevation & Depth
This design system avoids heavy drop shadows in favor of **Tonal Layers** and **Subtle Outlines**. 

- **Surfaces:** Depth is created by placing elements on slightly lighter or darker variations of the Cream background, or by using Midnight Blue containers for high-priority sections.
- **Outlines:** Use 1px solid borders in a muted version of the primary color (opacity 10-15%) for cards and input fields.
- **Shadows:** When depth is required (e.g., modals), use an extremely diffused, low-opacity Midnight Blue shadow (Blur: 32px, Y: 16px, Opacity: 5%). This creates an "ambient" lift rather than a physical shadow.

## Shapes
The shape language is **Soft** and restrained. While the brand is modern, the slight rounding (0.25rem - 0.75rem) prevents the UI from feeling too sharp or aggressive, aligning it with the warmth of the Cream color palette. 

- **Small elements (Buttons, Inputs):** Use the base 0.25rem radius.
- **Large elements (Cards, Modals):** Use the 0.75rem radius.
- **Icons:** Should be stroke-based with rounded ends to match the UI's geometry.

## Components
- **Buttons:** Primary buttons are solid Midnight Blue with Cream text. Secondary buttons use a Midnight Blue outline with transparent backgrounds. Use high padding (12px vertical, 24px horizontal).
- **Inputs:** Clean, 1px outlined boxes using the Tertiary color. On focus, the border thickens or darkens to the Primary Midnight Blue.
- **Cards:** Background matches the Cream surface or is slightly lighter. Use the 0.75rem (rounded-xl) corner radius and a subtle 1px border. 
- **Chips:** Small, uppercase labels with a light-tinted Midnight Blue background (approx 5-10% opacity) and Primary color text.
- **Lists:** Separated by thin, subtle horizontal rules. Maintain high vertical padding (16px+) between list items to ensure clarity.
- **Navigation:** Top-tier navigation should be minimal, using the Label-MD typographic style with ample horizontal spacing.