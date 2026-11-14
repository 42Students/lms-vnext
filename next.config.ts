import type { NextConfig } from "next";
import { legacyRedirects } from "./src/lib/retired-routes";
import { BASE_SECURITY_HEADERS, PRIVATE_API_HEADERS } from "./src/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // The image build's type check runs out of memory on GitHub runners; CI's typecheck job still gates this.
  typescript: { ignoreBuildErrors: process.env.SKIP_BUILD_TYPECHECK === "1" },
  async redirects() {
    // Retired paths live in one table (src/lib/retired-routes.ts) with a removal date each.
    return legacyRedirects();
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...BASE_SECURITY_HEADERS],
      },
      {
        // Fail closed for every API method, not just authentication endpoints.
        // Reverse proxies and browsers must not retain tenant-bound responses.
        source: "/api/:path*",
        headers: [...PRIVATE_API_HEADERS],
      },
    ];
  },
};

export default nextConfig;
