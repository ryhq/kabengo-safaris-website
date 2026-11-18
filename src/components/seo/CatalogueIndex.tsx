import { Link } from "@/i18n/navigation";
import type { CatalogueItem } from "@/lib/server-api";

/**
 * Every name in the catalogue, as plain links, rendered on the server.
 *
 * The hub pages above this are client components that fetch their grid after mount, so their
 * catalogue existed only once JavaScript had run. Googlebot runs JavaScript; GPTBot, ClaudeBot
 * and CCBot largely do not, and a crawl of /en/parks found 0 of 27 park names in the HTML.
 *
 * Seeding the grid from the server fixes the first nine. It cannot fix the rest, because the
 * grid pages at nine and each card paints its photo through an inline background:url(), which
 * has no lazy-loading escape hatch - server-rendering 74 of them would mean 74 eager image
 * requests on first paint. So the cards stay as they are and this carries the other sixty-five
 * names, as text, for a few KB.
 *
 * It is a server component with no state, deliberately: it ships no JavaScript, cannot cause a
 * hydration mismatch, and is as useful to a reader and to internal linking as it is to a
 * crawler. It is passed to the client hub as `children` so its markup never enters the bundle.
 */
export default function CatalogueIndex({
  title,
  items,
  hrefBase,
  accent,
  muted,
  border,
  serif,
}: {
  title: string;
  items: CatalogueItem[];
  /** "parks" | "accommodations" | "activities" - the segment under the locale. */
  hrefBase: string;
  accent: string;
  muted: string;
  border: string;
  serif: string;
}) {
  const listed = items.filter((i) => i.slug && i.name);
  if (listed.length < 2) return null;

  return (
    <section
      aria-label={title}
      style={{ marginTop: "clamp(40px,6vw,64px)", paddingTop: "clamp(28px,4vw,40px)", borderTop: `1px solid ${border}` }}
    >
      <h2 style={{ fontFamily: serif, fontWeight: 700, color: accent, fontSize: "clamp(18px,2.2vw,22px)", margin: "0 0 16px" }}>
        {title}
      </h2>
      {/*
        * One stylesheet instead of an inline style on every row. At 74 lodges the repeated
        * style attributes were most of this block's weight, and all of it is rendered twice -
        * once as HTML and once into the RSC payload.
        */}
      <style>{`
        .cat-idx { list-style: none; margin: 0; padding: 0; display: grid;
                   grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px 24px; }
        .cat-idx li { font-size: 14.5px; line-height: 1.6; }
        .cat-idx a { color: ${accent}; font-weight: 500; }
        .cat-idx span { color: ${muted}; }
      `}</style>
      <ul className="cat-idx">
        {listed.map((i) => {
          const where = [i.region, i.district].filter(Boolean)[0];
          return (
            <li key={i.slug}>
              <Link href={`/${hrefBase}/${i.slug}`}>{i.name}</Link>
              {where && <span>{` - ${where}`}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
