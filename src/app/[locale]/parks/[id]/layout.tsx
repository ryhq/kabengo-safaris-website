import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchParkMeta } from "@/lib/server-api";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getParkJsonLd, getBreadcrumbJsonLd, getFAQJsonLd, localeUrl } from "@/lib/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const park = await fetchParkMeta(id, locale);

  if (!park) {
    return { title: "Park Not Found" };
  }

  const description = (park.shortDescription || park.fullDescription || "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 160) || `Explore ${park.name} - National Park in Tanzania`;

  return {
    title: park.name,
    description,
    alternates: buildAlternates(locale, `/parks/${park.slug}`),
    openGraph: {
      title: park.name,
      description,
      type: "website",
      url: `https://kabengosafaris.com/${locale}/parks/${park.slug}`,
      ...(park.primaryImageUrl && {
        images: [{ url: park.primaryImageUrl, width: 1200, height: 630, alt: park.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: park.name,
      description,
      ...(park.primaryImageUrl && { images: [park.primaryImageUrl] }),
    },
  };
}

export default async function ParkDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [park, nav, tPark] = await Promise.all([
    fetchParkMeta(id, locale),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "parks" }),
  ]);

  const faqItems = [1, 2, 3, 4].map((i) => ({
    q: tPark(`detail.faq.q${i}`),
    a: tPark(`detail.faq.a${i}`),
  }));

  const breadcrumb = park
    ? getBreadcrumbJsonLd([
        { name: nav("home"), url: localeUrl(locale) },
        { name: nav("parks"), url: localeUrl(locale, "/parks") },
        { name: park.name, url: localeUrl(locale, `/parks/${park.slug || id}`) },
      ])
    : null;

  return (
    <>
      {park && <JsonLd data={getParkJsonLd(park, { locale })} />}
      {breadcrumb && <JsonLd data={breadcrumb} />}
      {park && <JsonLd data={getFAQJsonLd(faqItems)} />}
      {children}
    </>
  );
}
