# SEO & GEO Upgrade — kabengosafaris.com

## Context

Kabengo Safaris competes with established WordPress operators (paradise-wilderness.com, tanzania-specialist.com). A live audit showed Kabengo is technically close and faster (Next.js 16 / ISR vs their plugin-heavy WordPress), but is **losing on two fixable fronts** and **under-using a unique asset**:

- **Weak/broken titles** — the homepage renders `Home | Kabengo Safaris | Kabengo Safaris` (double-brand), and every static page repeats the bug because each `meta.*Title` translation already contains `| Kabengo Safaris` and then hits the root `%s | Kabengo Safaris` template.
- **Thin structured data** — `Organization` (not `TravelAgency`), `sameAs` = Instagram only, no reviews, no `WebSite`/`SearchAction`, no `BreadcrumbList` JSON-LD; the safari `TouristTrip.itinerary` is a shallow count (no per-day steps) and its `offers` block is **dead** (a `costSummary` type mismatch means price never populates); activities emit no schema.
- **Unused moat** — a structured Spring Boot database (day-by-day itineraries, parks, lodges w/ rates, testimonies) that can power richer, more factual, schema-marked pages than competitors' hand-written content — which wins both Google rich results and AI answer engines (GEO).

**Intended outcome:** fix the title bug, ship a comprehensive structured-data layer (incl. real per-day itineraries, `TravelAgency` + review stars, `Hotel`/`LodgingBusiness`, `TouristAttraction`, `FAQPage`, `BreadcrumbList`, `WebSite`+`SearchAction`), and make detail pages answer-first with fact tables + FAQs. Scope of this pass: **Phases 0–3**. Phases 4–6 are the documented follow-on roadmap.

Two repos are touched:
- **Frontend:** `/home/ricksy/Documents/NEXT JS PROJECTS/kabengo-safaris-website`
- **Backend:** `/home/ricksy/Documents/SPRING BOOT PROJECTS/kabengosafaris` (one new endpoint)

## Prerequisites (input needed from user before/at implementation)
- `sameAs` URLs: **Facebook, YouTube, SafariBookings, TripAdvisor** (Instagram known).
- NAP for `TravelAgency` schema: postal address, public phone, and org geo coordinates (Arusha office).

---

## Phase 0 — Title fix & baseline

- **Root cause fix:** rewrite every `meta.*Title` value in all 9 locale files (`src/messages/{en,sw,fr,de,es,it,pt,af,uk}.json`) to a **bare, keyword-led** string (drop the ` | Kabengo Safaris` suffix — the root template in `src/app/layout.tsx` adds the brand). E.g. `homeTitle: "Home | Kabengo Safaris"` → `"Tanzania Safari Tours & Tailor-Made Holidays"`; `safarisTitle` → `"Tanzania Safari Packages & Tours"`; `parksTitle` → `"Tanzania National Parks Guide"`.
- `src/app/[locale]/page.tsx` `generateMetadata` currently returns only title+description — also call `buildAlternates(locale)` (from `src/lib/seo.ts:9`) so the homepage emits canonical + hreflang like other routes.
- Baseline: Google Rich Results Test on current pages, Lighthouse SEO, and note current Search Console impressions to measure against.

## Phase 1 — Structured-data overhaul (`src/lib/jsonld.tsx` is the core)

Reuse the existing `JsonLd` primitive and extend the helpers. Fix the **hardcoded `/en/`** in every `url` field to use the actual `locale`.

