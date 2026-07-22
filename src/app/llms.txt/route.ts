// /llms.txt — a concise, LLM-friendly map of the site (emerging GEO convention).
// Curated key pages + factual summary so answer engines can cite Kabengo accurately.
export const revalidate = 86400; // 1 day

const BASE = "https://kabengosafaris.com";

const CONTENT = `# Kabengo Safaris

> Kabengo Safaris is a Tanzania-based, family-run tour operator in Arusha that designs private, tailor-made safaris across northern Tanzania (Serengeti, Ngorongoro Crater, Tarangire, Lake Manyara) and Zanzibar beach holidays. TATO/TALA licensed, guides who speak your language, rated 5.0 on Tripadvisor. Every trip is custom-built — there is no fixed booking cart; travellers request a free, no-obligation proposal and a local specialist replies within 24 hours.

## About
- Founder-led by Enock Fabian, a lifelong local guide based in Arusha, Tanzania.
- Private, custom itineraries only — no shared-bus group tours.
- Fully licensed & bonded operator (TATO / TALA). Support in 10 languages. Reply within 24 hours.
- Contact: info@kabengosafaris.com · phone/WhatsApp +255 786 345 408.

## Start here
- [Plan your safari](${BASE}/en/plan): Tailor-made trip planner — share your dates, interests and budget for a free, no-obligation proposal.
- [Contact](${BASE}/en/contact): Talk to a real specialist in Arusha.

## Explore
- [Safaris & itineraries](${BASE}/en/safaris): Multi-day safari itineraries with day-by-day plans, maps, lodges and per-person pricing.
- [National parks](${BASE}/en/parks): Guides to Tanzania's parks — wildlife, best time to visit, and how to get there.
- [Accommodations](${BASE}/en/accommodations): Lodges and tented camps built into trips.
- [Activities](${BASE}/en/activities): Game drives, walking safaris, cultural visits, balloon safaris and more.
- [Guest reviews](${BASE}/en/reviews): Verified Tripadvisor reviews.
- [FAQ](${BASE}/en/faq): Planning, cost, best time to visit, safety and what's included.
- [Gallery](${BASE}/en/gallery): Photos from Tanzania and Zanzibar.

## Notes
- Available in 10 languages (en, sw, fr, de, es, it, pt, af, uk, ar) via /{locale}/ paths; English is the default.
- Complete list of URLs: ${BASE}/sitemap.xml
`;

export function GET() {
  return new Response(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
