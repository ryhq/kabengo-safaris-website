"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

export default function CTASection() {
  const t = useTranslations("home");

  return (
    <section className="relative py-24 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-brand-brown/80" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-serif mb-6"
        >
          {t("ctaTitle")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg text-white/80 mb-10"
        >
          {t("ctaSubtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/book"
            className="inline-flex items-center px-8 py-4 bg-white text-brand-brown text-lg font-semibold rounded-lg hover:bg-brand-cream transition-all duration-300 shadow-lg"
          >
            {t("ctaCta")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
