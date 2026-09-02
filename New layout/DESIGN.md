---
name: Organic Professional
colors:
  surface: '#f7faf4'
  surface-dim: '#d3dcd3'
  surface-bright: '#f7faf4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5ee'
  surface-container: '#e9f0e8'
  surface-container-high: '#e3eae2'
  surface-container-highest: '#dce5db'
  on-surface: '#2c342e'
  on-surface-variant: '#59615a'
  inverse-surface: '#0b0f0c'
  inverse-on-surface: '#9a9e99'
  outline: '#747d75'
  outline-variant: '#abb4ac'
  surface-tint: '#386948'
  primary: '#386948'
  primary-dim: '#2b5d3c'
  on-primary: '#e8ffe9'
  primary-container: '#b9efc5'
  on-primary-container: '#2a5b3b'
  inverse-primary: '#bef5ca'
  secondary: '#665e53'
  secondary-dim: '#595248'
  on-secondary: '#fff8f2'
  secondary-container: '#ece1d3'
  on-secondary-container: '#585146'
  tertiary: '#745c27'
  tertiary-dim: '#67501c'
  on-tertiary: '#fff8f1'
  tertiary-container: '#fad998'
  on-tertiary-container: '#614b18'
  error: '#a83836'
  error-dim: '#67040d'
  on-error: '#fff7f6'
  error-container: '#fa746f'
  on-error-container: '#6e0a12'
  primary-fixed: '#b9efc5'
  primary-fixed-dim: '#abe1b7'
  on-primary-fixed: '#15482a'
  on-primary-fixed-variant: '#346544'
  secondary-fixed: '#ece1d3'
  secondary-fixed-dim: '#ded3c5'
  on-secondary-fixed: '#453e34'
  on-secondary-fixed-variant: '#625a50'
  tertiary-fixed: '#fad998'
  tertiary-fixed-dim: '#ebcb8b'
  on-tertiary-fixed: '#4d3806'
  on-tertiary-fixed-variant: '#6c5421'
  background: '#f7faf4'
  on-background: '#2c342e'
  surface-variant: '#dce5db'
typography:
  headline-lg:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

# Design System: Organic Professional

## Brand & Style
The brand identity has shifted from a high-energy, vibrant aesthetic to a more grounded, sophisticated, and organic feel. It evokes a sense of reliability, environmental consciousness, and calm professionalism. 

The design style is **Corporate / Modern** with a touch of **Minimalism**. It prioritizes clarity and a balanced composition. The visual language uses natural tones and serif/sans-serif pairing to establish a trustworthy presence that feels both established and contemporary.

## Colors
The palette is rooted in a "tonal spot" approach, using a mossy forest green as the primary anchor.

*   **Primary (#4a7c59):** A stable, organic green used for key actions and brand representation.
*   **Secondary (#6b6358):** A warm, earthy taupe that provides a sophisticated contrast to the green.
*   **Tertiary (#c4a66a):** A muted gold used for accents, highlights, or secondary calls to action.
*   **Neutral (#4a4e4a):** A deep, cool charcoal-green used for text and structural elements to maintain harmony with the primary palette.

The color mode is strictly **light**, emphasizing a clean, airy, and paper-like workspace.

## Typography
The system uses a refined editorial pairing. 

*   **Headlines:** **Literata** (Serif) provides a scholarly, trustworthy, and premium feel. It should be used for all major headings to establish a clear hierarchy.
*   **Body & Labels:** **Nunito Sans** (Sans-Serif) offers a clean, highly legible counterpoint. Its open curves maintain the "organic" feel of the brand while ensuring readability across dense information.

Typography scales are optimized for clarity, with generous line heights to prevent visual fatigue. Font weights should be used purposefully: Bold for Literata headlines and Regular/Semi-Bold for Nunito Sans body text and labels.

## Layout & Spacing
The layout follows a fluid 12-column grid system for desktop, transitioning to 4 columns for mobile. 

A consistent 8px spatial rhythm (Base 2) is used throughout. 
*   **Margins:** 24px (3 units) on mobile/tablet; 48px+ on desktop.
*   **Gutter:** 16px (2 units) to maintain a compact yet breathable flow.
*   **Component Padding:** Internal padding usually follows 8px or 12px increments to maintain a snug, professional appearance.

## Elevation & Depth
The system utilizes **Tonal Layers** rather than heavy shadows. Depth is communicated through subtle shifts in surface color (using the neutral palette) and soft, low-opacity ambient shadows.

Surfaces appear to sit slightly above the background, with depth used sparingly to highlight active states or modal overlays. High-contrast outlines are avoided in favor of soft tonal separation.

## Shapes
The shape language is **Rounded** (Level 2). This softens the professional tone of the typography and colors, making the interface feel more approachable and modern compared to sharp, industrial designs.

*   **Standard Elements (Buttons, Inputs):** 0.5rem (8px) corner radius.
*   **Large Containers (Cards, Modals):** 1rem (16px) corner radius.
*   **Extra Large Elements:** 1.5rem (24px) corner radius.

## Components
*   **Buttons:** Use the Primary Green (#4a7c59) for high-emphasis actions with white text. Use Tertiary Gold (#c4a66a) for secondary, "warm" actions.
*   **Cards:** Defined by a 1px border in a light neutral shade or a very subtle tonal background change, with 16px rounded corners.
*   **Input Fields:** Use Nunito Sans for placeholder and entered text. Borders are subtle and darken slightly on focus.
*   **Chips:** Highly rounded (pill-shaped) using Secondary or Tertiary tones to categorize content without overwhelming the primary action.
*   **Navigation:** Top or side navigation uses clear typographic hierarchy with Literata for section headers and Nunito Sans for navigation links.