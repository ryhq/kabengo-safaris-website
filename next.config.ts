import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  /*
   * Static files under /public are served with `Cache-Control: public, max-age=0` by default,
   * while Next's own build assets get a year. That is backwards for the share image: a link
   * preview crawler fetches it once per link, and Meta's are documented to prefer images they
   * are allowed to cache -- an uncacheable one is reported to be dropped from the card
   * altogether, which is a preview with a title and a blank space where the photograph goes.
   *
   * A day, not a year, and deliberately not `immutable`: these filenames carry no content hash,
   * so replacing og-default.jpg has to actually reach people.
   */
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:locale/testimonials",
        destination: "/:locale/reviews",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4450",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.1.195",
        port: "4450",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.kabengosafaris.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.kabengosafaris.ryhqtech.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
