import { getTranslations } from "next-intl/server";
import { fetchHomepageData } from "@/lib/api";
import { buildAlternates } from "@/lib/seo";
import HeroSection from "@/components/sections/HeroSection";
import SafarisSection from "@/components/sections/SafarisSection";
import BookVacationSection from "@/components/sections/BookVacationSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import ExploreSection from "@/components/sections/ExploreSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
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
    openGraph: {
      title: t("homeTitle"),
      description: t("homeDescription"),
      url: `https://kabengosafaris.com/${locale}`,
    },
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
      <SafarisSection
        initialSafaris={data.safaris ?? []}
        totalItems={data.safarisTotalItems ?? 0}
      />
      <BookVacationSection />
      <HowItWorksSection />
      <ExploreSection />
      <TestimonialsSection
        initialTestimonies={data.testimonies ?? []}
        totalItems={data.testimoniesTotalItems ?? 0}
      />
      <WhyChooseUsSection />
      <CTASection />
    </>
  );
}
