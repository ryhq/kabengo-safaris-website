import { useTranslations } from "next-intl";
import Link from "next/link";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-8xl font-serif font-bold text-brand-brown/20 mb-2">
          404
        </p>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-brown mb-4">
          {t("notFoundTitle")}
        </h1>
        <p className="text-lg text-brand-secondary/70 mb-8">
          {t("notFoundMessage")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-brown text-white font-medium hover:bg-brand-brown-dark transition-colors"
          >
            {t("backToHome")}
          </Link>
          <Link
            href="/safaris"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-brand-green text-brand-green font-medium hover:bg-brand-green hover:text-white transition-colors"
          >
            {t("notFoundCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
