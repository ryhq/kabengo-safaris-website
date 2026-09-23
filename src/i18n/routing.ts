/*
 * GENERATED AT BUILD TIME — editing this file does not change what the site offers.
 *
 * `prebuild` runs scripts/sync-languages.mjs --apply, which asks the API for
 * `translation.supported.languages` and rewrites this list from the answer. A locale added here and
 * not there disappears on the next deploy; a locale added there and not here appears on it. The
 * committed list is therefore a record of what the API said last, kept in the repo so a diff shows
 * when it changed — the lever is Settings → Translation, not this file.
 */

import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en","fr","de","es","it","pt","sw","uk"],
  defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);