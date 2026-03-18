# SEO Guide — Kabengo Safaris Website

> This guide explains all the SEO (Search Engine Optimization) improvements on the Kabengo Safaris website.
> Written simply enough for an 11-year-old to understand!

---

## What is SEO?

SEO stands for **Search Engine Optimization**. It means making your website easy for Google to find, understand, and show to people who are searching.

Think of Google like a **librarian**. When someone asks "best safari in Tanzania," the librarian needs to find the best book (website) to recommend. SEO is like writing a really good book cover, table of contents, and summary so the librarian picks YOUR book first.

---

## 1. JSON-LD Structured Data — "The Cheat Sheet for Google"

**File:** `src/lib/jsonld.tsx`

### What is it?

JSON-LD is **hidden code** on your website that Google can read but visitors can't see. It's like whispering a cheat sheet to Google about what your page is about.

Without it, Google has to *guess* what your website is. With it, you're *telling* Google directly.

### What we added

| Schema Type | Where it's used | What it tells Google |
|---|---|---|
| **Organization** | Every page (root layout) | "We are Kabengo Safaris, a safari company in Tanzania. Here's our logo, Instagram, and we speak 7 languages." |
| **TouristTrip** | Safari detail pages | "This is a 7-day safari trip. It costs $2,500. It starts in Arusha." |
| **TouristAttraction** | Park detail pages | "This is Serengeti National Park. Here are the exact GPS coordinates." |
| **LodgingBusiness** | Accommodation detail pages | "This is a 5-star lodge in Ngorongoro. Here's the location and price range." |
| **FAQPage** | FAQ page | "Here are 8 questions and answers about safaris." |

### Example — Without JSON-LD

Google sees your safari page and thinks:
> "Hmm, this page has some text about a safari... I think? Let me guess what it's about."

### Example — With JSON-LD

Google sees your safari page and knows:
> "This is a 7-day safari trip called 'Serengeti & Ngorongoro Adventure' by Kabengo Safaris. It costs $2,500 per person, starts in Arusha, and includes 6 nights."

### Why it matters