1. **`getOrganizationJsonLd` → `TravelAgency`**: add `sameAs` (all profiles above), `address` (PostalAddress), `telephone`, `geo`, keep `areaServed`/languages, and `aggregateRating` (from the new backend summary — Phase 1.6).
2. **New `getWebSiteJsonLd(locale)`** — `WebSite` + `SearchAction` (sitelinks search box); render in `src/app/[locale]/layout.tsx`.
3. **New `getBreadcrumbJsonLd(items, locale)`** — emit real `BreadcrumbList` JSON-LD (today `src/components/ui/Breadcrumbs.tsx` uses microdata only). Render alongside the existing breadcrumb UI on detail pages.
4. **`getSafariJsonLd` upgrade** (`src/app/[locale]/safaris/[id]/layout.tsx`):
   - **Real per-day itinerary**: build `itinerary` as `ItemList` of per-day `ListItem` → `TouristAttraction`/`TouristDestination` from `days[]` (`dayNumber`, `title`, `description`, `startLocation`/`endLocation`). Requires widening `SafariMeta` (Phase 1.5).
   - **Fix the dead `offers` block**: `costSummary` from the API is an **array** (`ItineraryCostSummaryDTO[]` with `grandTotalRack`, `currency`) — read `costSummary[0].grandTotalRack` + `currency`, not the non-existent `totalRackPriceUSD`.
   - Add `aggregateRating`.
5. **`server-api.ts` widening (the real bottleneck)** — the JSON-LD only sees trimmed `*Meta` subsets:
   - `SafariMeta`: add `days[]` and fix `costSummary` to the array shape (`grandTotalRack`, `currency`, pax for optional per-person).
   - `ParkMeta`: add `bestTimeToVisit`, `wildlife`, `openingHours`.
   - `AccommodationMeta`: add `accommodationType`, `address`, `amenities`, `checkInPolicy`/`checkOutPolicy`, `maxGuests`, `website`.
   - Add `fetchTestimonySummary()` (calls the new backend endpoint).
6. **`getAccommodationJsonLd` upgrade** — map `accommodationType` → `Hotel`/`Resort`/`Campground`/`LodgingBusiness`; add `amenityFeature`, `checkinTime`/`checkoutTime`, `address`, keep `starRating`/`priceRange`. (Note: public API exposes only `priceRange` string + board/room **counts**, not numeric per-night rates — no numeric `offers` here.)
7. **`getParkJsonLd` upgrade** — add `TouristAttraction` details + a `FAQPage` derived from `bestTimeToVisit`/`openingHours`/`wildlife`. (No explicit park-fee field on the public park object — fees live only in safari `costSummary.parkFeesRack`; do not fabricate.)
8. **New `getActivityJsonLd`** (`TouristAttraction`) — wire into `src/app/[locale]/activities/[id]/layout.tsx` (currently renders no JSON-LD).
9. **Localize FAQ** — `src/app/[locale]/faq/layout.tsx` uses hardcoded English `FAQ_ITEMS`; source from next-intl instead, and dedupe with the FAQPage logic already in `src/components/ui/ContextualFAQ.tsx` (which correctly emits localized FAQPage) by routing both through `getFAQJsonLd`.

### Phase 1.6 — Backend: testimony summary endpoint
- Add `GET /public/testimonies/summary` → `{ averageRating, reviewCount }` (optionally rating distribution) in the Spring Boot Public module (`.../Public/Controller/PublicController.java` + service, reusing the Testimony repository). Compute avg + count over active/approved testimonies. Feeds `aggregateRating`.

## Phase 2 — Metadata, titles & i18n polish
- Keyword-led titles (done in Phase 0) + **proof-driven meta descriptions** per route (e.g. `✓ Tailor-made ✓ Local expert guides ✓ TripAdvisor-rated`) across all 9 locale files.
- Add `og:locale` (+ per-locale OG) in `src/app/[locale]/layout.tsx`; give list pages/homepage a default OG image (currently only detail layouts set OG images). Consider a shared OG helper in `src/lib/seo.ts` to replace the hand-rolled OG blocks in the four detail layouts.
- Verify hreflang reciprocity for all 9 locales via `buildAlternates`.

