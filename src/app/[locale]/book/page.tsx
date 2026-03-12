"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import BookingInquiryForm from "@/components/safari/BookingInquiryForm";

export default function BookPage() {
  const t = useTranslations("bookingInquiry");
  const searchParams = useSearchParams();
  const safariId = searchParams.get("safari") || undefined;

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-brand-brown via-brand-secondary to-brand-brown-dark text-white overflow-hidden">
        {/* Decorative SVG pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="book-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#book-dots)" />
          </svg>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <BookingInquiryForm safariId={safariId} />
        </motion.div>
      </section>
    </main>
  );
}
