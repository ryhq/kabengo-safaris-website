"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { setApiLocale } from "@/lib/api";

/**
 * Syncs the current next-intl locale to the API client's Accept-Language header.
 * Place this inside NextIntlClientProvider in the layout.
 */
export default function ApiLocaleSync() {
  const locale = useLocale();

  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  return null;
}
