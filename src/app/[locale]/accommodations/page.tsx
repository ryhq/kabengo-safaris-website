import { getTranslations } from "next-intl/server";
import { fetchAccommodationsCatalogue } from "@/lib/server-api";
import {
  PAGE_SIZE,
  VALID_STAY_TYPES,
  VALID_STAY_CATS,
  namedItems,
  parseSort,
  parseText,
  sortParams,
} from "@/lib/catalogue-query";
import { JsonLd, getItemListJsonLd } from "@/lib/jsonld";
import CatalogueIndex from "@/components/seo/CatalogueIndex";
import AccommodationsClient from "./AccommodationsClient";

/*
 * The server half of the accommodations hub.
 *
 * A crawl of this page found 0 of 74 lodge names in the raw HTML. The grid still shows nine
 * cards, because each card paints its photo through an inline background:url() that cannot be
 * lazy-loaded and seventy-four of those would wreck the first paint. The other sixty-five names
 * are carried by the text index below the grid.
 */

export default async function AccommodationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const af = await getTranslations({ locale, namespace: "accommodationsFinder" });

  const query = parseText(sp.q);
  const rawType = parseText(sp.type);
  const type = VALID_STAY_TYPES.has(rawType) ? rawType : "all";
  const rawCat = parseText(sp.category);
  const category = VALID_STAY_CATS.has(rawCat) ? rawCat : "all";
  const sort = parseSort(sp.sort);

  const filtered = Boolean(query) || type !== "all" || category !== "all" || sort !== "popular";
  const [catalogue, page0] = await Promise.all([
    fetchAccommodationsCatalogue(locale, sortParams("popular")),
    filtered
      ? fetchAccommodationsCatalogue(locale, {
          ...sortParams(sort),
          page: 0,
          size: PAGE_SIZE,
          keyword: query || undefined,
          type: type !== "all" ? type : undefined,
          category: category !== "all" ? category : undefined,
        })
      : Promise.resolve(null),
  ]);

  const everything = namedItems(catalogue.items);
  const gridItems = page0 ? namedItems(page0.items) : everything.slice(0, PAGE_SIZE);
  const gridTotal = page0 ? page0.totalItems : catalogue.totalItems;

  /* A failed read hands the client back its old fetch-on-mount path rather than an empty page. */
  const serverRead = catalogue.totalItems > 0 || everything.length > 0;

  return (
    <>
      {everything.length > 0 && (
        <JsonLd data={getItemListJsonLd(everything, "accommodations", locale, af("allStays"))} />
      )}
      <AccommodationsClient
        initialQuery={query}
        initialType={type}
        initialCategory={category}
        initialSort={sort}
        initialItems={serverRead ? gridItems : null}
        initialTotal={gridTotal}
        initialAll={everything}
      >
        <CatalogueIndex
          title={af("allStays")}
          items={everything}
          hrefBase="accommodations"
          accent="#2a2018"
          muted="#7a6f61"
          border="#e4ddd1"
          serif="var(--font-source-serif), Georgia, serif"
        />
      </AccommodationsClient>
    </>
  );
}
