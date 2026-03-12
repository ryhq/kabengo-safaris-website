"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import PageHero from "@/components/ui/PageHero";

const FAQ_ITEMS = [
  { q: "What is the best time to go on a safari in East Africa?", a: "The best time depends on what you want to see. The Great Migration in the Serengeti/Masai Mara peaks from July to October. The dry season (June-October) is generally best for wildlife viewing as animals gather around water sources. However, the green season (November-May) offers lush landscapes, fewer crowds, and lower prices." },
  { q: "How many days do I need for a safari?", a: "We recommend a minimum of 3-4 days for a meaningful safari experience. However, 7-10 days allows you to visit multiple parks and have a more relaxed, immersive experience. We can customize itineraries to fit your schedule." },
  { q: "Is a safari safe?", a: "Yes, safaris are very safe when conducted with experienced, licensed operators like Kabengo Safaris. Our guides are highly trained, our vehicles are well-maintained, and we follow strict safety protocols. We also carry comprehensive insurance." },
  { q: "What should I pack for a safari?", a: "Essentials include neutral-colored clothing (khaki, olive, brown), comfortable walking shoes, a wide-brim hat, sunscreen, insect repellent, binoculars, a camera with a good zoom lens, and a light jacket for cool mornings. We provide a detailed packing list upon booking." },
  { q: "Do I need vaccinations?", a: "Yellow fever vaccination is required for entry to Tanzania and Tanzania. We also recommend being up to date on routine vaccinations and consulting your doctor about malaria prophylaxis. A travel clinic can provide personalized advice based on your itinerary." },
  { q: "Can children go on safari?", a: "Absolutely! Safaris are wonderful family experiences. We offer family-friendly itineraries with appropriate accommodations and activities. Most lodges welcome children, though some have minimum age requirements for game drives." },
  { q: "What types of accommodation are available?", a: "We offer a range from luxury lodges and permanent tented camps to mobile camps and budget-friendly options. Each provides a unique safari experience, and we'll help you choose based on your preferences and budget." },
  { q: "How do I book a safari?", a: "Simply contact us through our website, email, or phone. We'll discuss your interests, budget, and travel dates to create a customized itinerary. A deposit confirms your booking, with the balance due before departure." },
];

export default function FAQPage() {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <PageHero heroPage="FAQ" fallbackTitle={t("title")} fallbackSubtitle={t("subtitle")} />

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl border border-stone-100 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium text-stone-800 pr-4">{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-stone-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 text-sm text-stone-500 leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
