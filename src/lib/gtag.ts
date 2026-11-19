/**
 * Google Ads conversion tracking.
 *
 * The ads account could see clicks arriving and had no idea which of them asked for a quote, so
 * every decision about keywords and budget was being made blind. This is the other half: the tag
 * that tells Google a click turned into an enquiry.
 *
 * Neither value is secret - both are readable in the page source of any site running Google Ads -
 * so they live here rather than in the environment, where they would be one more thing to set
 * correctly on a deploy that nobody would notice was missing.
 */

/** The account's Google tag. One per advertiser. */
export const GOOGLE_ADS_ID = "AW-18580663347";

/** The "Request quote (1)" conversion action within that account. */
const QUOTE_CONVERSION_LABEL = "4CzLCIHOr7odELPY-ZtF";

type GtagArgs =
  | [command: "event", action: string, params?: Record<string, unknown>]
  | [command: "config" | "set" | "js", ...rest: unknown[]];

declare global {
  interface Window {
    gtag?: (...args: GtagArgs) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Report that somebody asked us for a quote.
 *
 * <p>Call it when the request has actually been accepted by the API, never when the form is
 * submitted: a request that failed is not a lead, and counting it would teach Google to buy more
 * of whatever produced the failure.
 *
 * <p>Silent when the tag has not loaded - an ad blocker, or a preview build - because a missing
 * analytics script is not a reason to break a form the business depends on.
 */
export function trackQuoteRequest(): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${QUOTE_CONVERSION_LABEL}`,
    value: 1.0,
    currency: "USD",
  });
}
