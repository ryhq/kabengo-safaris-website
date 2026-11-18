import { getTranslations } from "next-intl/server";
import { fetchActivitiesCatalogue } from "@/lib/server-api";
import { PAGE_SIZE, namedItems, parseSort, parseText, sortParams } from "@/lib/catalogue-query";
import { JsonLd, getItemListJsonLd } from "@/lib/jsonld";
import CatalogueIndex from "@/components/seo/CatalogueIndex";
import ActivitiesClient from "./ActivitiesClient";

/*
 * The server half of the activities hub.
 *
 * This page used to BE the client component, which meant its catalogue existed only after
 * JavaScript ran, and a crawler that does not run JavaScript saw a heading over nine skeletons.
 * It fetches the catalogue here instead and hands it to the same component as initial state, so
 * the first render already has the data. Every interaction below is unchanged, because it is
 * the same component.
 */

export default async function ActivitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const af = await getTranslations({ locale, namespace: "activitiesFinder" });

  const query = parseText(sp.q);
  const sort = parseSort(sp.sort);

  /*
   * The whole catalogue feeds the index and the featured strip. The grid needs only its first
   * page, and with no filters that page is a slice of what we already have, so the second
   * request is made only when a filter makes it a genuinely different list.
   */
  const filtered = Boolean(query) || sort !== "popular";
  const [catalogue, page0] = await Promise.all([
    fetchActivitiesCatalogue(locale, sortParams("popular")),
    filtered
      ? fetchActivitiesCatalogue(locale, {
          ...sortParams(sort),
          page: 0,
          size: PAGE_SIZE,
          keyword: query || undefined,
        })
      : Promise.resolve(null),
  ]);

  const everything = namedItems(catalogue.items);
  const gridItems = page0 ? namedItems(page0.items) : everything.slice(0, PAGE_SIZE);
  const gridTotal = page0 ? page0.totalItems : catalogue.totalItems;

  /*
   * A failed catalogue read must not render as "no activities" - a crawler would cache an empty
   * page, which is worse than the state this replaces. Null hands the client back its old
   * fetch-on-mount path.
   */
  const serverRead = catalogue.totalItems > 0 || everything.length > 0;

  return (
    <>
      {everything.length > 0 && (
        <JsonLd data={getItemListJsonLd(everything, "activities", locale, af("allActivities"))} />
      )}
      <ActivitiesClient
        initialQuery={query}
        initialSort={sort}
        initialItems={serverRead ? gridItems : null}
        initialTotal={gridTotal}
        initialAll={everything}
      >
        <CatalogueIndex
          title={af("allActivities")}
          items={everything}
          hrefBase="activities"
          accent="#2a2018"
          muted="#7a6f61"
          border="#e4ddd1"
          serif="var(--font-source-serif), Georgia, serif"
        />
      </ActivitiesClient>
    </>
  );
}
