import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * "Stop showing what I told you earlier."
 *
 * This site renders itself from the management API and then keeps the answer — five minutes for
 * anything that says a trip is for sale, an hour for everything else. That is what makes it fast,
 * and it is also why an edit made in the office is invisible to a visitor until the timer runs
 * out. This endpoint is how the office says "no, now".
 *
 * The API calls it. Not the admin panel: the panel is one application serving more than one
 * company, so it would have to choose which website it meant on every single call, and the day it
 * chooses wrong is the day one company's edit empties another company's site. Each API
 * installation has exactly one website, so there is nothing to choose.
 *
 * ── Why there is a key ──
 *
 * Without one, anyone could call this in a loop and the site would rebuild every page continuously
 * for as long as they cared to keep going. That is a denial of service that costs the attacker one
 * line of shell. So the caller must present the shared secret, and a request without it is refused
 * before any work is done.
 *
 * REVALIDATE_SECRET must be set in the environment. If it is missing the endpoint refuses
 * everything rather than defaulting to open: a cache that will not clear is an inconvenience, and
 * one that anybody can clear is an outage.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The labels this site puts on what it caches.
 *
 * Shared, by agreement, with WebsiteCacheTags on the API side. A name here means nothing until a
 * fetch is tagged with it, and a name the API sends that is not here is reported back as unknown
 * rather than silently accepted — "cleared" for a label nothing carries is worse than an error,
 * because the page then looks current and is not.
 */
const KNOWN_TAGS = [
  "site",
  "safaris",
  "parks",
  "accommodations",
  "activities",
  "testimonies",
  "heroes",
  "blog",
  "faqs",
  "brand",
] as const;

/** Constant time, so a wrong key cannot be discovered one character at a time. */
function secretMatches(given: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which would leak the length through the error.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Bad or missing key" }, { status: 401 });
}

function notConfigured() {
  return NextResponse.json(
    { ok: false, error: "REVALIDATE_SECRET is not set on this deployment" },
    { status: 503 },
  );
}

/**
 * A doorbell. Confirms the site is reachable and the two halves of the key agree, and throws
 * nothing away — so "is this wired up?" can be answered without making the site rebuild.
 */
export async function GET(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) return notConfigured();
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) return unauthorized();
  return NextResponse.json({ ok: true, tags: KNOWN_TAGS, at: new Date().toISOString() });
}

/** Throw away everything wearing these labels. An empty list means the whole site. */
export async function POST(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) return notConfigured();
  if (!secretMatches(request.headers.get("x-revalidate-secret"))) return unauthorized();

  let requested: string[] = [];
  try {
    const body = (await request.json()) as { tags?: unknown };
    if (Array.isArray(body?.tags)) requested = body.tags.filter((t): t is string => typeof t === "string");
  } catch {
    // No body at all is a legitimate way of saying "all of it".
  }

  const tags = requested.length === 0 ? ["site"] : requested;
  const unknown = tags.filter((t) => !(KNOWN_TAGS as readonly string[]).includes(t));
  if (unknown.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Unknown label(s): ${unknown.join(", ")}`, known: KNOWN_TAGS },
      { status: 400 },
    );
  }

  /*
   * { expire: 0 } means "gone now", not "stale soon".
   *
   * Next 16 made the second argument compulsory and it is not cosmetic: given a cache-life profile,
   * revalidateTag leaves the existing entry servable while a fresh one is built, so the visitor who
   * triggered the clear still sees the old page. The office presses this button precisely because
   * the old page is wrong, so anything short of immediate expiry would make the button look broken.
   */
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json({ ok: true, revalidated: tags, at: new Date().toISOString() });
}
