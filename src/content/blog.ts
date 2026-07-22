// File-based blog content — fully server-rendered (no backend needed), so every
// article ships in the raw HTML for SEO/GEO. Add a new object to POSTS to publish.
// Content is authored in English (our primary SEO/GEO language); the page chrome
// is translated. See docs/SEO-GEO-STRATEGY.md.

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO (YYYY-MM-DD)
  author: string;
  readMinutes: number;
  tags: string[];
  body: Block[];
  faqs: { q: string; a: string }[];
}

const GRADS = [
  "linear-gradient(150deg,#5a7a3a,#274e22)",
  "linear-gradient(150deg,#8a6a2a,#5a3410)",
  "linear-gradient(150deg,#c9962f,#7a2f14)",
  "linear-gradient(150deg,#3a8a7a,#134a42)",
];
export function coverGrad(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

export const POSTS: BlogPost[] = [
  {
    slug: "best-time-great-migration-serengeti",
    title: "When Is the Best Time to See the Great Migration in the Serengeti?",
    excerpt:
      "The Great Migration happens year-round — the trick is knowing where the herds are each month. Here's a plain-English guide to timing your Serengeti safari for calving, river crossings and the dry season.",
    date: "2026-07-10",
    author: "Enock Fabian",
    readMinutes: 6,
    tags: ["Great Migration", "Serengeti", "Best time to visit"],
    body: [
      { type: "p", text: "The Great Migration is not a single event on a single date. It is a continuous, year-round loop of roughly 1.5 million wildebeest and hundreds of thousands of zebra moving through the Serengeti–Mara ecosystem in search of fresh grass and water. So the real question is not \"when is the migration?\" but \"where will the herds be when I travel, and what do I want to see?\"" },
      { type: "h2", text: "December to March — the calving season (southern Serengeti)" },
      { type: "p", text: "The herds gather on the short-grass plains of the southern Serengeti and Ndutu area. Around late January to March, roughly 8,000 calves are born every day. This is the best window for dramatic predator action — lions, cheetahs and hyenas follow the newborns closely. It is also greener, quieter and often better value than the peak season." },
      { type: "h2", text: "April to May — the green season and the rut" },
      { type: "p", text: "The long rains arrive and the herds begin drifting north and west. It is lush, dramatic and the lowest-cost time to travel. Some roads are muddy, but wildlife is still excellent and lodges are at their calmest." },
      { type: "h2", text: "June to July — the western corridor and Grumeti" },
      { type: "p", text: "The herds push through the central and western Serengeti, with the first tense crossings of the Grumeti River. This is a wonderful, less-crowded alternative to the famous northern crossings." },
      { type: "h2", text: "August to October — the Mara River crossings (northern Serengeti)" },
      { type: "p", text: "This is the iconic image: thousands of wildebeest braving crocodile-filled rivers in the northern Serengeti near the Kenyan border. Crossings are unpredictable and require patience, but seeing one is unforgettable. It is peak season, so book well ahead." },
      { type: "h2", text: "So when should you go?" },
      { type: "ul", items: [
        "For newborns and big-cat action: late January to March (southern Serengeti).",
        "For the famous river crossings: August to October (northern Serengeti).",
        "For fewer crowds and better value: April to June.",
        "For a first safari at any time: the Serengeti and Ngorongoro deliver superb game viewing all year — we simply position your camps where the herds are.",
      ] },
      { type: "p", text: "Because the migration moves, timing and camp location matter more than any fixed itinerary. Tell us your travel dates and we'll place you where the action is likely to be." },
    ],
    faqs: [
      { q: "Can I see the Great Migration all year round?", a: "Yes. The herds are always somewhere in the Serengeti–Mara ecosystem. The key is matching your travel dates to the herds' likely location — calving in the south (Dec–Mar) or river crossings in the north (Aug–Oct)." },
      { q: "Which month has the river crossings?", a: "The dramatic Mara River crossings in the northern Serengeti typically happen between August and October, though exact timing depends on the rains and is never guaranteed on a given day." },
      { q: "Is the migration worth it in the green season?", a: "Absolutely. April–June is lush, quiet and better value, and the calving season (Jan–Mar) offers some of the year's best predator sightings." },
    ],
  },
  {
    slug: "how-many-days-tanzania-safari",
    title: "How Many Days Do You Need for a Tanzania Safari?",
    excerpt:
      "3, 5, 7 or 10+ days? A practical breakdown of what you can realistically see in northern Tanzania for each trip length — and how to add Zanzibar.",
    date: "2026-07-05",
    author: "Enock Fabian",
    readMinutes: 5,
    tags: ["Trip planning", "Northern circuit", "Zanzibar"],
    body: [
      { type: "p", text: "The right length depends on how far you're travelling, your budget, and whether you want to add a beach. Here's what each trip length realistically delivers on Tanzania's northern circuit." },
      { type: "h2", text: "3 days — a taste of the wild" },
      { type: "p", text: "Enough for Tarangire and Ngorongoro Crater, or a quick Serengeti fly-in. Ideal if you're short on time or combining with business. You'll see a lot, but travel days eat into game time." },
      { type: "h2", text: "5 days — the sweet spot for a first safari" },
      { type: "p", text: "Tarangire, Ngorongoro Crater and the Serengeti at a comfortable pace. This is the most popular length for first-time visitors: enough time to relax into the rhythm of the bush and enjoy full-day game drives." },
      { type: "h2", text: "7 days — the classic northern circuit" },
      { type: "p", text: "Add Lake Manyara and more time in the Serengeti (following the migration). Seven days lets you slow down, explore different habitats, and dramatically improve your chances of big cats and the migration." },
      { type: "h2", text: "10+ days — safari plus Zanzibar" },
      { type: "p", text: "Pair a full northern-circuit safari with a short flight to Zanzibar for white-sand beaches and Stone Town. This 'bush and beach' combination is our most-loved longer trip." },
      { type: "h2", text: "Our honest advice" },
      { type: "ul", items: [
        "Give yourself at least 5 days on safari if you can — it transforms the experience.",
        "Fly between distant parks to save game-drive time on longer trips.",
        "Match the season to what you want to see (see our Great Migration timing guide).",
        "Every Kabengo trip is private and tailor-made, so we tune the pace to you.",
      ] },
    ],
    faqs: [
      { q: "What is the minimum for a worthwhile Tanzania safari?", a: "Three days is the realistic minimum (Tarangire + Ngorongoro, or a Serengeti fly-in), but five days is the sweet spot for a first safari." },
      { q: "Can I combine a safari with Zanzibar?", a: "Yes — a short flight connects the northern circuit to Zanzibar. Ten or more days lets you enjoy both the bush and the beach comfortably." },
      { q: "Is it better to drive or fly between parks?", a: "For shorter trips, driving lets you see the landscape change. For longer itineraries or distant parks, flying saves hours and maximises game-viewing time." },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
