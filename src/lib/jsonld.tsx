const BASE_URL = "https://kabengosafaris.com";

/**
 * Render a JSON-LD <script> tag for structured data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization schema — used on root layout.
 */
export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kabengo Safaris",
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.svg`,
    description:
      "Premium safari tours, breathtaking destinations, and unforgettable wildlife experiences across East Africa.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English", "Swahili", "French", "German", "Spanish", "Italian", "Portuguese"],
    },
    sameAs: ["https://www.instagram.com/kabengosafaris/"],
    areaServed: {
      "@type": "Country",
      name: "Tanzania",
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/**
 * TouristTrip schema for safari detail pages.
 */
export function getSafariJsonLd(safari: {
  name: string;
  description?: string;
  primaryImageUrl?: string;
  totalDays?: number;
  totalNights?: number;
  startLocation?: string;
  endLocation?: string;
  code?: string;
  costSummary?: { totalRackPriceUSD?: number };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: safari.name,
    description: safari.description
      ? stripHtml(safari.description).slice(0, 300)
      : `${safari.name} - Safari experience with Kabengo Safaris`,
    ...(safari.primaryImageUrl && { image: safari.primaryImageUrl }),
    provider: {
      "@type": "Organization",
      name: "Kabengo Safaris",
      url: BASE_URL,
    },
    ...(safari.totalDays && {
      itinerary: {
        "@type": "ItemList",
        numberOfItems: safari.totalDays,
        description: `${safari.totalDays} Days / ${safari.totalNights ?? safari.totalDays - 1} Nights`,
      },
    }),
    url: `${BASE_URL}/en/safaris/${safari.code}`,
    ...(safari.costSummary?.totalRackPriceUSD && {
      offers: {
        "@type": "Offer",
        price: safari.costSummary.totalRackPriceUSD,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
  };
}

/**
 * TouristAttraction schema for park detail pages.
 */
export function getParkJsonLd(park: {
  name: string;
  shortDescription?: string;
  fullDescription?: string;
  primaryImageUrl?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  slug?: string;
}) {
  const desc = park.shortDescription || park.fullDescription;
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: park.name,
    description: desc
      ? stripHtml(desc).slice(0, 300)
      : `${park.name} - National Park in Tanzania`,
    ...(park.primaryImageUrl && { image: park.primaryImageUrl }),
    url: `${BASE_URL}/en/parks/${park.slug}`,
    ...(park.latitude && park.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: park.latitude,
        longitude: park.longitude,
      },
    }),
    ...(park.region && {
      address: {
        "@type": "PostalAddress",
        addressRegion: park.region,
        addressCountry: "TZ",
      },
    }),
    isAccessibleForFree: false,
  };
}

/**
 * LodgingBusiness schema for accommodation detail pages.
 */
export function getAccommodationJsonLd(acc: {
  name: string;
  shortDescription?: string;
  details?: string;
  primaryImageUrl?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  categoryApproximateStars?: number;
  priceRange?: string;
  slug?: string;
}) {
  const desc = acc.shortDescription || acc.details;
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: acc.name,
    description: desc
      ? stripHtml(desc).slice(0, 300)
      : `${acc.name} - Accommodation in Tanzania`,
    ...(acc.primaryImageUrl && { image: acc.primaryImageUrl }),
    url: `${BASE_URL}/en/accommodations/${acc.slug}`,
    ...(acc.latitude && acc.longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: acc.latitude,
        longitude: acc.longitude,
      },
    }),
    ...(acc.region && {
      address: {
        "@type": "PostalAddress",
        addressRegion: acc.region,
        addressCountry: "TZ",
      },
    }),
    ...((acc.starRating || acc.categoryApproximateStars) && {
      starRating: {
        "@type": "Rating",
        ratingValue: acc.starRating || acc.categoryApproximateStars,
      },
    }),
    ...(acc.priceRange && { priceRange: acc.priceRange }),
  };
}

/**
 * FAQPage schema for the FAQ page.
 */
export function getFAQJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