## Phase 3 — Programmatic content (the moat)
Detail `page.tsx` files are `"use client"` and already fetch the full object; enrich the rendered content (localized copy via next-intl):
- **Answer-first intro** (40–60 words, direct answer) at the top of `safaris/[id]`, `parks/[id]`, `accommodations/[id]` pages.
- **Fact tables** (duration, price-from, best months, region, board/rooms) — extractable/quotable by AI engines.
- **Per-page FAQ block** — reuse/extend `ContextualFAQ` (already supports `safari`/`park`; add `accommodation`) so every detail page has a localized FAQ + FAQPage schema.
- `src/app/sitemap.ts`: use real `lastModified` (from `updatedAt`) instead of `new Date()`, and confirm blog inclusion; dynamic IDs already enumerated.
- Strengthen internal linking (park ↔ its lodges ↔ itineraries that visit it).

## Phases 4–6 — Follow-on roadmap (not this pass)
- **Phase 4:** high-intent guides via `blog/[slug]` ("Best time for the calving migration", "Serengeti vs Ngorongoro", "10-day Tanzania & Zanzibar cost", "family safari") + a "Which safari suits you?" quiz.
- **Phase 5 (GEO/off-site):** add `public/llms.txt`; extend `src/app/robots.ts` to explicitly allow `GPTBot`, `PerplexityBot`, `Google-Extended`, `ClaudeBot`, `CCBot`; **your action:** finish SafariBookings.com listing, TripAdvisor, Google Business Profile with NAP identical to the `sameAs`/schema.
- **Phase 6:** Google Search Console, ongoing Rich Results validation, Lighthouse ≥95, track AI-citation appearances.

---

## Critical files
**Frontend** (`kabengo-safaris-website`):
- `src/lib/jsonld.tsx` — extend all helpers; add WebSite/SearchAction, BreadcrumbList, Activity; fix `/en/` hardcode.
- `src/lib/server-api.ts` — widen `SafariMeta`/`ParkMeta`/`AccommodationMeta`; add `fetchTestimonySummary`.
- `src/lib/seo.ts` — reuse `buildAlternates`; add shared OG helper.
- `src/messages/*.json` (×9) — rewrite `meta.*Title` (bare, keyword-led) + descriptions.
- `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx` — org/website schema, og:locale, homepage alternates + title.
- `src/app/[locale]/{safaris,parks,accommodations,activities}/[id]/layout.tsx` — wire enriched schema (+ Activity).
- `src/app/[locale]/{safaris,parks,accommodations}/[id]/page.tsx` — answer-first + fact tables + FAQ (Phase 3).
- `src/app/[locale]/faq/layout.tsx`, `src/components/ui/ContextualFAQ.tsx`, `src/components/ui/Breadcrumbs.tsx` — localize FAQ, dedupe FAQPage, add BreadcrumbList JSON-LD.
- `src/app/sitemap.ts` (real lastModified), `src/app/robots.ts` (Phase 5 crawlers), `public/llms.txt` (Phase 5).

**Backend** (`kabengosafaris`):
- `.../Public/Controller/PublicController.java` + service — new `GET /public/testimonies/summary`.

## Verification
1. **Backend:** run the API, `curl /api/public/testimonies/summary` → confirm `{averageRating, reviewCount}` matches a manual average of testimonies.
2. **Frontend:** `npm run build` (must pass) then `npm run start`; load `/en`, `/en/safaris`, a safari/park/lodge/activity detail page, `/en/faq`.
3. **View source / rendered HTML** on each: confirm one clean `<title>` (single brand), and JSON-LD present. Paste each JSON-LD block into **Google Rich Results Test** + **Schema Markup Validator** — expect `TravelAgency`, `WebSite`+SearchAction, `TouristTrip` (with `itemListElement` per day + `offers` populated + `aggregateRating`), `Hotel`/`LodgingBusiness`, `TouristAttraction`, `FAQPage`, `BreadcrumbList` — all error-free.
4. **hreflang:** confirm each locale page lists all 9 `alternate` + `x-default`, reciprocally.
5. **Lighthouse** SEO on home + a detail page (target ≥95); confirm no title/meta regressions.
6. Spot-check a non-English locale (e.g. `/fr/safaris`) for localized title + FAQ.
