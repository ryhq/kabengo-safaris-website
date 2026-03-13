import type { MetadataRoute } from "next";

const BASE_URL = "https://kabengosafaris.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "fr", "de", "es", "it"];

  const staticPages = [
    "",
    "/about",
    "/safaris",
    "/parks",
    "/accommodations",
    "/activities",
    "/testimonials",
    "/contact",
    "/book",
    "/faq",
    "/gallery",
    "/blog",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : 0.8,
      });
    }
  }

  return entries;
}
