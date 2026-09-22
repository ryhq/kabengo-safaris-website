import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en","fr","de","es","it","pt","sw","uk"],
  defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
