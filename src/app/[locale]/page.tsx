import { getTranslations } from "next-intl/server";
import { fetchHomepageData } from "@/lib/api";
import { buildAlternates, buildOpenGraph, buildTwitter } from "@/lib/seo";
import HeroSection from "@/components/sections/HeroSection";
import HomeTrustBar from "@/components/sections/HomeTrustBar";
import SafarisSection from "@/components/sections/SafarisSection";
import BookVacationSection from "@/components/sections/BookVacationSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import ExploreSection from "@/components/sections/ExploreSection";
import GuestReviewsSection from "@/components/sections/GuestReviewsSection";
import CTASection from "@/components/sections/CTASection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: buildAlternates(locale),
    openGraph: buildOpenGraph({
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: `https://kabengosafaris.com/${locale}`,
      locale,
    }),
    twitter: buildTwitter({
      title: t("homeTitle"),
      description: t("homeDescription"),
    }),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const data = await fetchHomepageData(locale);

  return (
    <>
      <HeroSection heroes={data.heroes ?? []} />
      <HomeTrustBar />
      <SafarisSection
        initialSafaris={data.safaris ?? []}
        totalItems={data.safarisTotalItems ?? 0}
      />
      <BookVacationSection />
      <HowItWorksSection />
      <ExploreSection />
      <WhyChooseUsSection />
      <GuestReviewsSection />
      <CTASection />
    </>
  );
}
