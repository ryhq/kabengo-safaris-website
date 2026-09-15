"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Reads the arrival tags once, as early as the layout mounts.
 *
 * It belongs in the layout rather than on the forms because the tags live on the URL
 * the visitor landed with, and by the time somebody reaches the booking form they
 * have usually clicked through several pages and lost them.
 *
 * Renders nothing and never throws: every storage call inside is guarded, so a
 * browser with storage blocked simply records no attribution rather than failing a
 * page the customer came to read.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
