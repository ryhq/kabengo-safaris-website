"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Compass, Map, Shield, Leaf } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const VALUES = [
  { icon: Compass, titleKey: "whyExpertGuides", descKey: "whyExpertGuidesDesc" },
  { icon: Map, titleKey: "whyCustomItineraries", descKey: "whyCustomItinerariesDesc" },
  { icon: Shield, titleKey: "whySafetyFirst", descKey: "whySafetyFirstDesc" },
  { icon: Leaf, titleKey: "whySustainable", descKey: "whySustainableDesc" },
] as const;

export default function WhyChooseUsSection() {
  const home = useTranslations("home");
  const about = useTranslations("about");

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={home("whyChooseUsTitle")}
          subtitle={home("whyChooseUsSubtitle")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {VALUES.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.titleKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center rounded-xl border border-stone-100 bg-white p-8 hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-brand-brown/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Icon size={28} className="text-brand-brown" />
                </div>
                <h3 className="text-lg font-bold text-stone-800 font-serif mb-3">
                  {about(item.titleKey)}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  {about(item.descKey)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
