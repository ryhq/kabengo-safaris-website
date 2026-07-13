import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { fetchSafariMeta, fetchTestimonySummary } from "@/lib/server-api";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getSafariJsonLd, getBreadcrumbJsonLd, localeUrl } from "@/lib/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const safari = await fetchSafariMeta(id, locale);

  if (!safari) {
    return { title: "Safari Not Found" };
  }

  const description = safari.description
    ? safari.description.replace(/<[^>]+>/g, "").slice(0, 160)
    : `Explore ${safari.name} - ${safari.totalDays} day safari with Kabengo Safaris`;

  return {
    title: safari.name,
    description,
    alternates: buildAlternates(locale, `/safaris/${safari.code || id}`),
    openGraph: {
      title: safari.name,
      description,
      type: "website",
      url: `https://kabengosafaris.com/${locale}/safaris/${safari.code || id}`,
      ...(safari.primaryImageUrl && {
        images: [{ url: safari.primaryImageUrl, width: 1200, height: 630, alt: safari.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: safari.name,
      description,
      ...(safari.primaryImageUrl && { images: [safari.primaryImageUrl] }),
    },
  };
}

export default async function SafariDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [safari, aggregate, nav] = await Promise.all([
    fetchSafariMeta(id, locale),
    fetchTestimonySummary(),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const breadcrumb = safari
    ? getBreadcrumbJsonLd([
        { name: nav("home"), url: localeUrl(locale) },
        { name: nav("safaris"), url: localeUrl(locale, "/safaris") },
        { name: safari.name, url: localeUrl(locale, `/safaris/${safari.code || id}`) },
      ])
    : null;

  return (
    <>
      {safari && <JsonLd data={getSafariJsonLd(safari, { locale, aggregate })} />}
      {breadcrumb && <JsonLd data={breadcrumb} />}
      {children}
    </>
  );
}
