"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

interface SafariDescriptionProps {
  description?: string;
  highlights?: string;
  safariName?: string;
}

export default function SafariDescription({
  description,
  highlights,
}: SafariDescriptionProps) {
  const t = useTranslations("safaris");
  const parsedHighlights = highlights
    ?.split(/[,\n]/)
    .map((h) => h.trim())
    .filter(Boolean) || [];

  if (!description && parsedHighlights.length === 0) return null;

  return (
    <div>
      {description && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-stone-600 leading-relaxed whitespace-pre-line text-base"
        >
          <p>{description}</p>
        </motion.div>
      )}

      {parsedHighlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-8"
        >
          <h3 className="text-lg font-semibold text-stone-800 font-serif mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-brand-green" />
            {t("detail.highlights")}
          </h3>
          <ul className="space-y-2">
            {parsedHighlights.map((highlight, i) => (
              <li key={i} className="flex items-start gap-3 text-stone-600">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-2 flex-shrink-0" />
                {highlight}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
