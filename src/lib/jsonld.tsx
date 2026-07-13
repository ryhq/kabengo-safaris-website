const BASE_URL = "https://kabengosafaris.com";

/* ── Organization authority constants ──
 * Fill the remaining sameAs profiles as they go live (Facebook, YouTube,
 * TripAdvisor, SafariBookings) — they strengthen entity trust for SEO & GEO. */
const ORG_SAME_AS: string[] = [
  "https://www.instagram.com/kabengosafaris/",
  "https://www.tripadvisor.com/Attraction_Review-g297913-d34283345-Reviews-Kabengo_Safaris-Arusha_Arusha_Region.html",
  // TODO (provide URLs): Facebook, YouTube, SafariBookings
];
const ORG_PHONE = "+255786345408";
const ORG_EMAIL = "info@kabengosafaris.com";
const ORG_LANGUAGES = ["en", "sw", "fr", "de", "es", "it", "pt", "af", "uk"];

/** Build a locale-aware absolute URL. */
export function localeUrl(locale: string, path = ""): string {
  return `${BASE_URL}/${locale}${path}`;
}

export interface AggregateRatingInput {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

function aggregateRating(a?: AggregateRatingInput | null) {
  if (!a || !a.reviewCount || !a.ratingValue) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: a.ratingValue,
    reviewCount: a.reviewCount,
    bestRating: a.bestRating ?? 5,
    worstRating: a.worstRating ?? 1,
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

/** Render a JSON-LD <script> tag for structured data. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * TravelAgency (organization) schema — rendered once per page in the locale layout.
 */
export function getOrganizationJsonLd(opts?: { aggregate?: AggregateRatingInput | null }) {
  const ar = aggregateRating(opts?.aggregate);
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${BASE_URL}/#organization`,
    name: "Kabengo Safaris",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.svg`,
    image: `${BASE_URL}/images/logo.svg`,
    description:
      "Kabengo Safaris is a Tanzanian tour operator offering tailor-made safaris across the Serengeti, Ngorongoro, Tarangire and Zanzibar, with local expert guides.",
    telephone: ORG_PHONE,
    email: ORG_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Arusha",
      addressRegion: "Arusha",
      addressCountry: "TZ",
    },
    areaServed: [
      { "@type": "Country", name: "Tanzania" },
      { "@type": "Place", name: "Zanzibar" },
    ],
    knowsLanguage: ORG_LANGUAGES,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: ORG_PHONE,
      email: ORG_EMAIL,
      availableLanguage: ["English", "Swahili", "French", "German", "Spanish", "Italian", "Portuguese"],
    },
    sameAs: ORG_SAME_AS,
    ...(ar && { aggregateRating: ar }),
  };
}

/**
 * WebSite + SearchAction (sitelinks search box) — rendered in the locale layout.
 */
export function getWebSiteJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "Kabengo Safaris",
    inLanguage: locale,
    publisher: { "@id": `${BASE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/${locale}/safaris?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * BreadcrumbList schema (JSON-LD) — pass ordered {name, url} items.
 */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

interface SafariDay {
  dayNumber?: number;
  title?: string;
  description?: string;
  startLocation?: string;
  endLocation?: string;
}

/**
 * TouristTrip schema for safari detail pages — real per-day itinerary + offers + rating.
 */
export function getSafariJsonLd(
  safari: {
    name: string;
    description?: string;
    primaryImageUrl?: string;
    totalDays?: number;
    totalNights?: number;
    startLocation?: string;
    endLocation?: string;
    code?: string;
    days?: SafariDay[];
    costSummary?:
      | Array<{ grandTotalRack?: number; currency?: string }>
      | { grandTotalRack?: number; currency?: string };
  },
  opts?: { locale?: string; aggregate?: AggregateRatingInput | null }
) {
  const locale = opts?.locale || "en";
  const cost = Array.isArray(safari.costSummary) ? safari.costSummary[0] : safari.costSummary;
  const ar = aggregateRating(opts?.aggregate);
  const days = safari.days?.filter((d) => d.title || d.description) ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: safari.name,
    description: safari.description
      ? stripHtml(safari.description).slice(0, 300)
      : `${safari.name} — a tailor-made Tanzania safari with Kabengo Safaris.`,
    ...(safari.primaryImageUrl && { image: safari.primaryImageUrl }),
    url: localeUrl(locale, `/safaris/${safari.code}`),
    provider: { "@id": `${BASE_URL}/#organization` },
    ...(safari.startLocation && { touristType: "Safari" }),
    ...(safari.totalDays && {
      itinerary: {
        "@type": "ItemList",
        numberOfItems: safari.totalDays,
        name: `${safari.totalDays} Days / ${safari.totalNights ?? safari.totalDays - 1} Nights`,
        ...(days.length && {
          itemListElement: days.map((d, i) => ({
            "@type": "ListItem",
            position: d.dayNumber ?? i + 1,
            item: {
              "@type": "TouristDestination",
              name: d.title || `Day ${d.dayNumber ?? i + 1}`,
              ...(d.description && { description: stripHtml(d.description).slice(0, 220) }),
            },
          })),
        }),
      },
    }),
    ...(cost?.grandTotalRack && {
      offers: {
        "@type": "Offer",
        price: Math.round(cost.grandTotalRack),
        priceCurrency: cost.currency || "USD",
        availability: "https://schema.org/InStock",
        url: localeUrl(locale, `/safaris/${safari.code}`),
      },
    }),
    ...(ar && { aggregateRating: ar }),
  };
}

/**
 * TouristAttraction schema for park detail pages.
 */
export function getParkJsonLd(
  park: {
    name: string;
    shortDescription?: string;
    fullDescription?: string;
    primaryImageUrl?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
    slug?: string;
    openingHours?: string;
  },
  opts?: { locale?: string }
) {
  const locale = opts?.locale || "en";
  const desc = park.shortDescription || park.fullDescription;
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: park.name,
    description: desc
      ? stripHtml(desc).slice(0, 300)
      : `${park.name} — a national park in Tanzania.`,
    ...(park.primaryImageUrl && { image: park.primaryImageUrl }),
    url: localeUrl(locale, `/parks/${park.slug}`),
    touristType: ["Safari", "Wildlife viewing", "Nature"],
    ...(park.latitude && park.longitude && {
      geo: { "@type": "GeoCoordinates", latitude: park.latitude, longitude: park.longitude },
    }),
    ...(park.region && {
      address: { "@type": "PostalAddress", addressRegion: park.region, addressCountry: "TZ" },
    }),
    ...(park.openingHours && { openingHours: park.openingHours }),
    isAccessibleForFree: false,
  };
}

/* Map internal accommodation types to schema.org lodging subtypes. */
const LODGING_TYPE: Record<string, string> = {
  HOTEL: "Hotel",
  BOUTIQUE_HOTEL: "Hotel",
  RESORT: "Resort",
  LODGE: "LodgingBusiness",
  TENTED_CAMP: "Campground",
  MOBILE_CAMP: "Campground",
  CAMPSITE: "Campground",
  GUESTHOUSE: "LodgingBusiness",
};

/**
 * Lodging schema (Hotel / Resort / Campground / LodgingBusiness) for accommodation pages.
 */
export function getAccommodationJsonLd(
  acc: {
    name: string;
    shortDescription?: string;
    details?: string;
    primaryImageUrl?: string;
    region?: string;
    district?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    starRating?: number;
    categoryApproximateStars?: number;
    priceRange?: string;
    slug?: string;
    accommodationType?: string;
    amenities?: string;
    website?: string;
  },
  opts?: { locale?: string }
) {
  const locale = opts?.locale || "en";
  const desc = acc.shortDescription || acc.details;
  const type = (acc.accommodationType && LODGING_TYPE[acc.accommodationType]) || "LodgingBusiness";
  const amenityList = (acc.amenities || "")
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: acc.name,
    description: desc
      ? stripHtml(desc).slice(0, 300)
      : `${acc.name} — safari accommodation in Tanzania.`,
    ...(acc.primaryImageUrl && { image: acc.primaryImageUrl }),
    url: localeUrl(locale, `/accommodations/${acc.slug}`),
    ...(acc.website && { sameAs: [acc.website] }),
    ...((acc.address || acc.region) && {
      address: {
        "@type": "PostalAddress",
        ...(acc.address && { streetAddress: acc.address }),
        ...(acc.district && { addressLocality: acc.district }),
        ...(acc.region && { addressRegion: acc.region }),
        addressCountry: "TZ",
      },
    }),
    ...(acc.latitude && acc.longitude && {
      geo: { "@type": "GeoCoordinates", latitude: acc.latitude, longitude: acc.longitude },
    }),
    ...((acc.starRating || acc.categoryApproximateStars) && {
      starRating: { "@type": "Rating", ratingValue: acc.starRating || acc.categoryApproximateStars },
    }),
    ...(acc.priceRange && { priceRange: acc.priceRange }),
    ...(amenityList.length && {
      amenityFeature: amenityList.map((a) => ({
        "@type": "LocationFeatureSpecification",
        name: a,
        value: true,
      })),
    }),
  };
}

/**
 * TouristAttraction schema for activity detail pages.
 */
export function getActivityJsonLd(
  activity: {
    name: string;
    description?: string;
    detailedDescription?: string;
    primaryImageUrl?: string;
    slug?: string;
  },
  opts?: { locale?: string }
) {
  const locale = opts?.locale || "en";
  const desc = activity.description || activity.detailedDescription;
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: activity.name,
    description: desc
      ? stripHtml(desc).slice(0, 300)
      : `${activity.name} — a safari activity in Tanzania.`,
    ...(activity.primaryImageUrl && { image: activity.primaryImageUrl }),
    url: localeUrl(locale, `/activities/${activity.slug}`),
    touristType: "Safari",
    provider: { "@id": `${BASE_URL}/#organization` },
  };
}

/**
 * FAQPage schema.
 */
export function getFAQJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
