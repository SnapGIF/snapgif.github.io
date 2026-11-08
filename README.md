# 🎬 SnapGIF — 100% Client-Side Video to GIF Converter

> **Turn MP4, WebM, MOV & MKV into Crystal-Clear 256-Color HD Animated GIFs Directly in Your Browser — Zero Cloud Uploads, Zero Watermarks, 100% Free Forever.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-snapgif.github.io-31AAA9?style=for-the-badge&logo=githubpages&logoColor=white)](https://snapgif.github.io/)
[![Astro 5.x](https://img.shields.io/badge/Astro-Islands_Architecture-A82020?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-2--Pass_HD_Palette-6C1A1A?style=for-the-badge&logo=webassembly&logoColor=F8E0A4)](https://github.com/ffmpegwasm/ffmpeg.wasm)
[![License: MIT](https://img.shields.io/badge/License-MIT-F8E0A4?style=for-the-badge&labelColor=6C1A1A&color=F8E0A4)](./LICENSE)
[![Support the Developer](https://img.shields.io/badge/Support_Developer-Buy_Me_a_Coffee-A82020?style=for-the-badge&logo=gumroad&logoColor=white)](https://kisharadilshan.gumroad.com/coffee)

---

## ✨ Why SnapGIF?

Traditional online video-to-GIF converters force you to upload private video files to slow remote servers, impose strict file size paywalls, degrade colors with generic 1-pass lookup tables, or stamp ugly watermarks onto your animations.

**SnapGIF** executes a studio-grade **2-Pass HD Palette Pipeline (`palettegen` + `paletteuse`)** 100% locally inside your browser RAM using WebAssembly (`@ffmpeg/ffmpeg`) and an adaptive 256-color GIF89a engine:

- 🔒 **Zero Cloud Uploads (100% Local RAM):** Your videos never leave your device. Instant processing with complete privacy.
- 🎨 **2-Pass HD Palette GIF Engine (`palettegen` + `paletteuse`):** Analyzes every frame in your trimmed clip to build a bespoke 256-color palette with perceptual Sierra/Bayer dithering and Lanczos scaling—eliminating color banding.
- ✂️ **Visual Trim, Crop, Boomerang & FPS Controls:** Scrub start and end times with `0.1s` precision, choose `10 FPS` to `30 FPS`, scale widths (`320px`, `480px`, `640px`, `800px`, `Original`), adjust playback speed (`0.5x–2x`), and apply **Infinite Loop**, **Boomerang / Bounce**, or **Reverse** playback.
- 💬 **1-Click Discord & Sticker Optimizer (`< 8MB`):** Automatically tunes frame budget, dimensions, and palette density for Discord, Slack, Twitter/X, and GitHub Readmes.
- ⚡ **GIF to MP4 Reverse & Social Video Engine:** Convert heavy animated GIFs into lightweight, fast-loading MP4 video clips in one click.
- 🌍 **Native 8-Language i18n:** Fully localized UI, metadata, `hreflang` network, and FAQs across **English (`/`), Español (`/es/`), Português (`/pt/`), Deutsch (`/de/`), Français (`/fr/`), 日本語 (`/ja/`), 中文 (`/zh/`), and Русский (`/ru/`)**.
- 🌓 **Adaptive Light & Dark Theme:** Engineered around a warm, high-contrast Retro Teal, Vanilla Cream & Crimson palette with instant theme switching.
- 📲 **Offline-Ready Installable PWA:** Complete with `manifest.webmanifest`, maskable icons, and an offline-first Service Worker (`sw.js`) so you can convert videos to GIFs without an internet connection.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Astro](https://astro.build/) (Static Output + Islands) | Zero-JS-by-default static HTML generation & sub-second LCP |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + CSS Custom Properties | Responsive layout, custom retro theme tokens & dark mode |
| **Media Engine** | `@ffmpeg/ffmpeg` + `@ffmpeg/util` + Native GIF89a | Client-side 2-pass `palettegen`/`paletteuse` & MP4 encoding |
| **Offline PWA** | Web App Manifest + Service Worker (`public/sw.js`) | Offline caching of HTML, CSS, JS, and WebAssembly core assets |
| **Technical SEO** | Flat `sitemap.xml` + `sitemap-index.xml` + JSON-LD | `WebApplication`, `HowTo`, `FAQPage` & `BreadcrumbList` schemas |
| **Analytics** | Google Tag Manager (`GTM-N2J2N8VM`) + GA4 (`G-908P8JY2SH`) | Privacy-conscious telemetry and conversion performance tracking |
| **CI/CD** | GitHub Actions (`withastro/action@v3` + `deploy-pages@v4`) | Automated Node 22 build and zero-downtime GitHub Pages release |

---

## 🎨 Color Palette Specification

SnapGIF is crafted with a bespoke **Retro Teal, Warm Vanilla Cream & Vivid Crimson** design system optimized for AAA visual hierarchy in both Light Mode and Dark Mode:

| Token Name | Hex Code | Role in Light Mode (Default) | Role in Dark Mode |
| :--- | :--- | :--- | :--- |
| **Vibrant Retro Teal** | `#31AAA9` | Borders, Secondary Accents, Progress Gradient | Primary Action Buttons, Borders, Secondary Text |
| **Warm Vanilla Cream** | `#F8E0A4` | Surface Cards, Badges, Highlights | Primary Text, Button Hover States |
| **Vivid Crimson Red** | `#A82020` | Primary Action Buttons, Active Pills & Sliders | Secondary Accent Surfaces |
| **Deep Burgundy Mahogany** | `#6C1A1A` | Primary Body & Heading Text, Button Hover | Surface Cards & Elevated Containers |
| **Soft Cream Tint** | `#FFFDF7` | Primary Page Background | — (Uses `#1E0B0B` Deep Espresso Burgundy) |
| **Pure Canvas White** | `#FFFFFF` | Interactive Converter Workspace Box | — (Uses `#2B1010` Dark Mahogany Workspace) |

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js** `>= 20.x` (Node `22.x` recommended)
- **npm** `>= 10.x`

### 1. Clone the Repository
```bash
git clone https://github.com/snapgif/snapgif.github.io.git
cd snapgif.github.io
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Local Development Server
```bash
npm run dev
```
Open `http://localhost:4321/` in your browser to test the interactive Video-to-GIF studio and all 8 localized routes.

### 4. Build for Production
```bash
npm run build
npm run preview
```
The static production bundle is output to `dist/` with pre-rendered HTML for all 8 languages, `dist/sitemap.xml`, `dist/sitemap-index.xml`, `dist/robots.txt`, `dist/manifest.webmanifest`, `dist/sw.js`, and `dist/.nojekyll`.

---

## ⚙️ Automated GitHub Pages Deployment

Every push to the `main` branch automatically triggers [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml):
1. Checks out the repository and ensures `public/.nojekyll` is present.
2. Builds the static site via `withastro/action@v3` on **Node 22**.
3. Publishes the `dist/` artifact directly to GitHub Pages via `actions/deploy-pages@v4`.

---

## ☕ Support the Developer

SnapGIF is 100% free, open-source, watermark-free, and ad-free. If SnapGIF saves you time or helps your creative workflow, consider supporting ongoing development:

👉 **[Buy Me a Coffee on Gumroad — kisharadilshan.gumroad.com/coffee](https://kisharadilshan.gumroad.com/coffee)**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full copyright and permission details (`Copyright (c) 2026 Kishara Dilshan (SnapGIF)`).
