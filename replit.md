# SurveyMetrix Landing Page

## Overview
SurveyMetrix is a nonprofit outcome-measurement platform landing page with an interactive workflow animation, waitlist collection, and a $5 founding tester pledge flow.

## Brand Guidelines
- **Primary**: Periwinkle 500 `#5550BA`, Periwinkle 900 `#211E62`, Periwinkle 050 `#EEEDfb`, Periwinkle 100 `#DAD8F6`
- **Accent**: Dusty Rose `#B86890`
- **Backgrounds**: Warm Greige `#FDFCFA`
- **Fonts**: Lora (font-display), Inter 300 (font-sans), DM Mono (font-mono), Playfair Display italic for hero emphasis at 110%

## Architecture
- **Frontend**: React + Vite + Tailwind v4 with Framer Motion animations
- **Backend**: Express.js API server on port 5000
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend)

## Key Files
- `client/src/pages/Home.tsx` — Full landing page with all sections, modals, and animation components
- `client/src/index.css` — Tailwind config, custom animations (scroll-left ticker)
- `client/src/assets/logos/logoMap.ts` — Data-driven logo ticker (name, initials, optional logo path)
- `client/index.html` — Meta tags, font imports
- `shared/schema.ts` — Drizzle schema for waitlist_entries table
- `server/routes.ts` — API routes (POST /api/waitlist)
- `server/storage.ts` — Database storage interface
- `server/db.ts` — PostgreSQL connection pool

## Features
- **Hero Section**: Periwinkle-to-greige background split, responsive heading, CTA button
- **Interactive Workflow Animation**: 3-step auto-playing GIF-style demo (Define & Link → Build & Personalize → Analyze Impact)
  - Starts when 40% scrolled into view via IntersectionObserver
  - Phase-based timers (1.2s/3.2s/4.8s/6.5s) with animated cursor and info bubbles
- **How It Works**: 3-step detailed section with animated visuals
- **Social Proof Ticker**: Scrolling org logos, faster on mobile (15s vs 30s)
- **Impact Areas**: 6 nonprofit sector cards with framework tags
- **Cross-Program Outcomes**: Stats grid + comparison table
- **Waitlist Modal**: Two-step flow — form (name, email, org, sector) → $5 founding tester pledge upsell
- **$5 Pledge Flow**: Founding tester offer with perks, skip option; Stripe checkout placeholder (TODO: wire up)
- **Mobile Responsive**: All sections optimized, working hamburger menu

## Navigation
- `#how-it-works` → 3-step journey section
- `#impact-areas` → Sectors section
- `#platform` → Hero animation

## Waitlist Schema
- `waitlist_entries`: email (unique), name, organization, sector, created_at

## API Endpoints
- `POST /api/waitlist` — Submit to waitlist (body: `{ email, name, organization, sector }`)

## TODO
- **Stripe Integration**: Wire up $5 pledge button to Stripe Checkout (handlePledge function in WaitlistModal). Stripe connector was not set up — will need API keys or Replit integration later.
