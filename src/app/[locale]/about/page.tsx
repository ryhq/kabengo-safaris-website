"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Compass, Map, Shield, Leaf } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { TripAdvisorAboutSection } from "@/components/ui/TripAdvisorBadge";

export default function AboutPage() {
  const t = useTranslations("about");

  const values = [
    { icon: Compass, title: t("whyExpertGuides"), desc: t("whyExpertGuidesDesc") },
    { icon: Map, title: t("whyCustomItineraries"), desc: t("whyCustomItinerariesDesc") },
    { icon: Shield, title: t("whySafetyFirst"), desc: t("whySafetyFirstDesc") },
    { icon: Leaf, title: t("whySustainable"), desc: t("whySustainableDesc") },
  ];

  return (
    <>
      <PageHero heroPage="ABOUT" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Story */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-stone-800 font-serif mb-4">{t("storyTitle")}</h2>
            <p className="text-stone-600 leading-relaxed">{t("storyText")}</p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-brand-warm rounded-xl p-8">
              <h3 className="text-xl font-bold text-brand-brown font-serif mb-3">{t("missionTitle")}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{t("missionText")}</p>
            </div>
            <div className="bg-brand-warm rounded-xl p-8">
              <h3 className="text-xl font-bold text-brand-green font-serif mb-3">{t("visionTitle")}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{t("visionText")}</p>
            </div>
          </div>

          {/* Why Choose Us */}
          <h2 className="text-2xl font-bold text-stone-800 font-serif mb-8 text-center">{t("whyTitle")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-6 bg-white rounded-xl border border-stone-100 shadow-sm"
              >
                <div className="w-12 h-12 bg-brand-brown/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon size={24} className="text-brand-brown" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">{item.title}</h4>
                  <p className="text-sm text-stone-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* TripAdvisor */}
          <TripAdvisorAboutSection />
        </div>
      </section>
    </>
  );
}
