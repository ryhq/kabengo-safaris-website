/**
 * Where a visitor came from, kept until they fill in a form.
 *
 * The tags an ad platform puts on a click only exist on the landing URL. One click
 * through to another page and they are gone, and a safari is not booked on the
 * landing page: people read three or four before they write to us. So the tags are
 * read once, on arrival, and held until a form is actually submitted.
 *
 * Two touches are kept. The last one is what converted them, which is what a
 * campaign gets judged on. The first one is what introduced them, which for a trip
 * decided over weeks is frequently a different channel entirely.
 *
 * First-party only: this is stored in the visitor's own browser under our own
 * origin, read back only when they choose to send us a form, and never handed to a
 * third party. No cross-site identifier is set, and nothing is recorded about
 * somebody who never contacts us.
 */

const STORAGE_KEY = "ks_attribution_v1";

/** After a year a stored arrival tells us nothing useful, so it is discarded rather than believed. */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** Mirrors the API's column widths, so nothing is silently truncated on arrival. */
const LIMITS = {
  source: 120,
  medium: 120,
  campaign: 180,
  content: 180,
  term: 180,
  clickId: 255,
  clickIdType: 20,
  landingPage: 500,
  referrer: 500,
} as const;

/**
 * The click identifiers worth keeping, most trustworthy first.
 *
 * Order matters: a link can carry more than one, and the platform that was actually
 * paid should win. fbclid and igshid sit last on purpose, because Facebook and
 * Instagram stamp those on organic posts as readily as on ads.
 */
const CLICK_ID_PARAMS = [
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "dclid",
  "yclid",
  "ttclid",
  "twclid",
  "li_fat_id",
  "sccid",
  "epik",
  "rdt_cid",
  "obclid",
  "taboolaclickid",
  "fbclid",
  "igshid",
] as const;

export interface AttributionPayload {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  clickId?: string;
  clickIdType?: string;
  landingPage?: string;
  referrer?: string;
  firstSource?: string;
  firstMedium?: string;
  firstCampaign?: string;
  firstSeenAt?: string;
  touchCount?: number;
}

/**
 * What sits in storage: the payload whole, and when it was last written.
 *
 * Nested rather than flattened so that what gets sent to the API is the stored
 * object itself, with no field to remember to strip on the way out.
 */
interface StoredAttribution {
  updatedAt: string;
  payload: AttributionPayload;
}

/** Control characters and angle brackets go: this text is read back in the office panel. */
const UNSAFE = /[\u0000-\u001F\u007F<>]/g;

function cap(value: string | null | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(UNSAFE, "").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, max);
}

/** Every storage call is guarded: private browsing and a full quota both throw. */
function read(): StoredAttribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed?.updatedAt || !parsed.payload) return null;
    if (Date.now() - new Date(parsed.updatedAt).getTime() > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function write(value: StoredAttribution): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* Nothing to do here, and nothing worth breaking a page over. */
  }
}

/** The tags on the URL we were loaded with. */
function tagsFromUrl(params: URLSearchParams) {
  let clickId: string | undefined;
  let clickIdType: string | undefined;
  for (const name of CLICK_ID_PARAMS) {
    const value = cap(params.get(name), LIMITS.clickId);
    if (value) {
      clickId = value;
      clickIdType = name;
      break;
    }
  }

  return {
    /*
     * utm_source is the tag we ask campaigns to set. `ref` is the fallback because
     * directories, partner sites and several newsletter tools use that instead, and a
     * lead tagged the other way is still a tagged lead.
     */
    source: cap(params.get("utm_source") ?? params.get("ref"), LIMITS.source),
    medium: cap(params.get("utm_medium"), LIMITS.medium),
    campaign: cap(params.get("utm_campaign"), LIMITS.campaign),
    content: cap(params.get("utm_content"), LIMITS.content),
    term: cap(params.get("utm_term"), LIMITS.term),
    clickId,
    clickIdType,
  };
}

/** Our own pages are not a referral, so only an outside host counts as one. */
function externalReferrer(): string | undefined {
  try {
    const raw = document.referrer;
    if (!raw) return undefined;
    const host = new URL(raw).host;
    if (!host || host === window.location.host) return undefined;
    return cap(raw, LIMITS.referrer);
  } catch {
    return undefined;
  }
}

/**
 * Record this arrival. Safe to call on every page load: a visit that carries no tags
 * and came from one of our own pages changes nothing.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const tags = tagsFromUrl(params);
  const referrer = externalReferrer();
  const landingPage = cap(window.location.pathname, LIMITS.landingPage);

  const tagged = Boolean(
    tags.source || tags.medium || tags.campaign || tags.content || tags.term || tags.clickId,
  );

  const stored = read();
  const now = new Date().toISOString();

  if (!stored) {
    write({
      updatedAt: now,
      payload: {
        ...tags,
        landingPage,
        referrer,
        firstSource: tags.source,
        firstMedium: tags.medium,
        firstCampaign: tags.campaign,
        firstSeenAt: now,
        touchCount: 1,
      },
    });
    return;
  }

  /*
   * A page they reached by clicking around our own site is not a new arrival. Only a
   * tagged URL or a link from somewhere else counts, or every click would inflate the
   * touch count and overwrite a real channel with a blank one.
   */
  if (!tagged && !referrer) return;

  const previous = stored.payload;
  write({
    updatedAt: now,
    payload: {
      ...previous,
      ...tags,
      landingPage,
      referrer,
      /* Never overwritten: what introduced them happened once. */
      firstSource: previous.firstSource,
      firstMedium: previous.firstMedium,
      firstCampaign: previous.firstCampaign,
      firstSeenAt: previous.firstSeenAt ?? now,
      touchCount: (previous.touchCount ?? 1) + 1,
    },
  });
}

/** What to send with a form. Undefined when we have nothing, so no empty object is posted. */
export function getAttribution(): AttributionPayload | undefined {
  const stored = read();
  if (!stored) return undefined;
  const hasAnything = Object.values(stored.payload).some(
    (value) => value !== undefined && value !== null && value !== "",
  );
  return hasAnything ? stored.payload : undefined;
}
