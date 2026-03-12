"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import PageHero from "@/components/ui/PageHero";

export default function BlogPage() {
  const t = useTranslations("blog");
  const common = useTranslations("common");

  return (
    <>
      <PageHero heroPage="BLOG" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <BookOpen size={64} className="mx-auto text-brand-brown/20 mb-6" />
          <h2 className="text-2xl font-bold text-stone-800 font-serif mb-3">
            {common("comingSoon")}
          </h2>
          <p className="text-stone-500">
            {t("comingSoonMessage")}
          </p>
        </div>
      </section>
    </>
  );
}
