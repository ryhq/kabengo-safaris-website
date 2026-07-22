# Kabengo Safaris — SEO & GEO Strategy

_Last updated: 2026-07-22_

This document explains how the Kabengo Safaris website is optimised for **SEO**
(traditional search engines like Google) and **GEO** (Generative Engine
Optimization — being found and cited by AI answer engines like ChatGPT,
Perplexity, Google AI Overviews, and Claude). It also records the conventions
every new page should follow so we don't lose ground over time.

---

## TL;DR — Server-rendering, explained like you're 12 (with a Tanzanian twist)

Imagine our website is a **mama lishe food stall** at the market, and the
customers are **robots** — Google's robot and the new AI robots (the ones that
answer questions inside ChatGPT and friends). These robots visit our stall, look
at the food, and then go tell *thousands of tourists* around the world, "Eat
here — they have the best food!" 🍲 So we really want the robots to see our food
clearly.

**How it worked before (the problem):**
When a robot walked up, the plate was **empty**, with a little note: *"Wait a few
seconds… the ugali and nyama choma are still cooking in the kitchen."*
- A **rich, patient robot** (Google) waits for the food to finish, then sees the
  full plate. Fine. 👍
- But the **AI robots are in a hurry** — they don't wait. They see an empty
  plate and leave. So when someone asks an AI *"Tell me about Kabengo's Serengeti
  trip,"* it doesn't really know — it only saw an empty plate. 😞

Why was the plate empty? Because the page was **cooking the food on the
customer's phone** (the "kitchen" was in *their* browser). The robot got the
plate *before* the browser finished cooking.

**What we changed (server-rendering):**
Now we **cook the food in our own kitchen first** and hand every robot a plate
that's **already full** — all the words about the park, the day-by-day safari
plan, the lodge details, already there, no waiting. In tech words: instead of the
page filling itself in on the *visitor's* device ("client-side"), our **server**
builds the full page first ("server-rendered") and sends the finished thing.

**And `llms.txt`?** That's a **clear, simple menu taped to the front of the
stall, written specially for the robots** — "here's who we are, our best dishes,
and where to find each one." It makes it easy for AI robots to understand and
recommend us. 📋

**The result:** more travellers hear about Kabengo Safaris — from Google *and*
from AI assistants — because now every robot sees the full plate. 🦁🐘

---

## SEO vs GEO — what's the difference?

| | SEO (search engines) | GEO (AI answer engines) |
|---|---|---|
| Who | Google, Bing | ChatGPT, Perplexity, Google AI Overviews, Claude |
| How they read | Google **runs JavaScript**, so it's patient | Many AI crawlers **do not run JavaScript** |
| What they reward | Keywords, links, page speed, structured data | Clear factual content **in the raw HTML**, structured data, citable answers |
| Our biggest lever | Metadata, sitemap, hreflang, Core Web Vitals | **Server-rendered content** + JSON-LD + `llms.txt` + FAQs |

The key insight: **GEO cares even more than SEO that the real content is in the
server HTML**, because AI crawlers often skip JavaScript.

---

## What's implemented (live)

### 1. Rendering — content is in the server HTML
- Detail pages (`/parks/[id]`, `/safaris/[id]`, `/accommodations/[id]`,
  `/activities/[id]`) are **server components** (`page.tsx`) that fetch the entity
  server-side and pass it as `initialData` to a client component
  (`*DetailClient.tsx`) which **seeds its state from props**.
- Because client components render to HTML during SSR, the full descriptive prose
  now ships in the initial response — readable by no-JS AI crawlers, not just
  Googlebot. Interactivity (carousels, maps, lightboxes, playback) is preserved.
- Server fetchers live in `src/lib/server-api.ts` (`fetchParkDetail`, etc.) and
  reuse the cached `serverFetch` helper (`next: { revalidate: 3600 }`).
- **Safe fallback:** if the server fetch fails, `null` is passed and the client
  fetches as before — no breakage.

### 2. Metadata
- Per-route `generateMetadata` (title, description, OpenGraph, Twitter cards) on
  home, planner, and detail routes via server `layout.tsx` files.
- Canonical + **hreflang alternates** for all 10 locales **+ `x-default`** via
  `buildAlternates()` in `src/lib/seo.ts`.
- Site-wide OG image (`src/app/opengraph-image.tsx`).

### 3. Structured data (JSON-LD) — `src/lib/jsonld.tsx`
Server-rendered on every relevant page:
- `TravelAgency` (org authority: address, contact, area served, AggregateRating)
- `WebSite` + `SearchAction` (sitelinks search box)
- `BreadcrumbList`
- `TouristTrip` (safari itineraries: per-day plan + Offer + rating)
- `TouristAttraction` (parks: geo + address)
- `FAQPage` (great for GEO — LLMs love Q&A)

### 4. Crawlability
- `src/app/sitemap.ts` — dynamic; every safari/park/accommodation/activity ×
  10 locales, with alternates.
- `src/app/robots.ts` — allows all crawlers (incl. AI bots: GPTBot, ClaudeBot,
  PerplexityBot, Google-Extended) and points to the sitemap.
- `src/app/llms.txt/route.ts` — curated, factual site map for AI answer engines.

### 5. Internationalisation
- 10 locales (en, sw, fr, de, es, it, pt, af, uk, ar) via next-intl; all new copy
  is translated into every locale.

---

## Rules for every new page (keep the score up)

1. **Put real content in the server HTML.** If a page shows meaningful text
   (descriptions, facts, FAQs), fetch it in a server component and pass it down,
   or render it in a server component. Don't rely on a `useEffect` fetch for
   primary content.
2. **Add `generateMetadata`** (title + description + `buildAlternates` hreflang +
   OpenGraph). Use a server `layout.tsx` if the page itself must be a client
   component.
3. **Add JSON-LD** where a schema type fits (Article/BlogPosting, FAQPage,
   Breadcrumb, Product/Offer, etc.).
4. **Translate all new copy** into the 10 locales.
5. **Write for humans and answer engines:** clear headings, short factual
   sentences, and a FAQ block where natural. Name things the way travellers say
   them.
6. **Include the page in the sitemap** (static list, or dynamic if entity-driven).

---

## Roadmap / backlog

- [ ] **Blog** — the biggest untapped SEO/GEO lever. Long-tail, citable articles
  ("Best time for the Great Migration", "5 vs 7 days in the Serengeti"). Each post
  server-rendered with `BlogPosting` + `FAQPage` JSON-LD and full metadata.
- [ ] **Metadata sweep** — ensure gallery, book, terms, privacy, faq, blog all
  have unique titles/descriptions + hreflang.
- [ ] Ongoing: expand `FAQPage` content; per-image `alt` text; prioritise LCP hero
  images.

---

## How to verify

- **Rendering:** `curl https://kabengosafaris.com/en/parks/<slug>` — the park's
  description text should be present in the raw HTML (not just a skeleton).
- **Structured data:** Google Rich Results Test / Schema.org validator on a detail
  URL — expect TravelAgency, Breadcrumb, and the page's primary type.
- **Sitemap:** `https://kabengosafaris.com/sitemap.xml` lists all entities ×
  locales with alternates.
- **llms.txt:** `https://kabengosafaris.com/llms.txt` returns the plain-text map.
- **GEO spot-check:** ask an AI assistant "What is Kabengo Safaris?" and check it
  describes us accurately (Arusha, tailor-made, TATO/TALA, Tripadvisor 5.0).
