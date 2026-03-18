# Kabengo Safaris — Session Context

> Last updated: 2026-03-18

---

## What We Are Building

**Kabengo Safaris** is a full-stack safari tour company platform with three main components:

1. **Backend API** (Spring Boot + JPA/Hibernate + MySQL) — manages itineraries, safaris, parks, accommodations, activities, tariffs, cost estimation, bookings, PDF generation, and translations
2. **Public Website** (Next.js 14 + TypeScript + Tailwind CSS) — customer-facing site with safari browsing, park details, gallery, testimonials, booking inquiries, i18n (multi-language)
3. **Management Dashboard** (React.js) — internal admin UI for managing all entities

### Core Business Flow
- **Itineraries** are templates (safari packages) displayed publicly as "Safaris"
- **Safaris** are actual booked trips created from itineraries with real dates and customers
- Each itinerary has: days → day-parks → park-activities + park-tariffs + standalone activities
- **Cost Estimation** calculates prices based on: park tariffs (per pax category), activities, accommodations, and budget tier

---

## What Has Been Completed

### 1. Seed Data — 46 Itinerary Packages (Production DB: deployed)

Created comprehensive SQL seed scripts for 46 safari itineraries covering:
- **Day trips** (8): Single-day excursions to individual parks
- **2-day safaris** (5): Quick overnight combos
- **3-day safaris** (6): Short circuit safaris
- **4-5 day safaris** (8): Classic northern circuit
- **6-7 day safaris** (8): Extended safaris + Kilimanjaro treks
- **8-10 day safaris** (5): Safari + Zanzibar combos
- **12-16 day safaris** (6): Comprehensive grand tours

**Parks covered:** Serengeti (1), Ngorongoro (2), Tarangire (3), Manyara (4), Arusha (9), Kilimanjaro (12), Mkomazi (14), Jozani/Zanzibar (27)

**Trip types:** PRIVATE, GROUP, FAMILY, HONEYMOON, PHOTOGRAPHY, ADVENTURE

**Budget categories:** ULTRA_LUXURY, LUXURY, MID_RANGE, BUDGET, BACKPACKER

### 2. Production DB Final Counts
| Table | Count |
|---|---|
| itineraries | 46 |
| itinerary_days | 251 |
| itinerary_day_parks | 246 |
| itinerary_day_park_activities | 369 |
| itinerary_day_activities (standalone) | 73 |
| itinerary_day_park_tariffs | 560 |
| itinerary_pax | 46 |

### 3. Budget-Differentiated Tariffs
Tariffs are correctly assigned per budget tier:
- **BACKPACKER/BUDGET**: Conservation Fee + Public Camping (SLEEP_OVER)
- **MID_RANGE**: Conservation Fee + Special Camping (SLEEP_OVER)
- **LUXURY/ULTRA_LUXURY**: Conservation Fee + Concession Fee (all parks)
- **Kilimanjaro**: Hiking/Mountaineering + Rescue Fee + Upper Barafu (where applicable) + Parks Accommodations (Marangu route)
- **WMA**: Applied to Serengeti and Tarangire

### 4. Default Pax
Each itinerary has 1 Non-Resident Adult (nation_category_id=4, age_category_id=3) as default pax.

### 5. Highlights Format Fix
All highlights converted from JSON array format (`["item1", "item2"]`) to comma-separated text for management UI compatibility.

### 6. Frontend Website Features (already built)
- Safari listing page with search, trip type & budget filters, pagination
- Safari detail page with hero, info cards, description, highlights, day-by-day itinerary, booking sidebar
- Price display logic using `costSummary[0].grandTotalRack` (shows "From" price on cards)
- Homepage SafarisSection with featured safaris
- Parks, Activities, Accommodations, Gallery, Testimonials, Contact, About pages
- i18n support (multi-language)
- Responsive design with Tailwind CSS + Framer Motion animations

---

## Seed SQL Files

All located in: `/home/ricksy/Documents/SPRING BOOT PROJECTS/kabengosafaris/src/main/resources/`

