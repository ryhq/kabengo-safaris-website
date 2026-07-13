import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import { fetchTestimonySummary, fetchFeaturedTestimonies } from "@/lib/server-api";
import { JsonLd, getReviewsJsonLd } from "@/lib/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("testimonialsTitle"),
    description: t("testimonialsDescription"),
    alternates: buildAlternates(locale, "/reviews"),
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [aggregate, reviews] = await Promise.all([
    fetchTestimonySummary(),
    fetchFeaturedTestimonies(locale),
  ]);

  const hasData = aggregate || reviews.length > 0;

  return (
    <>
      {hasData && <JsonLd data={getReviewsJsonLd({ aggregate, reviews })} />}
      {children}
    </>
  );
}
