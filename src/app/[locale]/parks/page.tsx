import { getTranslations } from "next-intl/server";
import { fetchParksCatalogue } from "@/lib/server-api";
import { PAGE_SIZE, VALID_PARK_TYPES, namedItems, parseText, topTags } from "@/lib/catalogue-query";
import { JsonLd, getItemListJsonLd } from "@/lib/jsonld";
import CatalogueIndex from "@/components/seo/CatalogueIndex";
import ParksClient from "./ParksClient";

/*
 * The server half of the parks hub.
 *
 * A crawl of this page found 0 of 27 park names in the raw HTML, because the page WAS the
 * client component and fetched its grid after mount. It now fetches on the server and hands the
 * result to the same component as initial state.
 */

const VALID_SORTS = ["visited", "az", "za"];

export default async function ParksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const pf = await getTranslations({ locale, namespace: "parksFinder" });

  const query = parseText(sp.q);
  const rawType = parseText(sp.type);
  const parkType = VALID_PARK_TYPES.has(rawType) ? rawType : "all";
  const rawSort = parseText(sp.sort);
  const sort = VALID_SORTS.includes(rawSort) ? rawSort : "visited";
  const tags = Array.isArray(sp.tag) ? sp.tag : sp.tag ? [sp.tag] : [];

  const gridSort =
    sort === "az"
      ? { sortBy: "name", sortDirection: "asc" }
      : sort === "za"
        ? { sortBy: "name", sortDirection: "desc" }
        : { sortBy: "visited" };

  const filtered = Boolean(query) || parkType !== "all" || tags.length > 0 || sort !== "visited";
  const [catalogue, page0] = await Promise.all([
    fetchParksCatalogue(locale, { sortBy: "visited" }),
    filtered
      ? fetchParksCatalogue(locale, {
          ...gridSort,
          page: 0,
          size: PAGE_SIZE,
          keyword: query || undefined,
          parkType: parkType !== "all" ? parkType : undefined,
          tag: tags.length ? tags : undefined,
        })
      : Promise.resolve(null),
  ]);

  const everything = namedItems(catalogue.items);
  const gridItems = page0 ? namedItems(page0.items) : everything.slice(0, PAGE_SIZE);
  const gridTotal = page0 ? page0.totalItems : catalogue.totalItems;

  /* Derived from the whole catalogue rather than the 60-row sample the client used to fetch. */
  const featured = everything.filter((p) => (p.safariCount ?? 0) > 0).slice(0, 6);
  const facetTags = topTags(everything);

  /* A failed read hands the client back its old fetch-on-mount path rather than an empty page. */
  const serverRead = catalogue.totalItems > 0 || everything.length > 0;

  return (
    <>
      {everything.length > 0 && (
        <JsonLd data={getItemListJsonLd(everything, "parks", locale, pf("allParks"))} />
      )}
      <ParksClient
        initialQuery={query}
        initialType={parkType}
        initialSort={sort}
        initialTags={tags}
        initialItems={serverRead ? gridItems : null}
        initialTotal={gridTotal}
        initialFeatured={featured}
        initialFacetTags={facetTags}
      >
        <CatalogueIndex
          title={pf("allParks")}
          items={everything}
          hrefBase="parks"
          accent="#2a2018"
          muted="#7a6f61"
          border="#e4ddd1"
          serif="var(--font-source-serif), Georgia, serif"
        />
      </ParksClient>
    </>
  );
}
