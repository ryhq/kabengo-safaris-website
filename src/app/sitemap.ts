import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://kabengosafaris.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;

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
      const languages: Record<string, string> = {};
      for (const alt of locales) {
        languages[alt] = `${BASE_URL}/${alt}${page}`;
      }
      languages["x-default"] = `${BASE_URL}/en${page}`;

      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1.0 : 0.8,
        alternates: { languages },
      });
    }
  }

  return entries;
}
