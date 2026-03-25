"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onClearFilters?: () => void;
}

export default function EmptyState({
  icon: Icon = SearchX,
  title,
  message,
  ctaLabel,
  ctaHref,
  onClearFilters,
}: EmptyStateProps) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
        <Icon size={36} className="text-stone-400" />
      </div>
      <h3 className="text-xl font-bold text-stone-700 font-serif mb-2">
        {title || t("noResultsTitle")}
      </h3>
      <p className="text-stone-500 max-w-md mb-6">
        {message || t("noResultsMessage")}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-5 py-2.5 rounded-lg border-2 border-brand-brown text-brand-brown font-medium hover:bg-brand-brown hover:text-white transition-colors cursor-pointer"
          >
            {t("clearFilters")}
          </button>
        )}
        {ctaHref && ctaLabel && (
          <Link
            href={ctaHref}
            className="px-5 py-2.5 rounded-lg bg-brand-green text-white font-medium hover:bg-brand-green-light transition-colors"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
