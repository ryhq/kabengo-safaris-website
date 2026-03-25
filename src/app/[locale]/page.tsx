import { getTranslations } from "next-intl/server";
import { fetchHomepageData } from "@/lib/api";
import HeroSection from "@/components/sections/HeroSection";
import SafarisSection from "@/components/sections/SafarisSection";
import ParksSection from "@/components/sections/ParksSection";
import ActivitiesSection from "@/components/sections/ActivitiesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import WhyChooseUsSection from "@/components/sections/WhyChooseUsSection";
import { TripAdvisorSection } from "@/components/ui/TripAdvisorBadge";

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
      <ParksSection
        initialParks={data.parks ?? []}
        totalItems={data.parksTotalItems ?? 0}
      />
      <ActivitiesSection
        initialActivities={data.activities ?? []}
        totalItems={data.activitiesTotalItems ?? 0}
      />
      <TestimonialsSection
        initialTestimonies={data.testimonies ?? []}
        totalItems={data.testimoniesTotalItems ?? 0}
      />
      <TripAdvisorSection />
      <WhyChooseUsSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
