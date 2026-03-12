import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
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
    ],
  },
};

export default withNextIntl(nextConfig);
