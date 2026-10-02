import type { NextConfig } from "next";
import { BASE_SECURITY_HEADERS } from "./src/security/headers";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...BASE_SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
