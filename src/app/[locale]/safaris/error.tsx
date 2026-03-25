"use client";

import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function SafarisError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorDisplay error={error} reset={reset} backHref="/safaris" backLabel="Browse Safaris" />;
}
