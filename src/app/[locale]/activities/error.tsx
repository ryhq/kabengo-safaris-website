"use client";

import ErrorDisplay from "@/components/ui/ErrorDisplay";

export default function ActivitiesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorDisplay error={error} reset={reset} backHref="/activities" backLabel="Browse Activities" />;
}