| File | Size | Purpose | Execution Order |
|---|---|---|---|
| `seed_itineraries.sql` | 36KB | 46 itinerary master records + codes. Assumes Jozani park (id=27) exists. | 1 |
| `seed_itinerary_days.sql` | 499KB | 251 days + 246 day-park links for all 46 itineraries | 2 (same session as #1) |
| `seed_activities_tariffs.sql` | 14KB | Park activity links, standalone activities, base tariffs (Conservation Fee for all) | 3 |
| `seed_tariffs_by_budget.sql` | 8KB | Budget-differentiated tariff corrections (camping fees, concession, WMA) | 4 |
| `seed_itinerary_pax.sql` | 567B | Default 1 Non-Resident Adult per itinerary | 5 |

### Important Execution Notes
- Scripts 1 & 2 **MUST** run in the same MySQL session (days script uses `@itin_N` variables set by itineraries script)
- Scripts 3-5 are idempotent (use `NOT EXISTS` or `INSERT...SELECT`)
- Jozani park (id=27) must exist before running script 1
- Park activities and tariffs in `parks_activities` and `parks_tariffs` tables must exist (FK constraints)

### Known Issue in seed_itineraries.sql
45 of 46 itineraries still have highlights in JSON array format (`["item1", "item2"]`). The fix was applied via UPDATE on production but NOT corrected in the seed INSERT statements. The batch UPDATE at the bottom of the file handles this.

---

## Current Project File Structure

### Frontend (Next.js) — `/home/ricksy/Documents/NEXT JS PROJECTS/kabengo-safaris-website/`
```
src/
├── app/
│   ├── [locale]/
│   │   ├── safaris/
│   │   │   ├── page.tsx          # Safari listing (search, filters, pagination)
│   │   │   ├── [id]/page.tsx     # Safari detail (hero, days, booking)
│   │   │   └── layout.tsx
│   │   ├── parks/                # Park listing & detail
│   │   ├── accommodations/       # Accommodation listing & detail
│   │   ├── activities/           # Activity listing & detail
│   │   ├── gallery/              # Photo gallery
│   │   ├── testimonials/         # Customer reviews
│   │   ├── book/                 # Booking form
│   │   ├── contact/              # Contact page
│   │   ├── about/                # About page
│   │   ├── blog/                 # Blog
│   │   ├── faq/                  # FAQ
│   │   └── page.tsx              # Homepage
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── safari/
│   │   ├── SafariDetailHero.tsx
│   │   ├── SafariInfoCards.tsx
│   │   ├── SafariDescription.tsx
│   │   ├── SafariItinerary.tsx
│   │   ├── SafariDetailSkeleton.tsx
│   │   ├── BookingSidebar.tsx
│   │   └── BookingInquiryForm.tsx
│   ├── sections/
│   │   ├── SafarisSection.tsx    # Homepage featured safaris
│   │   ├── HeroSection.tsx
│   │   ├── ParksSection.tsx
│   │   ├── ActivitiesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── CTASection.tsx
│   │   └── NewsletterSection.tsx
│   ├── park/
│   ├── accommodation/
│   ├── activity/
│   ├── layout/ (Navbar, Footer)
│   ├── search/
│   ├── testimonials/
│   └── ui/ (shared components)
├── lib/
│   ├── api.ts                    # API client (axios) + fetch functions
│   ├── ApiLocaleSync.tsx
│   └── useDebounce.ts
├── types/
│   └── index.ts                  # All TypeScript interfaces
├── i18n/                         # Internationalization config
├── messages/                     # Translation JSON files
└── middleware.ts
```

### Backend (Spring Boot) — `/home/ricksy/Documents/SPRING BOOT PROJECTS/kabengosafaris/`
```
src/main/java/com/itineraryledger/kabengosafaris/
├── Itinerary/          # Itinerary CRUD, Services, Controllers, DTOs, Entity
├── Itinerary/ItineraryDay/
├── Itinerary/ItineraryPax/
├── Itinerary/CostEstimation/
├── Safari/             # Safari (booked trips) CRUD
├── Safari/SafariDay/
├── Safari/SafariPax/
├── Park/               # Parks management
├── Accommodation/      # Accommodations
├── Activity/           # Activities
├── PdfDocument/        # PDF generation
├── Translation/        # i18n translations
├── BookingInquiry/     # Booking inquiry forms
├── Newsletter/         # Newsletter subscriptions
├── EmailEvent/         # Email notifications
├── Hero/               # Homepage hero management
├── Testimony/          # Testimonials
├── AuditLog/           # Audit logging
├── Permission/         # Permissions/roles
└── Public/             # Public API endpoints (no auth)
```

### Management Dashboard (React) — `/home/ricksy/Documents/REACT JS PROJECTS/kabengo-safaris-management/`

---

## What We Were Working On Last

### Safari Pricing on Frontend
The user requested that safari cards on the listing page show prices. The frontend already has the pricing logic built:
- `formatPrice()` in `safaris/page.tsx` (line 124-129) reads `costSummary[0].grandTotalRack`
- Price badge renders on safari cards (line 349-353)
- Detail page also shows price via `SafariInfoCards` and `BookingSidebar`

**The issue:** Prices only show when `costSummary` data exists. This requires the backend cost estimation to be calculated and stored in `itinerary_cost_summaries` table. Currently that table is **empty** on production (0 rows).

### Local DB Seeding (In Progress)
Attempted to run seed scripts on local XAMPP MySQL. Steps completed:
1. Jozani park inserted (id=27)
2. Cleared existing itinerary data
3. Concatenated seed_itineraries.sql + seed_itinerary_days.sql to run in one session
4. Hit error due to leftover non-SQL text in seed_itinerary_days.sql (line 1334)

**Status:** The non-SQL text has since been cleaned from the file. Ready to retry.

---

## Next Steps to Continue

### Immediate (pick up where we left off)
1. **Run seed scripts on local XAMPP** — concatenate and execute:
   ```bash
   cat seed_itineraries.sql seed_itinerary_days.sql | /opt/lampp/bin/mysql -u root springboot_itineraryledger_kabengosafaris
   /opt/lampp/bin/mysql -u root springboot_itineraryledger_kabengosafaris < seed_activities_tariffs.sql
   /opt/lampp/bin/mysql -u root springboot_itineraryledger_kabengosafaris < seed_tariffs_by_budget.sql
   /opt/lampp/bin/mysql -u root springboot_itineraryledger_kabengosafaris < seed_itinerary_pax.sql
   ```

2. **Enable safari pricing** — The `itinerary_cost_summaries` table needs to be populated. Options:
   - Trigger cost calculation from the management dashboard for each itinerary
   - Create a seed script for cost summaries
   - Run the backend cost estimation service for all 46 itineraries

3. **Fix highlights in seed script** — The `seed_itineraries.sql` still has JSON array highlights in the INSERT statements. Either fix the INSERTs directly or keep the batch UPDATE at the bottom.

### Short-term
4. **Fix total_days/total_nights mismatches** — Some itineraries have metadata that doesn't match actual day counts (e.g., #38 has 9 actual days but metadata says 8)
5. **Add safari images** — All itineraries currently use placeholder images
6. **Verify all standalone activities** — 18 itineraries have no standalone activities linked to their days

### Medium-term
7. **Add accommodations to itinerary days** — `itinerary_day_accommodations` table exists but is empty for seeded itineraries
8. **SEO optimization** — Safari detail pages should have proper meta tags, structured data
9. **Performance** — Consider SSR/ISR for safari pages instead of client-side fetching

---

## Important Decisions & Patterns

### Database Conventions
- **Park IDs are fixed:** Serengeti=1, Ngorongoro=2, Tarangire=3, Manyara=4, Arusha=9, Kilimanjaro=12, Mkomazi=14, Jozani=27
- **Tariff IDs:** Conservation Fee=1, Public Camping=2, Special Camping=3, Concession=10, Rescue=9, Hiking=11, WMA=12, Upper Barafu=6, Parks Accommodations=8
- **Activity IDs:** Walking Safari=1, Ranger=2, Bush Meals=3, Canopy Walk=4, Night Game Drive=5, Canoeing=6, Rhino Viewing=13, Crater Service=14, Hot Air Balloon=16, Bird Watching=21, Cultural Tours=22, Photography Safaris=23, Wildlife Tracking=25
- **Nation category 4** = Non-Resident, **Age category 3** = Adult
- **Entry types:** DAY_TRIP, SLEEP_OVER, TRANSIT

### Foreign Key Constraints (Critical)
- `itinerary_day_park_activities(activity_id, park_id)` → `parks_activities(activity_id, park_id)` — can only assign activities registered for that specific park
- `itinerary_day_park_tariffs(park_id, tariff_id)` → `parks_tariffs(park_id, tariff_id)` — same for tariffs
- Must ensure `parks_activities` and `parks_tariffs` entries exist before linking to itinerary days

### Frontend Patterns
- All pages are client-side (`"use client"`) with API fetching via axios
- API client in `src/lib/api.ts` handles locale headers automatically
- Pricing reads from `costSummary[0].grandTotalRack` — returns null gracefully if no cost data
- Safaris are identified by `code` (e.g., `ITI-16D15N-1001`) in URLs, falling back to `id`
- Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop

### Deployment
- **Production server:** `ssh -i ~/.ssh/deploy_ryhqtech root@ryhqtech.com`
- **Production MySQL:** `mysql -u kabengosafaris -pRick4450 springboot_itineraryledger_kabengosafaris`
- **Local MySQL (XAMPP):** `/opt/lampp/bin/mysql -u root springboot_itineraryledger_kabengosafaris`
- **Website URL:** `https://kabengosafaris.com`
- **JDBC fix applied:** `?zeroDateTimeBehavior=convertToNull` in both application.properties files

### Seed Script Design
- Idempotent where possible (`INSERT...SELECT...WHERE NOT EXISTS`)
- Variables (`@itin_N`, `@day_N_M`) track LAST_INSERT_ID() for chaining related inserts
- Scripts 1+2 must share a MySQL session; scripts 3-5 are independent
- Budget-differentiated tariffs use bulk `INSERT...SELECT` with JOINs rather than individual statements
