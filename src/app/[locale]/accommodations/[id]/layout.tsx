import type { Metadata } from "next";
import { fetchAccommodationMeta } from "@/lib/server-api";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getAccommodationJsonLd } from "@/lib/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const acc = await fetchAccommodationMeta(id, locale);

  if (!acc) {
    return { title: "Accommodation Not Found" };
  }

  const description = (acc.shortDescription || acc.details || "")
    .replace(/<[^>]+>/g, "")
    .slice(0, 160) || `${acc.name} - ${acc.categoryDisplayName || "Accommodation"} in Tanzania`;

  return {
    title: acc.name,
    description,
    alternates: buildAlternates(locale, `/accommodations/${acc.slug || id}`),
    openGraph: {
      title: acc.name,
      description,
      type: "website",
      url: `https://kabengosafaris.com/${locale}/accommodations/${acc.slug || id}`,
      ...(acc.primaryImageUrl && {
        images: [{ url: acc.primaryImageUrl, width: 1200, height: 630, alt: acc.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: acc.name,
      description,
      ...(acc.primaryImageUrl && { images: [acc.primaryImageUrl] }),
    },
  };
}

export default async function AccommodationDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const acc = await fetchAccommodationMeta(id, locale);

  return (
    <>
      {acc && <JsonLd data={getAccommodationJsonLd(acc)} />}
      {children}
    </>
  );
}
