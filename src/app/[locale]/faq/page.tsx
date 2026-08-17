import { getTranslations } from "next-intl/server";
import PageHero from "@/components/ui/PageHero";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { getFaqs } from "@/content/faq";

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  const items = await getFaqs(locale);

  return (
    <>
      <PageHero heroPage="FAQ" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaqAccordion items={items} />
        </div>
      </section>
    </>
  );
}
