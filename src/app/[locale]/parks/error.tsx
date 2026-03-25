"use client";

import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function ParksError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorDisplay error={error} reset={reset} backHref="/parks" backLabel="Browse Parks" />;
}