Google can now show **rich results** in search:
- FAQ answers appear **directly in Google** (people don't even need to click!)
- Safari prices and duration show up in search results
- Star ratings appear next to accommodations
- This makes your results **bigger and more eye-catching** than competitors

---

## 2. Dynamic Page Metadata — "Giving Every Page Its Own Name Tag"

**Files:**
- `src/app/[locale]/safaris/[id]/layout.tsx`
- `src/app/[locale]/parks/[id]/layout.tsx`
- `src/app/[locale]/accommodations/[id]/layout.tsx`
- `src/app/[locale]/activities/[id]/layout.tsx`

### What is it?

When Google shows your page in search results, it shows a **title** and a **description**. These come from your page's metadata.

### Example — Before (Bad)

Someone searches "Serengeti safari Tanzania" and Google shows:

```
Safaris | Kabengo Safaris
Premium safari tours and wildlife experiences across East Africa.
```

Boring! This is the same generic text for EVERY safari page. Google doesn't know what makes this page special.

### Example — After (Good)

```
7-Day Serengeti & Ngorongoro Safari | Kabengo Safaris
Explore the Serengeti plains and Ngorongoro Crater on this 7-day wildlife
adventure. Starting from Arusha, experience the Big Five...
```

Now Google (and the person searching) knows EXACTLY what this page is about!

### What else this includes

- **Canonical URLs** — Tells Google "this is the ONE official link for this page" so it doesn't get confused by duplicate pages
- **Hreflang alternates** — Tells Google "this page also exists in Swahili, French, German, Spanish, Italian, and Portuguese" so it shows the right language to the right person
- **OpenGraph & Twitter metadata** — Controls how the page looks when shared on social media (more on this in section 4)

### How it works technically

When someone visits `/en/safaris/ITI-7D6N-1001`, Next.js:
1. Calls the backend API to fetch the safari's name, description, and image
2. Sets that as the page's title, description, and OG image
3. Google sees unique, relevant metadata for every single safari

---

## 3. Dynamic Sitemap — "The Map of Your Entire Website"

**File:** `src/app/sitemap.ts`

### What is it?

A sitemap is a file (`sitemap.xml`) that lists **every single page** on your website. You give it to Google and say: "Here, these are all my pages. Please index them."

### Example — Before (Incomplete)

Your sitemap only had ~12 pages:

```
kabengosafaris.com/en/
kabengosafaris.com/en/safaris
kabengosafaris.com/en/parks
kabengosafaris.com/en/about
... (just the main pages)
```

Google had **no idea** about your individual safari pages, park pages, or accommodation pages!

### Example — After (Complete)

Your sitemap now has **hundreds** of pages:

```
kabengosafaris.com/en/
kabengosafaris.com/en/safaris
kabengosafaris.com/en/safaris/ITI-7D6N-1001     ← individual safari!
kabengosafaris.com/en/safaris/ITI-5D4N-1002     ← another safari!
kabengosafaris.com/en/parks/serengeti            ← individual park!
kabengosafaris.com/en/parks/ngorongoro           ← another park!
kabengosafaris.com/sw/safaris/ITI-7D6N-1001     ← same safari in Swahili!
kabengosafaris.com/fr/safaris/ITI-7D6N-1001     ← same safari in French!
... (every page, in every language)
```

### Think of it like this

**Before:** You gave Google a map with just the street names.
**After:** You gave Google a map with every single house address, in 7 languages.

### Priority system

Not all pages are equally important. The sitemap tells Google:
- **Homepage** → Priority 1.0 (most important), refresh weekly
- **Safari pages** → Priority 0.9 (very important), refresh weekly
- **Parks/Accommodations/Activities** → Priority 0.7 (important), refresh monthly

### How often does it update?

The sitemap **regenerates every 1 hour** (via `revalidate: 3600`). So if you add a new safari, it appears in the sitemap within an hour.

**But** — Google crawls your sitemap on **its own schedule**, not yours. Typically:
- New pages get discovered within **1-4 days**
- Changes to existing pages take **days to weeks** to reflect in search
- You can speed this up by submitting your sitemap in **Google Search Console**

---

## 4. OG Image — "The Preview Picture When You Share a Link"

**File:** `src/app/opengraph-image.tsx`

### What is it?

When you paste a link on WhatsApp, Facebook, Twitter, or Slack, you see a **preview card** with a picture, title, and description. That picture is called an **OpenGraph image** (OG image).

### Example — Before (No image)

You share `kabengosafaris.com/en/safaris/serengeti` on WhatsApp:

```
┌─────────────────────────┐
│ Safaris | Kabengo Safaris│
│ Premium safari tours...  │
│                          │
│      (no picture)        │
│                          │
└─────────────────────────┘
```

Boring! Nobody wants to click on that.

### Example — After (Beautiful preview)

```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │  [Beautiful photo    │ │
│ │   of the Serengeti]  │ │
│ └─────────────────────┘ │
│ 7-Day Serengeti &       │
│ Ngorongoro Safari       │
│ Explore the Serengeti   │
│ plains on this 7-day... │
└─────────────────────────┘
```

Way more clickable!

### How it works

- **Default pages** (homepage, about, contact) → Show a branded "Kabengo Safaris" image with company colors
- **Safari detail pages** → Show that safari's actual photo
- **Park detail pages** → Show that park's actual photo
- **Accommodation detail pages** → Show that accommodation's actual photo

The default image is **auto-generated** using Next.js — no designer needed. It creates a nice branded image with the company name and tagline.

---

## 5. Next.js Image Optimization — "Making Photos Load Faster"

**Files changed:**
- `src/components/sections/SafarisSection.tsx`
- `src/components/sections/ParksSection.tsx`
- `src/components/sections/ActivitiesSection.tsx`
- `src/components/park/ParkGallery.tsx`
- `src/app/[locale]/gallery/page.tsx`

### What is it?

We replaced regular HTML `<img>` tags with Next.js `<Image>` component.

### Example — Before (Regular `<img>`)

Imagine you have a photo that's 4000x3000 pixels (huge!). When someone visits on their phone:

1. Browser downloads the **full 4000x3000 image** (maybe 2MB)
2. Browser squishes it down to fit a 400px wide card
3. This wastes data and takes forever to load

### Example — After (Next.js `<Image>`)

Same photo, but now:

1. Next.js looks at the visitor's screen size
2. On a phone → serves a **400px wide** version (maybe 50KB)
3. On a tablet → serves an **800px wide** version
4. On a desktop → serves a **1200px wide** version
5. Automatically converts to **WebP format** (same quality, much smaller file)
6. Images below the screen **don't load until you scroll to them** (lazy loading)

### Why Google cares

Google measures how fast your website loads — this is called **Core Web Vitals**. There are three scores:

- **LCP** (Largest Contentful Paint) — How fast the biggest image/text loads
- **FID** (First Input Delay) — How fast the page responds to clicks
- **CLS** (Cumulative Layout Shift) — How much stuff jumps around while loading

Faster images = better LCP score = higher Google ranking.

### The `sizes` prop explained

You'll see code like:
```
sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

This tells the browser:
- On phones (under 768px wide) → the image takes up **100%** of the screen width
- On tablets (under 1024px) → the image takes up **50%** of the screen
- On desktops → the image takes up **33%** of the screen

The browser uses this to pick the perfect image size to download. Smart!

---

## 6. Web App Manifest — "Making Your Website Feel Like an App"

**File:** `public/manifest.json`

### What is it?

A small file that tells phones: "This website can be installed like an app."

### What it does

- If someone on their phone visits your site and taps **"Add to Home Screen"**, they get a nice app icon
- The app opens with your **brand color** (#5a1e03 — your brown color) in the status bar
- It says "Kabengo Safaris" under the icon

### Why it matters for SEO

Google gives a small ranking boost to websites that are "progressive web apps" (PWA). The manifest is the first step toward that. It signals to Google that your website is well-built and user-friendly.

---

## 7. Server-Side API Utility — "The Behind-the-Scenes Helper"

**File:** `src/lib/server-api.ts`

### What is it?

This is a helper file that lets the **server** (not the visitor's browser) fetch data from your backend API. It's used by the metadata system and the sitemap.

### Why is this needed?

The detail pages (safaris, parks, etc.) are "client components" — they run in the visitor's browser. But `generateMetadata()` runs on the **server** before the page is sent to the visitor.

So we needed a separate way to fetch data on the server. This utility:
- Uses native `fetch()` (works on the server, unlike axios)
- **Caches responses for 1 hour** (`revalidate: 3600`) so it doesn't hammer your API
- Fails silently — if the API is down, the site still works, just with generic metadata

---

## The Big Picture

Imagine Google is a **judge at a talent show**, deciding who gets to be on the first page of results.

### Before these changes

Your website walks on stage:
- No name tag (generic titles)
- No introduction (no structured data)
- A blurry selfie (no OG image)
- A hand-drawn map with 12 streets (tiny sitemap)
- Carrying a giant suitcase of photos (unoptimized images, slow loading)

The judge says: "Next!"

### After these changes

Your website walks on stage:
- A clear name tag for every single page ("7-Day Serengeti Safari")
- A full resume (JSON-LD structured data)
- A professional headshot (OG image)
- A detailed map of every house in town (complete dynamic sitemap)
- A slim portfolio with perfectly-sized photos (optimized images)
- Available in 7 languages

The judge says: "Now THIS is professional. Page one!"

---

## How Often Does Google Update?

| What | How often YOUR site updates | How often GOOGLE sees it |
|---|---|---|
| Sitemap | Every 1 hour | Google crawls every few days |
| Page metadata | Instant (on request) | Shows in search within days to weeks |
| JSON-LD rich results | Instant (on request) | Can take weeks to first appear |
| OG images | Instant (on request) | Social platforms cache for ~24 hours |

### Speed it up with Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your site: `https://kabengosafaris.com`
3. Submit your sitemap: `https://kabengosafaris.com/sitemap.xml`
4. Use "URL Inspection" to request indexing for important pages

This is **free** and is the single most important thing you can do after deploying these changes.

---

## Files Summary

| File | What it does |
|---|---|
| `src/lib/jsonld.tsx` | JSON-LD structured data generators |
| `src/lib/server-api.ts` | Server-side API fetch for metadata & sitemap |
| `src/lib/seo.ts` | Hreflang alternate link builder |
| `src/app/layout.tsx` | Organization schema + manifest link |
| `src/app/sitemap.ts` | Dynamic sitemap with all entities |
| `src/app/opengraph-image.tsx` | Default OG image generator |
| `src/app/[locale]/faq/layout.tsx` | FAQ page schema |
| `src/app/[locale]/safaris/[id]/layout.tsx` | Safari metadata + TouristTrip schema |
| `src/app/[locale]/parks/[id]/layout.tsx` | Park metadata + TouristAttraction schema |
| `src/app/[locale]/accommodations/[id]/layout.tsx` | Accommodation metadata + LodgingBusiness schema |
| `src/app/[locale]/activities/[id]/layout.tsx` | Activity metadata |
| `public/manifest.json` | Web app manifest |
| `src/components/sections/SafarisSection.tsx` | Image optimization (next/image) |
| `src/components/sections/ParksSection.tsx` | Image optimization (next/image) |
| `src/components/sections/ActivitiesSection.tsx` | Image optimization (next/image) |
| `src/components/park/ParkGallery.tsx` | Image optimization (next/image) |
| `src/app/[locale]/gallery/page.tsx` | Image optimization (next/image) |
