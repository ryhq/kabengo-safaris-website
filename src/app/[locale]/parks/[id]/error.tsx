"use client";

import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function ParkDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorDisplay error={error} reset={reset} backHref="/parks" backLabel="Browse Parks" />;
}
