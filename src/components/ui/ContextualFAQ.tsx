"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ContextualFAQProps {
  type: "safari" | "park";
}

const FAQ_KEYS = {
  safari: ["q1", "q2", "q3", "q4"] as const,
  park: ["q1", "q2", "q3", "q4"] as const,
};

export default function ContextualFAQ({ type }: ContextualFAQProps) {
  const namespace = type === "safari" ? "safaris" : "parks";
  const t = useTranslations(namespace);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const questions = FAQ_KEYS[type].map((key) => ({
    question: t(`detail.faq.${key}`),
    answer: t(`detail.faq.${key.replace("q", "a")}`),
  }));

  return (
    <section className="bg-brand-cream py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-800 font-serif text-center mb-10">
          {t("detail.faq.title")}
        </h2>

        <div className="space-y-3">
          {questions.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                >
                  <span className="font-semibold text-stone-800 pr-4">{item.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown size={20} className="text-stone-400" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-stone-600 text-sm leading-relaxed border-t border-stone-50 pt-4">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: questions.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }),
        }}
      />
    </section>
  );
}
