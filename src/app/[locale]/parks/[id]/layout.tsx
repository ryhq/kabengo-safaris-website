import type { Metadata } from "next";
import { fetchParkMeta } from "@/lib/server-api";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getParkJsonLd } from "@/lib/jsonld";

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
  const park = await fetchParkMeta(id, locale);

  return (
    <>
      {park && <JsonLd data={getParkJsonLd(park)} />}
      {children}
    </>
  );
}
