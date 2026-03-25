"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
  backHref?: string;
  backLabel?: string;
}

export default function ErrorDisplay({ error, reset, backHref, backLabel }: ErrorDisplayProps) {
  const t = useTranslations("common");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-8xl font-serif font-bold text-brand-brown/20 mb-2">!</p>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-brown mb-4">
          {t("errorTitle")}
        </h1>
        <p className="text-lg text-brand-secondary/70 mb-8">
          {t("errorMessage")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-brand-brown text-white font-medium hover:bg-brand-brown-dark transition-colors cursor-pointer"
          >
            <RefreshCw size={18} />
            {t("tryAgain")}
          </button>
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-brand-green text-brand-green font-medium hover:bg-brand-green hover:text-white transition-colors"
            >
              {backLabel || t("backToHome")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
